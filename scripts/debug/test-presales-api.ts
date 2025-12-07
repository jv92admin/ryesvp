#!/usr/bin/env npx tsx
/**
 * Test the presales API logic directly (without HTTP)
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import prisma from '../../src/db/prisma';

interface TMPresale {
  name: string;
  startDateTime?: string;
  endDateTime?: string;
}

function isRelevantPresale(presaleName: string | undefined): boolean {
  if (!presaleName) return false;
  
  const name = presaleName.toLowerCase();
  
  if (name === 'resale') return false;
  if (name.includes('vip package')) return false;
  if (name.includes('platinum')) return false;
  if (name.includes('public onsale')) return false;
  if (name === 'onsale' || name.endsWith(' onsale')) return false;
  
  const includePatterns = [
    'presale', 'pre-sale', 'fan club', 'early access',
    'preferred tickets', 'preferred seating', 'select seats',
  ];
  
  for (const pattern of includePatterns) {
    if (name.includes(pattern)) return true;
  }
  
  return false;
}

async function main() {
  const now = new Date();
  console.log('Current time:', now.toISOString());
  console.log('');

  const events = await prisma.event.findMany({
    where: {
      startDateTime: { gte: now },
      status: 'SCHEDULED',
      enrichment: { isNot: null },
    },
    include: {
      venue: { select: { name: true } },
      enrichment: {
        select: {
          tmPresales: true,
          tmOnSaleStart: true,
          tmEventName: true,
          tmPreferTitle: true,
        },
      },
    },
    orderBy: { startDateTime: 'asc' },
    take: 200,
  });

  console.log(`Found ${events.length} events with enrichment\n`);

  let presaleCount = 0;
  let upcomingCount = 0;
  let skippedNoPresales = 0;
  let skippedNoRelevant = 0;
  let skippedNotActive = 0;
  
  for (const event of events) {
    const enrichment = event.enrichment;
    if (!enrichment) continue;
    if (!enrichment.tmPresales && !enrichment.tmOnSaleStart) {
      skippedNoPresales++;
      continue;
    }

    const presales = enrichment.tmPresales as TMPresale[] | null;
    if (!presales || !Array.isArray(presales)) continue;

    const relevantPresales = presales.filter(p => isRelevantPresale(p.name));
    if (relevantPresales.length === 0) {
      skippedNoRelevant++;
      continue;
    }

    // Check for active presales
    let foundActive = false;
    for (const presale of relevantPresales) {
      if (!presale.startDateTime) continue;

      const start = new Date(presale.startDateTime);
      const end = presale.endDateTime ? new Date(presale.endDateTime) : null;

      if (start <= now && (!end || end > now)) {
        presaleCount++;
        foundActive = true;
        console.log(`✅ ACTIVE: ${event.title}`);
        console.log(`   Presale: ${presale.name}`);
        console.log(`   Started: ${start.toISOString()}`);
        console.log(`   Ends: ${end?.toISOString() || 'N/A'}`);
        console.log('');
        break;
      }
    }
    
    // If not active, check for upcoming presales
    if (!foundActive && relevantPresales.length > 0) {
      const upcomingPresales = relevantPresales
        .filter(p => p.startDateTime && new Date(p.startDateTime) > now)
        .sort((a, b) => new Date(a.startDateTime!).getTime() - new Date(b.startDateTime!).getTime());
      
      if (upcomingPresales.length > 0) {
        upcomingCount++;
        const next = upcomingPresales[0];
        const start = new Date(next.startDateTime!);
        if (upcomingCount <= 10) {
          console.log(`🔜 UPCOMING: ${event.title}`);
          console.log(`   Presale: ${next.name}`);
          console.log(`   Starts: ${start.toISOString()}`);
          console.log('');
        }
      } else {
        skippedNotActive++;
        if (skippedNotActive <= 3) {
          console.log(`⏭️ ENDED: ${event.title}`);
          for (const presale of relevantPresales.slice(0, 2)) {
            const end = presale.endDateTime ? new Date(presale.endDateTime) : null;
            console.log(`   - ${presale.name}: ended ${end?.toISOString() || 'unknown'}`);
          }
          console.log('');
        }
      }
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Active presales: ${presaleCount}`);
  console.log(`Upcoming presales: ${upcomingCount}`);
  console.log(`Skipped - no presale data: ${skippedNoPresales}`);
  console.log(`Skipped - no relevant presales: ${skippedNoRelevant}`);
  console.log(`Skipped - presales ended: ${skippedNotActive}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

