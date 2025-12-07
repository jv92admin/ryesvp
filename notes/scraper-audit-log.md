# Scraper Audit Log

Tracking scraper reviews, fixes, and status.

---

## 2025-12-06: ACL Live

**Status:** ✅ Fixed

**Issue:** Scraper was stopping too early (32 events through Feb 2026 instead of 71+ through Nov 2026)

**Root Cause:**
1. ACL Live uses infinite scroll with a hidden "Load More" button
2. Scroll triggers lazy loading, but stops after ~36 events
3. A hidden `#loadMoreEvents` button exists in DOM that loads the remaining events
4. Original scraper never clicked this button

**Fix Applied:**
- Hybrid approach: scroll → wait 3s for spinner → if stuck, click hidden button
- Button click loads 35+ more events in one go
- Added fallback date parsing for edge cases:
  - `"DECEMBER 12 & 14, 2025"` (multi-day events → use first date)
  - `"THURSDAY APRIL 2, 2026"` (day name prefix)

**Result:**
- Before: 32 events, through Feb 2026
- After: **73 events, through Dec 2026** (ingested 2025-12-06)

**Files Changed:**
- `src/ingestion/sources/aclLive.ts`

**Future Enhancement:**
- Scrape venue metadata from `/plan-your-visit/know-before-you-go` (address, phone, policies, parking info)

---

---

## 2025-12-06: Stubb's

**Status:** ✅ Verified (no fix needed)

**Finding:** Stubb's only has 20 events through May 2026. This is correct - it's a smaller venue that doesn't announce as far out as larger venues.

**Result:** 18 → 20 events

---

## 2025-12-07: Antone's Nightclub

**Status:** ✅ New scraper created

**URL:** `https://antonesnightclub.com/`

**Structure:**
- Paginated list (3 pages)
- Events in `.tw-section.tw-section--list` containers
- Date in `.tw-event-date` (format: "December 06, 2025")
- Time in `.tw-event-time` (format: "8:00pm")
- Title/link in `.tw-name a`
- Images in `.tw-image img`
- Ticket links in `.tw-buy-tix-btn`

**Implementation:** fetch + cheerio (no Puppeteer needed)

**Result:** **57 events** through May 2026

**Files Created:**
- `src/ingestion/sources/antones.ts`

---

## 2025-12-07: Scoot Inn

**Status:** ✅ New scraper created

**URL:** `https://www.scootinnaustin.com/shows`

**Structure:**
- LiveNation venue-sites platform (JS-rendered)
- JSON-LD embedded in page after render
- Events in `script[type="application/ld+json"]` with `@type: "MusicEvent"`

**Implementation:** Puppeteer + JSON-LD extraction (tries JSON-LD first, DOM fallback)

**Result:** **13 events** through May 2026

**Files Created:**
- `src/ingestion/sources/scootInn.ts`

---

## 2025-12-07: Moody Amphitheater (Waterloo Park)

**Status:** ✅ New scraper created

**URL:** `https://www.moodyamphitheater.com/events-tickets`

**Structure:**
- Single page list (no pagination visible)
- Events in `.collection-item.w-dyn-item` containers
- Date split: `.date-weekday`, `.date-month`, `.date-day`
- Time in `.event-time`
- Title in `.event-headliner` + `.event-title` (tour name)
- Support acts in `.event-support`
- Ticket links to Ticketmaster

**Implementation:** fetch + cheerio (no Puppeteer needed)

**Result:** **9 events** through May 2026

**Note:** Only 9 events currently listed. No pagination visible with this small dataset. If event count grows significantly, may need to revisit for pagination handling.

**Files Created:**
- `src/ingestion/sources/moodyAmphitheater.ts`

---

## 2025-12-06: Full Coverage Audit

All venues verified healthy:

| Venue | Events | Latest | Status |
|-------|--------|--------|--------|
| Paramount | 102 | 2026-06-18 | ✅ Healthy |
| ACL Live | 73 | 2026-12-01 | ✅ Fixed |
| Moody Center | 69 | 2026-11-09 | ✅ Healthy |
| Long Center | 59 | 2026-05-30 | ✅ Healthy |
| Antone's | 57 | 2026-05-17 | ✅ NEW |
| Mohawk | 37 | 2026-05 | ✅ NEW |
| Bass Concert Hall | 37 | 2031-01-31 | ✅ Healthy (includes far-future bookings) |
| Emo's | 36 | 2026-05 | ✅ NEW (fixed image bug) |
| Concourse Project | 25 | 2026-03 | ✅ NEW |
| Stubb's | 20 | 2026-05-03 | ✅ Healthy (smaller venue) |
| Scoot Inn | 13 | 2026-05-15 | ✅ NEW |
| Moody Amphitheater | 9 | 2026-05-29 | ✅ NEW |
| McCullough | 4 | 2026-01-25 | ✅ Sub-venue of TPA |
| Bates Recital | 2 | 2026-02-28 | ✅ Sub-venue of TPA |

**Total: ~545 future events across 14 venues**

---

## Future Enhancement: Venue Metadata Scraping

Many venues have "Know Before You Go" / FAQ pages with valuable metadata we should capture:

### ACL Live Example
**URL:** `https://www.acllive.com/plan-your-visit/know-before-you-go`

**Available Data:**
- Address: `310 West Willie Nelson Boulevard, Austin, Texas 78701`
- Phone: `512.404.1300`
- Email: `info@acllive.com`
- Policies:
  - Bag policy (no backpacks >11"x17")
  - Cashless venue
  - Re-entry policy
  - Age policy (children >1 need ticket)
  - Photography rules
- Parking/transportation info
- Accessibility info

### Implementation Plan
1. Add `Venue` model fields: `infoUrl`, `address`, `phone`, `email`, `policies` (JSON)
2. Create simple scraper that extracts text from FAQ sections
3. Store as structured JSON for display in app
4. Could enhance event detail pages with "Venue Info" section

### Other Venues to Check
- Moody Center: likely has similar page
- Stubb's: smaller venue, may be simpler
- Long Center: Austin symphony, likely detailed
- Paramount: historic venue, probably good info

**Priority:** Phase 1.3 or later (nice-to-have, not blocking)

---

## Debug Tools Created

- `scripts/debug/test-scraper.ts` - Run any scraper without DB writes
- `scripts/audit-event-coverage.ts` - Check event counts & date ranges per venue

