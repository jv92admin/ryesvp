# Priority Venues - Austin Event Discovery

> **Purpose:** Identify gaps in venue coverage for comprehensive Austin event discovery.
> **Created:** 2025-12-06
> **Status:** ✅ Phase 1.2 Complete (Dec 8, 2025)

---

## Currently Covered Venues

| Venue | Category | Events | Latest | Notes |
|-------|----------|--------|--------|-------|
| Paramount Theatre | Theater/Music | 102 | 2026-06 | ✅ Healthy |
| ACL Live at Moody Theater | Music | 73 | 2026-12 | ✅ Fixed |
| Moody Center | Arena/Music | 69 | 2026-11 | ✅ Healthy |
| Long Center | Arts/Symphony | 59 | 2026-05 | ✅ Healthy |
| Bass Concert Hall | Theater/Music | 37 | 2031-01 | ✅ TPA sub-venue |
| Mohawk | Music | 37 | 2026-05 | ✅ NEW - Puppeteer |
| Emo's Austin | Music | 37 | 2026-07 | ✅ Fixed - JSON-LD + DOM hybrid |
| Concourse Project | EDM | 25 | 2026-03 | ✅ NEW - AJAX Load More |
| Stubb's BBQ | Music/BBQ | 20 | 2026-05 | ✅ Smaller venue |
| McCullough Theatre | Theater | 4 | 2026-01 | ✅ TPA sub-venue |
| Bates Recital Hall | Classical | 2 | 2026-02 | ✅ TPA sub-venue |
| Antone's Nightclub | Blues | 57 | 2026-05 | ✅ NEW - fetch + cheerio |
| Moody Amphitheater | Outdoor | 9 | 2026-05 | ✅ NEW - fetch + cheerio |
| Scoot Inn | Outdoor | 13 | 2026-05 | ✅ NEW - Puppeteer + JSON-LD |
| Radio East | Music | 23 | 2026-04 | ✅ NEW - Puppeteer + DICE JSON-LD |
| Empire Control Room | Music | 47 | 2026-06 | ✅ NEW - Puppeteer + MEC Load More |
| HEB Center | Sports/Arena | 61 | 2026-06 | ✅ NEW - Puppeteer + Calendar view |
| COTA | Racing/Concerts | 9 | 2026-10 | ✅ NEW - fetch + cheerio |
| Q2 Stadium | Soccer/MLS | 16 | 2026-11 | ✅ NEW - fetch + cheerio |

**Total: ~711 future events across 19 venues**

---

## Priority Venues - Phase 1.2 ✅ COMPLETE

| # | Venue | Category | Status | Notes |
|---|-------|----------|--------|-------|
| 1 | **Emo's** | Music | ✅ | 37 events, JSON-LD + DOM hybrid |
| 2 | **Mohawk** | Music | ✅ | 37 events, Puppeteer + "show me more" |
| 3 | **Antone's** | Blues | ✅ | 57 events, fetch + cheerio |
| 4 | **Moody Amphitheater** | Outdoor | ✅ | 9 events, fetch + cheerio |
| 5 | **Scoot Inn** | Outdoor | ✅ | 13 events, Puppeteer + JSON-LD |
| 6 | **Concourse Project** | EDM | ✅ | 25 events, Puppeteer + AJAX Load More |
| 7 | **Empire Control Room** | Music | ✅ | 47 events, Puppeteer + MEC Load More |
| 8 | **HEB Center** | Sports/Arena | ✅ | 61 events, Puppeteer + Calendar view |
| 9 | **COTA** | Racing/Concerts | ✅ | 9 events, fetch + cheerio |
| 10 | **Q2 Stadium** | Soccer/MLS | ✅ | 16 events, fetch + cheerio |
| 11 | **Radio East** | Music | ✅ | 23 events, Puppeteer + DICE JSON-LD |

**11/11 priority venues complete!**

---

## Deferred - Tier 2 (Seasonal/Empty)

| Venue | Category | Status | Notes |
|-------|----------|--------|-------|
| **Parish** | Music | ⏸️ Deferred | Calendar empty as of Dec 2025 - revisit when events posted |
| **Darrell K Royal** | Football/Concerts | ⏸️ Deferred | Texas football season over - revisit Fall 2026 or when concerts scheduled |

## Optional - Later Phase

| Venue | Category | Notes |
|-------|----------|-------|
| Comedy Mothership | Comedy | Joe Rogan's club |
| Cap City Comedy | Comedy | Traditional comedy club |
| Far Out Lounge | Outdoor | Outdoor music venue |
| Hotel Vegas | Music | Adjacent to Volstead |
| ZACH Theater | Theater | Local theater company |
| Creek and the Cave | Comedy | Comedy club |
| Hideout Theatre | Improv | Improv theater |
| Continental Club | Honky Tonk | Historic, smaller |

---

## Implementation Notes

- User will provide HTML downloads for each venue
- Analyze HTML structure before writing scrapers
- Focus on structured data (JSON-LD) where available
- Document source structure in `docs/source-structure-log.md` (Phase 1.3)

---

## Progress Log

| Date | Venue | Action | Result |
|------|-------|--------|--------|
| 2025-12-06 | (starting) | Created priority list | 12 must-do, 8 optional |
| 2025-12-06 | Emo's | Scraper created | 36 events, JSON-LD extraction |
| 2025-12-06 | Mohawk | Scraper created | 37 events, Puppeteer + "show me more" |
| 2025-12-06 | Concourse Project | Scraper created | 25 events, Puppeteer + AJAX Load More |
| 2025-12-06 | ACL Live | Backdated events | Fixed "New" filter flood |
| 2025-12-06 | All | Bug fixes | Emo's image fix, presale filter fix, "New" filter API |
| 2025-12-07 | Antone's | Scraper created | 57 events, fetch + cheerio (no Puppeteer) |
| 2025-12-07 | Moody Amphitheater | Scraper created | 9 events, fetch + cheerio |
| 2025-12-07 | Scoot Inn | Scraper created | 13 events, Puppeteer + JSON-LD |
| 2025-12-07 | Radio East | Scraper created | 23 events, Puppeteer + DICE JSON-LD |
| 2025-12-08 | Emo's | DOM extraction fix | 36→37 events, catches events not in JSON-LD |
| 2025-12-08 | Empire | Scraper created | 47 events, Puppeteer + MEC Load More |
| 2025-12-08 | HEB Center | Scraper created | 61 events, Puppeteer + Calendar view |
| 2025-12-08 | COTA | Scraper created | 9 events, fetch + cheerio |
| 2025-12-08 | Q2 Stadium | Scraper created | 16 events, fetch + cheerio |
| 2025-12-08 | All new venues | Ingested + Enriched | 133 events added, backdated to avoid "New" flood |
| 2025-12-08 | Parish, DKR | Deferred to Tier 2 | Parish empty, Texas football season over |

**Note on Moody Amphitheater:** Only 9 events currently listed. No pagination visible with this small dataset. If event count grows significantly, may need to revisit for pagination handling.

---

## Phase 1.2 Summary

**Completed:** December 8, 2025

- **11 priority venue scrapers** built and operational
- **19 total venues** now covered
- **~711 future events** in database
- **133 new events** from today's session (Empire, HEB, COTA, Q2)
- All events enriched with Knowledge Graph + Spotify metadata
- Backdated to prevent "New" filter flood

**Deferred:**
- Parish (calendar empty)
- Darrell K Royal Stadium (football season over)

**Next:** Phase 1.3 - Source Structure Audit, or UX Quick Wins (Block B)

