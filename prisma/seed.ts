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
    // Antone's Nightclub - legendary blues venue
    prisma.venue.upsert({
      where: { slug: 'antones' },
      update: { lat: 30.2671, lng: -97.7395 },
      create: {
        name: "Antone's Nightclub",
        slug: 'antones',
        websiteUrl: 'https://antonesnightclub.com',
        address: '305 E 5th St',
        city: 'Austin',
        state: 'TX',
        lat: 30.2671,
        lng: -97.7395,
      },
    }),
    // Radio East (Radio Coffee & Beer) - outdoor music venue
    prisma.venue.upsert({
      where: { slug: 'radio-east' },
      update: { lat: 30.2292, lng: -97.7089 },
      create: {
        name: 'Radio East',
        slug: 'radio-east',
        websiteUrl: 'https://radio-coffee-beer.webflow.io/radio-east',
        address: '3504 Montopolis Dr',
        city: 'Austin',
        state: 'TX',
        lat: 30.2292,
        lng: -97.7089,
      },
    }),
    // Empire Garage & Control Room - music venue
    prisma.venue.upsert({
      where: { slug: 'empire-control-room' },
      update: { lat: 30.2641, lng: -97.7347 },
      create: {
        name: 'Empire Control Room',
        slug: 'empire-control-room',
        websiteUrl: 'https://empireatx.com',
        address: '606 E 7th St',
        city: 'Austin',
        state: 'TX',
        lat: 30.2641,
        lng: -97.7347,
      },
    }),
    // HEB Center at Cedar Park - arena for Texas Stars, Austin Spurs
    prisma.venue.upsert({
      where: { slug: 'heb-center' },
      update: { lat: 30.5241, lng: -97.8203 },
      create: {
        name: 'H-E-B Center at Cedar Park',
        slug: 'heb-center',
        websiteUrl: 'https://www.hebcenter.com',
        address: '2100 Avenue of the Stars',
        city: 'Cedar Park',
        state: 'TX',
        lat: 30.5241,
        lng: -97.8203,
      },
    }),
    // COTA - Circuit of the Americas
    prisma.venue.upsert({
      where: { slug: 'cota' },
      update: { lat: 30.1346, lng: -97.6358 },
      create: {
        name: 'Circuit of the Americas',
        slug: 'cota',
        websiteUrl: 'https://circuitoftheamericas.com',
        address: '9201 Circuit of the Americas Blvd',
        city: 'Austin',
        state: 'TX',
        lat: 30.1346,
        lng: -97.6358,
      },
    }),
    // Q2 Stadium - Austin FC home
    prisma.venue.upsert({
      where: { slug: 'q2-stadium' },
      update: { lat: 30.3885, lng: -97.7193 },
      create: {
        name: 'Q2 Stadium',
        slug: 'q2-stadium',
        websiteUrl: 'https://www.q2stadium.com',
        address: '10414 McKalla Pl',
        city: 'Austin',
        state: 'TX',
        lat: 30.3885,
        lng: -97.7193,
      },
    }),
    // Moody Amphitheater at Waterloo Park - outdoor venue
    prisma.venue.upsert({
      where: { slug: 'moody-amphitheater' },
      update: { lat: 30.2733, lng: -97.7385 },
      create: {
        name: "Moody Amphitheater at Waterloo Park",
        slug: 'moody-amphitheater',
        websiteUrl: 'https://www.moodyamphitheater.com',
        address: '1401 Trinity St',
        city: 'Austin',
        state: 'TX',
        lat: 30.2733,
        lng: -97.7385,
      },
    }),
    // Scoot Inn - outdoor music venue
    prisma.venue.upsert({
      where: { slug: 'scoot-inn' },
      update: { lat: 30.2615, lng: -97.7280 },
      create: {
        name: "Scoot Inn",
        slug: 'scoot-inn',
        websiteUrl: 'https://www.scootinnaustin.com',
        address: '1308 E 4th St',
        city: 'Austin',
        state: 'TX',
        lat: 30.2615,
        lng: -97.7280,
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

