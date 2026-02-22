# Ingestion & Scraping

You are working on the event ingestion pipeline: scrapers, enrichment, cron jobs, and venue data.

## Scraper Contract

Every scraper returns `NormalizedEvent[]` (defined in `src/ingestion/types.ts`):

```typescript
interface NormalizedEvent {
  venueSlug: string;              // Must match existing Venue.slug in DB
  title: string;
  description?: string | null;
  startDateTime: Date;
  endDateTime?: Date | null;
  url: string;
  imageUrl?: string | null;
  category?: EventCategory | null; // Default to OTHER — enrichment improves it
  source: EventSource;             // Always EventSource.VENUE_WEBSITE
  sourceEventId?: string | null;   // Critical for deduplication
}
```

## Three Scraping Strategies

### A) fetch + cheerio (JSON-LD) — Simplest
For venues that embed `<script type="application/ld+json">` structured data.
No browser needed. Use `fetch()` + `cheerio.load()`.
Examples: `moodyCenter.ts`, `longCenter.ts`, `radioEast.ts`

### B) Puppeteer + DOM — For JS-rendered content
For SPAs, AJAX pagination, "Load More" buttons, lazy-loaded content.
Use `launchBrowser()` from `src/lib/browser.ts` (handles serverless vs local).
Always close browser in `finally` block.
Examples: `texasPerformingArts.ts`, `aclLive.ts`, `mohawk.ts`

### C) Dual extraction (JSON-LD + DOM fallback)
Use `Map<string, NormalizedEvent>` for internal deduplication.
JSON-LD is primary, DOM catches gaps.
Example: `emos.ts`

## Browser Launcher

`src/lib/browser.ts` provides `launchBrowser()`:
- **Serverless (Vercel):** Uses `@sparticuz/chromium-min` + `puppeteer-core`, downloads chromium from GitHub releases
- **Local:** Uses regular `puppeteer`
- Always headless mode
- Pattern: `const browser = await launchBrowser();` in try, `browser.close()` in finally

## Upsert & Deduplication

`src/ingestion/upsert.ts` handles all database writes:

1. **Primary dedup:** Match by `(source, sourceEventId)` — most reliable
2. **Fallback dedup:** Match by `(venueId, startDateTime, normalizedTitle)` — for scrapers without stable IDs
3. **Update behavior:** All fields updated EXCEPT `category` (preserves LLM enrichment)

Always extract a `sourceEventId` if the source provides one (URL slug, production number, etc.).

## Adding a New Scraper

1. **Create scraper file:** `src/ingestion/sources/{venueName}.ts`
   - Export `async function fetchEventsFrom{VenueName}(): Promise<NormalizedEvent[]>`
   - Choose strategy A, B, or C based on the venue's website
   - Set `venueSlug` to match existing `Venue.slug` in database
   - Set `source: EventSource.VENUE_WEBSITE`
   - Extract `sourceEventId` if available
   - Default `category: EventCategory.OTHER` (enrichment handles categorization)

2. **Register in orchestrator:** `src/ingestion/orchestrator.ts`
   - Add to `scrapers` array in `runAllScrapers()`
   - Add to `scraperMap` in `runScraper()` with slug + aliases

3. **Ensure venue exists:** Venue record with matching `slug` must exist in DB
   - Check `prisma/seed.ts` or create via Prisma Studio
   - Include: name, slug, websiteUrl, address, city, state, lat, lng

4. **Test:** Call `POST /api/cron/scrape?name=venue-slug` to run single scraper

## Cron Pipeline (Daily, Staggered)

```
8 AM CT  → /api/cron/scrape         → Run all 19 venue scrapers
9 AM CT  → /api/cron/tm-download    → Refresh Ticketmaster event cache
10 AM CT → /api/cron/enrich         → LLM + KG + Spotify enrichment
11 AM CT → /api/cron/tm-match       → Match events to TM data (buy links)
12 PM CT → /api/cron/weather-precache → Pre-cache weather for event dates
```

All cron routes require `CRON_SECRET` bearer token. Auth via `verifyCronAuth()` from `src/lib/cron/auth.ts`.

## Enrichment Flow (After Scraping)

Events without an `Enrichment` record get processed:
1. **LLM (gpt-4o-mini):** Extract performer name, categorize, generate description, confidence score
2. **Knowledge Graph:** Bio, image, Wikipedia link (using LLM-extracted performer)
3. **Spotify:** Artist link, genres, popularity (using LLM-extracted performer)
4. **Ticketmaster (gpt-4o):** Match to TM cache for buy links, presales, seatmaps

LLM enrichment updates `event.category` ONLY if confidence exceeds the scraped value.

## Common Patterns

- **Pagination:** URL params (moodyCenter), AJAX button clicks (TPA, ACL)
- **Date parsing:** Prefer ISO formats when available, regex for custom formats
- **Images:** Fix relative URLs to absolute paths
- **Error handling:** Try/catch per event (skip bad events, don't fail entire scraper)
- **Austin timezone:** Use `date-fns-tz` with `America/Chicago` for date construction

## Key Files

| File | Purpose |
|------|---------|
| `src/ingestion/types.ts` | NormalizedEvent interface, normalizeTitle() |
| `src/ingestion/upsert.ts` | Database upsert with deduplication |
| `src/ingestion/orchestrator.ts` | Scraper registry and execution |
| `src/ingestion/sources/*.ts` | Individual venue scrapers (19 files) |
| `src/lib/browser.ts` | Puppeteer launcher (serverless + local) |
| `src/app/api/cron/scrape/route.ts` | Cron endpoint |
| `src/app/api/cron/enrich/route.ts` | Enrichment endpoint (?limit=N, ?force=true) |
| `notes/ingestion/source-audit.md` | Field coverage per scraper |
| `notes/ingestion/priority-venues.md` | Venue coverage decisions |
