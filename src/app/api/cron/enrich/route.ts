/**
 * GET /api/cron/enrich
 * 
 * Cron job to enrich events with LLM categorization, Knowledge Graph, and Spotify data.
 * Processes events that don't have enrichment records yet.
 * 
 * Schedule: Daily at 4 AM Central (10 AM UTC) — after scraping completes
 * 
 * Auth: Requires CRON_SECRET bearer token (Vercel sends this automatically)
 * 
 * Note: Vercel Cron jobs use GET requests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth, logCronStart, logCronSuccess, logCronError } from '@/lib/cron/auth';
import { runEnrichmentBatch } from '@/lib/enrichment';
import prisma from '@/db/prisma';

const JOB_NAME = 'enrich';
const DEFAULT_BATCH_SIZE = 50;

// Prevent caching
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Auth check
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const startTime = logCronStart(JOB_NAME);

  try {
    // Optional: allow batch size override via query param
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || String(DEFAULT_BATCH_SIZE), 10);
    const force = url.searchParams.get('force') === 'true';

    // If force mode, delete all enrichment records first (re-process everything)
    if (force) {
      console.log('[CRON] enrich: Force mode - clearing existing enrichments...');
      const deleted = await prisma.enrichment.deleteMany({});
      console.log(`[CRON] enrich: Deleted ${deleted.count} enrichment records`);
    }

    const result = await runEnrichmentBatch(limit);

    const summary = {
      processed: result.processed,
      completed: result.completed,
      partial: result.partial,
      failed: result.failed,
      skipped: result.skipped,
      categoriesUpdated: result.categoriesUpdated,
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
 * POST /api/cron/enrich
 * 
 * Manual trigger endpoint (for local testing)
 */
export async function POST(request: NextRequest) {
  return GET(request);
}

