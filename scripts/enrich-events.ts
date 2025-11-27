#!/usr/bin/env npx tsx
/**
 * Event Enrichment Script
 * 
 * Run manually to enrich events with Knowledge Graph and Spotify data.
 * 
 * Usage:
 *   npx dotenvx run -- npx tsx scripts/enrich-events.ts [--limit=N] [--force]
 * 
 * Options:
 *   --limit=N   Maximum number of events to process (default: 50)
 *   --force     Re-process all events, even those already enriched
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

// Use shared prisma instance
import prisma from '../src/db/prisma';

// Dynamic imports for enrichment functions (to work with tsx)
async function loadEnrichment() {
  const mod = await import('../src/lib/enrichment');
  return mod;
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let limit = 50;
  let force = false;
  
  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10);
    }
    if (arg === '--force') {
      force = true;
    }
  }

  console.log('🔍 Event Enrichment Script');
  console.log(`   Limit: ${limit}`);
  console.log(`   Force: ${force}`);
  console.log('');

  // Check for API keys
  if (!process.env.GOOGLE_API_KEY) {
    console.warn('⚠️  GOOGLE_API_KEY not set - Knowledge Graph will be skipped');
  }
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    console.warn('⚠️  Spotify credentials not set - Spotify will be skipped');
  }
  console.log('');

  // Load enrichment module
  const { runEnrichmentBatch, getEventsToEnrich } = await loadEnrichment();

  // If force mode, clear existing enrichments
  if (force) {
    console.log('🗑️  Clearing existing enrichments (force mode)...');
    await prisma.enrichment.deleteMany({});
    console.log('   Done');
    console.log('');
  }

  // Check how many events need enrichment
  const pendingEvents = await getEventsToEnrich(1000);
  console.log(`📊 Events needing enrichment: ${pendingEvents.length}`);
  console.log('');

  if (pendingEvents.length === 0) {
    console.log('✅ All events are already enriched!');
    return;
  }

  // Run enrichment
  console.log('🚀 Starting enrichment...');
  console.log('');
  
  const startTime = Date.now();
  const summary = await runEnrichmentBatch(limit);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Print summary
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 Enrichment Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Processed:  ${summary.processed}`);
  console.log(`   Completed:  ${summary.completed} ✓`);
  console.log(`   Partial:    ${summary.partial} ⚡`);
  console.log(`   Failed:     ${summary.failed} ✗`);
  console.log(`   Skipped:    ${summary.skipped} ○`);
  console.log(`   Categories: ${summary.categoriesUpdated} updated`);
  console.log(`   Duration:   ${duration}s`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

