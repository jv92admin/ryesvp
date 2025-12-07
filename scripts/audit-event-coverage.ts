/**
 * Audit script to check event coverage per venue.
 * 
 * Shows:
 * - Event count per venue
 * - Min/max dates per venue
 * - Date gaps (if any)
 * 
 * Usage:
 *   npx dotenvx run -- npx tsx scripts/audit-event-coverage.ts
 */

import prisma from '../src/db/prisma';

async function main() {
  console.log('🔍 Auditing event coverage by venue...\n');

  // Get all venues with their event counts and date ranges
  const venues = await prisma.venue.findMany({
    include: {
      events: {
        where: {
          status: 'SCHEDULED',
        },
        orderBy: {
          startDateTime: 'asc',
        },
        select: {
          id: true,
          title: true,
          startDateTime: true,
          createdAt: true,
        },
      },
    },
  });

  const today = new Date();
  const sixMonthsOut = new Date(today);
  sixMonthsOut.setMonth(sixMonthsOut.getMonth() + 6);

  console.log('=' .repeat(80));
  console.log(`Report Date: ${today.toISOString().split('T')[0]}`);
  console.log(`Expected Range: ${today.toISOString().split('T')[0]} to ${sixMonthsOut.toISOString().split('T')[0]}`);
  console.log('=' .repeat(80));
  console.log();

  for (const venue of venues) {
    const futureEvents = venue.events.filter(e => e.startDateTime >= today);
    
    if (futureEvents.length === 0) {
      console.log(`📍 ${venue.name} (${venue.slug})`);
      console.log(`   ⚠️  NO FUTURE EVENTS`);
      console.log();
      continue;
    }

    const minDate = futureEvents[0].startDateTime;
    const maxDate = futureEvents[futureEvents.length - 1].startDateTime;
    
    // Check for gaps > 2 weeks
    const gaps: { start: Date; end: Date; days: number }[] = [];
    for (let i = 1; i < futureEvents.length; i++) {
      const prev = futureEvents[i - 1].startDateTime;
      const curr = futureEvents[i].startDateTime;
      const daysBetween = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (daysBetween > 14) {
        gaps.push({ start: prev, end: curr, days: daysBetween });
      }
    }

    // Check if max date seems truncated (more than 2 months before 6-month mark)
    const daysToSixMonths = Math.floor((sixMonthsOut.getTime() - maxDate.getTime()) / (1000 * 60 * 60 * 24));
    const possiblyTruncated = daysToSixMonths > 60;

    console.log(`📍 ${venue.name} (${venue.slug})`);
    console.log(`   Events: ${futureEvents.length}`);
    console.log(`   First:  ${minDate.toISOString().split('T')[0]}`);
    console.log(`   Last:   ${maxDate.toISOString().split('T')[0]}${possiblyTruncated ? ' ⚠️  POSSIBLY TRUNCATED' : ''}`);
    
    if (gaps.length > 0) {
      console.log(`   Gaps (>14 days):`);
      for (const gap of gaps) {
        console.log(`     - ${gap.start.toISOString().split('T')[0]} to ${gap.end.toISOString().split('T')[0]} (${gap.days} days)`);
      }
    }
    
    // Show last 5 events
    console.log(`   Last 5 events:`);
    const lastFive = futureEvents.slice(-5);
    for (const e of lastFive) {
      console.log(`     - ${e.startDateTime.toISOString().split('T')[0]}: ${e.title.slice(0, 50)}...`);
    }
    
    console.log();
  }

  // Summary
  console.log('=' .repeat(80));
  console.log('SUMMARY');
  console.log('=' .repeat(80));
  
  const allFutureEvents = venues.flatMap(v => v.events.filter(e => e.startDateTime >= today));
  console.log(`Total future events: ${allFutureEvents.length}`);
  
  const byVenue = venues.map(v => ({
    name: v.name,
    count: v.events.filter(e => e.startDateTime >= today).length,
    maxDate: v.events.filter(e => e.startDateTime >= today).slice(-1)[0]?.startDateTime,
  })).sort((a, b) => b.count - a.count);
  
  console.log('\nBy venue (sorted by count):');
  for (const v of byVenue) {
    const maxDateStr = v.maxDate ? v.maxDate.toISOString().split('T')[0] : 'N/A';
    console.log(`  ${v.name}: ${v.count} events (latest: ${maxDateStr})`);
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));

