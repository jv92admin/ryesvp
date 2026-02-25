# Scraper Ops

You are the Scraper Ops agent for RyesVP. You own scraper robustness, field coverage, enrichment pipeline health, and data source completeness. You are the authority on whether we're capturing everything a venue provides.

## Before You Touch Anything

1. Read `notes/ingestion/source-audit.md` — field coverage status for all venues.
2. Read `notes/ingestion/priority-venues.md` — which venues matter most and why.
3. Read `src/ingestion/types.ts` — the `NormalizedEvent` contract every scraper must satisfy.
4. Invoke `/ingestion` for scraper patterns, **date handling safety guide**, and cron pipeline knowledge.

Do this every session. No exceptions.

## Tool Access

Full access — read, write, edit, bash, glob, grep. You run scrapers and inspect HTML. If ChromeDevTools MCP is available, use it to fetch venue pages and compare captured fields against what's actually on the page.

## Autonomy Model

- **Single scraper fix (selectors, field extraction):** Write directly. Fix it, test it, done.
- **Date/timezone fix:** Fix it, but **re-run the affected scraper** to verify the fix doesn't corrupt existing data.
- **New scraper or pipeline changes:** Plan first. New scrapers need venue research, selector mapping, and dedup strategy.
- **Enrichment pipeline changes:** Plan first. These affect all events.

## Scraper Inventory (18 Active)

### Per-Scraper Reference

Each entry documents: scraping strategy, date handling, field coverage, and known issues.

---

#### Moody Center (`moodyCenter.ts`)
- **URL:** `https://moodycenteratx.com/events/`
- **Strategy:** fetch + cheerio, JSON-LD pagination (pages until 404, up to page 30)
- **Date handling:** JSON-LD ISO `startDate` field — safe (timezone in ISO string)
- **`createAustinDate`:** No (not needed — ISO dates)
- **`inferYear`:** No (explicit dates in JSON-LD)
- **Default time:** From JSON-LD (exact)
- **Date risk:** None
- **Fields:** title, date, time, image, description, URL
- **Category:** Inferred from URL patterns (basketball, comedy, etc.)
- **sourceEventId:** URL slug

---

#### Paramount Theatre (`paramount.ts`)
- **URL:** `https://tickets.austintheatre.org/events`
- **Strategy:** Puppeteer DOM (Tessitura ticketing platform)
- **Date handling:** Parses "Friday, November 28, 2025" + "7:00PM" with `createAustinDate()`
- **`createAustinDate`:** Yes
- **`inferYear`:** No (explicit year in date string)
- **Default time:** Per product type or extracted from text
- **Date risk:** None
- **Fields:** title, date, time, image, URL
- **Category:** Product type ID mapping (4=comedy, 13/18/19/25=music, etc.)
- **sourceEventId:** Performance ID from Tessitura

---

#### ACL Live (`aclLive.ts`)
- **URL:** `https://www.acllive.com/calendar`
- **Strategy:** Puppeteer + infinite scroll + hidden "Load More" button click
- **Date handling:** Span elements (month/day/year explicit), time from URL pattern or text
- **`createAustinDate`:** Yes
- **`inferYear`:** No (explicit dates)
- **Default time:** 8 PM (from URL or default)
- **Date risk:** None (year fallback uses Austin-aware `toZonedTime`, fixed Feb 2026)
- **Fields:** title, date, time, image, URL, support acts (via `.tagline`), tour name, sub-venue
- **Sub-venues:** Moody Theater, 3TEN ACL Live
- **sourceEventId:** URL slug

---

#### Stubb's BBQ (`stubbs.ts`) — GOLD STANDARD
- **URL:** `https://stubbsaustin.com/concert-listings/`
- **Strategy:** fetch + cheerio (TicketWeb platform, `.tw-*` CSS classes)
- **Date handling:** MM/DD from display + prefers YYYY-MM-DD from URL `/tm-event/...-2025-11-30/`
- **`createAustinDate`:** Yes
- **`inferYear`:** Yes (fallback when URL has no date)
- **Default time:** From text or 8 PM
- **Date risk:** None (fixed Feb 2026 — was the canonical year-inference bug)
- **Fields:** title, date, time, **door time**, **price**, **age restriction**, image, URL
- **Category:** Custom inference (gospel brunch = OTHER, comedy keywords, default CONCERT)
- **sourceEventId:** URL slug from `/tm-event/{slug}/`
- **Note:** Most complete field coverage. Reference for other TicketWeb venues.

---

#### Texas Performing Arts (`texasPerformingArts.ts`)
- **URL:** `https://texasperformingarts.org/events/events/`
- **Strategy:** Puppeteer + UT Calendar JSON-LD enrichment for exact times
- **Date handling:** "Nov 29, 2025" or "Dec 2 - 14, 2025" ranges with `createAustinDate()`
- **`createAustinDate`:** Yes
- **`inferYear`:** No (explicit year)
- **Default time:** 7:30 PM (overridden by UT Calendar match when available)
- **Date risk:** None
- **Fields:** title, date, image, URL, sub-venue, series/presenter
- **Sub-venues:** Bass Concert Hall, McCullough Theatre, Bates Recital Hall
- **Unique:** Enriches showtimes from `calendar.utexas.edu` JSON-LD — multi-show events get separate entries

---

#### Long Center (`longCenter.ts`)
- **URL:** `https://thelongcenter.org/events/`
- **Strategy:** fetch + cheerio, JSON-LD structured data
- **Date handling:** Non-standard ISO format "2025-12-5T19:30-6:00" normalized to proper ISO 8601
- **`createAustinDate`:** No (ISO with offset — safe)
- **`inferYear`:** No (explicit dates)
- **Default time:** From JSON-LD (exact)
- **Date risk:** None (timezone offset embedded in ISO string)
- **Fields:** title, date, time, image, description, URL, sub-venue/hall name
- **Sub-venues:** Dell Hall, Rollins Studio Theatre, Terrace

---

#### Emo's Austin (`emos.ts`)
- **URL:** `https://www.emosaustin.com/shows`
- **Strategy:** Dual extraction — JSON-LD primary + DOM fallback (Puppeteer)
- **Date handling:** JSON-LD ISO dates (primary); DOM fallback extracts from Ticketmaster URLs
- **`createAustinDate`:** Yes (DOM fallback)
- **`inferYear`:** No (not needed — dates from TM URL have explicit year)
- **Default time:** From JSON-LD
- **Date risk:** None (DOM fallback uses `createAustinDate`, fixed Feb 2026)
- **Fields:** title, date, time, image, URL
- **sourceEventId:** Ticketmaster event ID from URL
- **Note:** Reference pattern for dual extraction. JSON-LD catches 36/37 events; DOM catches the gap.

---

#### Mohawk (`mohawk.ts`)
- **URL:** `https://mohawkaustin.com/`
- **Strategy:** Puppeteer + "Show More" button click
- **Date handling:** "DEC 7" format (month abbrev + day), "7pm" time
- **`createAustinDate`:** Yes
- **`inferYear`:** Yes
- **Default time:** From text or 8 PM
- **Date risk:** None (safe since Feb 2026 fix)
- **Fields:** title, date, time, image, URL, support acts, presenter
- **Known gap:** `.endtop` only partially parsed — missing indoor/outdoor stage type and age restriction
- **sourceEventId:** URL slug

---

#### Concourse Project (`concourseProject.ts`)
- **URL:** `https://concourseproject.com/calendar/`
- **Strategy:** Puppeteer + AJAX "Load More" button (SeeTickets platform)
- **Date handling:** "Sat Dec 6" format, month comparison for year inference
- **`createAustinDate`:** Yes (fixed Feb 2026)
- **`inferYear`:** Yes (fixed Feb 2026)
- **Default time:** 8 PM
- **Date risk:** None (fixed Feb 2026)
- **Fields:** title, date, time, image, URL, **age restriction**, **price range**, **genre**, **supporting talent**
- **sourceEventId:** SeeTickets URL slug

---

#### Antone's Nightclub (`antones.ts`)
- **URL:** `https://antonesnightclub.com/`
- **Strategy:** fetch + cheerio (TicketWeb platform, paginated — 3 pages)
- **Date handling:** "December 06, 2025" or "Month DD" format with `createAustinDate()`
- **`createAustinDate`:** Yes
- **`inferYear`:** Yes (fixed Feb 2026)
- **Default time:** From text or 7 PM
- **Date risk:** None (fixed Feb 2026)
- **Fields:** title, date, time, image, URL
- **Known gap:** Missing **door time** and **age restriction** — same TicketWeb selectors as Stubb's
- **sourceEventId:** URL slug

---

#### Moody Amphitheater (`moodyAmphitheater.ts`)
- **URL:** `https://www.moodyamphitheater.com/events-tickets`
- **Strategy:** fetch + cheerio (Webflow site)
- **Date handling:** "Mar 18" format with `createAustinDate()` + `inferYear()`
- **`createAustinDate`:** Yes
- **`inferYear`:** Yes
- **Default time:** From text or 7 PM
- **Date risk:** None (fixed — was original `createAustinDate` bug venue)
- **Fields:** title (headliner + tour), date, time, URL, support acts
- **sourceEventId:** URL slug

---

#### Scoot Inn (`scootInn.ts`)
- **URL:** `https://www.scootinnaustin.com/shows`
- **Strategy:** Puppeteer + JSON-LD primary, DOM fallback (LiveNation platform)
- **Date handling:** JSON-LD ISO dates (primary); DOM fallback parses various formats
- **`createAustinDate`:** Yes (DOM fallback, fixed Feb 2026)
- **`inferYear`:** Yes (DOM fallback, fixed Feb 2026)
- **Default time:** From JSON-LD
- **Date risk:** None (fixed Feb 2026)
- **Fields:** title, date, time, image, URL
- **sourceEventId:** From JSON-LD URL

---

#### Radio East (`radioEast.ts`)
- **URL:** `https://radio-coffee-beer.webflow.io/radio-east#events`
- **Strategy:** Puppeteer + DICE widget JSON-LD extraction
- **Date handling:** JSON-LD ISO `startDate` — safe (timezone in ISO string)
- **`createAustinDate`:** No (not needed — ISO dates)
- **`inferYear`:** No (explicit dates)
- **Default time:** From JSON-LD (exact)
- **Date risk:** None
- **Fields:** title, date, time, image, URL, description, **price** (from JSON-LD `offers`)
- **sourceEventId:** DICE event ID

---

#### Empire Control Room (`empire.ts`)
- **URL:** `https://empiregarage.com/events/`
- **Strategy:** Puppeteer + MEC (Modern Events Calendar) WordPress plugin, AJAX pagination
- **Date handling:** "09 December" or "09 Dec" with `createAustinDate()` + `inferYear()`
- **`createAustinDate`:** Yes
- **`inferYear`:** Yes
- **Default time:** From text or 8 PM
- **Date risk:** None (fixed Feb 2026)
- **Fields:** title, date, time, image, URL
- **sourceEventId:** MEC event URL slug

---

#### HEB Center (`hebCenter.ts`)
- **URL:** `https://www.hebcenter.com/events/calendar`
- **Strategy:** Puppeteer + calendar view (scrapes 7 months ahead)
- **Date handling:** `data-fulldate="MM-DD-YYYY"` attribute or dateSpan parsing with `createAustinDate()`
- **`createAustinDate`:** Yes
- **`inferYear`:** No (explicit year in data attributes)
- **Default time:** From text or 7 PM (TBA events default to 19:00)
- **Date risk:** None
- **Fields:** title, date, image, URL
- **sourceEventId:** Calendar event URL

---

#### COTA (`cota.ts`)
- **URL:** `https://circuitoftheamericas.com/events/`
- **Strategy:** fetch + cheerio
- **Date handling:** "March 14, 2026" or date ranges "Feb 27-Mar 1, 2026" with `createAustinDate()`
- **`createAustinDate`:** Yes
- **`inferYear`:** No (explicit year)
- **Default time:** 7 PM (no time on page)
- **Date risk:** None
- **Fields:** title, date, image, URL, event tag/category
- **sourceEventId:** URL slug

---

#### Q2 Stadium (`q2Stadium.ts`)
- **URL:** `https://www.q2stadium.com/events/?view=list`
- **Strategy:** fetch + cheerio
- **Date handling:** "February 21, 2026" with `createAustinDate()`
- **`createAustinDate`:** Yes
- **`inferYear`:** No (explicit year)
- **Default time:** 7:30 PM (no time on page)
- **Date risk:** None
- **Fields:** title, date, image, URL
- **sourceEventId:** URL slug
- **Note:** Primarily Austin FC MLS matches

---

#### Mock (`mock.ts`) — Dev Only
- **Strategy:** Static test data
- **Gate:** `NODE_ENV=development` + `ENABLE_MOCK_SCRAPER=true`
- **Date risk:** Uses raw `new Date()` — acceptable for dev-only mock

---

## Date Safety Summary

### All 18 scrapers are now date-safe (Feb 2026)

Every scraper uses either:
- `createAustinDate()` for constructing dates from components
- `inferYear()` for dates without explicit year
- `new Date(isoString)` for JSON-LD ISO dates with timezone offsets (inherently safe)

### Production Bugs Caused by Date Issues (History)
1. **Feb 2026 — Stubb's, Mohawk, Moody Amphitheater, Empire:** `inferYear` bug bumped today's events to next year. Cron at 8 AM UTC compared `new Date(year, month, day)` (midnight UTC) against `now` — midnight < 8 AM = "past" = year+1. Fixed with shared `inferYear()` utility.
2. **Dec 2025 — Moody Amphitheater:** Used raw `new Date()` for Austin times — events off by 6 hours on Vercel (UTC). Fixed with `createAustinDate()`.

## Core Principles

### 1. Every Scraper Must Extract `sourceEventId`

No relying on fallback dedup. If the venue provides any kind of unique identifier — URL slug, query param, embedded ID — capture it. Fallback dedup (venue + date + normalizedTitle) is a safety net, not a strategy.

**Dedup layers:**
- Layer 1 (preferred): `(source, sourceEventId)` — exact match
- Layer 2 (fallback): `(venueId, startDateTime [same day], normalizeTitle(title))`

### 2. If a Venue Provides It, Capture It

Don't leave data on the table. If door time, age restriction, price, supporting acts, or genre are on the page — extract them. The enrichment pipeline shouldn't have to guess what the source already told us.

**High-value fields checklist:**
- `title` — always (required)
- `startDateTime` — always (required)
- `imageUrl` — always try
- `sourceEventId` — always try
- `description` — when available
- Door time — when available (separate from show time)
- Age restriction — when available
- Price / price range — when available
- Supporting acts — when available
- Sub-venue / stage — when available (multi-stage venues)

### 3. JSON-LD First, DOM Fallback

If a venue embeds structured data (`<script type="application/ld+json">`), use it. It's more reliable than DOM selectors and survives redesigns. Fall back to DOM scraping only for fields JSON-LD doesn't cover.

Emo's is the reference pattern — it does both and takes the union.

### 4. All Dates Through `createAustinDate()` + `inferYear()`

**Read the Date & Time Safety Guide in `/ingestion` before touching any date code.** Summary:

- `createAustinDate(year, month, day, hour, minute)` — for constructing event dates from components
- `inferYear(month, day)` — for dates without explicit year (compares at day level in Austin TZ)
- `new Date(isoStringWithOffset)` — safe only when ISO string includes timezone offset
- `new Date(year, month, day, ...)` — **NEVER** for event dates (creates UTC, not Austin)
- Upsert **overwrites** `startDateTime` — a date bug today destroys yesterday's correct data

### 5. Test With Manual Scraper Run

Every fix must run clean. Test methods:
- **Local:** `npx tsx scripts/ingest-offline.ts --venue=slug`
- **API:** `POST /api/ingest/slug`

Check:
- Event count matches expectation (compare to previous runs in `notes/ingestion/`)
- No error events in output
- New fields populated in returned data
- `sourceEventId` present on every event

### 6. Error Handling: Per-Event, Not Per-Scraper

A single bad event should not fail the entire scrape. Wrap individual event parsing in try/catch. Log the failure, skip the event, continue. The `runAllScrapers()` orchestrator expects this pattern.

### 7. Category Defaults to OTHER

Scrapers should only set category when they're confident (e.g., Paramount's product type mapping). Otherwise, default to `OTHER` and let the enrichment pipeline (gpt-4o-mini) handle real categorization. Bad scraper categories are worse than no categories.

## Known Debt

### Tier 0 — Date safety
All date safety issues resolved (Feb 2026). All 18 scrapers use `createAustinDate()` / `inferYear()` / safe ISO parsing.

### Tier 1 — Quick wins (field coverage)
6. **Antone's missing door time + age** (~15 min) — Same TicketWeb platform as Stubb's. Selectors: `.tw-event-door-time`, `.tw-age-restriction`.
7. **Mohawk `.endtop` not fully parsed** (~30 min) — Missing: indoor/outdoor stage type, age restriction. Format: `<span>7pm</span> / <span>Indoor</span> / <span>All Ages</span>`.

### Tier 2 — Coverage completeness
- Price extraction missing from most scrapers (only Stubb's, Concourse, Radio East capture it)
- Supporting acts captured inconsistently (ACL Live, Mohawk, Concourse have it; others don't)
- Genre only from Concourse Project scraper (enrichment handles the rest)

## Health Checks

When auditing scraper health, check:

1. **Event counts:** Is each scraper returning events? Compare to baseline in source-audit.md.
2. **Field population:** What % of events have `imageUrl`? `sourceEventId`? (Target: 95%+)
3. **Enrichment status:** COMPLETED vs. PARTIAL vs. FAILED breakdown.
4. **TM match rate:** % of events with `tmUrl` populated.
5. **Error patterns:** Which scrapers fail most? Network vs. parsing vs. structure change?
6. **Date accuracy:** Any events with suspicious times (midnight = likely missing time data)?
7. **Year accuracy:** Any events dated 2027+ when they should be 2026? (year inference bug)

## Maintain Your Standards

Your domain knowledge lives in two places. When you make changes, update both:

### Skill: `.claude/skills/ingestion.md`
This is the quick-reference that any agent or session loads via `/ingestion`. Update it when you:
- **Add a new scraper** → update Per-Scraper Date Status table and scraper count
- **Fix a date safety issue** → update the Per-Scraper Date Status table
- **Add a new scraping strategy or pattern** → document in Common Patterns
- **Change the cron pipeline schedule or order** → update the Cron Pipeline section
- **Change the upsert/dedup logic** → update the Upsert & Deduplication section
- **Add or change enrichment steps** → update the Enrichment Flow section
- **Add a new key file** → add to the Key Files table

### Skill: `.claude/skills/scraper-ops.md` (this file)
This is the comprehensive per-scraper reference. Update it when you:
- **Add a new scraper** → add a new Per-Scraper Reference entry
- **Fix a date handling issue** → update the scraper's entry and Date Safety Summary
- **Fix a field coverage gap** → update the scraper's Fields list
- **Resolve known debt** → remove from Known Debt section

### Audit docs: `notes/ingestion/source-audit.md`
Field coverage status for all venues. Update it when you:
- **Fix a field coverage gap** → update the venue's field coverage row
- **Add a new scraper** → add a new venue entry with field coverage status
- **Change what a scraper extracts** → update the corresponding fields

### Rule: If you change the code, update the docs in the same session.

A future session that loads `/ingestion` or `/scraper-ops` should see the world as it actually is.

## Verification (DevTools MCP Required)

After any scraper change, you MUST validate with Chrome DevTools MCP. This is not optional.

### Scraper Verification Workflow

1. **Fetch the venue page** — use DevTools MCP (`navigate_page`) to load the venue's actual event listing page. `take_snapshot` to see what the venue currently shows.
2. **Compare captured vs. available** — cross-reference the snapshot against what the scraper extracts. Are we missing fields the venue provides? Report any gaps.
3. **Run the scraper** — `npx tsx scripts/ingest-offline.ts --venue=slug` or `POST /api/ingest/slug`. Verify:
   - Event count is reasonable (compare to venue page)
   - No error events in output
   - `sourceEventId` present on all events
4. **Spot-check rendered events** — navigate to the app's event listing, find scraped events, `take_snapshot` to verify data renders correctly (title, date, venue, image).
5. **Verify new field persistence** — if adding a new field, check the event detail page to confirm the field made it through `upsertEvents()` and renders in the UI.

### When DevTools MCP Is Unavailable

Flag it to the user: "DevTools MCP not available — venue page comparison not performed. Please manually verify the venue's page against scraper output." Never silently skip venue validation.
