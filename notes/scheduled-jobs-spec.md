# Scheduled Jobs Specification

> **Phase 2 Priority** — See `PROJECT-ROADMAP.md` for overall project priorities

## Overview

This document is the **definitive reference** for RyesVP's job infrastructure:
1. Complete inventory of all data jobs
2. Data sources and storage patterns
3. Job dependencies and execution order
4. Implementation plan for automation

---

## Job Inventory

### Summary Table

| # | Job | Script | API Route | Frequency | Dependencies |
|---|-----|--------|-----------|-----------|--------------|
| 1 | **Venue Scraping** | `ingest-offline.ts` | `POST /api/ingest/all` | Daily 2 AM | None |
| 2 | **LLM + KG + Spotify Enrichment** | `enrich-events.ts` | (none yet) | Daily 4 AM | After Job 1 |
| 3 | **TM Cache Download** | `download-tm-cache.ts` | (none yet) | Daily 3 AM | None |
| 4 | **TM Event Matching** | `enrich-tm-from-cache.ts` | (none yet) | Daily 5 AM | After Job 2 & 3 |
| 5 | **Weather Pre-Cache** | (not built) | `GET /api/weather` | Daily 6 AM | None |
| 6 | **Data Cleanup** | (not built) | (none) | Weekly | None |

---

## Job 1: Venue Scraping

**Purpose:** Fetch new events from venue websites and update the database.

### Data Sources (6 Venues)

| Venue | Scraper | Method | Data Format |
|-------|---------|--------|-------------|
| Moody Center | `moodyCenter.ts` | HTTP + JSON-LD | Schema.org Event |
| ACL Live | `aclLive.ts` | HTTP + HTML | Cheerio parsing |
| Stubb's BBQ | `stubbs.ts` | HTTP + HTML | Cheerio parsing |
| Paramount Theatre | `paramount.ts` | Puppeteer | JS-rendered page |
| Texas Performing Arts | `texasPerformingArts.ts` | HTTP + JSON-LD | Schema.org Event |
| Long Center | `longCenter.ts` | HTTP + JSON-LD | Schema.org Event |

### Data Flow

```
Venue Website → Scraper → NormalizedEvent[] → upsertEvents() → Event table
```

### Storage Pattern: **Live Pull + Upsert**

- No caching layer; scrapes go directly to database
- Deduplication by `(source, sourceEventId)` or `(venueId, startDateTime, normalizedTitle)`
- Creates new events, updates existing ones
- Never deletes (events stay even if removed from venue site)

### Current State

| Item | Status |
|------|--------|
| Scrapers | ✅ All 6 working |
| Orchestrator | ✅ `runAllScrapers()` |
| API Route | ✅ `POST /api/ingest/all` |
| Auth | ⚠️ No protection (commented out) |
| Scheduling | ❌ Manual only |

### Tables Touched

- **Event** — Created/updated
- **Venue** — Read only (must pre-exist)

### Scripts

```bash
# Run all scrapers locally
npm run ingest:all
# or
npx tsx scripts/ingest-offline.ts

# Run single scraper
npm run ingest:offline -- --venue=moody-center
```

---

## Job 2: LLM + KG + Spotify Enrichment

**Purpose:** Enrich events with categorization, performer info, artist data, and media links.

### Data Sources (3 APIs)

| API | Purpose | Rate Limit | Cost |
|-----|---------|------------|------|
| **OpenAI GPT-4o-mini** | Categorization, performer extraction | None (pay per token) | ~$0.001/event |
| **Google Knowledge Graph** | Bio, image, Wikipedia link | 100K/day free | Free |
| **Spotify Web API** | Artist link, genres, popularity | Very generous | Free |

### Data Flow

```
Event (no enrichment)
  → LLM: categorize + extract performer
  → If CONCERT: Spotify lookup
  → If COMEDY/THEATER: KG lookup
  → Enrichment record saved
  → Event.category updated if LLM confident
```

### Storage Pattern: **Process-Once + Store**

- Events without Enrichment record are candidates
- Failed events retry up to 3 times
- Results stored in `Enrichment` table (1:1 with Event)
- `EnrichmentStatus`: PENDING → PROCESSING → COMPLETED/PARTIAL/FAILED

### Enrichment Data Captured

| Source | Fields |
|--------|--------|
| **LLM** | `llmCategory`, `llmPerformer`, `llmDescription`, `llmConfidence` |
| **Knowledge Graph** | `kgEntityId`, `kgName`, `kgDescription`, `kgBio`, `kgImageUrl`, `kgWikiUrl`, `kgTypes`, `kgScore` |
| **Spotify** | `spotifyId`, `spotifyName`, `spotifyUrl`, `spotifyGenres`, `spotifyPopularity`, `spotifyImageUrl` |

### Current State

| Item | Status |
|------|--------|
| Enrichment logic | ✅ `src/lib/enrichment/index.ts` |
| Script | ✅ `scripts/enrich-events.ts` |
| API Route | ❌ None |
| Scheduling | ❌ Manual only |

### Tables Touched

- **Event** — Read, category updated
- **Enrichment** — Created/updated

### Scripts

```bash
# Enrich up to 50 events
npx dotenvx run -- npx tsx scripts/enrich-events.ts

# Enrich 100 events
npx dotenvx run -- npx tsx scripts/enrich-events.ts --limit=100

# Force re-enrich all
npx dotenvx run -- npx tsx scripts/enrich-events.ts --force
```

---

## Job 3: TM Cache Download

**Purpose:** Batch download all Ticketmaster events for our venues (6 API calls total).

### Data Source

| API | Endpoint | Rate Limit | Cost |
|-----|----------|------------|------|
| **TM Discovery API** | `GET /discovery/v2/events` | 5,000/day | Free |

### Venue Mapping

| Our Venue | TM Venue ID | TM Venue Name |
|-----------|-------------|---------------|
| moody-center | `KovZ917ANwG` | Moody Center ATX |
| acl-live | `KovZpZAJJlvA` | Austin City Limits Live |
| stubbs | `KovZ917AxzU` | Stubb's Waller Creek |
| paramount-theatre | `KovZpZAaa1nA` | Paramount Theatre |
| bass-concert-hall | `KovZpZAJJ7AA` | Bass Concert Hall |
| long-center | `KovZpZAJEFvA` | Long Center |

### Data Flow

```
For each venue:
  TM API → events for next 6 months
  
All TM events → Clear old cache → Insert to TMEventCache
```

### Storage Pattern: **Full Replace Cache**

- Deletes all existing cache entries
- Inserts fresh data from TM
- No incremental updates (simpler, ensures freshness)

### TM Data Captured

| Category | Fields |
|----------|--------|
| **Core** | `id`, `name`, `url`, `localDate`, `startDateTime` |
| **Sales** | `onSaleStart`, `onSaleEnd`, `presales` (JSON) |
| **Media** | `imageUrl`, `seatmapUrl` |
| **Artist** | `attractionId`, `attractionName`, `supportingActs`, `externalLinks` |
| **Classification** | `genre`, `subGenre`, `segment` |
| **Status** | `status`, `info`, `pleaseNote`, `ticketLimit` |

### Current State

| Item | Status |
|------|--------|
| TM Client | ✅ `src/lib/ticketmaster/client.ts` |
| Script | ✅ `scripts/download-tm-cache.ts` |
| API Route | ❌ None |
| Scheduling | ❌ Manual only |

### Tables Touched

- **TMEventCache** — Cleared and repopulated

### Scripts

```bash
# Download next 6 months
npx tsx scripts/download-tm-cache.ts

# Download next 3 months
npx tsx scripts/download-tm-cache.ts --months=3
```

---

## Job 4: TM Event Matching

**Purpose:** Match our events against cached TM data to add buy links, presales, and ticket info.

### Data Sources

| Source | Purpose |
|--------|---------|
| **TMEventCache** | Candidate TM events for matching |
| **OpenAI GPT-4o** | Disambiguate fuzzy matches |

### Matching Algorithm

```
For each our event:
  1. Find TMEventCache entries with same venue + date
  2. Calculate similarity score (Levenshtein + normalization)
  3. If similarity ≥ 85%: Auto-match
  4. If similarity < 85% but candidates exist: Ask LLM to pick
  5. Update Enrichment record with TM data
```

### Storage Pattern: **Incremental Update**

- Reads from TMEventCache (no API calls)
- Updates existing Enrichment records
- Tracks `tmLastChecked` for staleness
- Reuses previous matches to skip redundant LLM calls

### TM Enrichment Fields

| Field | Purpose |
|-------|---------|
| `tmEventId` | TM event ID (for future API calls) |
| `tmEventName` | TM title (often more descriptive) |
| `tmUrl` | **Buy tickets link** (main value!) |
| `tmOnSaleStart/End` | Public sale window |
| `tmPresales` | Presale windows (JSON) |
| `tmImageUrl` | High-quality image |
| `tmStatus` | onsale, offsale, cancelled |
| `tmPreferTitle` | Use TM title instead of venue title |
| `tmMatchConfidence` | 0-1 confidence score |
| `tmLastChecked` | When we last matched |

### Current State

| Item | Status |
|------|--------|
| Matcher | ✅ `src/lib/ticketmaster/matcher.ts` |
| Script | ✅ `scripts/enrich-tm-from-cache.ts` |
| API Route | ❌ None |
| Scheduling | ❌ Manual only |

### Tables Touched

- **TMEventCache** — Read only
- **Enrichment** — Updated with TM fields

### Scripts

```bash
# Match all upcoming events
npx tsx scripts/enrich-tm-from-cache.ts

# Dry run (no saves)
npx tsx scripts/enrich-tm-from-cache.ts --dry-run

# Force re-evaluate all (skip cached matches)
npx tsx scripts/enrich-tm-from-cache.ts --fresh

# Filter by venue
npx tsx scripts/enrich-tm-from-cache.ts --venue=moody-center
```

---

## Job 5: Weather Pre-Cache

**Purpose:** Pre-cache weather forecasts for upcoming events so Day-of mode loads instantly.

### Data Source

| API | Endpoint | Rate Limit | Cost |
|-----|----------|------------|------|
| **Google Weather API** | `forecast/days:lookup` | 25K/day free | Free |

### Current Behavior

Weather is fetched **on-demand** when user views Day-of mode:
- Check `WeatherCache` for (lat, lng, date)
- If cache miss or stale (>1 hour): fetch from Google
- Store result in cache

### Proposed Pre-Cache Strategy

```
Daily at 6 AM:
  For each distinct venue lat/lng:
    For each date in next 10 days with events:
      If no fresh cache entry:
        Fetch forecast
        Store in WeatherCache
```

### Storage Pattern: **Upsert Cache**

- Cache key: `(lat, lng, forecastDate)`
- Coordinates rounded to ~1km precision
- TTL: 1 hour (current), could extend for pre-cache

### Current State

| Item | Status |
|------|--------|
| Weather client | ✅ `src/lib/weather.ts` |
| API route | ✅ `GET /api/weather` |
| Cache model | ✅ `WeatherCache` |
| Venue lat/lng | ✅ All 9 venues have coordinates in seed |
| Pre-cache script | ❌ Not built |
| Scheduling | ❌ Not built |

### Tables Touched

- **Venue** — Read lat/lng
- **Event** — Read dates
- **WeatherCache** — Created/updated

### No Blockers

All venues have lat/lng populated via `prisma/seed.ts`:
- moody-center: 30.2820, -97.7328
- acl-live: 30.2652, -97.7519
- stubbs: 30.2694, -97.7368
- paramount-theatre: 30.2672, -97.7417
- bass-concert-hall: 30.2859, -97.7304
- long-center: 30.2594, -97.7505
- (and 3 more)

---

## Job 6: Data Cleanup (Future)

**Purpose:** Maintain data hygiene.

### Potential Tasks

| Task | Frequency | Priority |
|------|-----------|----------|
| Delete past events (>30 days old) | Weekly | Low |
| Clear orphaned Enrichment records | Weekly | Low |
| Expire old WeatherCache entries | Daily | Low |
| Clear old TMEventCache entries | Daily | Low |
| Prune old notifications | Weekly | Medium |

### Current State

Not built. Low priority until data volume grows.

---

## Execution Order & Dependencies

```
Daily Job Sequence:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   2:00 AM ─── Job 1: Venue Scraping ───────────────────┐    │
│                                                         │    │
│   3:00 AM ─── Job 3: TM Cache Download ────────────────┼──┐ │
│                                                         │  │ │
│   4:00 AM ─── Job 2: LLM/KG/Spotify Enrichment ────────┘  │ │
│               (needs new events from Job 1)               │ │
│                                                           │ │
│   5:00 AM ─── Job 4: TM Matching ─────────────────────────┘ │
│               (needs enrichment records from Job 2,         │
│                TM cache from Job 3)                         │
│                                                             │
│   6:00 AM ─── Job 5: Weather Pre-Cache                      │
│               (independent)                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Matrix

| Job | Depends On | Blocks |
|-----|------------|--------|
| 1. Scraping | — | 2 (new events) |
| 2. LLM/KG/Spotify | 1 | 4 (enrichment records) |
| 3. TM Cache | — | 4 (cache data) |
| 4. TM Matching | 2, 3 | — |
| 5. Weather | — | — |
| 6. Cleanup | — | — |

---

## Implementation Plan

### Phase 2A: API Routes (1-2 hours each)

Create API routes for scripts that don't have them:

```
POST /api/cron/enrich       → runs LLM/KG/Spotify enrichment
POST /api/cron/tm-download  → downloads TM cache
POST /api/cron/tm-match     → runs TM matching
POST /api/cron/weather      → pre-caches weather
```

**All cron routes require:** `Authorization: Bearer {CRON_SECRET}`

### Phase 2B: Vercel Cron Setup

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/scrape",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/tm-download",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/enrich",
      "schedule": "0 10 * * *"
    },
    {
      "path": "/api/cron/tm-match",
      "schedule": "0 11 * * *"
    },
    {
      "path": "/api/cron/weather",
      "schedule": "0 12 * * *"
    }
  ]
}
```

Note: Times in UTC. Adjust for Central Time (UTC-6).

### Phase 2C: Job Logging

Create `JobRun` table to track executions:

```prisma
model JobRun {
  id          String   @id @default(uuid())
  jobName     String   // "scrape", "enrich", "tm-download", etc.
  startedAt   DateTime @default(now())
  completedAt DateTime?
  status      String   // "running", "success", "failed"
  summary     Json?    // { processed: 50, errors: 2, ... }
  errorLog    String?  // Error details if failed
  durationMs  Int?
  
  @@index([jobName, startedAt])
}
```

---

## Environment Variables

```bash
# Already configured
GOOGLE_API_KEY=...           # Knowledge Graph + Weather
SPOTIFY_CLIENT_ID=...        # Spotify Web API
SPOTIFY_CLIENT_SECRET=...
OPENAI_API_KEY=...           # GPT-4o-mini for categorization
TICKETMASTER_API_KEY=...     # Discovery API

# New for cron
CRON_SECRET=random_secure_string
```

---

## API Rate Limits & Budgets

| API | Limit | Our Usage | Safety Margin |
|-----|-------|-----------|---------------|
| TM Discovery | 5,000/day | ~6 calls/day | ✅ Excellent |
| Google KG | 100,000/day | ~50 calls/day | ✅ Excellent |
| Spotify | Very generous | ~50 calls/day | ✅ Excellent |
| Google Weather | 25,000/day | ~100 calls/day | ✅ Excellent |
| OpenAI | Pay per token | ~$0.05/day | ✅ Cheap |

---

## Monitoring & Alerts (Future)

### Basic (Phase 2)
- Log job runs to database
- `/admin/jobs` page showing recent runs

### Advanced (Later)
- Slack webhook on failures
- Email digest of daily job results
- Grafana dashboard

---

## Appendix: File Reference

### Scripts (`/scripts/`)

| File | Purpose |
|------|---------|
| `ingest-offline.ts` | Run all/single scrapers locally |
| `enrich-events.ts` | Run LLM/KG/Spotify enrichment |
| `download-tm-cache.ts` | Batch download TM events |
| `enrich-tm-from-cache.ts` | Match events to TM cache |
| `lookup-tm-venues.ts` | Find TM venue IDs (one-time setup) |
| `check-tm-enrichment.ts` | Debug TM enrichment status |
| `debug-tm-status.ts` | Debug TM matching |
| `delete-mock-events.ts` | Cleanup mock data |
| `delete-seed-events.ts` | Cleanup seed data |

### Ingestion (`/src/ingestion/`)

| File | Purpose |
|------|---------|
| `orchestrator.ts` | Coordinates all scrapers |
| `upsert.ts` | Dedup + insert logic |
| `types.ts` | `NormalizedEvent`, `ScraperResult` |
| `sources/*.ts` | Individual venue scrapers |

### Libraries (`/src/lib/`)

| File | Purpose |
|------|---------|
| `enrichment/index.ts` | Main enrichment orchestrator |
| `enrichment/llm.ts` | OpenAI categorization |
| `enrichment/knowledgeGraph.ts` | Google KG client |
| `enrichment/spotify.ts` | Spotify client |
| `ticketmaster/client.ts` | TM API client |
| `ticketmaster/matcher.ts` | Fuzzy matching logic |
| `ticketmaster/venues.ts` | Venue ID mappings |
| `weather.ts` | Google Weather client |

### API Routes (`/src/app/api/`)

| Route | Purpose |
|-------|---------|
| `POST /api/ingest/all` | Trigger all scrapers |
| `POST /api/ingest/[source]` | Trigger single scraper |
| `GET /api/weather` | Fetch/cache weather |

---

**Last Updated:** December 2, 2025
**Status:** Audit complete. Ready for Phase 2 implementation.
