#!/usr/bin/env npx tsx
/**
 * Test the presales API logic directly
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import prisma from '../../src/db/prisma';

interface TMPresale {
  name?: string;
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

async function test() {
  const now = new Date();
  console.log('Current time:', now.toISOString());
  console.log('');
  
  // Fetch the same way the API does
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

  console.log(`Found ${events.length} future events with enrichment`);
  console.log('');
  
  // Look specifically for Jeff Dunham
  const jeffDunham = events.find(e => e.title.includes('Jeff Dunham'));
  
  if (!jeffDunham) {
    console.log('❌ Jeff Dunham event NOT FOUND in query results!');
    console.log('');
    
    // Check if it exists at all
    const directCheck = await prisma.event.findFirst({
      where: { title: { contains: 'Jeff Dunham' } },
      include: { enrichment: true }
    });
    
    if (directCheck) {
      console.log('Event exists in DB:');
      console.log('  ID:', directCheck.id);
      console.log('  Title:', directCheck.title);
      console.log('  Status:', directCheck.status);
      console.log('  startDateTime:', directCheck.startDateTime);
      console.log('  Has enrichment:', !!directCheck.enrichment);
    }
    return;
  }
  
  console.log('✅ Jeff Dunham event FOUND in query');
  console.log('  ID:', jeffDunham.id);
  console.log('  Status: SCHEDULED');
  console.log('');
  
  const enrichment = jeffDunham.enrichment;
  const presales = enrichment?.tmPresales as TMPresale[] | null;
  
  if (!presales) {
    console.log('❌ No presales data');
    return;
  }
  
  console.log(`Checking ${presales.length} presales:`);
  
  const relevantPresales = presales.filter(p => isRelevantPresale(p.name));
  console.log(`  Relevant presales: ${relevantPresales.length}`);
  
  for (const presale of relevantPresales) {
    const start = presale.startDateTime ? new Date(presale.startDateTime) : null;
    const end = presale.endDateTime ? new Date(presale.endDateTime) : null;
    
    const isActive = start && start <= now && (!end || end > now);
    
    console.log(`  - "${presale.name}"`);
    console.log(`    Start: ${start?.toISOString()}`);
    console.log(`    End: ${end?.toISOString()}`);
    console.log(`    Active: ${isActive ? '✅ YES' : '❌ NO'}`);
    
    if (isActive) {
      console.log('');
      console.log('🎉 This event SHOULD appear in presales filter!');
    }
  }
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
