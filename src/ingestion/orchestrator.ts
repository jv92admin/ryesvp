import { ScraperResult } from './types';
import { fetchEventsFromMoodyCenter } from './sources/moodyCenter';
import { fetchEventsFromParamount } from './sources/paramount';
import { fetchEventsFromAclLive } from './sources/aclLive';
import { fetchEventsFromStubbs } from './sources/stubbs';
import { fetchEventsFromTPA } from './sources/texasPerformingArts';
import { fetchEventsFromLongCenter } from './sources/longCenter';
import { fetchEventsFromEmos } from './sources/emos';
import { fetchEventsFromMohawk } from './sources/mohawk';
import { fetchEventsFromConcourseProject } from './sources/concourseProject';
import { fetchEventsFromAntones } from './sources/antones';
import { fetchEventsFromMoodyAmphitheater } from './sources/moodyAmphitheater';
import { fetchEventsFromScootInn } from './sources/scootInn';
import { fetchEventsFromRadioEast } from './sources/radioEast';
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
    {
      name: 'ACL Live',
      venueSlug: 'acl-live',
      fn: fetchEventsFromAclLive,
    },
    {
      name: "Stubb's BBQ",
      venueSlug: 'stubbs',
      fn: fetchEventsFromStubbs,
    },
    {
      name: 'Texas Performing Arts',
      venueSlug: 'bass-concert-hall',
      fn: fetchEventsFromTPA,
    },
    {
      name: 'Long Center',
      venueSlug: 'long-center',
      fn: fetchEventsFromLongCenter,
    },
    {
      name: "Emo's Austin",
      venueSlug: 'emos',
      fn: fetchEventsFromEmos,
    },
    {
      name: 'Mohawk',
      venueSlug: 'mohawk',
      fn: fetchEventsFromMohawk,
    },
    {
      name: 'The Concourse Project',
      venueSlug: 'concourse-project',
      fn: fetchEventsFromConcourseProject,
    },
    {
      name: "Antone's Nightclub",
      venueSlug: 'antones',
      fn: fetchEventsFromAntones,
    },
    {
      name: 'Moody Amphitheater',
      venueSlug: 'moody-amphitheater',
      fn: fetchEventsFromMoodyAmphitheater,
    },
    {
      name: 'Scoot Inn',
      venueSlug: 'scoot-inn',
      fn: fetchEventsFromScootInn,
    },
    {
      name: 'Radio East',
      venueSlug: 'radio-east',
      fn: fetchEventsFromRadioEast,
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
    'acl-live': fetchEventsFromAclLive,
    'acl': fetchEventsFromAclLive,
    'stubbs': fetchEventsFromStubbs,
    'stubbs-bbq': fetchEventsFromStubbs,
    'tpa': fetchEventsFromTPA,
    'bass-concert-hall': fetchEventsFromTPA,
    'texas-performing-arts': fetchEventsFromTPA,
    'long-center': fetchEventsFromLongCenter,
    'longcenter': fetchEventsFromLongCenter,
    'emos': fetchEventsFromEmos,
    'emos-austin': fetchEventsFromEmos,
    'mohawk': fetchEventsFromMohawk,
    'mohawk-austin': fetchEventsFromMohawk,
    'concourse-project': fetchEventsFromConcourseProject,
    'concourse': fetchEventsFromConcourseProject,
    'antones': fetchEventsFromAntones,
    'antones-nightclub': fetchEventsFromAntones,
    'moody-amphitheater': fetchEventsFromMoodyAmphitheater,
    'moody-amp': fetchEventsFromMoodyAmphitheater,
    'waterloo-park': fetchEventsFromMoodyAmphitheater,
    'scoot-inn': fetchEventsFromScootInn,
    'scootinn': fetchEventsFromScootInn,
    'radio-east': fetchEventsFromRadioEast,
    'radioeast': fetchEventsFromRadioEast,
    'radio': fetchEventsFromRadioEast,
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

