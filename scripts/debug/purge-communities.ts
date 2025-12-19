/**
 * Purge all legacy communities (isPublic: true)
 * Run with: npx tsx scripts/debug/purge-communities.ts
 */

import prisma from '../../src/db/prisma';

async function main() {
  console.log('Deleting all communities...\n');
  
  const result = await prisma.list.deleteMany({
    where: { isPublic: true },
  });
  
  console.log(`Deleted ${result.count} communities.`);
  console.log('\nDone! You can now create fresh group links from /friends');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

