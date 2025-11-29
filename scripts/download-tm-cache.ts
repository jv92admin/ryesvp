#!/usr/bin/env npx tsx
/**
 * Download TM Events Cache
 * 
 * Downloads all Ticketmaster events for our venues and stores them in TMEventCache.
 * This is much more efficient than per-event API calls.
 * 
 * Usage:
 *   npx tsx scripts/download-tm-cache.ts [--months=N]
 * 
 * Options:
 *   --months=N   How many months ahead to fetch (default: 6)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import prisma from '../src/db/prisma';
import { 
  searchEvents, 
  getBestImageUrl, 
  getPrimaryClassification,
  getSupportingActs,
  getExternalLinks,
  isConfigured 
} from '../src/lib/ticketmaster';
import { VENUE_TM_MAPPING } from '../src/lib/ticketmaster/venues';
import { TMEvent } from '../src/lib/ticketmaster/types';

async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let months = 6;
  for (const arg of args) {
    if (arg.startsWith('--months=')) {
      months = parseInt(arg.split('=')[1], 10);
    }
  }

  console.log('🎫 TM Event Cache Download');
  console.log(`   Months ahead: ${months}`);
  console.log('');

  if (!isConfigured()) {
    console.error('❌ TICKETMASTER_API_KEY not set');
    process.exit(1);
  }

  // Calculate date range
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + months);

  const startStr = startDate.toISOString().slice(0, 19) + 'Z';
  const endStr = endDate.toISOString().slice(0, 19) + 'Z';

  console.log(`📅 Date range: ${startDate.toDateString()} to ${endDate.toDateString()}`);
  console.log('');

  // Get venues with TM mappings
  const venues = Object.entries(VENUE_TM_MAPPING).filter(([, v]) => v.tmVenueId);
  console.log(`📍 Venues to fetch: ${venues.length}`);
  console.log('');

  let totalEvents = 0;
  const allTMEvents: { venueSlug: string; event: TMEvent }[] = [];

  // Fetch events for each venue
  for (const [venueSlug, mapping] of venues) {
    console.log(`Fetching: ${mapping.tmVenueName}...`);
    
    try {
      const events = await searchEvents({
        venueId: mapping.tmVenueId,
        startDateTime: startStr,
        endDateTime: endStr,
        size: 200, // Max per page
        sort: 'date,asc',
        includeTBA: 'yes',
        includeTBD: 'yes',
      });

      console.log(`  Found ${events.length} events`);
      totalEvents += events.length;

      for (const event of events) {
        allTMEvents.push({ venueSlug, event });
      }

      // Rate limiting between venues
      await new Promise(r => setTimeout(r, 300));
    } catch (error) {
      console.error(`  Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  console.log('');
  console.log(`📊 Total TM events found: ${totalEvents}`);
  console.log('');

  // Clear old cache and insert new
  console.log('💾 Updating cache...');
  
  await prisma.tMEventCache.deleteMany({});
  console.log('  Cleared old cache');

  let inserted = 0;
  for (const { venueSlug, event } of allTMEvents) {
    try {
      const classification = getPrimaryClassification(event);
      const supportingActs = getSupportingActs(event);
      const externalLinks = getExternalLinks(event);
      const mainAttraction = event._embedded?.attractions?.[0];

      // Parse dates
      let startDateTime: Date | null = null;
      let localDate: string | null = null;
      let endDateTime: Date | null = null;
      let onSaleStart: Date | null = null;
      let onSaleEnd: Date | null = null;

      // Get localDate directly from TM (YYYY-MM-DD format, no timezone issues)
      localDate = event.dates?.start?.localDate || null;

      if (event.dates?.start?.dateTime) {
        startDateTime = new Date(event.dates.start.dateTime);
      } else if (localDate) {
        startDateTime = new Date(localDate);
      }

      if (event.dates?.end?.dateTime) {
        endDateTime = new Date(event.dates.end.dateTime);
      }

      if (event.sales?.public?.startDateTime) {
        onSaleStart = new Date(event.sales.public.startDateTime);
      }
      if (event.sales?.public?.endDateTime) {
        onSaleEnd = new Date(event.sales.public.endDateTime);
      }

      if (!startDateTime || !localDate) {
        console.log(`  Skipping ${event.name} - no start date`);
        continue;
      }

      await prisma.tMEventCache.create({
        data: {
          id: event.id,
          venueSlug,
          tmVenueId: VENUE_TM_MAPPING[venueSlug].tmVenueId,
          name: event.name,
          url: event.url || null,
          
          // Dates
          localDate,
          startDateTime,
          endDateTime,
          timezone: event.dates?.timezone || null,
          spanMultipleDays: event.dates?.spanMultipleDays || false,
          
          // Sales
          onSaleStart,
          onSaleEnd,
          presales: event.sales?.presales ? JSON.parse(JSON.stringify(event.sales.presales)) : undefined,
          
          // Images
          imageUrl: getBestImageUrl(event),
          seatmapUrl: event.seatmap?.staticUrl || null,
          
          // Artist info
          attractionId: mainAttraction?.id || null,
          attractionName: mainAttraction?.name || null,
          supportingActs,
          externalLinks: Object.keys(externalLinks).length > 0 ? externalLinks : undefined,
          
          // Classification
          genre: classification.genre,
          subGenre: classification.subGenre,
          segment: classification.segment,
          
          // Promoter
          promoterId: event.promoter?.id || null,
          promoterName: event.promoter?.name || null,
          
          // Status & notes
          status: event.dates?.status?.code || null,
          info: event.info || null,
          pleaseNote: event.pleaseNote || null,
          ticketLimit: event.accessibility?.ticketLimit || null,
        },
      });
      inserted++;
    } catch (error) {
      // Skip duplicates or errors
      if (error instanceof Error && !error.message.includes('Unique constraint')) {
        console.log(`  Error inserting ${event.name}: ${error.message}`);
      }
    }
  }

  console.log(`  Inserted ${inserted} events into cache`);
  console.log('');
  console.log('✅ Cache updated!');
  console.log('');
  console.log('Next: Run enrichment to match events against cache:');
  console.log('  npx tsx scripts/enrich-tm-from-cache.ts');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

