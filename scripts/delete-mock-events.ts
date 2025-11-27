import { config } from 'dotenv';
import { PrismaClient, EventSource } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL or DIRECT_URL must be set in .env.local');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🗑️  Deleting mock/test scraper events...');

  const deleteResult = await prisma.event.deleteMany({
    where: {
      OR: [
        {
          source: EventSource.VENUE_WEBSITE,
          sourceEventId: {
            startsWith: 'mock-',
          },
        },
        {
          title: {
            contains: 'Test',
          },
          description: {
            contains: 'mock scraper',
          },
        },
        {
          title: {
            contains: 'Mock Scraper',
          },
        },
      ],
    },
  });

  console.log(`✅ Deleted ${deleteResult.count} mock/test events`);
}

main()
  .catch((e) => {
    console.error('❌ Delete mock events error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

