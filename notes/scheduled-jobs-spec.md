# Scheduled Jobs Specification

> **See also:** `PROJECT-ROADMAP.md` for overall project priorities

## Overview

This document covers the scheduled/async job infrastructure for RyesVP, including:
1. Event scraping from venue websites
2. Data enrichment (Knowledge Graph, Spotify)

Both jobs follow the same pattern: run periodically, process in batches, handle failures gracefully.

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

