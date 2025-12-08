/**
 * GET /api/cron/scrape
 * 
 * Cron job to scrape all venue websites for new events.
 * Runs all configured scrapers and upserts events into the database.
 * 
 * Schedule: Daily at 2 AM Central (8 AM UTC)
 * 
 * Auth: Requires CRON_SECRET bearer token (Vercel sends this automatically)
 * 
 * Note: Vercel Cron jobs use GET requests, so the job logic is in GET handler.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth, logCronStart, logCronSuccess, logCronError } from '@/lib/cron/auth';
import { runAllScrapers } from '@/ingestion/orchestrator';

const JOB_NAME = 'scrape';

// Prevent caching - ensures job runs every time
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/scrape
 * 
 * Main cron job handler - Vercel Cron calls this via GET
 */
export async function GET(request: NextRequest) {
  // Auth check - Vercel automatically sends Authorization header with CRON_SECRET
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
 * POST /api/cron/scrape
 * 
 * Manual trigger endpoint (for local testing or manual runs)
 */
export async function POST(request: NextRequest) {
  return GET(request);
}

