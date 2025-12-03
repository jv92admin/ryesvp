/**
 * POST /api/cron/scrape
 * 
 * Cron job to scrape all venue websites for new events.
 * Runs all configured scrapers and upserts events into the database.
 * 
 * Schedule: Daily at 2 AM Central (8 AM UTC)
 * 
 * Auth: Requires CRON_SECRET bearer token
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth, logCronStart, logCronSuccess, logCronError } from '@/lib/cron/auth';
import { runAllScrapers } from '@/ingestion/orchestrator';

const JOB_NAME = 'scrape';

export async function POST(request: NextRequest) {
  // Auth check
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const startTime = logCronStart(JOB_NAME);

  try {
    const result = await runAllScrapers();

    const summary = {
      totalEvents: result.summary.totalEvents,
      created: result.summary.created,
      updated: result.summary.updated,
      errorCount: result.summary.errors.length,
      scrapers: result.results.map((r) => ({
        venue: r.venueSlug,
        events: r.events.length,
        error: r.error || null,
      })),
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
 * GET /api/cron/scrape
 * 
 * Health check / status endpoint
 */
export async function GET() {
  return NextResponse.json({
    job: JOB_NAME,
    description: 'Scrape all venue websites for new events',
    method: 'POST',
    auth: 'Bearer CRON_SECRET',
  });
}

