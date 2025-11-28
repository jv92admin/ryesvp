#!/usr/bin/env npx tsx
/**
 * Check TM Enrichment Status
 * 
 * Quick validation of what TM data we have.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import prisma from '../src/db/prisma';

async function main() {
  console.log('📊 TM Enrichment Status\n');

  // Total events
  const totalEvents = await prisma.event.count({
    where: { startDateTime: { gte: new Date() } },
  });

  // Events with TM match
  const withTM = await prisma.enrichment.count({
    where: { tmEventId: { not: null } },
  });

  // Events where TM title is preferred
  const preferTM = await prisma.enrichment.count({
    where: { tmPreferTitle: true },
  });

  // Events with prices
  const withPrices = await prisma.enrichment.count({
    where: { tmPriceMin: { not: null } },
  });

  // Events with URLs
  const withUrls = await prisma.enrichment.count({
    where: { tmUrl: { not: null } },
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Total upcoming events:  ${totalEvents}`);
  console.log(`  With TM match:          ${withTM} (${((withTM/totalEvents)*100).toFixed(1)}%)`);
  console.log(`  With TM URL:            ${withUrls}`);
  console.log(`  With TM prices:         ${withPrices}`);
  console.log(`  Prefer TM title:        ${preferTM}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Show examples where TM title is preferred
  if (preferTM > 0) {
    console.log('📝 Events where TM title is preferred:\n');
    const examples = await prisma.enrichment.findMany({
      where: { tmPreferTitle: true },
      include: { event: { select: { title: true, venue: { select: { name: true } } } } },
      take: 10,
    });

    for (const e of examples) {
      console.log(`  Original: "${e.event.title}"`);
      console.log(`  TM Title: "${e.tmEventName}"`);
      console.log(`  Venue: ${e.event.venue.name}\n`);
    }
  }

  // Show some matched events with prices
  console.log('💰 Sample events with TM data:\n');
  const samples = await prisma.enrichment.findMany({
    where: { tmEventId: { not: null } },
    include: { event: { select: { title: true, startDateTime: true, venue: { select: { name: true } } } } },
    take: 10,
  });

  for (const e of samples) {
    console.log(`  ${e.event.title}`);
    console.log(`    Venue: ${e.event.venue.name}`);
    console.log(`    Date: ${e.event.startDateTime.toLocaleDateString()}`);
    console.log(`    Price: ${e.tmPriceMin ? `From $${e.tmPriceMin}` : 'N/A'}`);
    console.log(`    TM URL: ${e.tmUrl ? 'Yes' : 'No'}`);
    console.log('');
  }

  // Cache stats
  const cacheCount = await prisma.tMEventCache.count();
  console.log(`📦 TM Cache: ${cacheCount} events cached`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

