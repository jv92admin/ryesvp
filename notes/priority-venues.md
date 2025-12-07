# Priority Venues - Austin Event Discovery

> **Purpose:** Identify gaps in venue coverage for comprehensive Austin event discovery.
> **Created:** 2025-12-06
> **Status:** In Progress

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
| Emo's Austin | Music | 36 | 2026-05 | ✅ NEW - JSON-LD |
| Concourse Project | EDM | 25 | 2026-03 | ✅ NEW - AJAX Load More |
| Stubb's BBQ | Music/BBQ | 20 | 2026-05 | ✅ Smaller venue |
| McCullough Theatre | Theater | 4 | 2026-01 | ✅ TPA sub-venue |
| Bates Recital Hall | Classical | 2 | 2026-02 | ✅ TPA sub-venue |
| Antone's Nightclub | Blues | 57 | 2026-05 | ✅ NEW - fetch + cheerio |
| Moody Amphitheater | Outdoor | 9 | 2026-05 | ✅ NEW - fetch + cheerio |
| Scoot Inn | Outdoor | 13 | 2026-05 | ✅ NEW - Puppeteer + JSON-LD |
| Radio East | Music | 23 | 2026-04 | ✅ NEW - Puppeteer + DICE JSON-LD |

**Total: ~570 future events across 15 venues**

---

## Must Do - Priority Venues

| # | Venue | Category | Status | HTML Provided | Notes |
|---|-------|----------|--------|---------------|-------|
| 1 | **Emo's** | Music | ✅ | ✅ | 36 events via JSON-LD |
| 2 | **Mohawk** | Music | ✅ | ✅ | 37 events, "show me more" button |
| 3 | **Parish** | Music | ⏸️ | ⬜ | Calendar empty (Dec 2025) |
| 4 | **Antone's** | Blues | ✅ | ✅ | 57 events, fetch + cheerio |
| 5 | **Moody Amphitheater** | Outdoor | ✅ | ✅ | 9 events, fetch + cheerio |
| 6 | **Scoot Inn** | Outdoor | ✅ | ✅ | 13 events, Puppeteer + JSON-LD |
| 7 | **Concourse Project** | EDM | ✅ | ✅ | 25 events, Load More AJAX |
| 8 | **Empire** | Music | ⏳ | ⬜ | Empire Control Room |
| 9 | **HEB Center** | Sports/Arena | ⏳ | ⬜ | Cedar Park - Texas Stars |
| 10 | **COTA** | Racing/Concerts | ⏳ | ⬜ | F1, MotoGP, concerts |
| 11 | **Darrell K Royal** | Football/Concerts | ⏳ | ⬜ | UT Stadium |
| 12 | **Radio East** | Music | ✅ | ✅ | 23 events, Puppeteer + DICE JSON-LD |

---

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

**Note on Moody Amphitheater:** Only 9 events currently listed. No pagination visible with this small dataset. If event count grows significantly, may need to revisit for pagination handling.

