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

## Date & Time Safety Guide

**This is the most important section.** Date bugs corrupt data silently because the upsert pipeline **overwrites** `startDateTime` on every re-scrape. A bad date today destroys a good date from yesterday.

### The Golden Rules

1. **ALWAYS use `createAustinDate(year, month, day, hour, minute)` for constructing event dates.**
   - Located in `src/lib/utils.ts`
   - Uses `fromZonedTime()` to create a proper UTC `Date` from Austin local time components
   - `month` is 0-indexed (January = 0)

2. **NEVER use `new Date(year, month, day, ...)` for event dates.**
   - On Vercel (UTC), `new Date(2026, 1, 23, 20, 0)` creates 8 PM **UTC**, not 8 PM Austin
   - This means the event appears at 2 PM Austin time — 6 hours early

3. **ALWAYS use `inferYear(month, day)` when year is not explicit.**
   - Located in `src/ingestion/utils/dateParser.ts`
   - Compares at **day level in Austin timezone** — not time level
   - Old pattern `if (new Date(year, month, day) < new Date()) year++` is **broken** because the cron runs at 8 AM UTC — today's events at midnight UTC are "in the past" and get bumped to next year

4. **JSON-LD ISO dates with timezone offsets are safe with `new Date(isoString)`.**
   - `new Date("2026-02-23T20:00:00-06:00")` correctly parses to UTC
   - Only raw `new Date()` is dangerous — ISO strings with offsets are fine

### Why This Matters

The cron runs at **8 AM UTC (2 AM CT)**. At that moment:
- `new Date()` = 8 AM UTC
- `new Date(2026, 1, 23)` = midnight UTC on Feb 23 = **6 PM CT on Feb 22**
- Comparing these: midnight < 8 AM, so the scraper thinks "Feb 23 is in the past" and bumps to 2027
- The upsert **overwrites** the previously-correct date with 2027
- The event vanishes from listings because it's now a year in the future

This exact bug hit Stubb's, Mohawk, Moody Amphitheater, and Empire in Feb 2026.

### Safe Date Construction Patterns

```typescript
// GOOD: Austin-aware date from components
import { createAustinDate } from '@/lib/utils';
const date = createAustinDate(2026, 1, 23, 20, 0); // Feb 23, 2026 8 PM CT

// GOOD: Year inference for month/day-only dates
import { inferYear } from '../utils/dateParser';
const year = inferYear(month, day); // Austin-aware day-level comparison
const date = createAustinDate(year, month, day, hour, minute);

// GOOD: JSON-LD ISO string with timezone offset
const date = new Date("2026-02-23T20:00:00-06:00"); // Safe — offset is explicit

// BAD: Raw Date constructor
const date = new Date(2026, 1, 23, 20, 0); // 8 PM UTC, not 8 PM Austin!

// BAD: Year inference with time-level comparison
const now = new Date();
const test = new Date(year, month, day); // midnight UTC
if (test < now) year++; // BROKEN at 8 AM UTC — today looks "past"
```

### Shared Utilities

| Utility | Location | Purpose |
|---------|----------|---------|
| `createAustinDate(y, m, d, h, min)` | `src/lib/utils.ts` | Create UTC Date from Austin local time components |
| `inferYear(month, day)` | `src/ingestion/utils/dateParser.ts` | Determine year from month/day using Austin timezone day comparison |
| `getStartOfTodayAustin()` | `src/lib/utils.ts` | Midnight Austin time as UTC Date (for query filters) |
| `AUSTIN_TIMEZONE` | `src/lib/utils.ts` | `"America/Chicago"` constant |
| `toZonedTime(date, tz)` | `date-fns-tz` | Convert UTC Date to "fake" zoned Date (for display math only) |
| `fromZonedTime(date, tz)` | `date-fns-tz` | Convert "fake" zoned Date back to real UTC Date |
| `formatInTimeZone(date, tz, fmt)` | `date-fns-tz` | Format UTC Date as Austin local string |

### Per-Scraper Date Status

| Scraper | Uses `createAustinDate` | Uses `inferYear` | Year Source | Default Time | Risk |
|---------|:-:|:-:|---|---|---|
| moodyCenter | - | - | JSON-LD ISO (explicit) | From JSON-LD | Safe (ISO) |
| paramount | Yes | - | Text "Nov 28, 2025" (explicit) | From text | Safe |
| aclLive | Yes | - | Span elements (explicit) | 8 PM / from URL | Safe (year fallback Austin-aware) |
| stubbs | Yes | Yes | URL `YYYY-MM-DD` / inferred | From text / 8 PM | Safe |
| texasPerformingArts | Yes | - | Text "Nov 29, 2025" (explicit) | UT Calendar / 7:30 PM | Safe |
| longCenter | - | - | JSON-LD ISO with offset | From JSON-LD | Safe (ISO offset) |
| emos | Yes | - | JSON-LD ISO / TM URL (DOM: `createAustinDate`) | From JSON-LD | Safe (fixed Feb 2026) |
| mohawk | Yes | Yes | Inferred from "DEC 7" | From text / 8 PM | Safe |
| concourseProject | Yes | Yes | Inferred from "Sat Dec 6" | 8 PM | Safe (fixed Feb 2026) |
| antones | Yes | Yes | Inferred from "December 06" | From text / 7 PM | Safe (fixed Feb 2026) |
| moodyAmphitheater | Yes | Yes | Inferred from "Mar 18" | From text / 7 PM | Safe |
| scootInn | Yes | Yes | JSON-LD ISO / DOM: `createAustinDate` + `inferYear` | From JSON-LD | Safe (fixed Feb 2026) |
| radioEast | - | - | JSON-LD ISO | From JSON-LD | Safe (ISO) |
| empire | Yes | Yes | Inferred from "09 December" | From text / 8 PM | Safe |
| hebCenter | Yes | - | `data-fulldate` (explicit) | From text / 7 PM | Safe |
| cota | Yes | - | Text "March 14, 2026" (explicit) | 7 PM | Safe |
| q2Stadium | Yes | - | Text "February 21, 2026" (explicit) | 7:30 PM | Safe |

**All 18 scrapers are now date-safe.** (Feb 2026: fixed concourseProject, antones, emos, scootInn, aclLive)

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
4. **Critical:** Upsert **overwrites** `startDateTime` — a scraper date bug destroys previously-correct data on every re-scrape

Always extract a `sourceEventId` if the source provides one (URL slug, production number, etc.).

## Adding a New Scraper

1. **Create scraper file:** `src/ingestion/sources/{venueName}.ts`
   - Export `async function fetchEventsFrom{VenueName}(): Promise<NormalizedEvent[]>`
   - Choose strategy A, B, or C based on the venue's website
   - Set `venueSlug` to match existing `Venue.slug` in database
   - Set `source: EventSource.VENUE_WEBSITE`
   - Extract `sourceEventId` if available
   - Default `category: EventCategory.OTHER` (enrichment handles categorization)
   - **Use `createAustinDate()` for all date construction** (see Date & Time Safety Guide)
   - **Use `inferYear()` if dates lack explicit year** (see Date & Time Safety Guide)

2. **Register in orchestrator:** `src/ingestion/orchestrator.ts`
   - Add to `scrapers` array in `runAllScrapers()`
   - Add to `scraperMap` in `runScraper()` with slug + aliases

3. **Ensure venue exists:** Venue record with matching `slug` must exist in DB
   - Check `prisma/seed.ts` or create via Prisma Studio
   - Include: name, slug, websiteUrl, address, city, state, lat, lng

4. **Test:** Run `npx tsx scripts/ingest-offline.ts --venue=slug` locally, or `POST /api/ingest/slug`

## Cron Pipeline (Daily, Staggered)

```
2 AM CT (8 AM UTC)  → /api/cron/scrape          → Run all 18 venue scrapers
3 AM CT (9 AM UTC)  → /api/cron/tm-download     → Refresh Ticketmaster event cache
4 AM CT (10 AM UTC) → /api/cron/enrich          → LLM + KG + Spotify enrichment
5 AM CT (11 AM UTC) → /api/cron/tm-match        → Match events to TM data (buy links)
6 AM CT (12 PM UTC) → /api/cron/weather-precache → Pre-cache weather for event dates
```

All cron routes require `CRON_SECRET` bearer token. Auth via `verifyCronAuth()` from `src/lib/cron/auth.ts`.

## Manual Scraper Triggers

| Method | Command | Notes |
|--------|---------|-------|
| **Local CLI** | `npx tsx scripts/ingest-offline.ts --venue=stubbs` | Runs locally, writes to DB directly |
| **Local CLI (all)** | `npx tsx scripts/ingest-offline.ts --all` | Runs all scrapers |
| **API (single)** | `POST /api/ingest/stubbs` | Via deployed API |
| **API (all)** | `POST /api/cron/scrape` (with CRON_SECRET) | Full cron pipeline |

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
- **Austin timezone:** Use `createAustinDate()` — never raw `new Date()` for event times

## Key Files

| File | Purpose |
|------|---------|
| `src/ingestion/types.ts` | NormalizedEvent interface, normalizeTitle() |
| `src/ingestion/upsert.ts` | Database upsert with deduplication |
| `src/ingestion/orchestrator.ts` | Scraper registry and execution |
| `src/ingestion/sources/*.ts` | Individual venue scrapers (18 files) |
| `src/ingestion/utils/dateParser.ts` | `inferYear()`, `inferCategory()`, shared date utilities |
| `src/lib/utils.ts` | `createAustinDate()`, `getStartOfTodayAustin()`, `AUSTIN_TIMEZONE` |
| `src/lib/browser.ts` | Puppeteer launcher (serverless + local) |
| `src/app/api/cron/scrape/route.ts` | Cron endpoint |
| `src/app/api/cron/enrich/route.ts` | Enrichment endpoint (?limit=N, ?force=true) |
| `scripts/ingest-offline.ts` | Local CLI for manual scraper runs |
| `src/app/api/ingest/[source]/route.ts` | API endpoint for single scraper |
| `notes/ingestion/source-audit.md` | Field coverage per scraper |
| `notes/ingestion/priority-venues.md` | Venue coverage decisions |
| `notes/ingestion/scraper-log.md` | Audit log of scraper changes |
