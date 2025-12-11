/**
 * Backfill Performers from Enrichment Data
 * 
 * This script:
 * 1. Reads existing enrichment data (llmPerformer, Spotify, TM, KG)
 * 2. Creates Performer records with deduplication by slug
 * 3. Links Events to their Performers
 * 
 * Run with: npx tsx scripts/backfill-performers.ts
 */

import prisma from '../src/db/prisma';
import { EventCategory, PerformerType } from '@prisma/client';

// Generate URL-friendly slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Collapse multiple hyphens
    .replace(/^-|-$/g, '')         // Trim hyphens from ends
    .slice(0, 100);                // Limit length
}

// Infer performer type from event category
function inferPerformerType(category: EventCategory | null): PerformerType {
  switch (category) {
    case 'CONCERT':
      return 'ARTIST';
    case 'COMEDY':
      return 'COMEDIAN';
    case 'THEATER':
      return 'COMPANY';
    case 'SPORTS':
      return 'TEAM';
    default:
      return 'OTHER';
  }
}

interface PerformerData {
  name: string;
  slug: string;
  type: PerformerType;
  bio: string | null;
  imageUrl: string | null;
  websiteUrl: string | null;
  tags: string[];
  spotifyId: string | null;
  ticketmasterId: string | null;
}

async function backfillPerformers() {
  console.log('Starting performer backfill...\n');

  // Get all events with enrichment data that have a performer name
  const events = await prisma.event.findMany({
    where: {
      performerId: null, // Only events not yet linked
      enrichment: {
        OR: [
          { llmPerformer: { not: null } },
          { spotifyName: { not: null } },
          { tmAttractionName: { not: null } },
        ],
      },
    },
    include: {
      enrichment: true,
    },
  });

  console.log(`Found ${events.length} events to process\n`);

  // Track created performers for deduplication
  const performerCache = new Map<string, string>(); // slug -> performerId
  
  let created = 0;
  let linked = 0;
  let skipped = 0;

  for (const event of events) {
    const enrichment = event.enrichment;
    if (!enrichment) {
      skipped++;
      continue;
    }

    // Determine performer name (priority order)
    const performerName = 
      enrichment.llmPerformer ||
      enrichment.spotifyName ||
      enrichment.tmAttractionName ||
      enrichment.kgName;

    if (!performerName || performerName.trim().length < 2) {
      skipped++;
      continue;
    }

    const slug = generateSlug(performerName);
    if (!slug) {
      skipped++;
      continue;
    }

    let performerId: string;

    // Check cache first
    if (performerCache.has(slug)) {
      performerId = performerCache.get(slug)!;
    } else {
      // Check database
      const existing = await prisma.performer.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (existing) {
        performerId = existing.id;
        performerCache.set(slug, performerId);
      } else {
        // Create new performer
        const performerData: PerformerData = {
          name: performerName.trim(),
          slug,
          type: inferPerformerType(event.category),
          bio: enrichment.kgBio || enrichment.kgDescription || null,
          imageUrl: enrichment.spotifyImageUrl || enrichment.kgImageUrl || null,
          websiteUrl: enrichment.spotifyUrl || enrichment.kgWikiUrl || null,
          tags: enrichment.spotifyGenres || [],
          spotifyId: enrichment.spotifyId || null,
          ticketmasterId: enrichment.tmAttractionId || null,
        };

        try {
          const performer = await prisma.performer.create({
            data: performerData,
          });
          performerId = performer.id;
          performerCache.set(slug, performerId);
          created++;
          console.log(`✓ Created: ${performerData.name} (${performerData.type})`);
        } catch (error) {
          // Handle race condition - another process might have created it
          const retry = await prisma.performer.findUnique({
            where: { slug },
            select: { id: true },
          });
          if (retry) {
            performerId = retry.id;
            performerCache.set(slug, performerId);
          } else {
            console.error(`✗ Failed to create performer: ${performerName}`, error);
            skipped++;
            continue;
          }
        }
      }
    }

    // Link event to performer
    await prisma.event.update({
      where: { id: event.id },
      data: { performerId },
    });
    linked++;
  }

  console.log('\n--- Backfill Complete ---');
  console.log(`Performers created: ${created}`);
  console.log(`Events linked: ${linked}`);
  console.log(`Events skipped: ${skipped}`);
  console.log(`Total performers in cache: ${performerCache.size}`);
}

async function main() {
  try {
    await backfillPerformers();
  } catch (error) {
    console.error('Backfill failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

