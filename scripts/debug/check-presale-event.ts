#!/usr/bin/env npx tsx
/**
 * Debug script to check presale data for a specific event
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import prisma from '../../src/db/prisma';

const EVENT_ID = '8de7f64d-aa7b-4bb4-8d11-f6946029e4e2';

async function check() {
  const event = await prisma.event.findUnique({
    where: { id: EVENT_ID },
    include: { enrichment: true, venue: true }
  });
  
  if (!event) {
    console.log('Event not found:', EVENT_ID);
    return;
  }
  
  console.log('='.repeat(60));
  console.log('EVENT:', event.title);
  console.log('Venue:', event.venue?.name);
  console.log('Date:', event.startDateTime);
  console.log('='.repeat(60));
  console.log('');
  
  if (!event.enrichment) {
    console.log('No enrichment data!');
    return;
  }
  
  console.log('tmStatus:', event.enrichment.tmStatus);
  console.log('tmOnSaleStart:', event.enrichment.tmOnSaleStart);
  console.log('');
  
  const presales = event.enrichment.tmPresales as Array<{
    name?: string;
    startDateTime?: string;
    endDateTime?: string;
  }> | null;
  
  if (!presales || presales.length === 0) {
    console.log('No presales in enrichment data!');
    return;
  }
  
  console.log(`Found ${presales.length} presale(s):`);
  console.log('');
  
  const now = new Date();
  
  for (const presale of presales) {
    const start = presale.startDateTime ? new Date(presale.startDateTime) : null;
    const end = presale.endDateTime ? new Date(presale.endDateTime) : null;
    
    const isActive = start && start <= now && (!end || end > now);
    const isUpcoming = start && start > now;
    const isEnded = end && end <= now;
    
    console.log(`  Name: "${presale.name || '(no name)'}"`);
    console.log(`  Start: ${presale.startDateTime || '(none)'}`);
    console.log(`  End: ${presale.endDateTime || '(none)'}`);
    console.log(`  Status: ${isActive ? '🟢 ACTIVE' : isUpcoming ? '🟡 UPCOMING' : isEnded ? '🔴 ENDED' : '⚪ UNKNOWN'}`);
    
    // Check if it would pass isRelevantPresale filter
    const name = (presale.name || '').toLowerCase();
    const patterns = ['presale', 'pre-sale', 'fan club', 'early access', 'preferred tickets', 'preferred seating', 'select seats'];
    const matchesPattern = patterns.some(p => name.includes(p));
    console.log(`  Would pass filter: ${matchesPattern ? '✅ YES' : '❌ NO'} (name: "${name}")`);
    console.log('');
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

