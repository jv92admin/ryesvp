#!/usr/bin/env npx tsx
import { config } from 'dotenv';
config({ path: '.env.local' });

import prisma from '../src/db/prisma';

async function main() {
  // Check what status TM-enriched events have
  const withTMTitle = await prisma.enrichment.findMany({
    where: { tmPreferTitle: true },
    select: { 
      eventId: true, 
      status: true, 
      tmEventName: true,
      tmPreferTitle: true,
    }
  });
  
  console.log('Events with tmPreferTitle=true:', withTMTitle.length);
  
  const byStatus: Record<string, number> = {};
  for (const e of withTMTitle) {
    byStatus[e.status] = (byStatus[e.status] || 0) + 1;
  }
  console.log('By status:', byStatus);
  
  // Check a specific event that should show TM title
  if (withTMTitle.length > 0) {
    const sample = withTMTitle[0];
    console.log('\nSample event:');
    console.log('  eventId:', sample.eventId);
    console.log('  status:', sample.status);
    console.log('  tmEventName:', sample.tmEventName);
    console.log('  tmPreferTitle:', sample.tmPreferTitle);
  }
  
  // Now check what getEnrichmentPreviews would return
  const withCompletedStatus = await prisma.enrichment.findMany({
    where: { 
      tmPreferTitle: true,
      status: { in: ['COMPLETED', 'PARTIAL'] },
    },
    select: { eventId: true }
  });
  
  console.log('\nWith COMPLETED/PARTIAL status:', withCompletedStatus.length);
  
  // Check if there's a mismatch
  const notCompleted = await prisma.enrichment.findMany({
    where: { 
      tmPreferTitle: true,
      status: { notIn: ['COMPLETED', 'PARTIAL'] },
    },
    select: { eventId: true, status: true }
  });
  
  console.log('With OTHER status:', notCompleted.length);
  if (notCompleted.length > 0) {
    console.log('  Statuses:', notCompleted.map(e => e.status));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

