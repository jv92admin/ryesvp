#CURRENT PROPOSAL
RyesVP Discovery & Filters – Product Vision
1. Why we’re doing this

Right now the Events home view is trying to do too much in a cramped space:

A form-like filter bar (dropdowns, from/to, Apply button)

A separate New/Presales strip

Tabs for All Events / Your Events

On mobile this means multiple “control rows” before you see any events. It feels like configuring a search query, not browsing what’s happening.

At the same time, we’re starting to accumulate rich metadata (categories, tags, scenes, favorites). We need a place where people can actually play with that data without turning the main list into a control panel.

Primary objective:
Clean up the top of the Events view so it feels simple and legible, while laying the groundwork for a richer, separate Discover experience.

2. Vision in one sentence

A clean Events list with a minimal, chip-based filter strip, and a separate Discover surface where users can explore by tags, vibes, and preferences.

Events view = “find something for this night.”
Discover = “wander, tune your tastes, fall down rabbit holes.”

3. Experience overview
3.1 Events view – Filters as a lightweight “Discovery Strip”

The existing “Discovery Sandbox” spec becomes the default filter experience for All Events.

Principles

One cohesive strip

No big headings (“DISCOVER / WHEN / FILTER”).

Just a single chip/search area above the list.

Lead with When + Category

People usually start with “When am I free?” and “What am I in the mood for?”

Date and category chips come first; “New / Presales” are secondary.

Instant apply, no form

Every tap updates results immediately.

No global “Apply” button on the main screen.

Mobile: content above the fold

Hard constraint: at least part of the first event card must be visible without scrolling.

Target UI shape (conceptual)

Header (logo, Start Plan, etc.)

Tabs: All Events / Your Events

Filter strip (single compact area):

Date chips: Today, This Week, Weekend, Pick dates…

2–4 primary category chips: Concerts, Comedy, etc.

Discovery chips: New, Presales (with counts when non-zero)

More filters ▾ for overflow

Event list starts immediately.

More filters panel

More filters ▾ opens a compact panel/bottom sheet with:

Full category list (multi-select)

Venue selector:

Search field

Alphabetical multi-select list

Changes apply instantly; no extra Apply on the main page.

Selected venues appear as removable chips in the main strip.

Filter semantics

OR within a type (multiple categories, multiple venues).

AND across types (This Week AND (Concerts OR Comedy) AND (Moody OR ACL) AND New).

This keeps the top of the page clean while still giving power users enough control.

3.2 Discover – a dedicated exploration hub

Separate from the Events list, we introduce a Discover surface.

For v1 this can be a simple, clearly branded page reachable from the Events view (e.g., ✨ Discover chip near search or in the header). Initially it may even be a “Coming soon” stub, but the UX paths and visual home should exist.

Long-term role of Discover

New-user onboarding (taste setup)

First-run experience for new users:

“Pick some artists, tags, scenes, and venues you like.”

Seeds initial preferences for recommendations and “For You” style rows.

Ongoing exploration & preference tuning

A place to:

Browse by tags (genres, moods, vibes, neighborhoods).

Follow artists, venues, scenes.

Adjust discovery preferences (e.g., “more small rooms, fewer big arenas”).

Rabbit-hole entry point

“More like this” for a tag, artist, or venue.

Potential destination when tapping a tag on an event card:

Tap Indie rock → open Discover with that tag pre-selected.

v1 Discover scope

Very lightweight page reachable from:

A ✨ Discover entry point near the filter strip / search.

Content for now:

Even a simple “Coming soon” message is acceptable.

Optionally: a few static blocks like:

“New this week” (list of events)

“By category” (Concerts / Comedy / Sports rows)

The main goal of v1 is carving out the surface and wiring the navigation, not shipping full personalization.

4. Clickable tags on cards (Phase 2+)

We eventually want metadata tags on event cards (genre, scene, neighborhood, etc.) to be interactive pivots:

Tap a tag → either:

Apply that as a filter in place, or

Open Discover with that tag selected.

We will:

Keep card-level tags visually distinct from the main filter chips (smaller, lighter, different palette).

Use subtle hover/press feedback so people can learn they’re interactive.

Add at least one small hint somewhere (“Tip: tap tags on cards to explore more like them”).

Not required for the first iteration of this project, but it’s a key part of the longer-term discovery story.

5. Scope & phases
Phase 1 – Filter strip cleanup (MVP)

Replace current multi-row, form-style filters with the unified chip strip as defined in the Discovery Sandbox spec.

Implement More filters panel with category + venue selection.

Remove top-level From/To inputs and global Apply button.

Ensure mobile shows at least one event card above the fold.

Phase 2 – Discover entry point (MVP+)

Add a ✨ Discover entry point on the home Events view (near search/filters).

Implement a bare-bones Discover page:

At minimum: branded surface with “Coming soon” and a short message about what Discover will do.

Wire navigation so it’s a real destination, not a dead link.

Phase 3 – Discover v1 (taste + explore)

Add simple genre/scene/tag chips and “New this week / This weekend” rows on Discover.

Optionally experiment with:

Onboarding flow that routes first-time users through Discover.

Card tag clicks → Discover pre-filtered.

6. Success criteria (directional)

UX clarity

Users understand “Events” as the main list and “Discover” as a separate exploration space.

Fewer “what does this filter do?” questions in testing.

Perceived simplicity

Top of Events page visually lighter; more content seen on first screen.

Filter usage remains equal or increases despite fewer visible controls.

Foundation for future features

Easy to layer in:

Friends-going/Trending/For-You chips later.

Tag-based recommendation features on Discover.

This vision keeps the Events list fast and legible while letting you invest in a genuinely fun Discover experience over time, without the two fighting for the same cramped strip at the top of the page.














#####PREVIOUS SCOPING WORK
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
