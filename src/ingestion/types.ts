import { EventSource, EventCategory } from '@prisma/client';

/**
 * Normalized event data structure used by all scrapers.
 * All scrapers should return NormalizedEvent[].
 */
export interface NormalizedEvent {
  venueSlug: string; // Must map to an existing Venue.slug
  title: string;
  description?: string | null;
  startDateTime: Date;
  endDateTime?: Date | null;
  url: string;
  imageUrl?: string | null;
  category?: EventCategory | null;
  source: EventSource;
  sourceEventId?: string | null; // External ID from source (for deduplication)
}

/**
 * Result of running a scraper
 */
export interface ScraperResult {
  source: EventSource;
  venueSlug: string;
  events: NormalizedEvent[];
  error?: string;
}

/**
 * Normalize a title for fuzzy matching (lowercase, strip punctuation/whitespace)
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

