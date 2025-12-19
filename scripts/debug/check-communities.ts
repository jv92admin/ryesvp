/**
 * Debug script to check community/group data in the database
 * Run with: npx tsx scripts/debug/check-communities.ts
 */

import prisma from '../../src/db/prisma';

async function main() {
  console.log('=== All Communities/Lists (isPublic: true) ===\n');
  
  const communities = await prisma.list.findMany({
    where: { isPublic: true },
    include: {
      owner: { select: { id: true, email: true, displayName: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (communities.length === 0) {
    console.log('No communities found.\n');
  } else {
    for (const c of communities) {
      console.log(`ID: ${c.id}`);
      console.log(`  Name: ${c.name}`);
      console.log(`  Owner: ${c.owner.displayName || c.owner.email}`);
      console.log(`  isHidden: ${c.isHidden}`);
      console.log(`  inviteCode: ${c.inviteCode || '(none)'}`);
      console.log(`  autoFriend: ${c.autoFriend}`);
      console.log(`  Members: ${c._count.members}`);
      console.log(`  Created: ${c.createdAt.toISOString()}`);
      console.log('');
    }
  }

  console.log('=== Summary ===');
  console.log(`Total communities: ${communities.length}`);
  console.log(`Legacy (no inviteCode): ${communities.filter(c => !c.inviteCode).length}`);
  console.log(`Group links (has inviteCode): ${communities.filter(c => c.inviteCode).length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

