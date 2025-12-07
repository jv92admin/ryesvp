# Discovery Sandbox: Filter UX Redesign Proposal

**Author:** Engineering + PM  
**Date:** December 7, 2025  
**Status:** v1 Spec — Ready for Implementation

---

## Executive Summary

Redesign the event filter UI from a form-like configuration panel into a **Discovery Sandbox** — a single, cohesive control area that blends time-based discovery, category filtering, and special discovery dimensions (New, Presales) into one elegant strip.

---

## Problem Statement

**The current filter UI feels like filling out a form, not exploring events.**

Users approaching the calendar shouldn't need to pre-configure a query ("I want concerts at Moody Center next week"). They should be able to **browse and narrow fluidly**, starting from their availability and mood.

The existing design creates friction through:
- Dropdown menus requiring multiple clicks
- A rigid two-row layout with awkward separators
- An "Apply" button that breaks the exploration flow
- Visual disconnection between "discovery" features (New, Presales) and "filters" (Category, Venue, Date)

---

## Current State

### Layout (3 rows)

```
Row 1: [Category ▾] [Venue ▾] | [This Week] [Next Week]
Row 2: [From ___] – [To ___]                    [Clear] [Apply]
Row 3: (Sidebar) New Listings card, Presales card
```

### Issues

| Problem | Impact |
|---------|--------|
| Dropdowns for Category/Venue | Extra clicks, feels like a form |
| Separator `\|` between venue and date | Arbitrary visual hierarchy |
| "Apply" button | Breaks flow, signals "query" not "browse" |
| Date range inputs | Low discoverability, rarely used |
| New/Presales in sidebar only | Discovery features hidden from main flow |
| Two distinct rows | Takes space but feels rigid |

---

## v1 Target Experience

### Design Principles

1. **One cohesive control area** — No labeled sections (DISCOVER/WHEN/FILTER). All chips live in a single unified strip. Group via spacing/ordering, not headings.

2. **Lead with When + Category** — Most users start with "I'm free this weekend and I'm in the mood for X." Date and category are primary; New/Presales are secondary discovery dimensions.

3. **Mobile constraint: one event card above the fold** — This is a hard UX constraint. The control area must be compact enough that users see content immediately.

4. **Instant apply, no button** — Every tap immediately filters the list and updates the URL.

5. **Progressive disclosure** — Core filters visible; advanced options in expandable panel.

6. **Venues don't scale as chips** — Use a dropdown/bottom sheet with search, not inline chips.

---

## v1 Layout

### Main Strip (Always Visible)

```
[Today]  [This Week]  [Weekend]  [Pick dates...]  •  [Concerts]  [Comedy]  [Theater]  •  [✨ New]  [⚡ Presales]  •  [More ▾]
```

**Groupings (via spacing, not labels):**
- **Date chips:** Today, This Week, Weekend, Pick dates...
- **Category chips:** Top 2-4 categories (Concerts, Comedy, Theater, Sports)
- **Discovery chips:** New, Presales
- **Overflow:** More ▾

### "More ▾" Panel (Expandable)

Opens as bottom sheet (mobile) or slide-down panel (desktop):

```
┌─────────────────────────────────────────────┐
│  Categories                                 │
│  [Concerts ✓] [Comedy] [Theater ✓] [Sports] │
│  [Movies] [Festivals] [Other]               │
├─────────────────────────────────────────────┤
│  Venues                                     │
│  🔍 Search venues...                        │
│  ☑ Moody Center                             │
│  ☐ ACL Live                                 │
│  ☐ Emo's Austin                             │
│  ☐ Paramount Theatre                        │
│  ...                                        │
├─────────────────────────────────────────────┤
│                              [Clear all]    │
└─────────────────────────────────────────────┘
```

- Filters apply instantly (no "Apply" button)
- Panel collapses after user is done
- Active filters persist as chips in main strip

---

## Visual States

### Default (No Filters)

```
[Today]  [This Week]  [Weekend]  [Pick dates...]  •  [Concerts]  [Comedy]  [Theater]  •  [✨ New]  [⚡ Presales]  •  [More ▾]
```

### With Active Filters

```
[This Week ✓]  [Pick dates...]  •  [Concerts ✓]  [Comedy]  [Theater]  •  [✨ New]  [⚡ Presales]  •  [Moody Center ×]  [More ▾]  [Clear]
```

- Selected date/category chips show checkmark or highlight
- Selected venues appear as removable chips in main strip
- "Clear" link appears when any filters are active

### Mobile (Compact)

```
[This Week]  [Weekend]  •  [Concerts]  [Comedy]  •  [New]  [More ▾]
```

- Horizontally scrollable if needed
- Must leave room for at least one event card above the fold

---

## Filter Semantics

### Within a Filter Type: OR

- Categories: `Concerts OR Comedy OR Theater`
- Venues: `Moody Center OR ACL Live OR Emo's`
- Dates: Single selection (mutually exclusive)

### Across Filter Types: AND

```
(This Week) AND (Concerts OR Comedy) AND (Moody Center OR ACL Live) AND (has presale)
```

This matches user expectations and standard consumer app behavior.

---

## Detailed Behavior

### Date Chips

| Chip | Behavior |
|------|----------|
| Today | Filters to today only |
| This Week | Today → end of current week (Sunday) |
| Weekend | Friday → Sunday of current/next weekend |
| Pick dates... | Opens inline date range picker, collapses to `[Dec 15-22 ×]` |

*Date chips are mutually exclusive — selecting one deselects others.*

### Category Chips

| Visibility | Chips |
|------------|-------|
| Main strip | Top 3-4: Concerts, Comedy, Theater, (Sports?) |
| More panel | All 7 categories |

*Multi-select. Categories combine via OR.*

### Discovery Chips

| Chip | Behavior | Notes |
|------|----------|-------|
| ✨ New | Events added in last 48 hours | Shows count if > 0 |
| ⚡ Presales | Events with active/upcoming presales | Shows count if > 0 |

*These combine with other filters via AND.*

### Venue Selection

| Location | Behavior |
|----------|----------|
| Main strip | Selected venues appear as removable chips |
| More panel | Search field + scrollable checkbox list |

*Multi-select. Venues combine via OR. Alphabetically sorted.*

### "Coming Soon" Chips

**Policy:** At most ONE coming-soon chip, or none at all.

- If shown: `[👥 Friends Going]` with low-contrast disabled styling
- Multiple greyed-out chips make the UI feel half-finished
- Prefer hiding future features until they have real backing logic

---

## Mobile Constraints

### Hard Requirement

**At least one event card must be visible above the fold without scrolling.**

### Implementation

1. **Default view:** Single strip (or two compact rows max), then event list
2. **Chip overflow:** Horizontal scroll with fade hint, not wrapping
3. **More panel:** Bottom sheet that overlays content, doesn't push it down
4. **Aggressive pruning:** On small screens, show fewer category chips in main strip

### Suggested Mobile Strip

```
[This Week]  [Weekend]  •  [Concerts]  [Comedy]  •  [✨ New]  [More ▾]
```

---

## Future Considerations (Not v1)

### Tag Search

Leave visual space for a future search field that:
- Lets users type tags (e.g., "queer", "indie", "all ages")
- Converts confirmed tags into chips
- Searches across event titles, performers, genres

*For v1, we don't implement this, but the layout should accommodate it.*

### Additional Discovery Dimensions

Future chips that could join the strip:
- 👥 Friends Going — events where friends have RSVP'd
- 🔥 Trending — popularity-based signal
- 🎵 For You — personalized recommendations (requires Spotify integration)

---

## Migration Path

### Phase 1: Structure
- Replace current 2-row filter layout with single strip
- Move New/Presales from sidebar into strip
- Implement "More ▾" panel with categories + venues
- Remove "Apply" button, make all filters instant

### Phase 2: Polish
- Add counts to New/Presales chips when populated
- Refine chip styling (size, spacing, colors)
- Implement venue search in More panel
- Mobile optimization pass

### Phase 3: Iteration
- User testing with existing users
- Adjust chip visibility/ordering based on usage data
- Consider adding one "coming soon" teaser if appropriate

---

## Implementation Notes

### URL Structure

All filter state persists in URL params for shareability and back-button support:

```
/?when=thisWeek&categories=CONCERT,COMEDY&venues=moody-center&discovery=new
```

### Component Structure

```
<DiscoverySandbox>
  <FilterStrip>
    <DateChips />
    <CategoryChips />
    <DiscoveryChips />
    <MoreButton />
    <ActiveVenueChips />
    <ClearButton />
  </FilterStrip>
  <MorePanel isOpen={...}>
    <CategorySection />
    <VenueSection />
  </MorePanel>
</DiscoverySandbox>
```

### Existing Components to Reuse

- `ToggleChip` from `@/components/ui` — for filter chips
- `TagChip` from `@/components/ui` — for removable venue chips
- Existing URL param logic from `EventFilters.tsx`

---

## Open Questions (Resolved)

| Question | Decision |
|----------|----------|
| Zone labels? | **No labels.** One cohesive control area. |
| Venue overflow? | **More panel** with search + checkbox list |
| Mobile layout? | **Single strip**, horizontally scrollable, one event card above fold |
| Counts on chips? | **Discovery chips only** (New, Presales) |
| Coming soon chips? | **At most one**, or none until feature is ready |

---

## Appendix: Design Iterations

### Iteration 0: Current State (Starting Point)

```
[Category ▾] [Venue ▾] | [This Week] [Next Week]
[From ___] – [To ___]                [Clear] [Apply]
```

**Problems:** Form-like, dropdowns, Apply button, disconnected discovery.

---

### Iteration 1: Unified Filter Chips (Rejected)

```
[+ Add Filter]  [Concerts ×]  [Moody Center ×]  [This Week ×]
```

**Rejected:** "+ Add Filter" popover gets clunky with many options.

---

### Iteration 2: Popover with Search (Rejected)

```
[+ Filters] → opens searchable popover
```

**Rejected:** Still feels like a modal/form, hides everything.

---

### Iteration 3: Discovery Strip (Partial)

```
[✨ New]  [⚡ Presales]  [This Week]  [Concerts ▾]  [Venues ▾]
```

**Partial:** Good direction but still had dropdown triggers, led with discovery instead of time.

---

### Iteration 4: Three-Zone Sandbox (Rejected)

```
DISCOVER
[✨ New]  [⚡ Presales]  [🔥 Trending]  [👥 Friends Going]

WHEN
[This Week]  [Next Week]  [This Month]

FILTER
[Concerts]  [Comedy]  •  [Moody]  [ACL Live]
```

**Rejected:** Explicit labels make it feel like three toolbars. Venues as chips don't scale. Discovery chips promoted too prominently.

---

### Iteration 5: Discovery Sandbox v1 (Final)

```
[Today]  [This Week]  [Weekend]  •  [Concerts]  [Comedy]  •  [✨ New]  [⚡ Presales]  •  [More ▾]
```

**Accepted:** 
- One cohesive strip, no labels
- Time + Category first, Discovery second
- Venues in More panel with search
- Mobile-friendly, one event above fold
- Instant apply, no button

---

*Document version: 2.0*  
*Last updated: December 7, 2025*
