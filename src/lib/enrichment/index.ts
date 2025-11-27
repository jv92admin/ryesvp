// Main enrichment service

import prisma from '@/db/prisma';
import { Event, Enrichment, EnrichmentStatus, EventCategory } from '@prisma/client';
import { extractKeywords, getPrimaryKeyword } from './keywords';
import { searchKnowledgeGraph, KGResult, isMusicRelated } from './knowledgeGraph';
import { searchSpotifyArtist, SpotifyArtist, isConfidentMatch, isGenericQuery } from './spotify';
import { inferCategory, shouldUpdateCategory, hasHighConfidenceKGType } from './categoryInference';

// Environment variables
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';

// Rate limiting delays
const DELAY_BETWEEN_EVENTS_MS = 500;
const DELAY_BETWEEN_REQUESTS_MS = 100;

export interface EnrichmentResult {
  eventId: string;
  status: EnrichmentStatus;
  kgResult: KGResult | null;
  spotifyResult: SpotifyArtist | null;
  inferredCategory: EventCategory | null;
  categoryUpdated: boolean;
  error?: string;
}

export interface EnrichmentSummary {
  processed: number;
  completed: number;
  partial: number;
  failed: number;
  skipped: number;
  categoriesUpdated: number;
}

/**
 * Enrich a single event
 */
export async function enrichEvent(
  event: Event & { venue: { name: string } }
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    eventId: event.id,
    status: EnrichmentStatus.PENDING,
    kgResult: null,
    spotifyResult: null,
    inferredCategory: null,
    categoryUpdated: false,
  };

  // Extract keywords from title
  const keywords = extractKeywords(event.title, event.venue.name);
  const primaryKeyword = keywords[0] || null;

  if (!primaryKeyword) {
    result.status = EnrichmentStatus.SKIPPED;
    await saveEnrichment(event.id, primaryKeyword || event.title, result);
    return result;
  }

  try {
    // Mark as processing
    await prisma.enrichment.upsert({
      where: { eventId: event.id },
      create: {
        eventId: event.id,
        searchQuery: primaryKeyword,
        status: EnrichmentStatus.PROCESSING,
      },
      update: {
        status: EnrichmentStatus.PROCESSING,
        searchQuery: primaryKeyword,
      },
    });

    // Query Knowledge Graph
    result.kgResult = await searchKnowledgeGraph(primaryKeyword, GOOGLE_API_KEY);
    await delay(DELAY_BETWEEN_REQUESTS_MS);

    // Decide if we need Spotify
    const shouldQuerySpotify = shouldTrySpotify(result.kgResult) && !isGenericQuery(primaryKeyword);
    
    if (shouldQuerySpotify) {
      result.spotifyResult = await searchSpotifyArtist(
        primaryKeyword,
        SPOTIFY_CLIENT_ID,
        SPOTIFY_CLIENT_SECRET
      );
      
      // Validate Spotify match - must have actual name similarity
      if (result.spotifyResult && !isConfidentMatch(
        primaryKeyword,
        result.spotifyResult.name,
        result.spotifyResult.popularity
      )) {
        console.log(`  Rejected Spotify match: "${result.spotifyResult.name}" for query "${primaryKeyword}"`);
        result.spotifyResult = null; // Reject low-confidence match
      }
    }

    // Infer category
    result.inferredCategory = inferCategory(result.kgResult, result.spotifyResult);
    const isConfident = hasHighConfidenceKGType(result.kgResult);

    // Check if we should update the event's category
    if (result.inferredCategory && shouldUpdateCategory(event.category, result.inferredCategory, isConfident)) {
      await prisma.event.update({
        where: { id: event.id },
        data: { category: result.inferredCategory },
      });
      result.categoryUpdated = true;
    }

    // Determine final status
    if (result.kgResult || result.spotifyResult) {
      result.status = result.kgResult && result.spotifyResult
        ? EnrichmentStatus.COMPLETED
        : EnrichmentStatus.PARTIAL;
    } else {
      result.status = EnrichmentStatus.FAILED;
    }

    // Save enrichment
    await saveEnrichment(event.id, primaryKeyword, result);

  } catch (error) {
    result.status = EnrichmentStatus.FAILED;
    result.error = error instanceof Error ? error.message : 'Unknown error';
    
    await prisma.enrichment.upsert({
      where: { eventId: event.id },
      create: {
        eventId: event.id,
        searchQuery: primaryKeyword,
        status: EnrichmentStatus.FAILED,
        errorMessage: result.error,
      },
      update: {
        status: EnrichmentStatus.FAILED,
        errorMessage: result.error,
        retryCount: { increment: 1 },
      },
    });
  }

  return result;
}

/**
 * Decide if we should query Spotify
 * Only search Spotify if KG indicates music-related entity
 */
function shouldTrySpotify(kgResult: KGResult | null): boolean {
  // No KG result - don't blindly search Spotify (causes false matches)
  if (!kgResult) return false;
  
  // KG indicates music - definitely try Spotify
  if (isMusicRelated(kgResult.types)) return true;
  
  // Check description for music hints
  const desc = kgResult.description?.toLowerCase() || '';
  const bio = kgResult.bio?.toLowerCase() || '';
  
  if (desc.includes('band') || desc.includes('musician') || desc.includes('singer') || 
      desc.includes('rapper') || desc.includes('dj') || desc.includes('music')) {
    return true;
  }
  
  if (bio.includes('band') || bio.includes('musician') || bio.includes('recording artist') ||
      bio.includes('singer') || bio.includes('songwriter')) {
    return true;
  }
  
  // KG found something but it's not music - skip Spotify
  return false;
}

/**
 * Save enrichment data to database
 */
async function saveEnrichment(
  eventId: string,
  searchQuery: string,
  result: EnrichmentResult
): Promise<void> {
  const { kgResult, spotifyResult, inferredCategory, categoryUpdated, status, error } = result;

  await prisma.enrichment.upsert({
    where: { eventId },
    create: {
      eventId,
      searchQuery,
      status,
      errorMessage: error,
      
      // Knowledge Graph
      kgEntityId: kgResult?.entityId,
      kgName: kgResult?.name,
      kgDescription: kgResult?.description,
      kgBio: kgResult?.bio,
      kgImageUrl: kgResult?.imageUrl,
      kgWikiUrl: kgResult?.wikiUrl,
      kgTypes: kgResult?.types || [],
      kgScore: kgResult?.score,
      
      // Spotify
      spotifyId: spotifyResult?.id,
      spotifyName: spotifyResult?.name,
      spotifyUrl: spotifyResult?.url,
      spotifyGenres: spotifyResult?.genres || [],
      spotifyPopularity: spotifyResult?.popularity,
      spotifyImageUrl: spotifyResult?.imageUrl,
      
      // Inference
      inferredCategory,
      categoryUpdated,
    },
    update: {
      searchQuery,
      status,
      errorMessage: error,
      
      // Knowledge Graph
      kgEntityId: kgResult?.entityId,
      kgName: kgResult?.name,
      kgDescription: kgResult?.description,
      kgBio: kgResult?.bio,
      kgImageUrl: kgResult?.imageUrl,
      kgWikiUrl: kgResult?.wikiUrl,
      kgTypes: kgResult?.types || [],
      kgScore: kgResult?.score,
      
      // Spotify
      spotifyId: spotifyResult?.id,
      spotifyName: spotifyResult?.name,
      spotifyUrl: spotifyResult?.url,
      spotifyGenres: spotifyResult?.genres || [],
      spotifyPopularity: spotifyResult?.popularity,
      spotifyImageUrl: spotifyResult?.imageUrl,
      
      // Inference
      inferredCategory,
      categoryUpdated,
    },
  });
}

/**
 * Get events that need enrichment
 */
export async function getEventsToEnrich(limit: number = 50): Promise<(Event & { venue: { name: string } })[]> {
  return prisma.event.findMany({
    where: {
      OR: [
        // No enrichment record
        { enrichment: null },
        // Failed but retryable
        {
          enrichment: {
            status: EnrichmentStatus.FAILED,
            retryCount: { lt: 3 },
          },
        },
        // Pending
        {
          enrichment: {
            status: EnrichmentStatus.PENDING,
          },
        },
      ],
    },
    include: {
      venue: {
        select: { name: true },
      },
    },
    orderBy: { startDateTime: 'asc' },
    take: limit,
  });
}

/**
 * Run enrichment on a batch of events
 */
export async function runEnrichmentBatch(limit: number = 50): Promise<EnrichmentSummary> {
  const summary: EnrichmentSummary = {
    processed: 0,
    completed: 0,
    partial: 0,
    failed: 0,
    skipped: 0,
    categoriesUpdated: 0,
  };

  const events = await getEventsToEnrich(limit);
  console.log(`Found ${events.length} events to enrich`);

  for (const event of events) {
    console.log(`Enriching: ${event.title}`);
    
    const result = await enrichEvent(event);
    summary.processed++;

    switch (result.status) {
      case EnrichmentStatus.COMPLETED:
        summary.completed++;
        break;
      case EnrichmentStatus.PARTIAL:
        summary.partial++;
        break;
      case EnrichmentStatus.FAILED:
        summary.failed++;
        break;
      case EnrichmentStatus.SKIPPED:
        summary.skipped++;
        break;
    }

    if (result.categoryUpdated) {
      summary.categoriesUpdated++;
    }

    // Rate limiting
    await delay(DELAY_BETWEEN_EVENTS_MS);
  }

  return summary;
}

/**
 * Utility: delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Re-export types and utilities
export { extractKeywords, getPrimaryKeyword } from './keywords';
export type { KGResult } from './knowledgeGraph';
export type { SpotifyArtist } from './spotify';
export { isGenericQuery } from './spotify';

