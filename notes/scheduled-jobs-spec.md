# Scheduled Jobs Specification

> **See also:** `PROJECT-ROADMAP.md` for overall project priorities

## Overview

This document covers the scheduled/async job infrastructure for RyesVP, including:
1. Event scraping from venue websites
2. Data enrichment (Knowledge Graph, Spotify, LLM)
3. Ticketmaster data refresh (pricing, presales, availability)

All jobs follow the same pattern: run periodically, process in batches, handle failures gracefully.

---

## Jobs to Schedule

### 1. Event Scraping

**Purpose:** Fetch new events from venue websites

**Current State:** Manual script execution (`scripts/scrape-*.ts`)

**Frequency:** Daily at 2 AM (low traffic, venues update overnight)

**Batch Size:** All venues, but process sequentially with delays

### 2. Data Enrichment

**Purpose:** Enrich events with Knowledge Graph and Spotify data

**Current State:** Manual script execution (`scripts/enrich-events.ts`)

**Frequency:** Daily at 4 AM (after scraping completes)

**Batch Size:** 50 events per run (to respect API rate limits)

### 3. Weather Cache Refresh (Future)

**Purpose:** Pre-cache weather data for Austin venues

**Current State:** User-triggered with 1-hour cache TTL

**Frequency:** Daily at 6 AM (before users wake up)

**What it does:**
- Fetch 10-day forecast for each distinct Austin venue location
- Cache in `WeatherCache` table
- Ensures fast page loads without hitting Google Weather API

**Implementation Notes:**
- Use `forecast/days:lookup` endpoint with `days=10`
- Round lat/lng to ~1km precision to reduce cache entries
- ~10 distinct Austin venue locations means ~10 API calls daily
- Could extend to hourly refresh closer to events

### 4. Ticketmaster Data Refresh (Future)

**Purpose:** Keep TM-sourced data fresh (prices change, presales end, events sell out)

**Current State:** Manual script execution (`scripts/enrich-tm.ts`)

**Frequency:** Varies by event proximity (see Staleness Strategy below)

**Batch Size:** 50 events per run

#### Staleness Strategy

TM data changes over time - prices fluctuate, presales end, events sell out. 
Refresh frequency should be based on how soon the event is:

| Event Timeframe | Refresh Frequency | Rationale |
|-----------------|-------------------|-----------|
| Next 7 days | Daily | Prices most volatile, availability critical |
| 8-30 days | Weekly | Moderate changes |
| 30+ days | On-demand | Refresh when user views event detail |

#### What Changes in TM Data

- **Prices**: Dynamic pricing means prices rise as events approach
- **Availability**: Events go from "On Sale" → "Low Availability" → "Sold Out"
- **Presale Status**: Presales end, general sale starts
- **Event Status**: Cancelled, postponed, rescheduled
- **Supporting Acts**: Openers announced closer to show date

#### Implementation Notes

- Track `tmLastChecked` timestamp on each enrichment record
- Query: events where `tmLastChecked` is stale based on `startDateTime`
- API budget is generous (5K calls/day), so can be aggressive with refresh
- Consider: only refresh events that users have marked "Going" or "Interested"

#### Batch Download Strategy (Recommended)

Instead of per-event API calls, download all TM events for our venues in batch:

```
Daily at 3 AM:
  For each venue (6 total):
    → 1 API call: "All events at venue X, next 6 months"
    → Store in TMEventCache table
  
  Then match offline:
    → Compare our events vs cache (no API calls)
    → Update Enrichment records
```

**Benefits:**
- 6 API calls vs 100+ per-event calls
- No rate limiting issues
- Instant offline matching
- Prices/URLs up to 24h stale (acceptable with disclaimer)

---

## Implementation Options

### Option A: Vercel Cron Jobs (Recommended)

**Pros:**
- Built into Vercel, no external service
- Simple configuration via `vercel.json`
- Free tier: 2 cron jobs

**Cons:**
- Limited to once per day on free tier
- Max execution time: 10s (hobby) / 60s (pro)

**Setup:**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/scrape",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/enrich",
      "schedule": "0 4 * * *"
    }
  ]
}
```

### Option B: External Cron Service

**Options:**
- [cron-job.org](https://cron-job.org) - Free
- [EasyCron](https://easycron.com) - Free tier
- GitHub Actions - Free for public repos

**Pros:**
- More flexibility
- Longer execution times
- More frequent runs available

**Cons:**
- External dependency
- Need to secure API endpoints

### Option C: Supabase Edge Functions + pg_cron

**Pros:**
- Database-native scheduling
- No external HTTP calls

**Cons:**
- More complex setup
- Tied to Supabase

---

## API Endpoints

### POST /api/cron/scrape

**Auth:** Bearer token (`CRON_SECRET` env var)

**Response:**
```json
{
  "success": true,
  "venues": 5,
  "eventsAdded": 12,
  "eventsUpdated": 3,
  "errors": []
}
```

### POST /api/cron/enrich

**Auth:** Bearer token (`CRON_SECRET` env var)

**Body (optional):**
```json
{
  "limit": 50,
  "force": false
}
```

**Response:**
```json
{
  "success": true,
  "processed": 50,
  "completed": 45,
  "partial": 3,
  "failed": 2,
  "skipped": 0,
  "categoriesUpdated": 5
}
```

---

## Security

1. **Secret Token:** All cron endpoints require `Authorization: Bearer {CRON_SECRET}`
2. **Rate Limiting:** Built-in delays between API calls
3. **Idempotency:** Jobs can be re-run safely (upsert logic)

---

## Monitoring & Alerts

### Logging
- Log start/end of each job
- Log summary stats (processed, failed, etc.)
- Log errors with event IDs for debugging

### Alerts (Future)
- Slack/Discord webhook on failures
- Email digest of scrape results
- Dashboard for job history

---

## Environment Variables

```bash
# Cron job authentication
CRON_SECRET=random_secure_string

# Already configured for enrichment
GOOGLE_API_KEY=...
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
OPENAI_API_KEY=...

# Ticketmaster Discovery API
TICKETMASTER_API_KEY=...
```

---

## Implementation Tasks

### Phase 1: API Routes (1-2 hours)
1. Create `POST /api/cron/scrape`
2. Create `POST /api/cron/enrich`
3. Add auth middleware for cron routes
4. Test endpoints manually

### Phase 2: Vercel Cron Setup (30 min)
1. Add `vercel.json` cron config
2. Add `CRON_SECRET` to Vercel env
3. Deploy and verify scheduled runs

### Phase 3: Monitoring (Future)
1. Add logging to database or external service
2. Set up alerts for failures
3. Create admin dashboard for job history

---

## Rollback Plan

If scheduled jobs cause issues:
1. Remove cron config from `vercel.json`
2. Redeploy
3. Jobs stop running
4. Can still run manually via scripts

---

**Last Updated:** November 2024
**Status:** Scoped, ready when needed

---

## Appendix: Ticketmaster Integration

### Current Implementation

Ticketmaster is used as an **enrichment layer**, not a primary event source.
Our venue scrapers remain the source of truth for event schedules.

**What TM provides:**
- Direct buy links (`tmUrl`)
- Pricing (`tmPriceMin` - displayed as "From $XX")
- Presale windows (`tmPresales`)
- High-quality images (fallback only)
- Opening acts (`tmSupportingActs`)
- Genre/classification data

**Manual scripts:**
- `scripts/lookup-tm-venues.ts` - Find TM venue IDs
- `scripts/enrich-tm.ts` - Match events to TM and enrich

### Venue Mapping

Venues must be manually mapped in `src/lib/ticketmaster/venues.ts`.
Run `lookup-tm-venues.ts` to get TM venue IDs for new venues.

### Match Algorithm

1. Query TM for events at same venue on same date
2. Compare titles using fuzzy matching (Levenshtein + normalization)
3. ≥85% similarity → auto-accept
4. 50-84% similarity → LLM confirmation (yes/no)
5. <50% → no match

