/**
 * POST /api/cron/tm-match
 * 
 * Cron job to match our events against cached Ticketmaster data.
 * Updates Enrichment records with TM URLs, presales, and ticket info.
 * 
 * Schedule: Daily at 5 AM Central (11 AM UTC) — after tm-download and enrich complete
 * 
 * Auth: Requires CRON_SECRET bearer token
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth, logCronStart, logCronSuccess, logCronError } from '@/lib/cron/auth';
import prisma from '@/db/prisma';
import { TMEventCache } from '@prisma/client';
import { calculateSimilarity } from '@/lib/ticketmaster/matcher';

const JOB_NAME = 'tm-match';
const DEFAULT_BATCH_SIZE = 100;

// LLM to pick the best match from candidates (or none)
interface LLMMatchResult {
  matchIndex: number | null;
  preferTMTitle: boolean;
  reason?: string;
}

async function askLLMToMatch(
  ourTitle: string,
  candidates: { name: string; time?: string }[],
  venueName: string
): Promise<LLMMatchResult> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    return { matchIndex: null, preferTMTitle: false };
  }

  const candidateList = candidates
    .map((c, i) => `  ${i + 1}. "${c.name}"${c.time ? ` (${c.time})` : ''}`)
    .join('\n');

  const prompt = `We have an event from a venue website and need to match it to the correct Ticketmaster listing.

The titles may look different due to:
- Abbreviations (Texas MBB vs UT MBB vs Texas Longhorns Mens Basketball)
- Home/away formatting (team name only vs "Team A vs Team B")
- Tour names (artist vs "Artist - Tour Name 2025")
- Supporting acts included or not

Our event: "${ourTitle}"
Venue: ${venueName}

Ticketmaster candidates (same venue & date):
${candidateList}

Think step by step:
1. Is our event the same performer/team as any candidate? (Consider abbreviations)
2. If yes, which one? If TM title adds info (opponent, tour), prefer it.

JSON response:
{"reason": "brief explanation of match logic", "match": <1-${candidates.length}> or null, "preferTMTitle": true/false}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      return { matchIndex: null, preferTMTitle: false };
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim() || '';
    
    if (content.startsWith('```')) {
      content = content.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    }
    
    const parsed = JSON.parse(content);
    
    const matchNum = parsed.match;
    const matchIndex = typeof matchNum === 'number' && matchNum >= 1 && matchNum <= candidates.length
      ? matchNum - 1
      : null;
    
    return {
      matchIndex,
      preferTMTitle: Boolean(parsed.preferTMTitle),
      reason: parsed.reason || undefined,
    };
  } catch {
    return { matchIndex: null, preferTMTitle: false };
  }
}

export async function POST(request: NextRequest) {
  // Auth check
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const startTime = logCronStart(JOB_NAME);

  try {
    // Optional: allow batch size override via query param
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || String(DEFAULT_BATCH_SIZE), 10);

    // Check cache has data
    const cacheCount = await prisma.tMEventCache.count();
    if (cacheCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'TMEventCache is empty. Run tm-download first.',
      }, { status: 400 });
    }

    // Get upcoming events with enrichment records
    const events = await prisma.event.findMany({
      where: {
        startDateTime: { gte: new Date() },
        enrichment: { isNot: null },
      },
      include: { venue: true, enrichment: true },
      orderBy: { startDateTime: 'asc' },
      take: limit,
    });

    let matched = 0;
    let noMatch = 0;
    let skippedLLM = 0;
    let errors = 0;

    for (const event of events) {
      try {
        // Get same-day events from cache for this venue
        const eventDate = event.startDateTime;
        const localDate = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;

        const candidates = await prisma.tMEventCache.findMany({
          where: {
            venueSlug: event.venue.slug,
            localDate: localDate,
          },
        });

        if (candidates.length === 0) {
          noMatch++;
          if (event.enrichment) {
            await prisma.enrichment.update({
              where: { id: event.enrichment.id },
              data: { tmLastChecked: new Date() },
            });
          }
          continue;
        }

        // Calculate similarity scores
        const rankedCandidates = candidates
          .map(c => ({
            candidate: c,
            similarity: calculateSimilarity(event.title, c.name),
            time: c.startDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          }))
          .sort((a, b) => b.similarity - a.similarity);

        let bestMatch: TMEventCache | null = null;
        let bestSimilarity = 0;
        let isMatch = false;
        let preferTMTitle = false;

        // Check if we can reuse previous match
        const existingMatch = event.enrichment?.tmEventId 
          ? candidates.find(c => c.id === event.enrichment?.tmEventId)
          : null;

        if (existingMatch && event.enrichment?.tmEventName === existingMatch.name) {
          bestMatch = existingMatch;
          bestSimilarity = event.enrichment?.tmMatchConfidence || 0.85;
          isMatch = true;
          preferTMTitle = event.enrichment?.tmPreferTitle || false;
          skippedLLM++;
        } else if (rankedCandidates[0].similarity >= 0.85) {
          // High similarity → auto-match
          bestMatch = rankedCandidates[0].candidate;
          bestSimilarity = rankedCandidates[0].similarity;
          isMatch = true;
          preferTMTitle = bestMatch.name.length > event.title.length * 1.5;
          skippedLLM++;
        } else {
          // Ask LLM
          const llmCandidates = rankedCandidates.map(r => ({ 
            name: r.candidate.name, 
            time: r.time 
          }));
          
          const llmResult = await askLLMToMatch(
            event.title,
            llmCandidates,
            event.venue.name
          );

          if (llmResult.matchIndex !== null) {
            bestMatch = rankedCandidates[llmResult.matchIndex].candidate;
            bestSimilarity = rankedCandidates[llmResult.matchIndex].similarity;
            isMatch = true;
            preferTMTitle = llmResult.preferTMTitle;
          }
        }

        if (isMatch && bestMatch && event.enrichment) {
          matched++;
          await prisma.enrichment.update({
            where: { id: event.enrichment.id },
            data: {
              tmEventId: bestMatch.id,
              tmEventName: bestMatch.name,
              tmUrl: bestMatch.url,
              tmOnSaleStart: bestMatch.onSaleStart,
              tmOnSaleEnd: bestMatch.onSaleEnd,
              tmPresales: bestMatch.presales ?? undefined,
              tmImageUrl: bestMatch.imageUrl,
              tmSeatmapUrl: bestMatch.seatmapUrl,
              tmAttractionId: bestMatch.attractionId,
              tmAttractionName: bestMatch.attractionName,
              tmSupportingActs: bestMatch.supportingActs,
              tmExternalLinks: bestMatch.externalLinks ?? undefined,
              tmGenre: bestMatch.genre,
              tmSubGenre: bestMatch.subGenre,
              tmSegment: bestMatch.segment,
              tmInfo: bestMatch.info,
              tmPleaseNote: bestMatch.pleaseNote,
              tmTicketLimit: bestMatch.ticketLimit,
              tmTimezone: bestMatch.timezone,
              tmPromoterId: bestMatch.promoterId,
              tmPromoterName: bestMatch.promoterName,
              tmStatus: bestMatch.status,
              tmMatchConfidence: bestSimilarity,
              tmPreferTitle: preferTMTitle,
              tmLastChecked: new Date(),
            },
          });
        } else {
          noMatch++;
          if (event.enrichment) {
            await prisma.enrichment.update({
              where: { id: event.enrichment.id },
              data: { tmLastChecked: new Date() },
            });
          }
        }
      } catch (error) {
        errors++;
        console.warn(`[CRON] tm-match: Error processing ${event.title}:`, error instanceof Error ? error.message : error);
      }
    }

    const summary = {
      processed: events.length,
      matched,
      noMatch,
      llmSkipped: skippedLLM,
      errors,
      cacheSize: cacheCount,
    };

    logCronSuccess(JOB_NAME, startTime, summary);

    return NextResponse.json({
      success: true,
      duration: `${Date.now() - startTime}ms`,
      ...summary,
    });
  } catch (error) {
    logCronError(JOB_NAME, startTime, error);

    return NextResponse.json(
      {
        success: false,
        duration: `${Date.now() - startTime}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/tm-match
 * 
 * Health check / status endpoint
 */
export async function GET() {
  return NextResponse.json({
    job: JOB_NAME,
    description: 'Match events against Ticketmaster cache',
    method: 'POST',
    auth: 'Bearer CRON_SECRET',
    params: {
      limit: 'Optional batch size (default: 100)',
    },
  });
}

