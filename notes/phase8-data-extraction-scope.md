# Phase 8: Data Extraction Requirements - Scoping Document

## Overview

This document outlines the requirements for extracting additional metadata from venue websites (Moody Center and Paramount Theatre) to improve data quality and user experience. The goal is to identify what additional data is available in the HTML and create a specification for implementing the extraction.

## Current State

### Moody Center (`src/ingestion/sources/moodyCenter.ts`)
**Currently Extracted:**
- Event title
- Date (format: "Sunday / Feb 1 / 2026")
- URL
- Description (if available)
- Image URL
- Category (inferred from title/description)

**Missing/Incomplete:**
- ⚠️ **Time**: Currently defaults to 8 PM for all events
- ⚠️ **Opponent names**: For basketball/sports events (e.g., "Austin Spurs vs. Rio Grande Valley Vipers")
- ⚠️ **Event subcategory**: More specific categorization beyond CONCERT/SPORTS/etc.
- ⚠️ **Status**: Sold out, cancelled, postponed indicators

**Website:** https://moodycenteratx.com/events/

---

### Paramount Theatre (`src/ingestion/sources/paramount.ts`)
**Currently Extracted:**
- Event title
- Date and time (format: "Friday, November 28, 2025" + "7:00PM")
- URL
- Image URL
- Category (inferred from title)

**Missing/Incomplete:**
- ⚠️ **Genre/Category**: Page shows genre filters (Comedy, Music, Film, Family, Holiday, LGBTQ+, Podcast, Speaker) - not extracted
- ⚠️ **Description**: Currently null for all events
- ⚠️ **Venue distinction**: Paramount Theatre vs Stateside Theatre (if applicable)
- ⚠️ **Pricing information**: If available on listing page

**Website:** https://tickets.austintheatre.org/events

---

## Database Schema

### Current Event Model (`prisma/schema.prisma`)
```prisma
model Event {
  id            String      @id @default(uuid())
  venueId       String
  title         String
  description   String?     // Currently used, may need expansion
  startDateTime DateTime
  endDateTime   DateTime?
  url           String?
  imageUrl      String?
  source        EventSource
  sourceEventId String?
  status        EventStatus @default(SCHEDULED)
  category      EventCategory @default(OTHER)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}
```

**Proposed Addition:**
- `notes` field (String?) - For additional context like opponent names, subcategories, venue distinctions

---

## Investigation Requirements

### For Moody Center HTML Analysis

**Priority 1: Time Extraction**
- [ ] Locate where event times are displayed in HTML
- [ ] Identify CSS selectors or HTML structure for time elements
- [ ] Document time format variations (e.g., "7:00 PM", "7PM", "19:00")
- [ ] Check if times are on listing page or require visiting event detail page
- [ ] Identify any timezone information

**Priority 2: Sports Event Opponent Extraction**
- [ ] Find examples of basketball games in HTML
- [ ] Identify how opponent names are structured (e.g., "vs.", "at", "vs")
- [ ] Locate CSS selectors for opponent information
- [ ] Determine if opponent is in title, description, or separate field
- [ ] Check for team logos or additional team metadata

**Priority 3: Event Status Indicators**
- [ ] Locate sold out indicators
- [ ] Find cancelled/postponed markers
- [ ] Identify CSS classes or text patterns for status
- [ ] Check if status affects event display or availability

**Priority 4: Category/Subcategory**
- [ ] Check if events have tags or categories beyond what we infer
- [ ] Look for event type indicators (e.g., "Concert Series", "Special Event")
- [ ] Identify any subcategory information

---

### For Paramount Theatre HTML Analysis

**Priority 1: Genre/Category Extraction**
- [ ] Locate genre information in HTML (Comedy, Music, Film, Family, Holiday, LGBTQ+, Podcast, Speaker)
- [ ] Identify CSS selectors or data attributes for genre
- [ ] Check if genre is on listing page or detail page
- [ ] Determine if genre is per-event or per-production
- [ ] Map genres to our EventCategory enum (CONCERT, COMEDY, THEATER, etc.)

**Priority 2: Description Extraction**
- [ ] Locate event descriptions in HTML
- [ ] Identify CSS selectors for description text
- [ ] Check if descriptions are truncated on listing page
- [ ] Determine if full description requires visiting detail page
- [ ] Note any formatting (HTML tags, line breaks, etc.)

**Priority 3: Venue Distinction**
- [ ] Check if events specify "Paramount Theatre" vs "Stateside Theatre"
- [ ] Locate venue name in HTML structure
- [ ] Determine if this affects our venue mapping (currently all go to "paramount-theatre")
- [ ] Check if separate venues need separate venue records

**Priority 4: Additional Metadata**
- [ ] Look for pricing information
- [ ] Check for age restrictions or content warnings
- [ ] Identify any special event indicators
- [ ] Look for performer/artist names beyond title

---

## Expected Output Specification

After HTML analysis, provide a specification document with:

### For Each Venue:

1. **HTML Structure Map**
   - CSS selectors for each data field
   - HTML hierarchy and relationships
   - Example HTML snippets for each field

2. **Data Extraction Rules**
   - Parsing logic for each field
   - Edge cases and variations
   - Fallback strategies

3. **Field Mapping**
   - Source field → Database field mapping
   - Data transformation rules (e.g., genre → category enum)
   - Validation requirements

4. **Implementation Notes**
   - Whether data requires visiting detail pages
   - Any JavaScript rendering considerations
   - Rate limiting or performance concerns

---

## Success Criteria

After implementation:
- ✅ Moody Center events show actual times (not default 8 PM)
- ✅ Basketball games include opponent names in notes or description
- ✅ Paramount events have genre/category extracted from page
- ✅ Paramount events have descriptions populated
- ✅ All additional metadata stored appropriately (description or notes field)

---

## Files to Analyze

1. **Moody Center**: `references/moody-center-events.html` (to be provided)
2. **Paramount Theatre**: `references/paramount-events.html` (to be provided)

## Next Steps

1. Analyze HTML files for both venues
2. Create detailed extraction specification
3. Update scrapers with new extraction logic
4. Add `notes` field to schema if needed
5. Test and verify data quality improvements

