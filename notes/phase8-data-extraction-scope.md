# Phase 8: Scraper Audit & Data Extraction Specification

## Purpose

This document provides detailed specifications for a junior LLM to improve the two existing venue scrapers (Moody Center and Paramount Theatre). The goal is to extract richer metadata that currently exists in the HTML but isn't being captured.

---

## Executive Summary

| Venue | Current Status | Key Improvements Needed |
|-------|---------------|------------------------|
| Moody Center | Working, but missing rich data | Use JSON-LD for exact times, extract opponent names |
| Paramount Theatre | Working, but missing categories | Map product type IDs to categories |

---

## 1. Moody Center (`src/ingestion/sources/moodyCenter.ts`)

### Current Implementation

The scraper extracts events from `https://moodycenteratx.com/events/` using Cheerio. It:
- Parses dates from text like "Sunday / Nov 30 / 2025"
- Defaults time to 8:00 PM
- Infers categories from title text
- Extracts images from event cards

### HTML Structure Analysis

The Moody Center website uses **The Events Calendar** WordPress plugin. There are **two valuable data sources**:

#### Source A: JSON-LD Structured Data (PREFERRED)

Location: `<script type="application/ld+json">` in `<head>`

This contains an **array of Event objects** with:

```json
{
  "@type": "Event",
  "name": "Texas WBB",
  "description": "Texas vs. University of Pennsylvania at Moody Center...",
  "image": "https://moodycenteratx.com/wp-content/uploads/2025/10/WBB_Header_Moody.png",
  "url": "https://moodycenteratx.com/event/texas-womens-basketball-universityofpennsylvania/",
  "startDate": "2025-11-30T13:00:00-06:00",
  "endDate": "2025-11-30T15:00:00-06:00",
  "eventStatus": "https://schema.org/EventScheduled"
}
```

**Benefits of using JSON-LD:**
- ✅ Exact start and end times with timezone
- ✅ Full description with opponent names
- ✅ Direct image URLs (not resized thumbnails)
- ✅ Event status (scheduled/cancelled/postponed)
- ✅ No text parsing required

#### Source B: Event Cards (Current Implementation)

Structure per event:

```html
<div class="event-card calendar-event-card">
  <div class="event-image full-width-brand-bar">
    <a href="{event-url}" class="embed-responsive embed-responsive-16by9">
      <img src="{image-url}" alt="{title}" class="embed-responsive-item">
    </a>
  </div>
  <div class="event-meta-wrapper">
    <div class="event-meta">
      <p class="event-date">Sunday / Nov 30 / 2025</p>
      <h3 class="h2 event-title">
        <a href="{url}">{Title}</a>
      </h3>
      <p class="lead event-subheading">vs. University of Pennsylvania</p>  <!-- OPPONENT HERE -->
    </div>
  </div>
</div>
```

### Category Mapping

The site has a category dropdown with these categories (from HTML):
- Comedy → `COMEDY`
- E-Sports → `OTHER`
- Family → `OTHER`
- Music → `CONCERT`
- Speaker → `OTHER`
- Sports → `OTHER` (unless more granular tracking added)
- Texas MBB → `OTHER` (Men's Basketball)
- Texas WBB → `OTHER` (Women's Basketball)

Categories appear in the URL:
- `https://moodycenteratx.com/events/category/comedy/`
- `https://moodycenteratx.com/events/category/music/`

### Recommended Implementation Changes

```typescript
// 1. Extract JSON-LD from page
const jsonLdScript = $('script[type="application/ld+json"]').first().text();
const schemaData = JSON.parse(jsonLdScript);

// 2. schemaData is an array of Event objects
for (const event of schemaData) {
  if (event['@type'] !== 'Event') continue;
  
  const normalized: NormalizedEvent = {
    venueSlug: 'moody-center',
    title: event.name,
    description: extractOpponentFromDescription(event.description),  // NEW
    startDateTime: new Date(event.startDate),  // EXACT TIME
    endDateTime: event.endDate ? new Date(event.endDate) : null,  // NEW
    url: event.url,
    imageUrl: event.image,
    category: inferCategoryFromUrl(event.url),  // IMPROVED
    source: 'VENUE_WEBSITE',
    sourceEventId: extractIdFromUrl(event.url),
  };
  
  events.push(normalized);
}

// Helper to extract opponent from description
function extractOpponentFromDescription(description: string | undefined): string | null {
  if (!description) return null;
  // Pattern: "Texas vs. {Opponent} at Moody Center"
  const match = description.match(/Texas vs\.\s+([^<]+?)\s+at Moody Center/i);
  if (match) {
    return `vs. ${match[1].trim()}`;
  }
  return description.slice(0, 200);  // First 200 chars as fallback
}

// Helper to infer category from URL
function inferCategoryFromUrl(url: string): EventCategory {
  if (url.includes('basketball') || url.includes('-mbb') || url.includes('-wbb')) {
    return 'OTHER';  // Sports
  }
  if (url.includes('comedy')) return 'COMEDY';
  if (url.includes('concert') || url.includes('music')) return 'CONCERT';
  return 'OTHER';
}
```

### Data Available But Not Currently Extracted

| Field | Location | Example Value |
|-------|----------|---------------|
| Exact start time | JSON-LD `startDate` | `2025-11-30T13:00:00-06:00` |
| Exact end time | JSON-LD `endDate` | `2025-11-30T15:00:00-06:00` |
| Opponent name | `.event-subheading` or JSON-LD description | "vs. University of Pennsylvania" |
| Event status | JSON-LD `eventStatus` | "EventScheduled", "EventCancelled" |
| Full-size image | JSON-LD `image` | Direct CDN URL |
| Category | URL path | "texas-womens-basketball" |

---

## 2. Paramount Theatre (`src/ingestion/sources/paramount.ts`)

### Current Implementation

The scraper uses Puppeteer to render `https://tickets.austintheatre.org/events` and extracts:
- Title from `.tn-prod-list-item__property--heading a`
- Date from `.tn-prod-list-item__perf-date`
- Time from `.tn-prod-list-item__perf-time`
- Image from `.tn-prod-list-item__property--img-container img`
- Infers category from title keywords

### HTML Structure Analysis

Paramount uses the **Tessitura ticketing system (TNEW)**. Events are organized as:

```html
<li data-tn-prod-season-no="12932" class="tn-prod-list-item">
  <h4 class="tn-prod-list-item__property tn-prod-list-item__property--heading">
    <a href="https://tickets.austintheatre.org/12932">Home is Here</a>
  </h4>
  
  <ul class="tn-prod-list-item__property--perf-list">
    <li class="tn-prod-list-item__perf-list-item" 
        data-tn-performance-no="12933" 
        data-tn-product-type-id="20">  <!-- PRODUCT TYPE ID = CATEGORY -->
      <a class="tn-prod-list-item__perf-anchor">
        <span class="tn-prod-list-item__perf-date">Friday, November 28, 2025</span>
        <span class="tn-prod-list-item__perf-time">7:00PM</span>
        <span class="tn-performance-title">Home is Here</span>
        <span class="tn-prod-list-item__perf-action">Purchase</span>
      </a>
    </li>
  </ul>
  
  <div class="tn-prod-list-item__property--img-container">
    <img src="./Events _ Paramount Theatre Austin_files/HomeIsHere-600x400-1.jpg">
  </div>
</li>
```

### Key Discovery: Product Type IDs

Each performance has a `data-tn-product-type-id` attribute that maps to event categories:

| Product Type ID | Likely Category |
|-----------------|-----------------|
| 5 | Film (from "Elf Pub Run", "The Holiday") |
| 19 | Music (from "Marc Broussard") |
| 20 | Other/Special Event (from "Home is Here", "Luna") |

**Action:** Log these IDs during scraping to build a complete mapping.

### Genre Filter Buttons (Alternative Category Source)

The page has filter buttons that link to category-specific pages:

```html
<a href="https://tickets.austintheatre.org/events?kid=4">Comedy</a>
<a href="https://tickets.austintheatre.org/events?kid=15">Family</a>
<a href="https://tickets.austintheatre.org/events?kid=12">Film</a>
<a href="https://tickets.austintheatre.org/events?kid=92">Holiday</a>
<a href="https://tickets.austintheatre.org/events?kid=72">LGBTQ+</a>
<a href="https://tickets.austintheatre.org/events?kid=13">Music</a>
<a href="https://tickets.austintheatre.org/events?kid=32">Podcast</a>
<a href="https://tickets.austintheatre.org/events?kid=38">Speaker</a>
```

**Alternative approach:** Scrape each category page separately to get explicit categorization.

### Recommended Implementation Changes

```typescript
// Extract product type ID from each performance
const productTypeId = $perf.attr('data-tn-product-type-id');
const category = mapProductTypeToCategory(productTypeId);

// Category mapping function
function mapProductTypeToCategory(productTypeId: string | undefined): EventCategory {
  const mapping: Record<string, EventCategory> = {
    '5': 'OTHER',     // Film
    '13': 'CONCERT',  // Music (if kid= maps to same system)
    '19': 'CONCERT',  // Music
    '20': 'OTHER',    // Special events
    '4': 'COMEDY',    // Comedy
  };
  return mapping[productTypeId || ''] || 'OTHER';
}

// Alternative: Fetch events from each category endpoint
const categories = [
  { kid: '4', category: 'COMEDY' },
  { kid: '12', category: 'OTHER' },   // Film
  { kid: '13', category: 'CONCERT' }, // Music
];

for (const { kid, category } of categories) {
  const url = `https://tickets.austintheatre.org/events?kid=${kid}`;
  // ... fetch and parse, assign category directly
}
```

### Venue Distinction (Paramount vs Stateside)

The Paramount Theatre operates two venues:
1. **Paramount Theatre** - Main historic venue
2. **Stateside Theatre** - Smaller adjacent venue

Currently, the scraper treats all events as "Paramount Theatre". 

**Investigation needed:** Check if the venue is indicated in:
- Individual event pages
- Performance metadata
- Image URLs or alt text

**Note:** The provided HTML sample (`Events _ Paramount Theatre Austin.html`) does not contain "Stateside" anywhere, suggesting venue distinction may require visiting individual event detail pages.

### Data Available But Not Currently Extracted

| Field | Location | Example Value |
|-------|----------|---------------|
| Category/Genre | `data-tn-product-type-id` | 5, 19, 20 |
| Purchase status | `.tn-prod-list-item__perf-action` | "Purchase", "Sold Out" |
| Season/Series ID | `data-tn-prod-season-no` | "12932" |
| Direct ticket link | `.tn-prod-list-item__perf-anchor[href]` | Full URL to purchase |

---

## 3. Implementation Checklist

### Moody Center Tasks

- [ ] **HIGH PRIORITY:** Switch to JSON-LD parsing as primary data source
- [ ] Extract exact start times from ISO 8601 dates
- [ ] Extract end times when available
- [ ] Parse opponent names from description or `.event-subheading`
- [ ] Extract event status (scheduled/cancelled/postponed)
- [ ] Use full-resolution image URLs from JSON-LD
- [ ] Add category inference from URL patterns

### Paramount Theatre Tasks

- [ ] **HIGH PRIORITY:** Log `data-tn-product-type-id` values to build category mapping
- [ ] Extract and store product type ID as additional metadata
- [ ] Consider scraping category-specific pages for explicit categorization
- [ ] Add "Sold Out" status detection from `.tn-prod-list-item__perf-action`
- [ ] Investigate venue distinction (Paramount vs Stateside)

---

## 4. Testing Instructions

### Moody Center Validation

1. Run the updated scraper
2. Verify events have exact times (not just 8:00 PM)
3. Check basketball events have opponent names in description
4. Confirm image URLs are full CDN paths (not relative)

**Sample Expected Output:**
```json
{
  "title": "Texas WBB",
  "description": "vs. University of Pennsylvania",
  "startDateTime": "2025-11-30T13:00:00.000Z",
  "endDateTime": "2025-11-30T15:00:00.000Z",
  "imageUrl": "https://moodycenteratx.com/wp-content/uploads/2025/10/WBB_Header_Moody.png"
}
```

### Paramount Theatre Validation

1. Run the updated scraper
2. Log unique `data-tn-product-type-id` values encountered
3. Verify category inference produces reasonable results
4. Check that film events get categorized differently from music

**Sample Expected Output:**
```json
{
  "title": "Marc Broussard",
  "category": "CONCERT",
  "productTypeId": "19",
  "startDateTime": "2025-12-04T20:00:00.000Z"
}
```

---

## 5. Database Schema Considerations

The current `Event` model has:
- `description`: Text field - can store opponent info or other notes
- `category`: Enum - COMEDY, CONCERT, THEATER, OTHER
- `status`: Enum - SCHEDULED, CANCELLED, POSTPONED

**No schema changes required** for these improvements. All new data fits existing fields:
- Opponent names → `description`
- Event status → `status`
- Categories → `category`
- End times → `endDateTime`

---

## 6. Code Files to Modify

1. `src/ingestion/sources/moodyCenter.ts` - Main refactor to use JSON-LD
2. `src/ingestion/sources/paramount.ts` - Add product type mapping
3. `src/ingestion/utils/dateParser.ts` - May need updates for new date formats

---

## 7. Success Criteria

- [ ] Moody Center events have exact times (not defaults)
- [ ] Texas basketball events include opponent names
- [ ] Paramount events have meaningful category assignments
- [ ] No regression in event count or data quality
- [ ] All dates parse correctly with timezones
