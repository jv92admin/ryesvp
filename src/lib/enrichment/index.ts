// Main enrichment service - LLM-first approach

import prisma from '@/db/prisma';
import { Event, EnrichmentStatus, EventCategory } from '@prisma/client';
import { searchKnowledgeGraph, KGResult, isMusicRelated } from './knowledgeGraph';
import { searchSpotifyArtist, SpotifyArtist, isConfidentMatch } from './spotify';
import { categorizeWithLLM, LLMEnrichmentResult } from './llm';

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
  llmResult: LLMEnrichmentResult | null;
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
 * Enrich a single event using LLM-first approach
 * 
 * Flow:
 * 1. LLM categorizes and extracts performer name
 * 2. Based on category, query Spotify (music) or KG (comedy/theater)
 * 3. Store combined results
 */
export async function enrichEvent(
  event: Event & { venue: { name: string } }
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    eventId: event.id,
    status: EnrichmentStatus.PENDING,
    llmResult: null,
    kgResult: null,
    spotifyResult: null,
    inferredCategory: null,
    categoryUpdated: false,
  };

  try {
    // Mark as processing
    await prisma.enrichment.upsert({
      where: { eventId: event.id },
      create: {
        eventId: event.id,
        searchQuery: event.title,
        status: EnrichmentStatus.PROCESSING,
      },
      update: {
        status: EnrichmentStatus.PROCESSING,
        searchQuery: event.title,
      },
    });

    // Step 1: LLM categorization (always run)
    const dateStr = event.startDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    
    result.llmResult = await categorizeWithLLM(
      event.title,
      event.venue.name,
      dateStr,
      {
        description: event.description,
        url: event.url,
        currentCategory: event.category,
      }
    );
    await delay(DELAY_BETWEEN_REQUESTS_MS);

    // Use LLM result for category
    if (result.llmResult) {
      result.inferredCategory = result.llmResult.category;
      
      // Step 2: Targeted API lookups based on LLM category
      const searchTerm = result.llmResult.performer || event.title;
      
      if (result.llmResult.category === 'CONCERT') {
        // Music event - query Spotify
        console.log(`  Searching Spotify for: ${searchTerm}`);
        result.spotifyResult = await searchSpotifyArtist(
          searchTerm,
          SPOTIFY_CLIENT_ID,
          SPOTIFY_CLIENT_SECRET
        );
        
        // Validate match
        if (result.spotifyResult && result.llmResult.performer) {
          if (!isConfidentMatch(searchTerm, result.spotifyResult.name, result.spotifyResult.popularity)) {
            console.log(`  Rejected Spotify match: "${result.spotifyResult.name}" for "${searchTerm}"`);
            result.spotifyResult = null;
          }
        }
        await delay(DELAY_BETWEEN_REQUESTS_MS);
      }
      
      if (['COMEDY', 'THEATER', 'MOVIE'].includes(result.llmResult.category) && result.llmResult.performer) {
        // Non-music with performer - query KG for bio/wiki
        console.log(`  Searching KG for: ${searchTerm}`);
        result.kgResult = await searchKnowledgeGraph(searchTerm, GOOGLE_API_KEY);
        await delay(DELAY_BETWEEN_REQUESTS_MS);
      }
    } else {
      // LLM failed - fall back to legacy flow
      console.log('  LLM failed, using legacy KG-first flow');
      result.kgResult = await searchKnowledgeGraph(event.title, GOOGLE_API_KEY);
      await delay(DELAY_BETWEEN_REQUESTS_MS);
      
      // Check if music-related
      if (result.kgResult && isMusicRelated(result.kgResult.types)) {
        result.spotifyResult = await searchSpotifyArtist(
          event.title,
          SPOTIFY_CLIENT_ID,
          SPOTIFY_CLIENT_SECRET
        );
      }
    }

    // Update event category if LLM is confident
    if (result.llmResult && 
        result.llmResult.confidence !== 'low' &&
        result.llmResult.category !== event.category) {
      await prisma.event.update({
        where: { id: event.id },
        data: { category: result.llmResult.category },
      });
      result.categoryUpdated = true;
      console.log(`  Updated category: ${event.category} → ${result.llmResult.category}`);
    }

    // Determine final status
    if (result.llmResult) {
      result.status = (result.spotifyResult || result.kgResult)
        ? EnrichmentStatus.COMPLETED
        : EnrichmentStatus.PARTIAL; // LLM worked but no API enrichment
    } else if (result.kgResult || result.spotifyResult) {
      result.status = EnrichmentStatus.PARTIAL;
    } else {
      result.status = EnrichmentStatus.FAILED;
    }

    // Save enrichment
    await saveEnrichment(event.id, result.llmResult?.performer || event.title, result);

  } catch (error) {
    result.status = EnrichmentStatus.FAILED;
    result.error = error instanceof Error ? error.message : 'Unknown error';
    
    await prisma.enrichment.upsert({
      where: { eventId: event.id },
      create: {
        eventId: event.id,
        searchQuery: event.title,
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
 * Save enrichment data to database
 */
async function saveEnrichment(
  eventId: string,
  searchQuery: string,
  result: EnrichmentResult
): Promise<void> {
  const { llmResult, kgResult, spotifyResult, inferredCategory, categoryUpdated, status, error } = result;

  await prisma.enrichment.upsert({
    where: { eventId },
    create: {
      eventId,
      searchQuery,
      status,
      errorMessage: error,
      
      // LLM data
      llmCategory: llmResult?.category,
      llmPerformer: llmResult?.performer,
      llmDescription: llmResult?.description,
      llmConfidence: llmResult?.confidence,
      
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
      
      // LLM data
      llmCategory: llmResult?.category,
      llmPerformer: llmResult?.performer,
      llmDescription: llmResult?.description,
      llmConfidence: llmResult?.confidence,
      
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
export type { LLMEnrichmentResult } from './llm';
export { categorizeWithLLM } from './llm';

