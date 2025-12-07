#!/usr/bin/env npx tsx
import { config } from 'dotenv';
config({ path: '.env.local' });

import prisma from '../src/db/prisma';

async function backdate() {
  const venueSlugs = ['emos', 'mohawk', 'concourse-project', 'acl-live'];
  const backdateDate = new Date('2025-12-01T00:00:00Z');
  
  for (const slug of venueSlugs) {
    const venue = await prisma.venue.findUnique({ where: { slug } });
    if (!venue) { 
      console.log('Venue not found:', slug); 
      continue; 
    }
    
    const result = await prisma.event.updateMany({
      where: { venueId: venue.id },
      data: { createdAt: backdateDate }
    });
    console.log(`${slug}: backdated ${result.count} events`);
  }
  
  console.log('Done!');
}

backdate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

