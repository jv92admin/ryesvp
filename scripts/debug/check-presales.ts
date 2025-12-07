#!/usr/bin/env npx tsx
/**
 * Debug script to inspect presale data in the database
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import prisma from '../../src/db/prisma';

interface TMPresale {
  name: string;
  startDateTime?: string;
  endDateTime?: string;
  description?: string;
  url?: string;
}

/**
 * Same filter as the API - check if presale is relevant
 */
function isRelevantPresale(presaleName: string | undefined): boolean {
  if (!presaleName) return false;
  
  const name = presaleName.toLowerCase();
  
  // Exclude these exact categories (not useful for presale alerts)
  // Note: Check these BEFORE presale patterns since "presale" contains "resale"
  if (name === 'resale') return false;                    // Resale market only
  if (name.includes('vip package')) return false;         // VIP upsells
  if (name.includes('platinum')) return false;            // Dynamic pricing
  if (name.includes('public onsale')) return false;       // Already public
  if (name === 'onsale' || name.endsWith(' onsale')) return false; // Generic onsale
  
  // Include these patterns (real presales worth alerting about)
  const includePatterns = [
    'presale',
    'pre-sale',
    'fan club',
    'early access',
    'preferred tickets',
    'preferred seating',
    'select seats',
  ];
  
  for (const pattern of includePatterns) {
    if (name.includes(pattern)) return true;
  }
  
  return false;
}

async function main() {
  console.log('🔍 Inspecting presale data...\n');

  const now = new Date();

  // Get all enrichments with presale data
  const allEnrichments = await prisma.enrichment.findMany({
    include: {
      event: {
        include: {
          venue: true,
        },
      },
    },
  });
  
  // Filter to only those with presale data
  const enrichments = allEnrichments.filter(e => e.tmPresales || e.tmOnSaleStart);

  console.log(`Found ${enrichments.length} events with presale/onsale data\n`);

  // Collect all unique presale types
  const presaleTypes = new Map<string, number>();
  const activePresales: Array<{ event: string; venue: string; presale: string; start: string; end: string }> = [];
  const upcomingPresales: Array<{ event: string; venue: string; presale: string; start: string }> = [];
  const futureOnSales: Array<{ event: string; venue: string; onSaleDate: string }> = [];

  for (const enrichment of enrichments) {
    const presales = enrichment.tmPresales as TMPresale[] | null;
    
    if (presales && Array.isArray(presales)) {
      for (const presale of presales) {
        // Count presale types
        const name = presale.name || 'Unknown';
        presaleTypes.set(name, (presaleTypes.get(name) || 0) + 1);

        if (presale.startDateTime) {
          const start = new Date(presale.startDateTime);
          const end = presale.endDateTime ? new Date(presale.endDateTime) : null;

          // Active presale
          if (start <= now && (!end || end > now)) {
            activePresales.push({
              event: enrichment.event.title,
              venue: enrichment.event.venue.name,
              presale: name,
              start: start.toISOString(),
              end: end?.toISOString() || 'N/A',
            });
          }
          // Upcoming presale
          else if (start > now) {
            upcomingPresales.push({
              event: enrichment.event.title,
              venue: enrichment.event.venue.name,
              presale: name,
              start: start.toISOString(),
            });
          }
        }
      }
    }

    // Check tmOnSaleStart
    if (enrichment.tmOnSaleStart && enrichment.tmOnSaleStart > now) {
      futureOnSales.push({
        event: enrichment.event.title,
        venue: enrichment.event.venue.name,
        onSaleDate: enrichment.tmOnSaleStart.toISOString(),
      });
    }
  }

  // Print presale type breakdown with filter status
  console.log('📊 PRESALE TYPES (by name):');
  console.log('================================');
  const sortedTypes = [...presaleTypes.entries()].sort((a, b) => b[1] - a[1]);
  for (const [name, count] of sortedTypes) {
    const status = isRelevantPresale(name) ? '✅' : '❌';
    console.log(`  ${status} ${count.toString().padStart(3)} × ${name}`);
  }

  console.log('\n🟢 ACTIVE PRESALES (now):');
  console.log('================================');
  if (activePresales.length === 0) {
    console.log('  (none)');
  } else {
    for (const p of activePresales.slice(0, 10)) {
      console.log(`  • ${p.event} @ ${p.venue}`);
      console.log(`    → ${p.presale} (until ${p.end})`);
    }
    if (activePresales.length > 10) {
      console.log(`  ... and ${activePresales.length - 10} more`);
    }
  }

  console.log('\n🔜 UPCOMING PRESALES (future):');
  console.log('================================');
  const sortedUpcoming = upcomingPresales.sort((a, b) => 
    new Date(a.start).getTime() - new Date(b.start).getTime()
  );
  if (sortedUpcoming.length === 0) {
    console.log('  (none)');
  } else {
    for (const p of sortedUpcoming.slice(0, 10)) {
      console.log(`  • ${p.event} @ ${p.venue}`);
      console.log(`    → ${p.presale} starts ${new Date(p.start).toLocaleDateString()}`);
    }
    if (sortedUpcoming.length > 10) {
      console.log(`  ... and ${sortedUpcoming.length - 10} more`);
    }
  }

  console.log('\n🎟️ FUTURE PUBLIC ON-SALES:');
  console.log('================================');
  if (futureOnSales.length === 0) {
    console.log('  (none)');
  } else {
    for (const p of futureOnSales.slice(0, 10)) {
      console.log(`  • ${p.event} @ ${p.venue}`);
      console.log(`    → On sale ${new Date(p.onSaleDate).toLocaleDateString()}`);
    }
    if (futureOnSales.length > 10) {
      console.log(`  ... and ${futureOnSales.length - 10} more`);
    }
  }

  // Count how many pass the filter
  const filteredActiveCount = activePresales.filter(p => isRelevantPresale(p.presale)).length;
  const filteredUpcomingCount = upcomingPresales.filter(p => isRelevantPresale(p.presale)).length;

  console.log('\n📈 SUMMARY:');
  console.log('================================');
  console.log(`  Total events with TM data: ${enrichments.length}`);
  console.log(`  Unique presale types: ${presaleTypes.size}`);
  console.log(`  Active presales now: ${activePresales.length} (${filteredActiveCount} pass filter)`);
  console.log(`  Upcoming presales: ${upcomingPresales.length} (${filteredUpcomingCount} pass filter)`);
  console.log(`  Future public on-sales: ${futureOnSales.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

