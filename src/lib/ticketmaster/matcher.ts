/**
 * Event Matching: Match RyesVP events to Ticketmaster events
 * 
 * Strategy:
 * 1. Filter to same venue + same date (done before calling this)
 * 2. Calculate similarity scores to RANK candidates
 * 3. If ≥85% similarity → auto-accept highest match
 * 4. If <85% → send candidates to LLM to decide
 * 
 * Keep it simple - let the LLM handle nuances like:
 * - Men's vs Women's sports
 * - Tour names vs artist names
 * - Abbreviations
 */

import { Event, Venue } from '@prisma/client';
import { TMEvent, TMEnrichmentData } from './types';
import {
  searchEventsAtVenue,
  getBestImageUrl,
  getPrimaryClassification,
  getStandardPriceRange,
  getSupportingActs,
  getExternalLinks,
} from './client';
import { getTMVenueId } from './venues';

// Thresholds
const AUTO_MATCH_THRESHOLD = 0.85; // 85%+ = auto-accept (no LLM needed)

/**
 * Calculate string similarity using Levenshtein distance
 * Returns 0-1 where 1 is exact match
 * 
 * This is ONLY for ranking candidates - LLM makes final decision for <85%
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeForComparison(str1);
  const s2 = normalizeForComparison(str2);
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const containment = Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
    return Math.max(containment, 0.7);
  }

  // Word overlap bonus
  const words1 = s1.split(/\s+/).filter(w => w.length > 2);
  const words2 = s2.split(/\s+/).filter(w => w.length > 2);
  const commonWords = words1.filter(w => words2.some(w2 => w2.includes(w) || w.includes(w2)));
  
  if (commonWords.length > 0 && words1.length > 0) {
    const wordOverlap = commonWords.length / words1.length;
    if (wordOverlap >= 0.5) {
      return Math.max(0.5, wordOverlap * 0.8);
    }
  }

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  
  return 1 - (distance / maxLength);
}

/**
 * Normalize string for comparison (just for ranking, not for matching logic)
 */
function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\b(the|a|an)\b/gi, '')
    .trim();
}

/**
 * Levenshtein distance implementation
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }
  
  return dp[m][n];
}

interface LLMMatchResult {
  isMatch: boolean;
  preferTMTitle: boolean;
}

/**
 * Use LLM to confirm if two event titles refer to the same event
 * Also asks if we should prefer the TM title (often more descriptive)
 */
async function confirmMatchWithLLM(
  ourTitle: string,
  tmTitle: string,
  venueName: string
): Promise<LLMMatchResult> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set, skipping LLM confirmation');
    return { isMatch: false, preferTMTitle: false };
  }

  const prompt = `You are helping match event listings from a venue website to Ticketmaster data.

Context: These two events are at the SAME VENUE on the SAME DATE. We are fuzzy-matching because venue websites and Ticketmaster often describe the same event differently.

Venue listing: "${ourTitle}"
Ticketmaster listing: "${tmTitle}"
Venue: ${venueName}

Answer JSON only:
{"isMatch": true/false, "preferTMTitle": true/false}

isMatch guidance:
- Same date + same venue is strong evidence of a match
- Ticketmaster titles are often more verbose (tour names, opponent names, etc.)
- Venue titles may use abbreviations or shorthand
- For sports: home team should match; opponent name is extra detail
- For concerts: artist should match; tour name may differ
- Red flags: different gender (men's vs women's), completely different performers
- When context is strong and no red flags: lean toward matching

preferTMTitle guidance:
- Set true ONLY if TM title is clearly more informative for users
- If venue title is adequate, keep false (don't change for marginal gains)
- Example: "Texas WBB" → "Texas vs North Carolina" might be worth it; "Billy Strings" → "Billy Strings" is not`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      console.error('LLM confirmation failed:', response.status);
      return { isMatch: false, preferTMTitle: false };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    try {
      const parsed = JSON.parse(content);
      return {
        isMatch: Boolean(parsed.isMatch),
        preferTMTitle: Boolean(parsed.preferTMTitle),
      };
    } catch {
      // Fallback: check if response contains "yes" or "true"
      const isMatch = /yes|true|match/i.test(content);
      return { isMatch, preferTMTitle: false };
    }
  } catch (error) {
    console.error('LLM confirmation error:', error);
    return { isMatch: false, preferTMTitle: false };
  }
}

export interface MatchResult {
  tmEvent: TMEvent | null;
  confidence: number;
  matchedBy: 'auto' | 'llm' | 'none';
  preferTMTitle: boolean;
}

/**
 * Find the best TM match for a RyesVP event
 */
export async function findTMMatch(
  event: Event & { venue: Venue }
): Promise<MatchResult> {
  // Get TM venue ID
  const tmVenueId = getTMVenueId(event.venue.slug);
  
  if (!tmVenueId) {
    console.log(`  No TM venue mapping for: ${event.venue.slug}`);
    return { tmEvent: null, confidence: 0, matchedBy: 'none', preferTMTitle: false };
  }

  // Search TM for events at this venue on this date
  const tmEvents = await searchEventsAtVenue(tmVenueId, event.startDateTime);
  
  if (tmEvents.length === 0) {
    console.log(`  No TM events found at ${event.venue.name} on ${event.startDateTime.toDateString()}`);
    return { tmEvent: null, confidence: 0, matchedBy: 'none', preferTMTitle: false };
  }

  console.log(`  Found ${tmEvents.length} TM events, comparing titles...`);

  // Find best match by title similarity
  let bestMatch: TMEvent | null = null;
  let bestSimilarity = 0;

  for (const tmEvent of tmEvents) {
    const similarity = calculateSimilarity(event.title, tmEvent.name);
    
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = tmEvent;
    }
  }

  if (!bestMatch) {
    return { tmEvent: null, confidence: 0, matchedBy: 'none', preferTMTitle: false };
  }

  console.log(`  Best match: "${bestMatch.name}" (${(bestSimilarity * 100).toFixed(1)}% similar)`);

  // Auto-accept high confidence matches (but still check if TM title is better)
  if (bestSimilarity >= AUTO_MATCH_THRESHOLD) {
    console.log(`  Auto-matched (≥${AUTO_MATCH_THRESHOLD * 100}%)`);
    // Check if TM title is more descriptive (longer with more info)
    const preferTMTitle = bestMatch.name.length > event.title.length * 1.5;
    return { tmEvent: bestMatch, confidence: bestSimilarity, matchedBy: 'auto', preferTMTitle };
  }

  // For lower similarity, ALWAYS ask LLM (even below threshold)
  // If we found events at the same venue on the same day, let LLM decide
  console.log(`  Asking LLM to confirm match...`);
  const llmResult = await confirmMatchWithLLM(
    event.title,
    bestMatch.name,
    event.venue.name
  );

  if (llmResult.isMatch) {
    console.log(`  LLM confirmed match (prefer TM title: ${llmResult.preferTMTitle})`);
    return { 
      tmEvent: bestMatch, 
      confidence: Math.max(0.75, bestSimilarity), 
      matchedBy: 'llm',
      preferTMTitle: llmResult.preferTMTitle,
    };
  } else {
    console.log(`  LLM rejected match`);
    return { tmEvent: null, confidence: 0, matchedBy: 'none', preferTMTitle: false };
  }
}

/**
 * Extract enrichment data from a matched TM event
 */
export function extractTMEnrichmentData(
  tmEvent: TMEvent,
  matchConfidence: number,
  preferTMTitle: boolean = false
): TMEnrichmentData {
  const classification = getPrimaryClassification(tmEvent);
  const supportingActs = getSupportingActs(tmEvent);
  const externalLinks = getExternalLinks(tmEvent);
  
  // Get main attraction
  const mainAttraction = tmEvent._embedded?.attractions?.[0];
  
  // Parse sales dates
  let onSaleStart: Date | null = null;
  let onSaleEnd: Date | null = null;
  
  if (tmEvent.sales?.public?.startDateTime) {
    onSaleStart = new Date(tmEvent.sales.public.startDateTime);
  }
  if (tmEvent.sales?.public?.endDateTime) {
    onSaleEnd = new Date(tmEvent.sales.public.endDateTime);
  }

  return {
    tmEventId: tmEvent.id,
    tmEventName: tmEvent.name, // Full TM event title
    tmUrl: tmEvent.url || null,
    tmOnSaleStart: onSaleStart,
    tmOnSaleEnd: onSaleEnd,
    tmPresales: tmEvent.sales?.presales || null,
    tmImageUrl: getBestImageUrl(tmEvent),
    tmAttractionId: mainAttraction?.id || null,
    tmAttractionName: mainAttraction?.name || null,
    tmGenre: classification.genre,
    tmSubGenre: classification.subGenre,
    tmSegment: classification.segment,
    tmSupportingActs: supportingActs,
    tmExternalLinks: Object.keys(externalLinks).length > 0 ? externalLinks : null,
    tmMatchConfidence: matchConfidence,
    preferTMTitle,
    // "Know before you go" fields
    tmInfo: tmEvent.info || null,
    tmPleaseNote: tmEvent.pleaseNote || null,
  };
}

/**
 * Match and enrich a single event with TM data
 * Returns null if no match found
 */
export async function matchAndExtractTMData(
  event: Event & { venue: Venue }
): Promise<TMEnrichmentData | null> {
  const matchResult = await findTMMatch(event);
  
  if (!matchResult.tmEvent) {
    return null;
  }

  return extractTMEnrichmentData(
    matchResult.tmEvent, 
    matchResult.confidence,
    matchResult.preferTMTitle
  );
}

