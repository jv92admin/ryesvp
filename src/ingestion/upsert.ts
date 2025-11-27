import prisma from '@/db/prisma';
import { NormalizedEvent, normalizeTitle } from './types';
import { EventSource, EventCategory, EventStatus } from '@prisma/client';

/**
 * Upsert events from scraped data.
 * Handles deduplication and updates existing events.
 * 
 * Deduplication strategy:
 * 1. If sourceEventId is present: match by (source, sourceEventId)
 * 2. Otherwise: match by (venueId, startDateTime, normalizedTitle)
 */
export async function upsertEvents(events: NormalizedEvent[]): Promise<{
  created: number;
  updated: number;
  errors: string[];
}> {
  const results = {
    created: 0,
    updated: 0,
    errors: [] as string[],
  };

  for (const event of events) {
    try {
      // Find venue by slug
      const venue = await prisma.venue.findUnique({
        where: { slug: event.venueSlug },
      });

      if (!venue) {
        results.errors.push(
          `Venue not found: ${event.venueSlug} (event: ${event.title})`
        );
        continue;
      }

      // Try to find existing event
      let existingEvent = null;

      if (event.sourceEventId) {
        // Strategy 1: Match by source + sourceEventId
        existingEvent = await prisma.event.findUnique({
          where: {
            source_sourceEventId: {
              source: event.source,
              sourceEventId: event.sourceEventId,
            },
          },
        });
      }

      if (!existingEvent) {
        // Strategy 2: Match by venue, startDateTime, and normalized title
        const normalizedTitle = normalizeTitle(event.title);
        const startOfDay = new Date(event.startDateTime);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(event.startDateTime);
        endOfDay.setHours(23, 59, 59, 999);

        const candidates = await prisma.event.findMany({
          where: {
            venueId: venue.id,
            startDateTime: {
              gte: startOfDay,
              lte: endOfDay,
            },
            source: event.source,
          },
        });

        // Find best match by normalized title
        existingEvent = candidates.find((candidate) => {
          const candidateNormalized = normalizeTitle(candidate.title);
          return candidateNormalized === normalizedTitle;
        }) || null;
      }

      // Prepare event data
      const eventData = {
        venueId: venue.id,
        title: event.title,
        description: event.description || null,
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime || null,
        url: event.url || null,
        imageUrl: event.imageUrl || null,
        source: event.source,
        sourceEventId: event.sourceEventId || null,
        category: event.category || EventCategory.OTHER,
        status: EventStatus.SCHEDULED,
      };

      if (existingEvent) {
        // Update existing event
        await prisma.event.update({
          where: { id: existingEvent.id },
          data: eventData,
        });
        results.updated++;
      } else {
        // Create new event
        await prisma.event.create({
          data: eventData,
        });
        results.created++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.errors.push(`Error processing "${event.title}": ${errorMessage}`);
      console.error(`Error upserting event "${event.title}":`, error);
    }
  }

  return results;
}

