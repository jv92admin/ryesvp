#!/usr/bin/env npx tsx
import { config } from 'dotenv';
config({ path: '.env.local' });

import prisma from '../../src/db/prisma';

async function main() {
  const search = process.argv[2] || 'Emo';
  
  console.log(`🔍 Searching TM cache for venue: "${search}"\n`);

  const events = await prisma.tMEventCache.findMany({
    where: { venueSlug: { contains: search, mode: 'insensitive' } },
    take: 10,
    orderBy: { localDate: 'asc' },
    select: { name: true, localDate: true, venueSlug: true },
  });

  if (events.length === 0) {
    console.log('No events found in TM cache for this venue.');
  } else {
    console.log(`Found ${events.length} events:\n`);
    for (const e of events) {
      console.log(`📅 ${e.localDate} - ${e.name}`);
      console.log(`   Venue slug: ${e.venueSlug}`);
      console.log('');
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

