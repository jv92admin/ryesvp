# Discovery & Filters Redesign Spec

**Author:** Engineering + PM  
**Date:** December 11, 2025  
**Status:** ✅ Phase 1 Complete (December 12, 2025)

---

## Implementation Status

### ✅ Completed
- FilterStrip with instant URL-based filtering
- SearchInput with 300ms debounce, pg_trgm fuzzy search
- DateChips (This Week, This Weekend, custom date picker)
- CategoryChips (Concerts, Comedy, Theater, Sports, Other)
- DiscoveryChips (New, Presales with live counts)
- All filters instant apply — no Apply button
- Deleted legacy EventFilters.tsx, DiscoveryStrip.tsx
- EventCard layout redesign (presale as own row)
- FriendsAndStatusCard 3-row hierarchy redesign
- StartPlanModal with search + date filters

### 🚫 Cancelled (Not Needed)
- MorePanel.tsx (bottom sheet) — All categories inline, venue filter deferred
- ActiveFilters.tsx — No venue chips in current UI
- Mobile optimization — Already looks good per testing

### 📋 Remaining (Phase 2)
- Discover stub page (`/discover`)
- Typeahead suggestions (Phase 2 enhancement)

---

## Executive Summary

Redesign the event filter UI from a form-like control panel into a **unified chip-based filter strip** with instant apply. Add a basic **search** capability for events, performers, and tags. Create a **Discover stub page** as a future home for exploration features.

**Goal:** Clean, legible Events list with filters that feel like browsing, not configuring.

---

## Problem Statement

The current filter UI has multiple issues:
- **Form-like feel:** Dropdowns + Apply button = feels like submitting a query
- **New/Presales hidden:** Desktop sidebar only, separate view loading
- **No search:** Users can't search by performer name or genre tags
- **Mobile unfriendly:** Multiple control rows before seeing events

---

## Scope

### In Scope (Phase 1 + 2)

| Feature | Phase | Description |
|---------|-------|-------------|
| Filter strip redesign | 1 | Replace dropdowns with chip strip, remove Apply button |
| Instant apply | 1 | Every filter change updates immediately + URL |
| New/Presales as filter chips | 1 | Move from sidebar to main strip |
| "More" panel | 1 | Bottom sheet with all categories + venue search |
| Search input | 1 | Search events, performers, tags |
| Mobile optimization | 1 | One event card above fold (390px target) |
| Discover entry point | 2 | Stub page linked from filter strip |

### Out of Scope (Future)

- Discover page content (taste setup, tags, preferences)
- "For You" / personalization
- Following artists/tags
- Clickable tags on event cards

---

## Current URL Params (Reference)

```
?venueIds=abc,def
?categories=CONCERT,COMEDY
?startDate=2025-12-15
?endDate=2025-12-22
```

**New params to add:**
```
?q=dreampop           # Search query (searches events, performers, tags, venues)
?new=true             # New listings filter
?presales=true        # Presales filter
?when=today|thisWeek|weekend|custom
```

---

## Design

### Filter Strip Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│ 🔍 Search events, artists, genres...                                       │
├────────────────────────────────────────────────────────────────────────────┤
│ [Today] [This Week] [Weekend] • [Concerts] [Comedy] • [✨ New] [⚡ Presales] • [More ▾] │
│                                                                            │
│ Active: [Moody Center ×] [ACL Live ×]                          [Clear all] │
└────────────────────────────────────────────────────────────────────────────┘
```

### Desktop (≥1024px)
- Search bar full width above chips
- Single row of chips (horizontal scroll if overflow)
- "More" opens slide-down panel

### Mobile (390px target)
- Search bar collapsed to icon, expands on tap
- Compact chip row: `[This Week] [Concerts] [New] [More ▾]`
- "More" opens bottom sheet
- **Hard constraint:** First event card visible above fold

---

## Filter Semantics

### Default State (No Filters)

- **Default date:** None (show all future events)
- **Default sorting:** Date ascending (`startDateTime ASC`)
- **With search query:** Sort by relevance score DESC, then date ASC
- **Timezone:** All date calculations use `America/Chicago` (Austin)

### Date Params: `when` vs `startDate/endDate`

| Scenario | Behavior |
|----------|----------|
| Only `when=thisWeek` | Use computed range |
| Only `startDate/endDate` | Use explicit dates |
| Both set | **`when` wins** - ignore startDate/endDate |
| Neither | Show all future events |

*Rationale: `when` is the chip-based UX; explicit dates are power-user or "Pick dates" flow. Chips should feel authoritative.*

### Within Type: OR
- Categories: `CONCERT OR COMEDY OR THEATER`
- Venues: `Moody OR ACL OR Stubb's`

### Across Types: AND
```
(This Week) AND (CONCERT OR COMEDY) AND (Moody OR ACL) AND (has presale)
```

### Date Chips (Mutually Exclusive)
| Chip | Range |
|------|-------|
| Today | Today only |
| This Week | Today → Sunday |
| Weekend | Fri → Sun (current or next) |
| Pick dates... | Custom range picker |

*All ranges computed in `America/Chicago` timezone to avoid off-by-one issues.*

---

## Search Implementation

### What's Searchable

| Field | Source | Example |
|-------|--------|---------|
| Event title | `Event.title` | "Billie Eilish" |
| Performer name | `Performer.name` | "Arctic Monkeys" |
| Performer tags | `Performer.tags` | "dreampop", "indie rock" |
| Venue name | `Venue.name` | "Moody Center" |

### Search Behavior

1. **Debounced input** (300ms)
2. **Results update main list** (not separate view)
3. **Combines with other filters** via AND
4. **URL persists:** `?q=dreampop&categories=CONCERT`
5. **Typo tolerant:** "artic" finds "Arctic Monkeys"
6. **Relevance ranked:** Best matches first

### Placeholder Text (Teaching the Feature)

```
🔍 Search "Bill Burr", "dreampop", or "Sports"...
```

This hints that users can search:
- **Performers:** "Bill Burr", "Olivia Dean", "Arctic Monkeys"
- **Genres/tags:** "dreampop", "dance music", "indie rock"
- **Category names:** "Sports", "Comedy", "Theater"
- **Venues:** "Moody Center", "Stubb's"

### Search vs Category Filters (Important Clarification)

**`q` is pure text search. It does NOT auto-set category filters.**

| User types | What happens |
|------------|--------------|
| "Sports" | Text search for "Sports" in titles, performer names, tags |
| | Does NOT auto-flip `categories=SPORTS` |
| | User must explicitly tap [Sports] chip if they want category filter |

*Rationale: Magical behavior is confusing. If user wants category filter, they tap the chip. Search is search.*

**Future consideration:** We could add smart suggestions in typeahead ("Did you mean the Sports category?") but that's Phase 2+ polish.

### Typeahead Suggestions (Phase 2 Enhancement)

**MVP:** Just filter results on Enter/debounce. Placeholder teaches the feature.

**Phase 2:** Add categorized typeahead dropdown:

```
User types: "bill"
┌─────────────────────────────────────┐
│ 🎤 Bill Burr (comedian)             │
│ 🎤 Billy Strings (artist)           │
│ 📅 "Kill Bill Vol. 1" screening     │
└─────────────────────────────────────┘
```

**Typeahead API:** `GET /api/search/suggest?q=bill`

```json
{
  "performers": [
    { "id": "...", "name": "Bill Burr", "type": "COMEDIAN" },
    { "id": "...", "name": "Billy Strings", "type": "ARTIST" }
  ],
  "events": [
    { "id": "...", "title": "Kill Bill Vol. 1 screening" }
  ],
  "tags": [
    { "tag": "bill-paying blues", "count": 3 }
  ]
}
```

### Technical Approach: pg_trgm + ILIKE Hybrid

We use PostgreSQL's `pg_trgm` extension for fuzzy matching with ILIKE fallback:

**Why pg_trgm:**
- ✅ Typo tolerance ("artic" → "Arctic Monkeys")
- ✅ Substring matching ("arc" → "arctic")
- ✅ Relevance ranking (best matches first)
- ✅ Fast with GIN index
- ✅ Simple setup (~30 min)

**Setup (one-time migration):**
```sql
-- Enable extension (Supabase has it)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes
CREATE INDEX CONCURRENTLY idx_event_title_trgm 
  ON "Event" USING GIN (title gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_performer_name_trgm 
  ON "Performer" USING GIN (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_venue_name_trgm 
  ON "Venue" USING GIN (name gin_trgm_ops);
```

**Query:**
```sql
WHERE 
  -- Trigram similarity (fuzzy + ranked)
  event.title % :query 
  OR performer.name % :query
  OR venue.name % :query
  -- ILIKE fallback for exact substrings
  OR event.title ILIKE '%' || :query || '%'
  OR performer.name ILIKE '%' || :query || '%'
  -- Tag array containment
  OR performer.tags @> ARRAY[:query]
ORDER BY 
  GREATEST(
    similarity(event.title, :query),
    COALESCE(similarity(performer.name, :query), 0),
    similarity(venue.name, :query)
  ) DESC
```

**Similarity threshold:** Default is 0.3 (30% similar). Can tune via `SET pg_trgm.similarity_threshold = 0.2;`

### Search Edge Cases

| Scenario | Behavior |
|----------|----------|
| **No results** | Show empty state: "No events found for '[query]'" + "Clear search" button |
| **Very short query (1-2 chars)** | Skip fuzzy matching, use ILIKE only (performance) |
| **Query + other filters = 0 results** | Show: "No [category] events matching '[query]'" + suggest clearing one filter |

---

## "More" Panel (Bottom Sheet / Slide Panel)

### What is it?

A **secondary filter surface** that opens when user taps "More ▾":
- **Mobile:** Slides up from bottom (bottom sheet pattern)
- **Desktop:** Slides down from filter strip or opens as modal

### Why a panel instead of inline?

| Inline chips | Panel |
|--------------|-------|
| Limited space | Room for all options |
| Clutters main strip | Keeps strip clean |
| Can't search venues | Search + scroll list |
| No conditional sections | Can show genres when music selected |

### Content Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Categories                                                 │
│  [Concerts ✓] [Comedy] [Theater ✓] [Sports] [Movies]       │
│  [Festivals] [Other]                                        │
├─────────────────────────────────────────────────────────────┤
│  Venues                                                     │
│  🔍 Search venues...                                        │
│  ☑ Moody Center                                             │
│  ☑ ACL Live                                                 │
│  ☐ Emo's Austin                                             │
│  ☐ Paramount Theatre                                        │
│  ☐ Stubb's                                                  │
│  ... (alphabetical, scrollable)                             │
├─────────────────────────────────────────────────────────────┤
│                                              [Clear all]    │
└─────────────────────────────────────────────────────────────┘
```

**⚠️ No genres section in panel.** Search handles genre/tag filtering via `?q=dreampop`. This is simpler and more discoverable via the search placeholder hint. Do not add a genres section during implementation.

### Behavior

1. **Opens as overlay** - doesn't push content down
2. **Instant apply** - every tap updates URL and results behind panel
3. **Visual feedback** - chips highlight immediately on tap
4. **Close gestures:**
   - Tap outside panel
   - Swipe down (mobile)
   - "Done" button or X (optional)
5. **Selected items persist** - venues/genres appear as removable chips in main strip

### Implementation Notes

**Mobile (bottom sheet):**
- Use `framer-motion` or CSS `transform: translateY()` for smooth slide
- Draggable handle at top for swipe-to-dismiss
- Max height: 70vh (user can still see header)
- Scrollable content area

**Desktop (slide panel):**
- Slides down from filter strip
- Or: modal overlay centered
- Max width: 480px
- Closes on Escape key

---

## New/Presales Integration

### Current Behavior (Legacy) - MUST CHANGE

**File:** `src/components/EventListWithPagination.tsx`

**What happens now:**
```
User clicks [✨ New] chip
         ↓
Sets activeDiscoveryChip = 'new'
         ↓
Component renders COMPLETELY DIFFERENT VIEW:
  - Fetches from /api/events/recent (separate API)
  - Renders simplified inline cards (not EventCard)
  - No date grouping
  - No pagination
  - Does NOT filter main events list
```

**Problems with current approach:**
1. ❌ Can't combine with other filters ("new concerts this week")
2. ❌ Different card UI (confusing)
3. ❌ No pagination on new/presales views
4. ❌ Separate data sources, not integrated

### New Behavior (Target)

**Chips filter the main list, not replace it:**
```
User clicks [✨ New] chip
         ↓
URL updates to ?new=true
         ↓
Main events query adds: WHERE createdAt > NOW() - INTERVAL '48 hours'
         ↓
Same EventCard components, same date grouping, same pagination
         ↓
Can combine: ?new=true&categories=CONCERT&when=thisWeek
```

**Benefits:**
- ✅ Combines with all other filters
- ✅ Same UI (EventCard, date groups, pagination)
- ✅ Single data source (main events query)
- ✅ URL shareable

### Migration Tasks

| Task | Description |
|------|-------------|
| 1. Add params to main query | `getEventsWithSocialSignals` accepts `new`, `presales` booleans |
| 2. Implement filter logic | `WHERE createdAt > NOW() - '48h'` for new, presale join for presales |
| 3. Remove separate views | Delete the `activeDiscoveryChip === 'new'` branch in EventListWithPagination |
| 4. Update DiscoveryStrip | Chips update URL params, not local state |
| 5. Keep sidebar counts | CalendarSidebar can still show counts, but links go to `?new=true` |

### API Changes

**Current (separate endpoints):**
- `GET /api/events/recent` → returns new listings
- `GET /api/events/presales` → returns presale events

**New (integrated into main query):**
- `GET /api/events?new=true` → main query + createdAt filter
- `GET /api/events?presales=true` → main query + presale join

**Query additions to `getEventsWithSocialSignals`:**
```sql
-- For ?new=true
AND "Event"."createdAt" > NOW() - INTERVAL '48 hours'

-- For ?presales=true  
AND EXISTS (
  SELECT 1 FROM "Enrichment" e 
  WHERE e."eventId" = "Event".id 
  AND (
    e."tmPresales" IS NOT NULL 
    OR e."tmOnSaleStart" > NOW()
  )
)
```

---

## Discover Stub (Phase 2)

### Entry Point
- `[✨ Discover]` chip at end of filter strip
- Or small link below search: "✨ Explore by genre, scene, vibe →"

### Stub Page Content (`/discover`)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     ✨ Discover                                             │
│                                                             │
│     We're building a new way to explore Austin events       │
│     by genre, scene, and vibe.                              │
│                                                             │
│     Coming soon:                                            │
│     • Browse by tags (dreampop, punk, jazz, all-ages)       │
│     • Follow your favorite artists                          │
│     • Personalized recommendations                          │
│                                                             │
│     [← Back to Events]                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

```
src/components/
├── discovery/
│   ├── FilterStrip.tsx          # Main chip strip
│   ├── SearchInput.tsx          # Debounced search
│   ├── DateChips.tsx            # Today, This Week, etc.
│   ├── CategoryChips.tsx        # Quick category chips
│   ├── DiscoveryChips.tsx       # New, Presales with counts
│   ├── MorePanel.tsx            # Bottom sheet / slide panel
│   ├── VenueSelector.tsx        # Search + checkbox list
│   └── ActiveFilters.tsx        # Removable chips row
├── EventFilters.tsx             # DEPRECATED - remove after migration
```

---

## Migration Plan

### Phase 1: Filter Strip + Search (MVP)

**Week 1:**
- [ ] Create `FilterStrip` component shell
- [ ] Implement date chips with instant URL update
- [ ] Implement category chips (top 4 inline)
- [ ] Remove Apply button, make all filters instant

**Week 2:**
- [ ] Build `MorePanel` with full categories + venue search
- [ ] Implement `SearchInput` with debounce
- [ ] Add search to events API (`?q=` param)
- [ ] Integrate New/Presales as filter chips

**Week 3:**
- [ ] Mobile optimization pass (390px)
- [ ] Remove legacy `EventFilters.tsx`
- [ ] Update sidebar (remove redundant New/Presales cards)
- [ ] Testing + polish

### Phase 2: Discover Entry Point

**Week 4:**
- [ ] Create `/discover` route with stub page
- [ ] Add entry point chip/link to filter strip
- [ ] Wire navigation

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Mobile: first event visible | Above fold on 390px viewport |
| Filter interactions | No "Apply" button, all instant |
| Search latency | < 500ms from keystroke to results |
| URL persistence | All filters persist in URL, work with back button |

### Analytics (Instrument These)

Track the following to validate adoption:
- Filter chip clicks (which chips, how often)
- "More" panel opens
- Search usage (queries, result counts)
- Discover entry clicks
- Filter combinations (what do users combine most?)

---

## Open Questions

| Question | Proposed Answer |
|----------|-----------------|
| Keep sidebar New/Presales cards? | Remove or make secondary (chips are primary) |
| How many category chips inline? | 3-4 most popular: Concerts, Comedy, Theater, Sports |
| Search placeholder text? | `Search "Bill Burr", "dreampop", or "Sports"...` |
| Discover entry point style? | **v1 (stub):** Subtle link below search. **Later (with content):** Promote to visible ✨ Discover chip near search. Build entry point in a location that's easy to upgrade later. |

---

## Appendix: Files to Modify

| File | Change |
|------|--------|
| `src/components/EventFilters.tsx` | Replace entirely with FilterStrip |
| `src/components/EventListWithPagination.tsx` | **Remove separate new/presales views**, update DiscoveryStrip usage |
| `src/components/DiscoveryStrip.tsx` | Update to use URL params instead of local state |
| `src/components/CalendarSidebar.tsx` | Update links to use `?new=true` instead of `?discovery=new` |
| `src/components/HomePageContent.tsx` | Update to use new FilterStrip |
| `src/app/page.tsx` | Add `q`, `new`, `presales`, `when` params to searchParams |
| `src/db/events.ts` | Add search + new/presales filter logic to `getEventsWithSocialSignals` |
| `src/app/discover/page.tsx` | NEW - stub page |

### Legacy Code to Remove

```
src/components/EventListWithPagination.tsx:
  - Lines 151-235: Separate new/presales view rendering
  - State: activeDiscoveryChip, presaleEvents, newListingEvents
  - The entire conditional render based on activeDiscoveryChip
```

---

*Document version: 1.0*  
*Based on: `notes/discovery-sandbox-proposal.md`*

