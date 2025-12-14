/**
 * Backfill script: Auto-set INTERESTED for squad members without event status
 * 
 * This ensures all squad members show up in the Social feed.
 * Run with: npx tsx scripts/backfill-squad-interested.ts
 */

import prisma from '../src/db/prisma';

async function backfillSquadInterested() {
  console.log('🔍 Finding squad members without event status...\n');

  // Get all squad memberships with their event info
  const squadMembers = await prisma.squadMember.findMany({
    include: {
      squad: {
        select: {
          eventId: true,
          event: {
            select: {
              title: true,
              startDateTime: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
        },
      },
    },
  });

  console.log(`Found ${squadMembers.length} total squad memberships\n`);

  let created = 0;
  let skipped = 0;
  let pastEvents = 0;

  for (const member of squadMembers) {
    const { userId } = member;
    const { eventId, event } = member.squad;

    // Skip past events
    if (event.startDateTime < new Date()) {
      pastEvents++;
      continue;
    }

    // Check if user already has an event status
    const existingStatus = await prisma.userEvent.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
    });

    if (existingStatus) {
      skipped++;
      continue;
    }

    // Create INTERESTED status
    await prisma.userEvent.create({
      data: {
        userId,
        eventId,
        status: 'INTERESTED',
      },
    });

    console.log(`✓ Set INTERESTED: ${member.user.displayName || member.user.email} → ${event.title}`);
    created++;
  }

  console.log('\n📊 Summary:');
  console.log(`  - Created INTERESTED: ${created}`);
  console.log(`  - Already had status: ${skipped}`);
  console.log(`  - Past events (skipped): ${pastEvents}`);
  console.log('\n✅ Done!');
}

backfillSquadInterested()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

