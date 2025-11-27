import { ScraperResult } from './types';
import { fetchEventsFromMoodyCenter } from './sources/moodyCenter';
import { fetchEventsFromParamount } from './sources/paramount';
import { fetchMockEvents } from './sources/mock';
import { upsertEvents } from './upsert';

/**
 * Run all scrapers and upsert events into the database.
 * Returns summary of results.
 */
export async function runAllScrapers(): Promise<{
  results: ScraperResult[];
  summary: {
    totalEvents: number;
    created: number;
    updated: number;
    errors: string[];
  };
}> {
  const scraperResults: ScraperResult[] = [];

  // Define all scrapers to run
  const scrapers = [
    {
      name: 'Moody Center',
      venueSlug: 'moody-center',
      fn: fetchEventsFromMoodyCenter,
    },
    {
      name: 'Paramount Theatre',
      venueSlug: 'paramount-theatre',
      fn: fetchEventsFromParamount,
    },
    // Mock scraper only runs in development or when explicitly requested
    ...(process.env.NODE_ENV === 'development' && process.env.ENABLE_MOCK_SCRAPER === 'true' ? [{
      name: 'Mock Scraper',
      venueSlug: 'moody-center',
      fn: fetchMockEvents,
    }] : []),
  ];

  // Run all scrapers
  for (const scraper of scrapers) {
    try {
      console.log(`Running scraper: ${scraper.name}`);
      const events = await scraper.fn();
      
      scraperResults.push({
        source: events[0]?.source || 'VENUE_WEBSITE',
        venueSlug: scraper.venueSlug,
        events,
      });

      console.log(`  Found ${events.length} events`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error running scraper ${scraper.name}:`, error);
      
      scraperResults.push({
        source: 'VENUE_WEBSITE',
        venueSlug: scraper.venueSlug,
        events: [],
        error: errorMessage,
      });
    }
  }

  // Collect all events and upsert
  const allEvents = scraperResults.flatMap((result) => result.events);
  const upsertResult = await upsertEvents(allEvents);

  return {
    results: scraperResults,
    summary: {
      totalEvents: allEvents.length,
      created: upsertResult.created,
      updated: upsertResult.updated,
      errors: upsertResult.errors,
    },
  };
}

/**
 * Run a single scraper by name
 */
export async function runScraper(scraperName: string): Promise<ScraperResult> {
  // Map scraper names to functions
  const scraperMap: Record<string, () => Promise<import('./types').NormalizedEvent[]>> = {
    'moody-center': fetchEventsFromMoodyCenter,
    'paramount': fetchEventsFromParamount,
    'paramount-theatre': fetchEventsFromParamount,
    'mock': fetchMockEvents,
  };

  const scraperFn = scraperMap[scraperName.toLowerCase()];
  
  if (!scraperFn) {
    throw new Error(`Unknown scraper: ${scraperName}. Available: ${Object.keys(scraperMap).join(', ')}`);
  }

  const events = await scraperFn();
  const upsertResult = await upsertEvents(events);

  return {
    source: events[0]?.source || 'VENUE_WEBSITE',
    venueSlug: scraperName,
    events,
    error: upsertResult.errors.length > 0 ? upsertResult.errors.join('; ') : undefined,
  };
}

