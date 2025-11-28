#!/usr/bin/env npx tsx
/**
 * Analyze TM title preferences
 * 
 * Shows why some events prefer TM title and others don't
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import prisma from '../../src/db/prisma';

async function main() {
  console.log('📊 TM Title Analysis\n');

  const totalTM = await prisma.enrichment.count({ 
    where: { tmEventId: { not: null } } 
  });
  
  const preferTM = await prisma.enrichment.count({ 
    where: { tmPreferTitle: true } 
  });
  
  const keepOriginal = await prisma.enrichment.count({ 
    where: { tmEventId: { not: null }, tmPreferTitle: false } 
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Total TM matches:      ${totalTM}`);
  console.log(`  Prefer TM title:       ${preferTM} (LLM said TM is better)`);
  console.log(`  Keep original title:   ${keepOriginal} (venue title is fine)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Samples where TM title IS preferred
  console.log('✅ Events where TM title is preferred:\n');
  const preferred = await prisma.enrichment.findMany({
    where: { tmPreferTitle: true },
    select: { 
      tmEventName: true, 
      event: { select: { title: true, venue: { select: { name: true } } } } 
    },
    take: 5
  });
  
  for (const s of preferred) {
    console.log(`  Venue: "${s.event.title}"`);
    console.log(`  TM:    "${s.tmEventName}"`);
    console.log(`  → TM is more informative\n`);
  }

  // Samples where original title is kept
  console.log('○ Events where venue title is kept:\n');
  const kept = await prisma.enrichment.findMany({
    where: { tmEventId: { not: null }, tmPreferTitle: false },
    select: { 
      tmEventName: true, 
      event: { select: { title: true, venue: { select: { name: true } } } } 
    },
    take: 10  // Show more examples
  });
  
  for (const s of kept) {
    console.log(`  Venue: "${s.event.title}"`);
    console.log(`  TM:    "${s.tmEventName}"`);
    console.log(`  → Similar, keep original\n`);
  }

  // Check specifically for inconsistent "Texas MBB" decisions
  console.log('\n🔍 Checking "Texas MBB" consistency:\n');
  const texasMBB = await prisma.enrichment.findMany({
    where: { 
      tmEventId: { not: null },
      event: { title: { contains: 'Texas MBB' } }
    },
    select: { 
      tmEventName: true,
      tmPreferTitle: true,
      event: { select: { title: true } } 
    },
  });
  
  for (const t of texasMBB) {
    const flag = t.tmPreferTitle ? '✅ PREFER TM' : '❌ KEEP VENUE';
    console.log(`  ${flag}: "${t.event.title}" → "${t.tmEventName}"`);
  }
  console.log(`\nTotal Texas MBB with TM: ${texasMBB.length}`);
  console.log(`Prefer TM: ${texasMBB.filter(t => t.tmPreferTitle).length}`);
  console.log(`Keep venue: ${texasMBB.filter(t => !t.tmPreferTitle).length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

