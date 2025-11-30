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
      update: { lat: 30.2820, lng: -97.7328 },
      create: {
        name: 'Moody Center',
        slug: 'moody-center',
        websiteUrl: 'https://moodycenteratx.com',
        address: '2001 Robert Dedman Dr',
        city: 'Austin',
        state: 'TX',
        lat: 30.2820,
        lng: -97.7328,
      },
    }),
    prisma.venue.upsert({
      where: { slug: 'paramount-theatre' },
      update: { lat: 30.2672, lng: -97.7417 },
      create: {
        name: 'Paramount Theatre',
        slug: 'paramount-theatre',
        websiteUrl: 'https://austintheatre.org',
        address: '713 Congress Ave',
        city: 'Austin',
        state: 'TX',
        lat: 30.2672,
        lng: -97.7417,
      },
    }),
    prisma.venue.upsert({
      where: { slug: 'acl-live' },
      update: { lat: 30.2652, lng: -97.7519 },
      create: {
        name: 'ACL Live at The Moody Theater',
        slug: 'acl-live',
        websiteUrl: 'https://acl-live.com',
        address: '310 W Willie Nelson Blvd',
        city: 'Austin',
        state: 'TX',
        lat: 30.2652,
        lng: -97.7519,
      },
    }),
    prisma.venue.upsert({
      where: { slug: 'stubbs' },
      update: { lat: 30.2694, lng: -97.7368 },
      create: {
        name: "Stubb's BBQ",
        slug: 'stubbs',
        websiteUrl: 'https://stubbsaustin.com',
        address: '801 Red River St',
        city: 'Austin',
        state: 'TX',
        lat: 30.2694,
        lng: -97.7368,
      },
    }),
    prisma.venue.upsert({
      where: { slug: 'emo-s' },
      update: { lat: 30.2423, lng: -97.7245 },
      create: {
        name: "Emo's Austin",
        slug: 'emo-s',
        websiteUrl: 'https://emosaustin.com',
        address: '2015 E Riverside Dr',
        city: 'Austin',
        state: 'TX',
        lat: 30.2423,
        lng: -97.7245,
      },
    }),
    // Texas Performing Arts venues
    prisma.venue.upsert({
      where: { slug: 'bass-concert-hall' },
      update: { lat: 30.2859, lng: -97.7304 },
      create: {
        name: 'Bass Concert Hall',
        slug: 'bass-concert-hall',
        websiteUrl: 'https://texasperformingarts.org',
        address: '2350 Robert Dedman Dr',
        city: 'Austin',
        state: 'TX',
        lat: 30.2859,
        lng: -97.7304,
      },
    }),
    prisma.venue.upsert({
      where: { slug: 'mccullough-theatre' },
      update: { lat: 30.2862, lng: -97.7289 },
      create: {
        name: 'McCullough Theatre',
        slug: 'mccullough-theatre',
        websiteUrl: 'https://texasperformingarts.org',
        address: '2375 Robert Dedman Dr',
        city: 'Austin',
        state: 'TX',
        lat: 30.2862,
        lng: -97.7289,
      },
    }),
    prisma.venue.upsert({
      where: { slug: 'bates-recital-hall' },
      update: { lat: 30.2858, lng: -97.7278 },
      create: {
        name: 'Bates Recital Hall',
        slug: 'bates-recital-hall',
        websiteUrl: 'https://texasperformingarts.org',
        address: '2406 Robert Dedman Dr',
        city: 'Austin',
        state: 'TX',
        lat: 30.2858,
        lng: -97.7278,
      },
    }),
    // Long Center venues
    prisma.venue.upsert({
      where: { slug: 'long-center' },
      update: { lat: 30.2594, lng: -97.7505 },
      create: {
        name: 'Long Center',
        slug: 'long-center',
        websiteUrl: 'https://thelongcenter.org',
        address: '701 W Riverside Dr',
        city: 'Austin',
        state: 'TX',
        lat: 30.2594,
        lng: -97.7505,
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

