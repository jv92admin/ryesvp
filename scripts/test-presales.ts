/**
 * Quick test script to verify presale count logic
 * Run with: npx tsx scripts/test-presales.ts
 * 
 * Uses the SAME isRelevantPresale function from lib/presales.ts
 * to ensure test matches production behavior.
 */

import prisma from '../src/db/prisma';
import { type TMPresale, isRelevantPresale } from '../src/lib/presales';

async function testPresales() {
  const now = new Date();
  console.log('\n🔍 Testing Presale Logic');
  console.log(`Current time: ${now.toISOString()}\n`);

  // Fetch all future scheduled events with enrichment data
  const events = await prisma.event.findMany({
    where: {
      startDateTime: { gte: now },
      status: 'SCHEDULED',
      enrichment: { isNot: null },
    },
    select: {
      id: true,
      title: true,
      startDateTime: true,
      enrichment: {
        select: {
          tmPresales: true,
          tmOnSaleStart: true,
        },
      },
    },
    orderBy: { startDateTime: 'asc' },
  });

  console.log(`Total future events with enrichment: ${events.length}\n`);

  const presaleEvents: { id: string; title: string; reason: string; details: string }[] = [];

  for (const event of events) {
    const enrichment = event.enrichment;
    if (!enrichment) continue;
    
    if (!enrichment.tmPresales && !enrichment.tmOnSaleStart) continue;

    const presales = enrichment.tmPresales as TMPresale[] | null;
    let added = false;

    // Check for active or upcoming presales
    if (presales && Array.isArray(presales)) {
      const relevantPresales = presales.filter(p => isRelevantPresale(p.name));
      
      for (const presale of relevantPresales) {
        if (!presale.startDateTime) continue;

        const start = new Date(presale.startDateTime);
        const end = presale.endDateTime ? new Date(presale.endDateTime) : null;

        // Active presale
        if (start <= now && (!end || end > now)) {
          presaleEvents.push({
            id: event.id,
            title: event.title.slice(0, 50),
            reason: 'ACTIVE PRESALE',
            details: `${presale.name} (started ${start.toLocaleDateString()}, ends ${end?.toLocaleDateString() || 'N/A'})`,
          });
          added = true;
          break;
        }
        
        // Upcoming presale
        if (start > now) {
          presaleEvents.push({
            id: event.id,
            title: event.title.slice(0, 50),
            reason: 'UPCOMING PRESALE',
            details: `${presale.name} (starts ${start.toLocaleDateString()})`,
          });
          added = true;
          break;
        }
      }
    }

    // Check for future public on-sale
    if (!added && enrichment.tmOnSaleStart && enrichment.tmOnSaleStart > now) {
      presaleEvents.push({
        id: event.id,
        title: event.title.slice(0, 50),
        reason: 'FUTURE ON-SALE',
        details: `Public on-sale: ${enrichment.tmOnSaleStart.toLocaleDateString()}`,
      });
    }
  }

  console.log('='.repeat(80));
  console.log(`PRESALE EVENTS: ${presaleEvents.length}`);
  console.log('='.repeat(80));

  for (const pe of presaleEvents) {
    console.log(`\n[${pe.reason}] ${pe.title}`);
    console.log(`  ${pe.details}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`TOTAL COUNT: ${presaleEvents.length}`);
  console.log('='.repeat(80) + '\n');

  await prisma.$disconnect();
}

testPresales().catch(console.error);

