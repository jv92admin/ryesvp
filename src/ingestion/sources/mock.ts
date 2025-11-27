import { NormalizedEvent } from '../types';
import { EventSource, EventCategory } from '@prisma/client';

/**
 * Mock scraper for testing ingestion pipeline.
 * Returns sample events that can be used to test the upsert logic.
 */
export async function fetchMockEvents(): Promise<NormalizedEvent[]> {
  // Return some test events for different venues
  const now = new Date();
  const addDays = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    date.setHours(20, 0, 0, 0); // 8 PM
    return date;
  };

  return [
    {
      venueSlug: 'moody-center',
      title: 'Test Concert - Mock Scraper',
      description: 'This is a test event created by the mock scraper',
      startDateTime: addDays(15),
      endDateTime: addDays(15),
      url: 'https://example.com/test-event',
      category: EventCategory.CONCERT,
      source: EventSource.VENUE_WEBSITE,
      sourceEventId: 'mock-1',
    },
    {
      venueSlug: 'paramount-theatre',
      title: 'Test Comedy Show - Mock Scraper',
      description: 'Another test event for testing ingestion',
      startDateTime: addDays(20),
      endDateTime: null,
      url: 'https://example.com/test-comedy',
      category: EventCategory.COMEDY,
      source: EventSource.VENUE_WEBSITE,
      sourceEventId: 'mock-2',
    },
  ];
}

