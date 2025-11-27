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

  // Create sample events (dates relative to now)
  const now = new Date();
  const addDays = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    date.setHours(20, 0, 0, 0); // 8 PM
    return date;
  };

  const events = await Promise.all([
    // Moody Center events
    prisma.event.upsert({
      where: { source_sourceEventId: { source: 'MANUAL', sourceEventId: 'seed-1' } },
      update: {},
      create: {
        venueId: venues[0].id,
        title: 'Taylor Swift - The Eras Tour',
        description: 'Experience the iconic Eras Tour live!',
        startDateTime: addDays(30),
        url: 'https://moodycenteratx.com/events',
        source: EventSource.MANUAL,
        sourceEventId: 'seed-1',
        category: EventCategory.CONCERT,
        status: EventStatus.SOLD_OUT,
      },
    }),
    prisma.event.upsert({
      where: { source_sourceEventId: { source: 'MANUAL', sourceEventId: 'seed-2' } },
      update: {},
      create: {
        venueId: venues[0].id,
        title: 'Austin Spurs vs. Rio Grande Valley Vipers',
        description: 'NBA G League basketball action',
        startDateTime: addDays(5),
        url: 'https://moodycenteratx.com/events',
        source: EventSource.MANUAL,
        sourceEventId: 'seed-2',
        category: EventCategory.SPORTS,
      },
    }),
    // Paramount events
    prisma.event.upsert({
      where: { source_sourceEventId: { source: 'MANUAL', sourceEventId: 'seed-3' } },
      update: {},
      create: {
        venueId: venues[1].id,
        title: 'John Mulaney - Live Comedy',
        description: 'Stand-up comedy from the Emmy-winning comedian',
        startDateTime: addDays(14),
        url: 'https://austintheatre.org/events',
        source: EventSource.MANUAL,
        sourceEventId: 'seed-3',
        category: EventCategory.COMEDY,
      },
    }),
    prisma.event.upsert({
      where: { source_sourceEventId: { source: 'MANUAL', sourceEventId: 'seed-4' } },
      update: {},
      create: {
        venueId: venues[1].id,
        title: 'Classic Film Series: Casablanca',
        description: 'Screening of the 1942 classic on the big screen',
        startDateTime: addDays(3),
        url: 'https://austintheatre.org/events',
        source: EventSource.MANUAL,
        sourceEventId: 'seed-4',
        category: EventCategory.OTHER,
      },
    }),
    // ACL Live events
    prisma.event.upsert({
      where: { source_sourceEventId: { source: 'MANUAL', sourceEventId: 'seed-5' } },
      update: {},
      create: {
        venueId: venues[2].id,
        title: 'Khruangbin',
        description: 'Psychedelic soul trio from Houston',
        startDateTime: addDays(21),
        url: 'https://acl-live.com/events',
        source: EventSource.MANUAL,
        sourceEventId: 'seed-5',
        category: EventCategory.CONCERT,
      },
    }),
    prisma.event.upsert({
      where: { source_sourceEventId: { source: 'MANUAL', sourceEventId: 'seed-6' } },
      update: {},
      create: {
        venueId: venues[2].id,
        title: 'Austin City Limits Taping: Leon Bridges',
        description: 'Live taping for the legendary PBS series',
        startDateTime: addDays(7),
        url: 'https://acl-live.com/events',
        source: EventSource.MANUAL,
        sourceEventId: 'seed-6',
        category: EventCategory.CONCERT,
      },
    }),
    // Stubb's events
    prisma.event.upsert({
      where: { source_sourceEventId: { source: 'MANUAL', sourceEventId: 'seed-7' } },
      update: {},
      create: {
        venueId: venues[3].id,
        title: 'Turnstile with Snail Mail',
        description: 'Hardcore punk meets indie rock',
        startDateTime: addDays(10),
        url: 'https://stubbsaustin.com/events',
        source: EventSource.MANUAL,
        sourceEventId: 'seed-7',
        category: EventCategory.CONCERT,
      },
    }),
    prisma.event.upsert({
      where: { source_sourceEventId: { source: 'MANUAL', sourceEventId: 'seed-8' } },
      update: {},
      create: {
        venueId: venues[3].id,
        title: 'Gospel Brunch',
        description: 'Sunday gospel music with BBQ buffet',
        startDateTime: addDays(4),
        url: 'https://stubbsaustin.com/events',
        source: EventSource.MANUAL,
        sourceEventId: 'seed-8',
        category: EventCategory.CONCERT,
      },
    }),
    // Emo's events
    prisma.event.upsert({
      where: { source_sourceEventId: { source: 'MANUAL', sourceEventId: 'seed-9' } },
      update: {},
      create: {
        venueId: venues[4].id,
        title: 'Local Natives',
        description: 'Indie rock from Los Angeles',
        startDateTime: addDays(18),
        url: 'https://emosaustin.com/events',
        source: EventSource.MANUAL,
        sourceEventId: 'seed-9',
        category: EventCategory.CONCERT,
      },
    }),
    prisma.event.upsert({
      where: { source_sourceEventId: { source: 'MANUAL', sourceEventId: 'seed-10' } },
      update: {},
      create: {
        venueId: venues[4].id,
        title: 'Remi Wolf',
        description: 'Funk-pop sensation',
        startDateTime: addDays(2),
        url: 'https://emosaustin.com/events',
        source: EventSource.MANUAL,
        sourceEventId: 'seed-10',
        category: EventCategory.CONCERT,
      },
    }),
  ]);

  console.log(`✅ Created ${events.length} events`);
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

