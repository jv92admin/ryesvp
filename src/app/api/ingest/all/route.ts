import { NextRequest, NextResponse } from 'next/server';
import { runAllScrapers } from '@/ingestion/orchestrator';

/**
 * POST /api/ingest/all
 * 
 * Triggers all scrapers and upserts events into the database.
 * This endpoint should be called by Vercel Cron for scheduled ingestion.
 * 
 * For security, you may want to add authentication/authorization:
 * - Check for a secret token in headers
 * - Or restrict to Vercel Cron IPs
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.INGEST_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('Starting ingestion...');
    const startTime = Date.now();

    const result = await runAllScrapers();

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      summary: result.summary,
      scrapers: result.results.map((r) => ({
        venueSlug: r.venueSlug,
        eventCount: r.events.length,
        error: r.error || null,
      })),
    });
  } catch (error) {
    console.error('Ingestion error:', error);
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

/**
 * GET /api/ingest/all
 * 
 * Returns status information about ingestion (for monitoring/debugging)
 */
export async function GET() {
  return NextResponse.json({
    message: 'Ingestion endpoint is active',
    endpoints: {
      POST: 'Trigger all scrapers',
    },
  });
}

