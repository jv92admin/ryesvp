# Ingestion System

This directory contains the event ingestion system that scrapes venue websites and APIs to populate the events database.

## Architecture

### Types (`types.ts`)
- `NormalizedEvent`: Standard event format used by all scrapers
- `ScraperResult`: Result of running a scraper
- `normalizeTitle()`: Helper for fuzzy title matching

### Upsert Logic (`upsert.ts`)
- `upsertEvents()`: Handles deduplication and database updates
- Deduplication strategies:
  1. Match by `(source, sourceEventId)` if available
  2. Match by `(venueId, startDateTime, normalizedTitle)` as fallback

### Scrapers (`sources/`)
Each venue/source has its own scraper module:
- `moodyCenter.ts`: Moody Center scraper (stub - needs implementation)
- `paramount.ts`: Paramount Theatre scraper (stub - needs implementation)
- `mock.ts`: Mock scraper for testing

### Orchestrator (`orchestrator.ts`)
- `runAllScrapers()`: Runs all scrapers and upserts events
- `runScraper(name)`: Runs a single scraper by name

## Adding a New Scraper

1. **Create a new scraper file** in `sources/`:
   ```typescript
   // src/ingestion/sources/myVenue.ts
   import { NormalizedEvent } from '../types';
   import { EventSource, EventCategory } from '@prisma/client';
   import { load } from 'cheerio';

   export async function fetchEventsFromMyVenue(): Promise<NormalizedEvent[]> {
     const events: NormalizedEvent[] = [];
     
     try {
       const response = await fetch('https://venue-website.com/events', {
         headers: {
           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
         },
       });

       if (!response.ok) {
         return events;
       }

       const html = await response.text();
       const $ = load(html);

       // Parse HTML and extract events
       $('.event-item').each((_, element) => {
         const title = $(element).find('.event-title').text().trim();
         const dateStr = $(element).find('.event-date').text().trim();
         const url = $(element).find('a').attr('href');
         
         // Parse date, map to category, etc.
         events.push({
           venueSlug: 'my-venue-slug', // Must match Venue.slug in DB
           title,
           startDateTime: parseDate(dateStr),
           url: url || '',
           source: EventSource.VENUE_WEBSITE,
           sourceEventId: extractId(url), // Optional but recommended
           category: EventCategory.CONCERT, // Or detect from content
         });
       });
     } catch (error) {
       console.error('Error scraping My Venue:', error);
     }

     return events;
   }
   ```

2. **Add to orchestrator** (`orchestrator.ts`):
   ```typescript
   import { fetchEventsFromMyVenue } from './sources/myVenue';
   
   // Add to scrapers array:
   {
     name: 'My Venue',
     venueSlug: 'my-venue-slug',
     fn: fetchEventsFromMyVenue,
   }
   ```

3. **Ensure venue exists** in database (via seed script or manual creation)

4. **Test**:
   ```bash
   # Test single scraper
   curl -X POST http://localhost:3000/api/ingest/my-venue
   
   # Test all scrapers
   curl -X POST http://localhost:3000/api/ingest/all
   ```

## API Endpoints

### `POST /api/ingest/all`
Runs all scrapers and upserts events.

**Response:**
```json
{
  "success": true,
  "duration": "1953ms",
  "summary": {
    "totalEvents": 10,
    "created": 5,
    "updated": 5,
    "errors": []
  },
  "scrapers": [
    {
      "venueSlug": "moody-center",
      "eventCount": 5,
      "error": null
    }
  ]
}
```

### `POST /api/ingest/[source]`
Runs a single scraper by name.

**Example:** `POST /api/ingest/moody-center`

## Scheduling with Vercel Cron

To schedule automatic ingestion, add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/ingest/all",
      "schedule": "0 3 * * *"
    }
  ]
}
```

Or configure in Vercel Dashboard:
1. Go to your project → Settings → Cron Jobs
2. Add new cron job:
   - Path: `/api/ingest/all`
   - Schedule: `0 3 * * *` (daily at 3 AM UTC)

## Best Practices

1. **Always include `sourceEventId`** when available for better deduplication
2. **Handle errors gracefully** - return empty array on failure, log errors
3. **Respect rate limits** - add delays between requests if needed
4. **Use appropriate User-Agent** headers
5. **Parse dates carefully** - handle timezones correctly
6. **Test scrapers regularly** - websites change structure frequently

## Troubleshooting

- **"Venue not found" errors**: Ensure venue exists in database with matching `slug`
- **Duplicate events**: Check deduplication logic, ensure `sourceEventId` is unique
- **Parsing errors**: Website structure may have changed, update selectors
- **Rate limiting**: Add delays or use proxies if needed

