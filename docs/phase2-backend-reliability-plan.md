# Phase 2: Backend Reliability — Implementation Plan

> **Type:** Business Requirements Document (BRD)  
> **Phase:** 2  
> **Priority:** Next  
> **Est. Effort:** 2-3 days  

---

## 1. Overview

### 1.1 Objective

Transform RyesVP from "developer-manually-runs-scripts" to "automated daily refresh" before expanding user base.

### 1.2 Success Criteria

- [ ] All data jobs run automatically on a daily schedule
- [ ] Jobs are protected by authentication
- [ ] Job executions are logged and inspectable
- [ ] Failures are visible (logs at minimum, alerts as stretch)
- [ ] Manual scripts remain functional for debugging

### 1.3 Out of Scope

- Admin dashboard UI for job management
- Email/Slack alerting (future enhancement)
- Job retry logic beyond what exists
- New data sources or scrapers

---

## 2. Pre-Implementation Verification

> ⚠️ **CRITICAL:** Do not assume current state. Verify each item before implementing.

### 2.1 Verification Checklist

| Item | How to Verify | Expected State |
|------|---------------|----------------|
| Venue scraping works | Run `npm run ingest:all` locally | Creates/updates events |
| LLM enrichment works | Run `npx dotenvx run -- npx tsx scripts/enrich-events.ts --limit=5` | Enriches 5 events |
| TM cache download works | Run `npx tsx scripts/download-tm-cache.ts` | Populates TMEventCache |
| TM matching works | Run `npx tsx scripts/enrich-tm-from-cache.ts --limit=5` | Matches events to TM |
| Weather API works | Hit `/api/weather?lat=30.28&lng=-97.73&date=YYYY-MM-DD` with tomorrow's date | Returns weather data |
| Venue lat/lng populated | Query `SELECT slug, lat, lng FROM "Venue"` | All venues have coordinates |
| Existing ingest route works | `POST /api/ingest/all` | Returns success with event counts |
| Environment variables set | Check `.env.local` for all required keys | All present |

### 2.2 Required Environment Variables

```bash
# Verify these exist before starting
DATABASE_URL=...
DIRECT_URL=...
GOOGLE_API_KEY=...           # KG + Weather
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
OPENAI_API_KEY=...
TICKETMASTER_API_KEY=...

# New (to be added)
CRON_SECRET=...              # Auth for cron endpoints
```

---

## 3. Requirements

### 3.1 Cron API Routes

Create authenticated API endpoints that cron services can call.

#### R1: Authentication Middleware

**Requirement:** All `/api/cron/*` routes must require `Authorization: Bearer {CRON_SECRET}`.

**Acceptance Criteria:**
- Returns 401 if header missing or invalid
- Returns 200/500 with job results if valid
- `CRON_SECRET` read from environment variable

#### R2: POST /api/cron/enrich

**Requirement:** Triggers LLM + Knowledge Graph + Spotify enrichment batch.

**Behavior:**
- Calls existing `runEnrichmentBatch()` from `src/lib/enrichment`
- Processes up to 50 events per invocation
- Returns summary: `{ processed, completed, partial, failed, skipped }`

**Acceptance Criteria:**
- Enriches events that lack enrichment records
- Does not re-enrich already-enriched events (unless forced)
- Completes within Vercel function timeout (60s Pro, 10s Hobby)

#### R3: POST /api/cron/tm-download

**Requirement:** Downloads fresh Ticketmaster event cache.

**Behavior:**
- Fetches all TM events for mapped venues (next 6 months)
- Clears and repopulates `TMEventCache` table
- Returns summary: `{ venuesProcessed, eventsDownloaded, errors }`

**Acceptance Criteria:**
- Uses batch API calls (6 venues = 6 API calls max)
- Handles TM API errors gracefully
- Logs which venues succeeded/failed

#### R4: POST /api/cron/tm-match

**Requirement:** Matches our events against TM cache.

**Behavior:**
- Processes events that have enrichment records but no TM match
- Uses existing matching logic from `enrich-tm-from-cache.ts`
- Updates `Enrichment` records with TM data
- Returns summary: `{ processed, matched, noMatch, errors }`

**Acceptance Criteria:**
- Reuses previous matches where TM data unchanged (skip LLM)
- Falls back to LLM for ambiguous matches
- Updates `tmLastChecked` timestamp

#### R5: POST /api/cron/weather-precache (Optional)

**Requirement:** Pre-caches weather for upcoming events.

**Behavior:**
- Finds events in next 10 days with venue lat/lng
- Fetches weather for each unique (venue, date) pair
- Stores in `WeatherCache`
- Returns summary: `{ datesCached, apiCalls, errors }`

**Acceptance Criteria:**
- Skips dates already cached within TTL (1 hour)
- Handles Google Weather API errors gracefully
- Does not exceed API rate limits

### 3.2 Cron Scheduling

#### R6: Vercel Cron Configuration

**Requirement:** Configure cron jobs in `vercel.json`.

**Schedule (UTC):**
| Job | Path | Schedule | Notes |
|-----|------|----------|-------|
| Scraping | `/api/cron/scrape` | `0 8 * * *` | 2 AM Central |
| TM Download | `/api/cron/tm-download` | `0 9 * * *` | 3 AM Central |
| Enrichment | `/api/cron/enrich` | `0 10 * * *` | 4 AM Central |
| TM Match | `/api/cron/tm-match` | `0 11 * * *` | 5 AM Central |
| Weather | `/api/cron/weather-precache` | `0 12 * * *` | 6 AM Central (optional) |

**Acceptance Criteria:**
- Jobs run in correct order (dependencies respected via timing)
- Vercel dashboard shows scheduled jobs
- Jobs trigger successfully (verify in Vercel logs)

#### R7: Rename Existing Ingest Route

**Requirement:** Move `/api/ingest/all` to `/api/cron/scrape` for consistency.

**Acceptance Criteria:**
- Old route removed or redirects
- New route has same behavior
- Auth middleware applied

### 3.3 Job Logging

#### R8: Job Run Logging

**Requirement:** Log job executions for debugging and monitoring.

**Minimum Viable:**
- Log to console (visible in Vercel logs)
- Include: job name, start time, duration, success/fail, summary stats

**Stretch Goal (Optional):**
- `JobRun` table in database
- Query-able history of all job runs

**Acceptance Criteria (Minimum):**
- Can see job results in Vercel dashboard logs
- Failures include error messages
- Duration is logged

---

## 4. Directory Structure (Stubs)

```
src/app/api/cron/
├── scrape/
│   └── route.ts          # R7: Move from /api/ingest/all
├── enrich/
│   └── route.ts          # R2: LLM + KG + Spotify
├── tm-download/
│   └── route.ts          # R3: TM cache download
├── tm-match/
│   └── route.ts          # R4: TM matching
└── weather-precache/
    └── route.ts          # R5: Weather pre-cache (optional)

src/lib/cron/
├── auth.ts               # R1: CRON_SECRET validation helper
└── logger.ts             # R8: Job logging utilities (optional)

vercel.json               # R6: Cron schedule configuration
```

### 4.1 Route Stub Template

Each route should follow this pattern:

```typescript
// src/app/api/cron/[job]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/cron/auth';

export async function POST(request: NextRequest) {
  // R1: Auth check
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const startTime = Date.now();
  
  try {
    // Job-specific logic here
    const result = await runJob();
    
    const duration = Date.now() - startTime;
    console.log(`[CRON] ${JOB_NAME} completed in ${duration}ms`, result);
    
    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      ...result,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[CRON] ${JOB_NAME} failed after ${duration}ms`, error);
    
    return NextResponse.json({
      success: false,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
```

### 4.2 Auth Helper Stub

```typescript
// src/lib/cron/auth.ts
import { NextRequest, NextResponse } from 'next/server';

export function verifyCronAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;
  
  if (!expectedToken) {
    console.error('[CRON] CRON_SECRET not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }
  
  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return null; // Auth passed
}
```

---

## 5. Conditions of Completion

### 5.1 Definition of Done

| # | Condition | Verification Method |
|---|-----------|---------------------|
| 1 | All 4 core cron routes exist and respond | `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://[app]/api/cron/[job]` |
| 2 | Routes return 401 without valid auth | `curl -X POST https://[app]/api/cron/scrape` returns 401 |
| 3 | `vercel.json` contains cron config | File exists with schedule entries |
| 4 | Jobs appear in Vercel Cron dashboard | Visual inspection in Vercel UI |
| 5 | Scrape job runs and logs results | Check Vercel logs after scheduled run |
| 6 | Enrich job runs and logs results | Check Vercel logs after scheduled run |
| 7 | TM Download job runs and logs results | Check Vercel logs after scheduled run |
| 8 | TM Match job runs and logs results | Check Vercel logs after scheduled run |
| 9 | Manual scripts still work | Run each script locally, verify success |
| 10 | `CRON_SECRET` added to Vercel env | Check Vercel environment variables |

### 5.2 Verification Procedure

After implementation, run this verification sequence:

```bash
# 1. Local verification
npm run ingest:all                           # Scraping still works
npx dotenvx run -- npx tsx scripts/enrich-events.ts --limit=3
npx tsx scripts/download-tm-cache.ts --months=1
npx tsx scripts/enrich-tm-from-cache.ts --limit=3

# 2. API route verification (local)
curl -X POST http://localhost:3000/api/cron/scrape
# → Should return 401

curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/scrape
# → Should return 200 with results

# 3. Deploy and verify in Vercel
# - Check Cron Jobs tab in Vercel dashboard
# - Manually trigger each job via Vercel UI
# - Verify logs show expected output
```

---

## 6. Dependencies & Risks

### 6.1 Dependencies

| Dependency | Risk | Mitigation |
|------------|------|------------|
| Vercel Pro for >10s functions | Jobs may timeout on Hobby plan | Test with small batches; paginate if needed |
| External APIs (TM, Google, OpenAI) | Rate limits, downtime | Graceful error handling, logging |
| Existing script logic | May have bugs when called from routes | Test scripts before wrapping |

### 6.2 Known Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Puppeteer scrapers fail in Vercel | Some venues not scraped | Medium | Keep manual fallback; investigate Vercel Puppeteer support |
| Function timeout | Incomplete job runs | Medium | Limit batch sizes; split into multiple jobs |
| Missing env vars in prod | Jobs fail silently | Low | Validate env vars at startup; log missing keys |

---

## 7. Future Enhancements (Out of Scope)

- Admin UI showing job run history
- Slack/Discord notifications on failure
- Automatic retry with exponential backoff
- Job queue for long-running tasks
- Observability integration (Datadog, Sentry)

---

## 8. Reference

- **Spec Document:** `notes/scheduled-jobs-spec.md`
- **Existing Scripts:** `scripts/README.md`
- **Ingestion System:** `src/ingestion/README.md`
- **Enrichment Logic:** `src/lib/enrichment/index.ts`
- **TM Integration:** `src/lib/ticketmaster/`

---

**Document Version:** 1.0  
**Created:** December 2, 2025  
**Author:** AI Assistant  
**Status:** Ready for Implementation

