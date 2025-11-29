#!/usr/bin/env npx tsx
/**
 * Enrich Events from TM Cache
 * 
 * Matches our events against the TMEventCache (offline, no API calls).
 * Run download-tm-cache.ts first to populate the cache.
 * 
 * Usage:
 *   npx tsx scripts/enrich-tm-from-cache.ts [--limit=N] [--venue=slug] [--title=text] [--dry-run] [--fresh]
 * 
 * Options:
 *   --limit=N     Max events to process (default: 500)
 *   --venue=slug  Only process events from this venue
 *   --title=text  Only process events with title containing text (case-insensitive)
 *   --dry-run     Show matches without saving
 *   --fresh       Force re-evaluation: ignore cached matches, re-run LLM on all events (for dev/testing)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import prisma from '../src/db/prisma';
import { TMEventCache } from '@prisma/client';
import { calculateSimilarity } from '../src/lib/ticketmaster/matcher';

// LLM to pick the best match from candidates (or none)
interface LLMMatchResult {
  matchIndex: number | null; // Index of matching candidate, or null if no match
  preferTMTitle: boolean;
  reason?: string; // Why the LLM made this decision
}

async function askLLMToMatch(
  ourTitle: string,
  candidates: { name: string; time?: string }[],
  venueName: string,
  eventTime: string
): Promise<LLMMatchResult> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    return { matchIndex: null, preferTMTitle: false };
  }

  // Format candidates for the prompt
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
    
    // Strip markdown code blocks if present
    if (content.startsWith('```')) {
      content = content.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    }
    
    const parsed = JSON.parse(content);
    
    const matchNum = parsed.match;
    const matchIndex = typeof matchNum === 'number' && matchNum >= 1 && matchNum <= candidates.length
      ? matchNum - 1  // Convert 1-indexed to 0-indexed
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

async function main() {
  const args = process.argv.slice(2);
  
  let limit = 500;
  let venueFilter: string | undefined;
  let titleFilter: string | undefined;
  let dryRun = false;
  let fresh = false; // Force re-evaluation, ignore previous matches
  
  for (const arg of args) {
    if (arg.startsWith('--limit=')) limit = parseInt(arg.split('=')[1], 10);
    if (arg.startsWith('--venue=')) venueFilter = arg.split('=')[1];
    if (arg.startsWith('--title=')) titleFilter = arg.split('=')[1];
    if (arg === '--dry-run') dryRun = true;
    if (arg === '--fresh') fresh = true;
  }

  console.log('🎫 TM Enrichment from Cache');
  console.log(`   Limit: ${limit}`);
  console.log(`   Venue: ${venueFilter || 'all'}`);
  console.log(`   Title: ${titleFilter || 'all'}`);
  console.log(`   Dry Run: ${dryRun}`);
  console.log(`   Fresh: ${fresh}${fresh ? ' (ignoring previous matches)' : ''}`);
  console.log('');

  // Check cache has data
  const cacheCount = await prisma.tMEventCache.count();
  if (cacheCount === 0) {
    console.error('❌ TMEventCache is empty. Run download-tm-cache.ts first.');
    process.exit(1);
  }
  console.log(`📦 Cache has ${cacheCount} TM events`);
  console.log('');

  // Get ALL upcoming events with enrichment records
  // Always re-enrich to catch presale changes, cancellations, price updates
  const where: Record<string, unknown> = {
    startDateTime: { gte: new Date() },
    enrichment: { isNot: null },
  };

  if (venueFilter) {
    where.venue = { slug: venueFilter };
  }

  if (titleFilter) {
    where.title = { contains: titleFilter, mode: 'insensitive' };
  }

  const events = await prisma.event.findMany({
    where,
    include: { venue: true, enrichment: true },
    orderBy: { startDateTime: 'asc' },
    take: limit,
  });

  console.log(`📊 Found ${events.length} events to enrich`);
  console.log('');

  let matched = 0;
  let noMatch = 0;
  let errors = 0;
  let llmSkipped = 0;

  console.log('🚀 Starting enrichment...\n');

  for (const event of events) {
    console.log(`Processing: ${event.title}`);
    console.log(`  Venue: ${event.venue.name}`);
    console.log(`  Date: ${event.startDateTime.toLocaleDateString()}`);

    try {
      // Get same-day events from cache for this venue
      // Use localDate string (YYYY-MM-DD) to avoid timezone issues
      const eventDate = event.startDateTime;
      const localDate = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;

      const candidates = await prisma.tMEventCache.findMany({
        where: {
          venueSlug: event.venue.slug,
          localDate: localDate, // Simple string match, no timezone confusion
        },
      });

      if (candidates.length === 0) {
        console.log(`  No TM events in cache for this venue/date`);
        noMatch++;
        
        if (!dryRun && event.enrichment) {
          await prisma.enrichment.update({
            where: { id: event.enrichment.id },
            data: { tmLastChecked: new Date() },
          });
        }
        console.log('');
        continue;
      }

      console.log(`  Found ${candidates.length} cached TM events`);
      
      // Format event time for context
      const eventTime = event.startDateTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });

      // Calculate similarity scores for all candidates (for ranking)
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
      let skippedLLM = false;

      // Check if we can reuse previous match (optimization)
      // Skip if --fresh flag is set (for dev/testing)
      const existingMatch = !fresh && event.enrichment?.tmEventId 
        ? candidates.find(c => c.id === event.enrichment?.tmEventId)
        : null;

      if (existingMatch && event.enrichment?.tmEventName === existingMatch.name) {
        // Previous match still valid and TM name unchanged - reuse
        bestMatch = existingMatch;
        bestSimilarity = event.enrichment?.tmMatchConfidence || 0.85;
        isMatch = true;
        preferTMTitle = event.enrichment?.tmPreferTitle || false;
        skippedLLM = true;
        console.log(`  Reusing previous match (skipping LLM)`);
      } else if (rankedCandidates[0].similarity >= 0.85) {
        // High similarity → auto-match
        bestMatch = rankedCandidates[0].candidate;
        bestSimilarity = rankedCandidates[0].similarity;
        isMatch = true;
        // Simple heuristic: prefer TM if it's much longer (has more info)
        preferTMTitle = bestMatch.name.length > event.title.length * 1.5;
        skippedLLM = true;
        console.log(`  Auto-matched: "${bestMatch.name}" (${(bestSimilarity * 100).toFixed(1)}%)`);
      } else {
        // Ask LLM to pick from ALL candidates
        console.log(`  Asking LLM to pick from ${candidates.length} candidates...`);
        
        const llmCandidates = rankedCandidates.map(r => ({ 
          name: r.candidate.name, 
          time: r.time 
        }));
        
        // Debug: show what we're comparing
        // for (const c of llmCandidates) {
        //   console.log(`    → "${c.name}"`);
        // }
        
        const llmResult = await askLLMToMatch(
          event.title,
          llmCandidates,
          event.venue.name,
          eventTime
        );

        if (llmResult.matchIndex !== null) {
          bestMatch = rankedCandidates[llmResult.matchIndex].candidate;
          bestSimilarity = rankedCandidates[llmResult.matchIndex].similarity;
          isMatch = true;
          preferTMTitle = llmResult.preferTMTitle;
          console.log(`  LLM picked: "${bestMatch.name}"`);
          console.log(`    preferTM: ${preferTMTitle} | reason: ${llmResult.reason || 'none'}`);
        } else {
          console.log(`  LLM: no match${llmResult.reason ? ` (${llmResult.reason})` : ''}`);
        }
      }

      if (isMatch && bestMatch) {
        matched++;
        if (skippedLLM) llmSkipped++;
        console.log(`  ✓ Matched to TM: ${bestMatch.attractionName || bestMatch.name}`);
        console.log(`    Status: ${bestMatch.status || 'N/A'}`);
        console.log(`    URL: ${bestMatch.url || 'N/A'}`);

        if (!dryRun && event.enrichment) {
          await prisma.enrichment.update({
            where: { id: event.enrichment.id },
            data: {
              tmEventId: bestMatch.id,
              tmEventName: bestMatch.name,
              tmUrl: bestMatch.url,
              
              // Sales dates
              tmOnSaleStart: bestMatch.onSaleStart,
              tmOnSaleEnd: bestMatch.onSaleEnd,
              tmPresales: bestMatch.presales ?? undefined,
              
              // Images
              tmImageUrl: bestMatch.imageUrl,
              tmSeatmapUrl: bestMatch.seatmapUrl,
              
              // Artist info
              tmAttractionId: bestMatch.attractionId,
              tmAttractionName: bestMatch.attractionName,
              tmSupportingActs: bestMatch.supportingActs,
              tmExternalLinks: bestMatch.externalLinks ?? undefined,
              
              // Classification
              tmGenre: bestMatch.genre,
              tmSubGenre: bestMatch.subGenre,
              tmSegment: bestMatch.segment,
              
              // Event details
              tmInfo: bestMatch.info,
              tmPleaseNote: bestMatch.pleaseNote,
              tmTicketLimit: bestMatch.ticketLimit,
              tmTimezone: bestMatch.timezone,
              
              // Promoter
              tmPromoterId: bestMatch.promoterId,
              tmPromoterName: bestMatch.promoterName,
              
              // Status & matching
              tmStatus: bestMatch.status,
              tmMatchConfidence: bestSimilarity,
              tmPreferTitle: preferTMTitle,
              tmLastChecked: new Date(),
            },
          });
          console.log(`    💾 Saved`);
        }
      } else {
        noMatch++;
        console.log(`  ✗ No match confirmed`);
        
        if (!dryRun && event.enrichment) {
          await prisma.enrichment.update({
            where: { id: event.enrichment.id },
            data: { tmLastChecked: new Date() },
          });
        }
      }
    } catch (error) {
      errors++;
      console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    console.log('');
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 Enrichment Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Processed:   ${events.length}`);
  console.log(`   Matched:     ${matched} ✓`);
  console.log(`   No Match:    ${noMatch} ○`);
  console.log(`   LLM Skipped: ${llmSkipped} ⚡ (reused previous)`);
  console.log(`   Errors:      ${errors} ✗`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

