#!/usr/bin/env npx tsx
import { config } from 'dotenv';
config({ path: '.env.local' });

import prisma from '../../src/db/prisma';

async function main() {
  const search = process.argv[2] || 'Billy Strings';
  
  console.log(`🔍 Checking source for: "${search}"\n`);

  const results = await prisma.tMEventCache.findMany({
    where: { name: { contains: search, mode: 'insensitive' } },
    select: { 
      name: true, 
      source: true, 
      localDate: true, 
      priceMin: true,
      venueSlug: true,
    },
    take: 5,
  });

  if (results.length === 0) {
    console.log('No results found in cache.');
  } else {
    for (const r of results) {
      console.log(`📅 ${r.localDate} - ${r.name}`);
      console.log(`   Venue: ${r.venueSlug}`);
      console.log(`   Source: ${r.source || 'NOT SET'}`);
      console.log(`   Price: ${r.priceMin ? `$${r.priceMin}` : 'N/A'}`);
      console.log('');
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

