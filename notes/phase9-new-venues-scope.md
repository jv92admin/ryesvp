# Phase 9: New Venue Scrapers - Stubb's BBQ & ACL Live

## Purpose

This document provides a framework for a more powerful LLM to analyze HTML from Stubb's BBQ and ACL Live at The Moody Theater websites, and create detailed scraping specifications for implementation.

---

## Target Venues

1. **Stubb's BBQ** - Live music venue in Austin
   - Website: https://www.stubbsaustin.com/ (or similar)
   - Known for: Live music, BBQ restaurant + venue

2. **ACL Live at The Moody Theater** - Concert venue
   - Website: https://www.acl-live.com/ (or similar)
   - Known for: Live music, concerts, tapings

---

## Current Scraper Pattern

Both existing scrapers follow this pattern:

### File Structure
- Location: `src/ingestion/sources/[venueSlug].ts`
- Export: `export async function fetchEventsFrom[Venue](): Promise<NormalizedEvent[]>`
- Return type: `NormalizedEvent[]`

### NormalizedEvent Interface
```typescript
interface NormalizedEvent {
  venueSlug: string;        // Must match venue slug in database
  title: string;
  description?: string | null;
  startDateTime: Date;     // Required, exact time
  endDateTime?: Date | null; // Optional
  url: string;              // Link to event page/tickets
  imageUrl?: string | null;  // Optional, full URL
  category: EventCategory;   // COMEDY | CONCERT | THEATER | OTHER
  source: EventSource;       // VENUE_WEBSITE
  sourceEventId?: string;    // Unique ID from source for deduplication
}
```

### Example: Moody Center Pattern
- Uses JSON-LD structured data (preferred)
- Extracts exact times from ISO 8601 dates
- Falls back to HTML parsing if JSON-LD unavailable

### Example: Paramount Pattern
- Uses Puppeteer (headless browser) for JavaScript-heavy pages
- Extracts product type IDs for category mapping
- Parses date/time from text

---

## Investigation Requirements

For each venue, the more powerful LLM should:

### 1. HTML Structure Analysis
- Identify the events listing page URL
- Document the HTML structure (CSS selectors, class names, data attributes)
- Check for:
  - JSON-LD structured data (`<script type="application/ld+json">`)
  - Static HTML vs JavaScript-rendered content
  - Pagination mechanism (if any)
  - Date/time format used

### 2. Data Extraction Points
For each event, identify how to extract:
- **Title**: CSS selector or text location
- **Date**: Format and parsing method
- **Time**: Format and parsing method
- **URL**: Link to event detail page or tickets
- **Image**: Image URL (if available)
- **Category**: How to infer (keywords, URL patterns, metadata)
- **Source Event ID**: Unique identifier for deduplication

### 3. Technical Approach Recommendation
- **Cheerio only** (if static HTML)
- **Puppeteer** (if JavaScript-rendered)
- **JSON-LD** (if structured data available)

### 4. Edge Cases
- Multiple shows per event (like Paramount)
- Recurring events
- Sold out/cancelled indicators
- Missing data handling

---

## Expected Output Format

For each venue, provide:

### Venue: [Name]

**Website URL**: `https://...`

**Events Listing Page**: `https://...`

**HTML Structure**:
```html
<!-- Example structure -->
<div class="event-list">
  <div class="event-item">
    <h3>Event Title</h3>
    <span class="date">Dec 15, 2025</span>
    <span class="time">8:00 PM</span>
  </div>
</div>
```

**CSS Selectors**:
- Event container: `.event-item`
- Title: `.event-item h3`
- Date: `.event-item .date`
- Time: `.event-item .time`
- URL: `.event-item a[href]`

**Date/Time Format**:
- Date: "Dec 15, 2025" or "December 15, 2025"
- Time: "8:00 PM" or "20:00"

**Technical Approach**: [Cheerio | Puppeteer | JSON-LD]

**Category Inference**: [How to determine category]

**Source Event ID**: [How to extract unique ID]

**Code Implementation**:
```typescript
// Complete scraper function with:
// 1. Fetch/load page
// 2. Extract events
// 3. Parse dates/times
// 4. Map to NormalizedEvent
// 5. Return array
```

**Testing Notes**: [Any special considerations]

---

## Database Setup

Before implementing scrapers, ensure venues exist in database:

```typescript
// Venue slugs to use:
- 'stubbs-bbq' (or 'stubbs')
- 'acl-live' (or 'acl-live-moody-theater')
```

**Action**: Add venues to database via Prisma seed or manual insert if not already present.

---

## Integration Steps

After receiving specs from more powerful LLM:

1. Create scraper file: `src/ingestion/sources/[venueSlug].ts`
2. Implement `fetchEventsFrom[Venue]()` function
3. Add to orchestrator: `src/ingestion/orchestrator.ts`
4. Test locally: `npm run ingest:all`
5. Verify events appear in UI

---

## Success Criteria

- [ ] Scraper extracts all upcoming events
- [ ] Dates/times parse correctly
- [ ] Categories are reasonable (not all "OTHER")
- [ ] Events deduplicate correctly (no duplicates)
- [ ] Scraper handles errors gracefully
- [ ] Events appear correctly in UI

---

## Notes for More Powerful LLM

- Provide actual HTML samples if possible (save pages like we did for Phase 8)
- Focus on reliability over completeness - better to extract core fields correctly than try to get everything
- Consider timezone (Austin is Central Time, UTC-6)
- Test with multiple events to ensure pattern holds
- Document any gotchas or special cases

