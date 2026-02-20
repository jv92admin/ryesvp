# Scraper Ops Audit

> **Date:** 2026-02-19
> **Auditor:** Scraper Ops Agent
> **Scope:** All 17 venue scrapers, orchestrator, upsert, enrichment pipeline, date utilities
> **Files Reviewed:** 25 source files across `src/ingestion/`, `src/lib/enrichment/`, `src/app/api/cron/`

---

## Blockers (Must Fix)

### 1. Moody Center: `new Date()` on JSON-LD ISO strings instead of `createAustinDate()`

**File:** `src/ingestion/sources/moodyCenter.ts:60-61`

```ts
const startDateTime = new Date(item.startDate);
const endDateTime = item.endDate ? new Date(item.endDate) : null;
```

**What's wrong:** Uses raw `new Date()` on ISO strings from JSON-LD. If the JSON-LD string includes a timezone offset (e.g., `-06:00`), this works correctly. But if the string lacks a timezone (e.g., `2026-03-15T19:30:00`), `new Date()` interprets it as UTC on Vercel servers, producing a 6-hour offset. This is the exact same class of bug that was fixed in Moody Amphitheater.

**What it should be:** Parse components and use `createAustinDate()`, or verify that Moody Center's JSON-LD always includes timezone offset.

### 2. Emo's: `new Date()` used extensively without timezone handling

**File:** `src/ingestion/sources/emos.ts:123, 197, 313, 317, 327, 331`

Multiple locations use raw `new Date()`:

- **Line 123:** `const startDateTime = new Date(item.startDate);` -- JSON-LD extraction, same risk as Moody Center.
- **Line 197:** `const startDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));` -- DOM extraction constructs a date with `new Date(year, month, day)` which uses the server's local time, not Austin time. On Vercel (UTC), this creates midnight UTC which is 6 PM the day before in Austin.
- **Lines 313, 317, 327, 331:** The `parseEmosDate` function uses raw `new Date()` throughout, though this function is dead code (see Suggestion #3).

**What it should be:** Import and use `createAustinDate()` for all locally-constructed dates. For JSON-LD ISO strings with timezone offsets, `new Date()` is acceptable.

### 3. Scoot Inn: `new Date()` on JSON-LD without timezone safety

**File:** `src/ingestion/sources/scootInn.ts:58, 163, 167, 177, 181, 191, 194`

- **Line 58:** `startDateTime: new Date(item.startDate)` -- Same JSON-LD issue as Moody Center and Emo's.
- **Lines 163-194:** The `parseScootInnDate` fallback function uses raw `new Date()` to construct dates from month/day strings, which will be interpreted as server-local time (UTC on Vercel).

**What it should be:** Use `createAustinDate()` for all manually-constructed dates. Verify JSON-LD strings include timezone offsets.

### 4. Radio East: `new Date()` on JSON-LD without timezone safety

**File:** `src/ingestion/sources/radioEast.ts:107`

```ts
const startDate = new Date(item.startDate);
```

**What it should be:** Same fix as above. DICE JSON-LD likely includes timezone offsets, but this should be verified and, if not, parsed through `createAustinDate()`.

### 5. Long Center: `new Date()` fallback without timezone safety

**File:** `src/ingestion/sources/longCenter.ts:54`

```ts
return new Date(dateStr);
```

The `parseLongCenterDate` function has a proper ISO parsing path (line 49) that handles timezone offsets correctly, but the fallback on line 54 uses raw `new Date(dateStr)` which may interpret ambiguous strings as UTC.

**What it should be:** The fallback should either reject the string or parse it through a timezone-aware path.

### 6. Concourse Project: `new Date()` constructs server-local dates

**File:** `src/ingestion/sources/concourseProject.ts:146`

```ts
startDateTime = new Date(year, monthIndex, parseInt(day, 10), hours, minutes, 0);
```

**What's wrong:** Constructs dates using `new Date(year, month, day, hour, minute)` which creates a date in the server's local timezone. On Vercel (UTC), this means an event at "9:00 PM" becomes 9:00 PM UTC = 3:00 PM Austin time.

**What it should be:** `createAustinDate(year, monthIndex, parseInt(day, 10), hours, minutes)`.

### 7. Concourse Project: Unreachable code after `break`

**File:** `src/ingestion/sources/concourseProject.ts:79`

```ts
break;

loadMoreAttempts++;  // <-- This line is never executed
```

**What's wrong:** After the `break` statement on line 77 (when Load More button is not found), the `loadMoreAttempts++` on line 79 is dead code. This means the while loop only increments `loadMoreAttempts` via the `continue` path (line 73). If the button disappears but `clicked` was true on the last iteration, the loop exits via `break` correctly, so this is functionally harmless but is still dead code that indicates a logic error.

**What it should be:** Remove the dead line. The loop termination logic should be reviewed.

### 8. TPA UT Calendar enrichment: `new Date()` on JSON-LD dates

**File:** `src/ingestion/sources/texasPerformingArts.ts:417`

```ts
const startDate = new Date(item.startDate);
```

**What's wrong:** The UT Calendar JSON-LD dates are parsed with raw `new Date()`. If the ISO string includes `-06:00` offset, this is fine. If it doesn't, times will be wrong.

**What it should be:** Verify the UT Calendar JSON-LD always includes timezone offsets, or parse through `createAustinDate()`.

---

## Field Coverage Gaps

### NormalizedEvent Type Limitations

The `NormalizedEvent` interface lacks fields for door time, age restriction, price, supporting acts, genre, and sub-venue. Scrapers that capture these must stuff them into the `description` string, which:
- Makes the data unstructured and unsearchable
- Requires regex parsing to extract later
- Mixes user-facing description with machine-readable metadata

| Venue | Field | Available on page? | Currently captured? | How captured |
|-------|-------|--------------------|--------------------|----|
| **Antone's** | Door time | Yes (`.tw-event-door-time`) | **No** | -- |
| **Antone's** | Age restriction | Yes (`.tw-age-restriction`) | **No** | -- |
| **Antone's** | Price | Yes (`.tw-price`) | **No** | -- |
| **Stubb's** | Door time | Yes | Yes | `description` string |
| **Stubb's** | Age restriction | Yes | Yes | `description` string |
| **Stubb's** | Price | Yes | Yes | `description` string |
| **Mohawk** | Indoor/Outdoor stage | Yes (`.endtop` 2nd segment) | **No** | -- |
| **Mohawk** | Age restriction | Yes (`.endtop` 3rd segment) | **No** | -- |
| **Mohawk** | Supporting acts | Yes (`.supports`) | Extracted but unused | Not in output |
| **Concourse Project** | Age restriction | Yes (`.ages`) | Yes | `description` string |
| **Concourse Project** | Price range | Yes (`.price`) | Yes | `description` string |
| **Concourse Project** | Genre | Yes (`.genre`) | Used for category only | Not persisted |
| **Concourse Project** | Supporting acts | Yes (`.supporting-talent`) | Yes | `description` string |
| **Radio East** | Price | Yes (JSON-LD `offers`) | Extracted but not in output | Variable `priceInfo` is computed but never added to the event |
| **Emo's** | JSON-LD `performer` | Possibly | **No** | Not checked |
| **Emo's** | JSON-LD `offers` | Possibly | **No** | Not checked |
| **Scoot Inn** | JSON-LD `performer` | Possibly | **No** | Not checked |
| **Scoot Inn** | JSON-LD `offers` | Possibly | **No** | Not checked |
| **Moody Center** | JSON-LD `performer` | Possibly | **No** | Not checked |
| **Moody Center** | JSON-LD `offers` | Possibly | **No** | Not checked |
| **Long Center** | JSON-LD `performer` | Possibly | **No** | Not checked |
| **Long Center** | JSON-LD `offers` | Possibly | **No** | Not checked |
| **ACL Live** | Tagline/support acts | Yes (`.tagline`) | Yes | `description` string |
| **Moody Amphitheater** | Support acts | Yes (`.event-support`) | Yes | Appended to title |
| **Moody Amphitheater** | Image | On page | **No** | `imageUrl` is never extracted |
| **Empire** | Time | Likely on detail page | **No** | Defaults to 8 PM |
| **HEB Center** | Time | Some events have it | Partial | Falls back to 7 PM for TBA |
| **COTA** | Time | Not on listing page | **No** | Defaults to 7 PM |
| **Q2 Stadium** | Time | Not on listing page | **No** | Defaults to 7:30 PM |

### Radio East Price Extraction Bug

**File:** `src/ingestion/sources/radioEast.ts:142-151`

The scraper extracts `priceInfo` from JSON-LD `offers` but never includes it in the `NormalizedEvent` output. The variable is computed and then discarded:

```ts
let priceInfo: string | undefined;
if (item.offers && item.offers.length > 0) {
  const price = item.offers[0].price;
  if (price === 0) { priceInfo = 'Free'; }
  else if (price) { priceInfo = `$${price}`; }
}
// priceInfo is never added to the event object
```

### Moody Amphitheater Missing Image

The scraper does not extract `imageUrl` at all. The event object is pushed without it, unlike most other scrapers.

---

## Enrichment Pipeline Issues

### 1. No structured field passthrough from scrapers to enrichment

The enrichment pipeline (`src/lib/enrichment/index.ts`) operates on `Event` records from the database. Since `NormalizedEvent` has no fields for door time, price, age, genre, or supporting acts, and the Event schema likewise lacks them, the enrichment pipeline has no way to benefit from scraper-extracted metadata. Everything valuable that scrapers capture gets stuffed into `description` and is invisible to enrichment.

**Impact:** The LLM categorization step re-infers what scrapers already knew. Concourse Project knows genre is "DJ/Dance" but the enrichment LLM has to guess it from the title.

### 2. Enrichment only runs on events without enrichment records

`getEventsToEnrich()` selects events where `enrichment` is null, FAILED (with retryCount < 3), or PENDING. Once an event reaches COMPLETED or PARTIAL status, it is never re-enriched even if the event's title/description changes during a scraper re-run.

**Impact:** If a scraper updates an event's title (e.g., support acts added), the enrichment record becomes stale. The `upsertEvents()` function updates the event but does not reset the enrichment status.

### 3. TM match uses `gpt-4o` for low-similarity matches

**File:** `src/app/api/cron/tm-match/route.ts:79`

The TM match job uses `gpt-4o` (not `gpt-4o-mini`) for disambiguation. The enrichment LLM uses `gpt-4o-mini`. The TM match is more expensive per call and could use the mini model since the task (title matching) is simpler than categorization.

### 4. Enrichment batch processes only 50 events by default

With ~700+ events in the database and new events being added regularly, a batch size of 50 may cause a backlog if many events arrive at once (e.g., after adding a new scraper). There is no catchup mechanism besides running the cron job repeatedly.

### 5. No re-enrichment trigger when scraper data changes

When `upsertEvents()` updates an existing event (new title, new description, etc.), the enrichment record is not invalidated. The event could have meaningfully changed but the stale enrichment persists.

---

## Upsert Dedup Edge Cases

### 1. Fallback dedup restricted to same `source`

**File:** `src/ingestion/upsert.ts:69`

```ts
where: {
  venueId: venue.id,
  startDateTime: { gte: startOfDay, lte: endOfDay },
  source: event.source,
},
```

The fallback dedup (Strategy 2) only matches events with the same `source`. Since all venue scrapers use `EventSource.VENUE_WEBSITE`, this is currently fine. But if a second source (e.g., Ticketmaster) were added for the same venue, the same event from two sources would not deduplicate via Strategy 2.

**Risk:** Low currently (single source per venue), but worth noting for future multi-source support.

### 2. Category overwrite protection is one-directional

**File:** `src/ingestion/upsert.ts:97-101`

```ts
const { category: _scrapedCategory, ...updateData } = eventData;
await prisma.event.update({
  where: { id: existingEvent.id },
  data: updateData,  // Don't overwrite category on existing events
});
```

On update, the scraper's category is intentionally discarded to preserve LLM-enriched categories. However, this means if a scraper correctly identifies a specific category (e.g., Paramount's product type mapping to COMEDY), that information is lost on subsequent scraper runs for existing events. Only the first create honors the scraper's category.

### 3. No batch/transaction for upsert

Each event is upserted individually with separate Prisma calls (findUnique, findMany, then create/update). For ~700 events, this means ~1400-2100 database round-trips. There is no transaction wrapping, so a failure mid-batch could leave partial results. Using `prisma.$transaction` with batch operations would be more efficient and atomic.

### 4. sourceEventId uniqueness relies on scraper consistency

The unique constraint `@@unique([source, sourceEventId])` requires scrapers to produce stable `sourceEventId` values across runs. If a scraper changes how it generates the ID (e.g., COTA uses a URL-derived slug that could change if COTA restructures URLs), existing events would be duplicated rather than updated.

---

## Suggestions (Should Fix)

### 1. Add structured metadata fields to NormalizedEvent

**Files:** `src/ingestion/types.ts`, `prisma/schema.prisma`

Add optional fields to `NormalizedEvent` and the Event schema:
```ts
doorTime?: string | null;
ageRestriction?: string | null;
priceRange?: string | null;
supportingActs?: string | null;
subVenue?: string | null;
genre?: string | null;
```

This would allow structured extraction instead of stuffing everything into `description`.

**Priority:** HIGH -- enables all the field coverage gaps to be properly captured.

### 2. Fix Antone's missing door time, age, and price extraction

**File:** `src/ingestion/sources/antones.ts`

Antone's uses the same TicketWeb platform as Stubb's. Add selectors:
- `.tw-event-door-time` for door time
- `.tw-age-restriction` for age restriction
- `.tw-price` for price info

Estimated effort: 15 minutes. Already documented in agent file as Tier 1 quick win.

### 3. Remove dead code: `parseEmosDate` in emos.ts

**File:** `src/ingestion/sources/emos.ts:309-340`

The `parseEmosDate` function is defined but never called anywhere in the codebase. Remove it.

### 4. Remove unused imports

- `src/ingestion/sources/concourseProject.ts:5` -- imports `parseDate` from `dateParser` but never uses it
- `src/ingestion/sources/stubbs.ts:4` -- imports `inferCategory` from `dateParser` but uses local `inferStubbsCategory` instead

### 5. Fix Radio East price extraction to include in output

**File:** `src/ingestion/sources/radioEast.ts:142-163`

The `priceInfo` variable is computed but never added to the event's description. Add it:
```ts
description: [item.description, priceInfo].filter(Boolean).join(' | '),
```

### 6. Parse Mohawk `.endtop` fully for indoor/outdoor and age

**File:** `src/ingestion/sources/mohawk.ts:91-92`

Currently:
```ts
const endtop = $item.find('.endtop').text().trim();
const [timeStr] = endtop.split('/').map(s => s.trim());
```

Should extract all three segments:
```ts
const endtopParts = endtop.split('/').map(s => s.trim());
const [timeStr, stageType, ageRestriction] = endtopParts;
```

Estimated effort: 30 minutes. Already documented as Tier 2 debt.

### 7. Add image extraction to Moody Amphitheater scraper

**File:** `src/ingestion/sources/moodyAmphitheater.ts`

The scraper does not extract `imageUrl` from the event cards. Most other scrapers do. Check the page structure for image elements and add extraction.

### 8. Standardize category inference approach

Several scrapers implement their own `inferCategory` / `inferEventCategory` functions with overlapping but inconsistent logic:
- `moodyCenter.ts` -- `inferCategoryFromUrl()`
- `aclLive.ts` -- `inferEventCategory()`
- `stubbs.ts` -- `inferStubbsCategory()`
- `emos.ts` -- `inferEventCategory()`
- `mohawk.ts` -- `inferCategory()`
- `antones.ts` -- `inferCategory()`
- `moodyAmphitheater.ts` -- `inferCategory()`
- `scootInn.ts` -- `inferCategory()`
- `hebCenter.ts` -- `categorizeHEBEvent()`
- `cota.ts` -- `categorizeCOTAEvent()`
- `q2Stadium.ts` -- `categorizeQ2Event()`
- `texasPerformingArts.ts` -- `inferTPACategory()`
- `utils/dateParser.ts` -- `inferCategory()`

There are 13 different category inference functions with slightly different keyword sets and logic. Per the agent principles (Section 7), scrapers should default to `OTHER` unless they have high-confidence signals (like Paramount's product type IDs or COTA's event tags). Most of these `inferCategory` functions are doing low-confidence keyword matching that the enrichment LLM does better.

**Recommendation:** For music venues (Emo's, Mohawk, Antone's, Scoot Inn, Moody Amphitheater), just default to `EventCategory.CONCERT`. For multi-category venues, keep the inference but simplify. Remove the shared `inferCategory` from `dateParser.ts` since it conflates date parsing with category inference.

### 9. Consolidate date utilities

**File:** `src/ingestion/utils/dateParser.ts`

This utility file contains:
- `parseMoodyCenterDate()` -- not used by the Moody Center scraper (which has its own JSON-LD parser)
- `parseDate()` -- only imported by Concourse Project but never called
- `inferCategory()` -- imported by 3 scrapers (Paramount, Stubb's, Radio East) but only Paramount and Radio East actually call it

The file is a legacy artifact from early development. The useful `inferCategory` should be kept (or moved to a proper shared location), but the dead date parsers should be removed.

### 10. Antone's pagination is hardcoded to 3 pages

**File:** `src/ingestion/sources/antones.ts:24-28`

```ts
const pages = [
  baseUrl,
  `${baseUrl}/page/2/`,
  `${baseUrl}/page/3/`,
];
```

If Antone's adds a 4th page, events will be missed. The scraper should paginate dynamically until a 404 is received (the 404 handling code already exists on line 43 but never triggers because the loop is fixed).

**Recommendation:** Loop from page 1 upward, breaking on 404, instead of hardcoding page count.

### 11. Orchestrator runs scrapers sequentially

**File:** `src/ingestion/orchestrator.ts:133`

```ts
for (const scraper of scrapers) {
  // ...
  const events = await scraper.fn();
}
```

All 17 scrapers run sequentially. Fetch-based scrapers (Moody Center, Stubb's, Antone's, Moody Amphitheater, COTA, Q2 Stadium, Long Center) could run in parallel since they don't use Puppeteer. Puppeteer scrapers should remain sequential to avoid browser resource contention.

**Estimated savings:** 30-60 seconds per cron run (fetch scrapers complete in 2-5s each).

### 12. Scrape cron route does not support individual scraper runs

**File:** `src/app/api/cron/scrape/route.ts`

The scrape cron route calls `runAllScrapers()` with no option to run a single scraper. The `runScraper()` function exists in orchestrator.ts and is used by `src/app/api/ingest/[source]/route.ts`, but the cron route only runs all scrapers. The agent definition says to test with `POST /api/cron/scrape?name=venue-slug` but this is not implemented in the cron route.

### 13. TPA date range filtering uses server-local time

**File:** `src/ingestion/sources/texasPerformingArts.ts:507-510`

```ts
const rangeStart = new Date(start);
rangeStart.setHours(0, 0, 0, 0);
const rangeEnd = end ? new Date(end) : new Date(start);
rangeEnd.setHours(23, 59, 59, 999);
```

`setHours()` operates in server-local time. On Vercel (UTC), "start of day" and "end of day" are in UTC, not Austin time. This could cause UT Calendar times near midnight to be filtered out incorrectly.

### 14. Empire scraper defaults all events to 8 PM

**File:** `src/ingestion/sources/empire.ts:208`

Empire's MEC listing only shows dates ("09 December"), not times. The scraper defaults to 8 PM. Empire's event detail pages likely have actual times, but scraping detail pages for each event would add significant load. This is an acceptable tradeoff, but should be noted -- enrichment via TM match may provide actual times.

### 15. `sourceEventId` extraction inconsistencies

Different scrapers produce IDs in different formats with no naming convention:

| Scraper | sourceEventId Format | Example |
|---------|---------------------|---------|
| Moody Center | Numeric from URL | `123` |
| Paramount | Tessitura performance number | `12345` |
| ACL Live | URL slug | `2025-11-28-bob-schneider...` |
| Stubb's | URL slug | `gospel-brunch-2025-11-30` |
| Antone's | `antones-{slug}` | `antones-keller-williams` |
| Mohawk | Query param ID | `-2852852648592801188` |
| Emo's (JSON-LD) | identifier or URL tail | varies |
| Emo's (DOM) | TM event ID | `A1B2C3D4E5` |
| Concourse | Full URL | `https://concourseproject.com/...` |
| Scoot Inn | `scoot-inn-{slug}` | `scoot-inn-12345` |
| Empire | `empire-{id or slug}` | `empire-12345` |
| HEB Center | `heb-center-{slug}` | `heb-center-texas-stars-vs-...` |
| COTA | `cota-{url-hash}` | `cota-circuitoftheamericas-com-...` |
| Q2 Stadium | `q2-stadium-{slug}` | `q2-stadium-austin-fc-vs-...` |
| Long Center | `@id` from JSON-LD | varies |
| TPA | `tpa-{slug}` | `tpa-stomp-2026-bass-concert-hall...` |
| Moody Amphitheater | `moody-amp-{slug}` or `tm-{id}` | `moody-amp-miguel` |
| Radio East | URL tail slug | `event-slug-name` |

This is not a bug, but the lack of a naming convention makes debugging and cross-referencing harder. Prefixed formats (like `antones-`, `empire-`, `tpa-`) are easier to identify at a glance.

---

## Good Practices Observed

### 1. Per-event error handling is consistent

Every scraper wraps individual event parsing in try/catch blocks. A single bad event does not crash the entire scraper. This follows the agent principle #6 exactly. Examples: `paramount.ts:134`, `aclLive.ts:208`, `mohawk.ts:143`.

### 2. Stubb's is genuinely the gold standard

The Stubb's scraper (`stubbs.ts`) extracts door time, price, age restriction, uses `createAustinDate()` correctly, has proper `sourceEventId` extraction, and uses per-event error handling. It should be the template for Antone's fixes.

### 3. Emo's dual extraction (JSON-LD + DOM) is the right pattern

The Emo's scraper uses JSON-LD as primary source and DOM parsing as fallback, with deduplication between the two. This catches events that one method misses.

### 4. `createAustinDate()` is used correctly in most newer scrapers

Scrapers written later in the project (Paramount, ACL Live, Mohawk, Stubb's, Antone's, Moody Amphitheater, Empire, HEB Center, COTA, Q2 Stadium) all use `createAustinDate()` for manually-constructed dates. The timezone bug pattern is concentrated in the JSON-LD scrapers that parse ISO strings.

### 5. Orchestrator has robust scraper-level error isolation

`orchestrator.ts:133-155` wraps each scraper in try/catch and records errors per-scraper without stopping the pipeline. A failing scraper produces an empty result set, not a crashed cron job.

### 6. Upsert dedup is well-layered

The two-tier dedup strategy (sourceEventId first, then venue+date+title fallback) provides good coverage. The `normalizeTitle()` function in `types.ts` strips punctuation and normalizes whitespace, which handles minor title variations well.

### 7. TPA UT Calendar enrichment is sophisticated

The Texas Performing Arts scraper cross-references its own listings against UT Calendar JSON-LD to get actual performance times, splitting multi-show events into separate entries. This is a well-designed enrichment-at-scrape-time pattern.

### 8. Category preservation on update

The upsert logic intentionally skips category updates on existing events (`upsert.ts:97`) to preserve LLM-enriched categories. This prevents scraper defaults from overwriting better data.

### 9. Long Center JSON-LD typing

The Long Center scraper defines a `JsonLdEvent` interface for type-safe JSON-LD parsing, which is better than the untyped `JSON.parse()` approach used by other scrapers.

---

## Summary

### Overall Assessment

The ingestion system is **functional and well-structured** with 17 active scrapers covering 19 venues and ~700+ events. The orchestrator, upsert, and enrichment pipeline work correctly as a daily 3-stage cron job. Error handling is consistent and robust.

### Critical Issues (3)

The primary risk is **timezone handling in JSON-LD scrapers**. Five scrapers (Moody Center, Emo's, Scoot Inn, Radio East, Long Center fallback) use raw `new Date()` on ISO strings that may or may not include timezone offsets. One scraper (Concourse Project) constructs dates with `new Date(year, month, day)` which uses server-local time. These are the same class of bug that was already fixed in Moody Amphitheater. The fix is straightforward: use `createAustinDate()` consistently.

### Data Quality Gaps (2)

1. **NormalizedEvent lacks structured metadata fields.** Door time, price, age restriction, supporting acts, and genre are either lost or stuffed into description strings. Adding these fields to the type and schema would unlock significant data quality improvements.

2. **Antone's is the most impactful quick win.** It's the same TicketWeb platform as Stubb's (the gold standard) but misses door time, age, and price. 15-minute fix for a meaningful improvement.

### Architecture Observations

- The scraper system has significant code duplication (13 separate category inference functions, repeated date parsing logic). A shared utility layer would reduce maintenance burden.
- The enrichment pipeline and scrapers are decoupled by design, which is correct, but there's no mechanism to re-enrich events when scraper data changes.
- Sequential scraper execution adds unnecessary latency; parallel execution of fetch-based scrapers would save 30-60 seconds.

### Recommended Priority Order

1. **Fix timezone issues** in Moody Center, Emo's (DOM path), Scoot Inn, Concourse Project (BLOCKERS)
2. **Verify JSON-LD timezone offsets** for Moody Center, Emo's (JSON-LD path), Scoot Inn, Radio East, Long Center, TPA
3. **Add Antone's door/age/price** (15-min quick win)
4. **Fix Radio East price extraction** (5-min fix -- priceInfo is computed but not included)
5. **Parse Mohawk .endtop fully** (30-min improvement)
6. **Add structured metadata fields** to NormalizedEvent and Event schema (larger effort, enables future work)
7. **Clean up dead code** and unused imports
8. **Standardize category inference** (default to OTHER, let enrichment LLM handle it)
