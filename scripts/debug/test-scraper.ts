#!/usr/bin/env npx tsx
/**
 * Test a scraper without writing to the database.
 * 
 * Usage:
 *   npx tsx scripts/debug/test-scraper.ts acl-live
 *   npx tsx scripts/debug/test-scraper.ts moody-center
 *   npx tsx scripts/debug/test-scraper.ts paramount
 *   npx tsx scripts/debug/test-scraper.ts stubbs
 *   npx tsx scripts/debug/test-scraper.ts long-center
 *   npx tsx scripts/debug/test-scraper.ts tpa
 * 
 * Output:
 *   - Total events found
 *   - Date range (earliest to latest)
 *   - Sample of events at different points
 *   - Any errors or warnings
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { fetchEventsFromAclLive } from '../../src/ingestion/sources/aclLive';
import { fetchEventsFromMoodyCenter } from '../../src/ingestion/sources/moodyCenter';
import { fetchEventsFromParamount } from '../../src/ingestion/sources/paramount';
import { fetchEventsFromStubbs } from '../../src/ingestion/sources/stubbs';
import { fetchEventsFromLongCenter } from '../../src/ingestion/sources/longCenter';
import { fetchEventsFromTPA } from '../../src/ingestion/sources/texasPerformingArts';
import { fetchEventsFromEmos } from '../../src/ingestion/sources/emos';
import { fetchEventsFromMohawk } from '../../src/ingestion/sources/mohawk';
import { fetchEventsFromConcourseProject } from '../../src/ingestion/sources/concourseProject';
import { NormalizedEvent } from '../../src/ingestion/types';

const scrapers: Record<string, () => Promise<NormalizedEvent[]>> = {
  'acl-live': fetchEventsFromAclLive,
  'moody-center': fetchEventsFromMoodyCenter,
  'paramount': fetchEventsFromParamount,
  'stubbs': fetchEventsFromStubbs,
  'long-center': fetchEventsFromLongCenter,
  'tpa': fetchEventsFromTPA,
  'emos': fetchEventsFromEmos,
  'mohawk': fetchEventsFromMohawk,
  'concourse-project': fetchEventsFromConcourseProject,
};

async function main() {
  const venue = process.argv[2];
  
  if (!venue || !scrapers[venue]) {
    console.log('Usage: npx tsx scripts/debug/test-scraper.ts <venue>');
    console.log('\nAvailable scrapers:');
    Object.keys(scrapers).forEach(v => console.log(`  - ${v}`));
    process.exit(1);
  }

  console.log(`\n🧪 Testing scraper: ${venue}`);
  console.log('=' .repeat(60));
  console.log('⏳ Running scraper (this may take a minute)...\n');

  const startTime = Date.now();
  
  try {
    const events = await scrapers[venue]();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n' + '=' .repeat(60));
    console.log(`✅ Scraper completed in ${elapsed}s`);
    console.log('=' .repeat(60));
    
    if (events.length === 0) {
      console.log('\n⚠️  No events found!');
      return;
    }

    // Sort by date
    const sorted = [...events].sort((a, b) => 
      a.startDateTime.getTime() - b.startDateTime.getTime()
    );

    // Date range
    const earliest = sorted[0];
    const latest = sorted[sorted.length - 1];
    
    console.log(`\n📊 SUMMARY`);
    console.log(`   Total events: ${events.length}`);
    console.log(`   Earliest: ${earliest.startDateTime.toISOString().split('T')[0]} - ${earliest.title.slice(0, 40)}`);
    console.log(`   Latest:   ${latest.startDateTime.toISOString().split('T')[0]} - ${latest.title.slice(0, 40)}`);

    // Group by month
    const byMonth: Record<string, NormalizedEvent[]> = {};
    for (const e of sorted) {
      const month = e.startDateTime.toISOString().slice(0, 7); // YYYY-MM
      if (!byMonth[month]) byMonth[month] = [];
      byMonth[month].push(e);
    }

    console.log(`\n📅 EVENTS BY MONTH`);
    for (const [month, monthEvents] of Object.entries(byMonth)) {
      console.log(`   ${month}: ${monthEvents.length} events`);
    }

    // Show first 5 and last 5
    console.log(`\n🎯 FIRST 5 EVENTS`);
    for (const e of sorted.slice(0, 5)) {
      console.log(`   ${e.startDateTime.toISOString().split('T')[0]} | ${e.title.slice(0, 50)}`);
    }

    console.log(`\n🎯 LAST 5 EVENTS`);
    for (const e of sorted.slice(-5)) {
      console.log(`   ${e.startDateTime.toISOString().split('T')[0]} | ${e.title.slice(0, 50)}`);
    }

    // Check for duplicates
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const e of events) {
      const key = `${e.startDateTime.toISOString().split('T')[0]}-${e.title}`;
      if (seen.has(key)) {
        duplicates.push(key);
      }
      seen.add(key);
    }
    
    if (duplicates.length > 0) {
      console.log(`\n⚠️  DUPLICATES FOUND: ${duplicates.length}`);
      duplicates.slice(0, 3).forEach(d => console.log(`   - ${d}`));
    }

    // Check for missing data
    const missingUrl = events.filter(e => !e.url).length;
    const missingImage = events.filter(e => !e.imageUrl).length;
    
    console.log(`\n📋 DATA QUALITY`);
    console.log(`   Missing URL: ${missingUrl}/${events.length}`);
    console.log(`   Missing Image: ${missingImage}/${events.length}`);

  } catch (error) {
    console.error('\n❌ Scraper failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);

