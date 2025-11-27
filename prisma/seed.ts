import { config } from 'dotenv';
import { PrismaClient, EventCategory, EventSource, EventStatus } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Load environment variables FIRST
config({ path: '.env.local' });

// Create Prisma client with adapter for seeding
// Try DATABASE_URL first (pooled connection) since it worked for migrations
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL or DIRECT_URL must be set in .env.local');
}

console.log('🔗 Using connection:', connectionString.substring(0, 50) + '...');

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Create venues
  const venues = await Promise.all([
    prisma.venue.upsert({
      where: { slug: 'moody-center' },
      update: {},
      create: {
        name: 'Moody Center',
        slug: 'moody-center',
        websiteUrl: 'https://moodycenteratx.com',
        address: '2001 Robert Dedman Dr',
        city: 'Austin',
        state: 'TX',
      },
    }),
    prisma.venue.upsert({
      where: { slug: 'paramount-theatre' },
      update: {},
      create: {
        name: 'Paramount Theatre',
        slug: 'paramount-theatre',
        websiteUrl: 'https://austintheatre.org',
        address: '713 Congress Ave',
        city: 'Austin',
        state: 'TX',
      },
    }),
    prisma.venue.upsert({
      where: { slug: 'acl-live' },
      update: {},
      create: {
        name: 'ACL Live at The Moody Theater',
        slug: 'acl-live',
        websiteUrl: 'https://acl-live.com',
        address: '310 W Willie Nelson Blvd',
        city: 'Austin',
        state: 'TX',
      },
    }),
    prisma.venue.upsert({
      where: { slug: 'stubbs' },
      update: {},
      create: {
        name: "Stubb's BBQ",
        slug: 'stubbs',
        websiteUrl: 'https://stubbsaustin.com',
        address: '801 Red River St',
        city: 'Austin',
        state: 'TX',
      },
    }),
    prisma.venue.upsert({
      where: { slug: 'emo-s' },
      update: {},
      create: {
        name: "Emo's Austin",
        slug: 'emo-s',
        websiteUrl: 'https://emosaustin.com',
        address: '2015 E Riverside Dr',
        city: 'Austin',
        state: 'TX',
      },
    }),
  ]);

  console.log(`✅ Created ${venues.length} venues`);

  // Remove any existing seed events (cleanup)
  const deletedSeedEvents = await prisma.event.deleteMany({
    where: {
      source: EventSource.MANUAL,
      sourceEventId: {
        startsWith: 'seed-',
      },
    },
  });
  
  if (deletedSeedEvents.count > 0) {
    console.log(`🗑️  Deleted ${deletedSeedEvents.count} seed events`);
  }
  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

