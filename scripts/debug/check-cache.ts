#!/usr/bin/env npx tsx
/**
 * Check what's in the TM cache for debugging
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import prisma from '../../src/db/prisma';

async function main() {
  const args = process.argv.slice(2);
  const searchTerm = args[0] || '';
  const venueSlug = args[1] || '';

  console.log('🔍 TM Cache Search\n');

  if (searchTerm) {
    // Search by name
    const results = await prisma.tMEventCache.findMany({
      where: {
        name: { contains: searchTerm, mode: 'insensitive' },
        ...(venueSlug ? { venueSlug } : {}),
      },
      select: {
        name: true,
        venueSlug: true,
        localDate: true,
        startDateTime: true,
      },
      take: 20,
    });

    console.log(`Search: "${searchTerm}"${venueSlug ? ` at ${venueSlug}` : ''}`);
    console.log(`Found: ${results.length}\n`);

    for (const r of results) {
      console.log(`  ${r.localDate} - ${r.name}`);
      console.log(`    Venue: ${r.venueSlug}`);
      console.log('');
    }
  }

  // Show venue breakdown
  const byVenue = await prisma.tMEventCache.groupBy({
    by: ['venueSlug'],
    _count: { id: true },
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Cache by Venue:');
  for (const v of byVenue) {
    console.log(`  ${v.venueSlug}: ${v._count.id} events`);
  }

  // Show date range
  const oldest = await prisma.tMEventCache.findFirst({
    orderBy: { localDate: 'asc' },
    select: { localDate: true },
  });
  const newest = await prisma.tMEventCache.findFirst({
    orderBy: { localDate: 'desc' },
    select: { localDate: true },
  });

  console.log(`\nDate range: ${oldest?.localDate} to ${newest?.localDate}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

