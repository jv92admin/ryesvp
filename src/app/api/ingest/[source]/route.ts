import { NextRequest, NextResponse } from 'next/server';
import { runScraper } from '@/ingestion/orchestrator';

/**
 * POST /api/ingest/[source]
 * 
 * Triggers a single scraper by name.
 * Useful for testing individual scrapers.
 * 
 * Example: POST /api/ingest/moody-center
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  try {
    const { source } = await params;
    
    console.log(`Running scraper: ${source}`);
    const startTime = Date.now();

    const result = await runScraper(source);
    const upsertResult = await import('@/ingestion/upsert').then(m => 
      m.upsertEvents(result.events)
    );

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      scraper: {
        source: result.source,
        venueSlug: result.venueSlug,
        eventCount: result.events.length,
        error: result.error || null,
      },
      upsert: {
        created: upsertResult.created,
        updated: upsertResult.updated,
        errors: upsertResult.errors,
      },
    });
  } catch (error) {
    console.error(`Error running scraper ${(await params).source}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

