# Source Data Audit

> What data is available from each venue source, what we capture, and gaps.
> 
> **Last Updated:** February 23, 2026
> **Purpose:** Inform scraper enhancements and venue info collection
> **Phase:** 1.3 of Event Discovery

---

## Summary Table

| Venue | Captures | Missing (Available) | Platform | Notes |
|-------|----------|---------------------|----------|-------|
| **Moody Center** | title, date, time, image, desc, url | - | JSON-LD | ✅ Good coverage |
| **ACL Live** | title, date, time, image, desc, url, support | - | Puppeteer | ✅ Has tagline for support acts |
| **Paramount** | title, date, time, image, url | - | Puppeteer | Tessitura ticketing |
| **Stubb's** | title, date, time, door, price, age, image, url | - | TicketWeb | ✅ **Most complete** |
| **Antone's** | title, date, time, image, url | **door time, age** | TicketWeb | Same platform as Stubb's |
| **Mohawk** | title, date, time, image, url, support | **indoor/outdoor, age** | Puppeteer | Has `.endtop` with venue+age |
| **Emo's** | title, date, time, image, url | - | JSON-LD + DOM | LiveNation site |
| **Long Center** | title, date, time, image, desc, url, sub-venue | - | JSON-LD | Has hall name |
| **Texas Performing Arts** | title, date, image, url, sub-venue, series | - | Puppeteer | Multiple venues |
| **Moody Amphitheater** | title, date, time, url, support | - | fetch | ⚠️ TZ fixed |
| **Scoot Inn** | title, date, time, image, url | - | JSON-LD | LiveNation site |
| **Concourse Project** | title, date, time, image, url, age, price, genre, support | - | Puppeteer | ✅ **Very complete** |
| **Radio East** | title, date, time, image, url, desc, price | - | DICE JSON-LD | Has price from offers |
| **Empire** | title, date, time, image, url | - | Puppeteer MEC | |
| **HEB Center** | title, date, image, url | time (calendar view) | Puppeteer | |
| **COTA** | title, date, image, url, tag | time | fetch | Defaults to 7 PM |
| **Q2 Stadium** | title, date, image, url | time | fetch | Defaults to 7:30 PM |

---

## Detailed Findings

### Antone's Nightclub ⚠️ HAS UNCAPTURED DATA

**Source URL:** https://antonesnightclub.com/  
**Scraper:** `antones.ts` (fetch + cheerio)  
**Platform:** TicketWeb

**Currently Captures:**
- ✅ Title (`.tw-name a`)
- ✅ Date (`.tw-event-date`)
- ✅ Time (`.tw-event-time`)
- ✅ Image (`.tw-image img`)
- ✅ Event URL

**Available But NOT Captured:**
- ❌ **Door time** - `.tw-event-door-time` (e.g., "7:00pm")
- ❌ **Age restriction** - `.tw-age-restriction` (e.g., "18 and up", "21 and up")

**HTML Evidence:**
```html
<span class="tw-event-door-time-complete">(Doors: <span class="tw-event-door-time">7:00pm</span>)</span>
<div class="tw-age-restriction">21 and up</div>
```

**Enhancement Priority:** HIGH - easy to add, same platform as Stubb's

---

### Mohawk ⚠️ HAS UNCAPTURED DATA

**Source URL:** https://mohawkaustin.com/  
**Scraper:** `mohawk.ts` (Puppeteer)

**Currently Captures:**
- ✅ Title, Date, Time, Image, URL
- ✅ Support acts (`.supports`)
- ✅ Presenter (`.toptop`)

**Available But NOT Captured:**
- ❌ **Indoor/Outdoor stage** - in `.endtop` (e.g., "Indoor")
- ❌ **Age restriction** - in `.endtop` (e.g., "All Ages")

**HTML Evidence:**
```html
<div class="endtop"><span>7pm</span> / <span>Indoor</span> / <span>All Ages</span></div>
```

**Enhancement Priority:** MEDIUM - requires parsing `.endtop` better

---

### Stubb's BBQ ✅ GOLD STANDARD

**Source URL:** https://stubbsaustin.com/concert-listings/  
**Scraper:** `stubbs.ts` (fetch + cheerio)  
**Platform:** TicketWeb

**Currently Captures:**
- ✅ Title, Date, Time
- ✅ **Door time** (`.tw-event-door-time`)
- ✅ **Price** (`.tw-price`)
- ✅ **Age restriction** (`.tw-age-restriction`)
- ✅ Image, URL

**Venue Info:**
- FAQ: https://stubbsaustin.com/faq/

**Note:** This scraper is the gold standard. Other TicketWeb venues (Antone's) should match.

---

### Concourse Project ✅ VERY COMPLETE

**Source URL:** https://concourseproject.com/calendar/  
**Scraper:** `concourseProject.ts` (Puppeteer)  
**Platform:** SeeTickets

**Currently Captures:**
- ✅ Title, Date, Time, Image, URL
- ✅ **Age restriction** (`.ages`) - "18+"
- ✅ **Price range** (`.price`) - "$35.00-$55.00"
- ✅ **Genre** (`.genre`) - "DJ/Dance"
- ✅ **Supporting talent** (`.supporting-talent`)

**Note:** Second most complete scraper after Stubb's.

---

### ACL Live ✅ GOOD COVERAGE

**Source URL:** https://www.acllive.com/calendar  
**Scraper:** `aclLive.ts` (Puppeteer + infinite scroll)

**Currently Captures:**
- ✅ Title, Date, Time, Image, URL
- ✅ **Support acts** via `.tagline` (e.g., "featuring...", "with special guest...")
- ✅ Tour name
- ✅ Location/venue within ACL

**Venue Info:**
- Know Before You Go: https://www.acllive.com/plan-your-visit/know-before-you-go

---

### Radio East ✅ HAS PRICE

**Source URL:** https://radio-coffee-beer.webflow.io/radio-east#events  
**Scraper:** `radioEast.ts` (Puppeteer + DICE widget)  
**Platform:** DICE JSON-LD

**Currently Captures:**
- ✅ Title, Date, Time, Image, URL, Description
- ✅ **Price** from JSON-LD `offers` field

---

### Long Center ✅ HAS SUB-VENUE

**Source URL:** https://thelongcenter.org/events/  
**Scraper:** `longCenter.ts` (fetch + JSON-LD)

**Currently Captures:**
- ✅ Title, Date, Time, Image, URL, Description
- ✅ **Sub-venue/hall name** (Dell Hall, Rollins Studio Theatre, Terrace)

---

### Texas Performing Arts ✅ HAS SUB-VENUE

**Source URL:** https://texasperformingarts.org/events/events/
**Scraper:** `texasPerformingArts.ts` (Puppeteer)

**Currently Captures:**
- ✅ Title, Date, Image, URL
- ✅ **Sub-venue** (Bass Concert Hall, McCullough Theatre, Bates Recital)
- ✅ **Series/presenter** (Broadway in Austin, Texas Welcomes, etc.)
- ✅ **Actual event times** enriched from UT Calendar (calendar.utexas.edu JSON-LD). Multi-show events (e.g. matinee + evening) get separate entries. Falls back to 7:30 PM default for unmatched/far-future events.

---

### Moody Amphitheater ✅ FIXED

**Source URL:** https://www.moodyamphitheater.com/events-tickets  
**Scraper:** `moodyAmphitheater.ts` (fetch + cheerio)

**Currently Captures:**
- ✅ Title (headliner + tour)
- ✅ **Support acts** (`.event-support`)
- ✅ Date, Time, URL

**Status:** Timezone bug fixed (added `createAustinDate`)

---

### Moody Center ✅ GOOD

**Source URL:** https://moodycenteratx.com/events/  
**Scraper:** `moodyCenter.ts` (fetch + JSON-LD)

**Currently Captures:**
- ✅ Title, Date, Time, Image, Description, URL
- ✅ Infers category from URL patterns (basketball, comedy, etc.)

---

### Paramount Theatre ✅ GOOD

**Source URL:** https://tickets.austintheatre.org/events  
**Scraper:** `paramount.ts` (Puppeteer)  
**Platform:** Tessitura ticketing

**Currently Captures:**
- ✅ Title, Date, Time, Image, URL
- ✅ Product type → category mapping

---

### Emo's ✅ GOOD

**Source URL:** https://www.emosaustin.com/shows  
**Scraper:** `emos.ts` (Puppeteer)  
**Platform:** LiveNation

**Currently Captures:**
- ✅ Title, Date, Time, Image, URL
- ✅ Hybrid JSON-LD + DOM extraction for completeness

---

### Scoot Inn ✅ GOOD

**Source URL:** https://www.scootinnaustin.com/shows  
**Scraper:** `scootInn.ts` (Puppeteer)  
**Platform:** LiveNation

**Currently Captures:**
- ✅ Title, Date, Time, Image, URL

---

### Empire Control Room ✅ OK

**Source URL:** https://empiregarage.com/events/  
**Scraper:** `empire.ts` (Puppeteer + MEC)  
**Platform:** Modern Events Calendar (WordPress)

**Currently Captures:**
- ✅ Title, Date, Time, Image, URL

---

### HEB Center ✅ OK

**Source URL:** https://www.hebcenter.com/events/calendar  
**Scraper:** `hebCenter.ts` (Puppeteer)

**Currently Captures:**
- ✅ Title, Date, Image, URL
- Calendar view scrapes 7 months ahead

---

### COTA ✅ OK

**Source URL:** https://circuitoftheamericas.com/events/  
**Scraper:** `cota.ts` (fetch + cheerio)

**Currently Captures:**
- ✅ Title, Date, Image, URL
- ✅ Event tag/category
- Defaults to 7 PM (no time on page)

---

### Q2 Stadium ✅ OK

**Source URL:** https://www.q2stadium.com/events/?view=list  
**Scraper:** `q2Stadium.ts` (fetch + cheerio)

**Currently Captures:**
- ✅ Title, Date, Image, URL
- Defaults to 7:30 PM (no time on page)

---

## Common Platforms Identified

### 1. TicketWeb Platform (`.tw-*` classes)
**Venues:** Stubb's, Antone's

**Standard Fields Available:**
- `.tw-event-date` - Event date
- `.tw-event-time` - Show time
- `.tw-event-door-time` - Door time
- `.tw-age-restriction` - Age restriction
- `.tw-price` - Price info
- `.tw-name` - Event title

**Recommendation:** All TicketWeb venues should capture the full field set.

### 2. JSON-LD Structured Data
**Venues:** Moody Center, Emo's, Scoot Inn, Long Center, Radio East

**Standard Fields in JSON-LD:**
- `name`, `startDate`, `endDate`
- `image`, `url`, `description`
- `location`, `performer` (sometimes)
- `offers` (price info - Radio East has this)

**Recommendation:** Check for `performer` and `offers` fields.

### 3. LiveNation Sites
**Venues:** Emo's, Scoot Inn

**Pattern:** JSON-LD in script tags, Chakra UI components

### 4. SeeTickets
**Venues:** Concourse Project

**Rich data:** age, price, genre, supporting talent

---

## Enhancement Priorities

### High Priority (Easy + High Value)

1. **Antone's: Add door time + age** ⏱️ 15 min
   - Same platform as Stubb's, just add selectors
   - Value: Users know when to arrive, age requirements

### Medium Priority

2. **Mohawk: Add indoor/outdoor + age** ⏱️ 30 min
   - Parse `.endtop` field properly (currently only gets time)
   - Value: Stage type matters for Mohawk regulars

### Lower Priority (Nice to Have)

3. **Check JSON-LD scrapers for `performer` field**
   - May already have support act data we're not capturing

4. **Add venue info URLs to database** ⏱️ 1-2 hours
   - Manual collection of FAQ/parking/accessibility URLs
   - Display on event pages

---

## Venue Info URLs (Collected)

| Venue | FAQ/Info | Status |
|-------|----------|--------|
| ACL Live | [Know Before You Go](https://www.acllive.com/plan-your-visit/know-before-you-go) | ✅ |
| Stubb's | [FAQ](https://stubbsaustin.com/faq/) | ✅ |
| Moody Center | TBD | |
| Paramount | TBD | |
| Long Center | TBD | |
| ... | ... | |

---

## Scraper Completeness Ranking

1. **Stubb's** - door, price, age ⭐⭐⭐
2. **Concourse Project** - age, price, genre, support ⭐⭐⭐
3. **Radio East** - price from JSON-LD ⭐⭐
4. **ACL Live** - support acts ⭐⭐
5. **Mohawk** - support acts (missing age/venue type) ⭐⭐
6. **Long Center / TPA** - sub-venue info ⭐⭐
7. **Others** - basic fields ⭐

---

## Date Safety Status (Feb 2026)

| Scraper | `createAustinDate` | `inferYear` | Risk Level |
|---------|:-:|:-:|---|
| moodyCenter | - | - | Safe (JSON-LD ISO) |
| paramount | Yes | - | Safe |
| aclLive | Yes | - | Safe (year fallback Austin-aware, fixed Feb 2026) |
| stubbs | Yes | Yes | Safe (fixed Feb 2026) |
| texasPerformingArts | Yes | - | Safe |
| longCenter | - | - | Safe (ISO with offset) |
| emos | Yes | - | Safe (DOM fallback fixed Feb 2026) |
| mohawk | Yes | Yes | Safe (fixed Feb 2026) |
| concourseProject | Yes | Yes | Safe (fixed Feb 2026) |
| antones | Yes | Yes | Safe (fixed Feb 2026) |
| moodyAmphitheater | Yes | Yes | Safe (fixed Feb 2026) |
| scootInn | Yes | Yes | Safe (DOM fallback fixed Feb 2026) |
| radioEast | - | - | Safe (JSON-LD ISO) |
| empire | Yes | Yes | Safe (fixed Feb 2026) |
| hebCenter | Yes | - | Safe |
| cota | Yes | - | Safe |
| q2Stadium | Yes | - | Safe |

## Next Steps

1. [x] Fix Moody Amphitheater timezone bug (Dec 2025)
2. [x] Fix year inference bug — Stubb's, Mohawk, Moody Amp, Empire (Feb 2026)
3. [x] Fix event listing midnight cutoff (Feb 2026)
4. [x] Fix `concourseProject.ts` — replace `new Date()` with `createAustinDate()` + `inferYear()` (Feb 2026)
5. [x] Fix `antones.ts` — replace local year inference with `inferYear()` (Feb 2026)
6. [x] Fix `emos.ts`, `scootInn.ts`, `aclLive.ts` — fallback paths use raw `new Date()` (Feb 2026)
7. [ ] Enhance Antone's scraper with door/age fields
8. [ ] Enhance Mohawk scraper to parse full `.endtop`
9. [ ] Collect remaining venue info URLs
10. [ ] Consider adding `doorTime`, `ageRestriction` fields to Event model
