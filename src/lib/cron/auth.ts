/**
 * Cron Job Authentication
 * 
 * Validates that cron requests have the correct CRON_SECRET token.
 * All /api/cron/* routes should use this.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify cron job authentication.
 * 
 * @returns null if auth passes, NextResponse error if auth fails
 * 
 * Usage:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const authError = verifyCronAuth(request);
 *   if (authError) return authError;
 *   // ... job logic
 * }
 * ```
 */
export function verifyCronAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;
  
  // Check if CRON_SECRET is configured
  if (!expectedToken) {
    console.error('[CRON] CRON_SECRET environment variable not configured');
    return NextResponse.json(
      { error: 'Server misconfigured: CRON_SECRET not set' },
      { status: 500 }
    );
  }
  
  // Check if auth header matches
  if (authHeader !== `Bearer ${expectedToken}`) {
    console.warn('[CRON] Unauthorized request - invalid or missing token');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Auth passed
  return null;
}

/**
 * Log helper for cron jobs
 */
export function logCronStart(jobName: string): number {
  console.log(`[CRON] ${jobName} starting...`);
  return Date.now();
}

export function logCronSuccess(jobName: string, startTime: number, summary: Record<string, unknown>): void {
  const duration = Date.now() - startTime;
  console.log(`[CRON] ${jobName} completed in ${duration}ms`, JSON.stringify(summary));
}

export function logCronError(jobName: string, startTime: number, error: unknown): void {
  const duration = Date.now() - startTime;
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[CRON] ${jobName} failed after ${duration}ms: ${message}`);
}

