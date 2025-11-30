# UI Design Reference

> **Living document** — Updated as pages are redesigned. Source of truth for design decisions, patterns, and component usage.

---

## Design Principles

From `product-vision.md`:

- **Mobile-first:** Most decisions about going out happen on phones
- **Scannable:** Event cards, friend signals, and plans should be glanceable
- **Fast:** No loading spinners for core flows — optimistic updates, prefetching
- **Exportable:** Everything important can be copied, shared, or sent elsewhere
- **Subtle, not flashy:** The event is the star, not the app

**Typography:** Geist Sans  
**Color approach:** Image-forward event cards, visual badges for social signals

---

## Event Detail Page

**Route:** `/events/[id]`  
**File:** `src/app/events/[id]/page.tsx`  
**Last updated:** November 2025

### Layout Overview (Mobile)

```
┌─────────────────────────────────┐
│ [← All Events]     [Share 📤]  │  ← Navigation bar
├─────────────────────────────────┤
│                                 │
│         [Hero Image]            │  ← Full-width, rounded
│                                 │
├─────────────────────────────────┤
│ [NEW] [CONCERT]                 │  ← Badges row
│ Event Title                     │
│ Sat, Dec 14 • 8:00 PM          │  ← Compact date/time
│ 📍 Moody Center, Austin • Link │  ← Venue + event website
├─────────────────────────────────┤
│ What's your status?  [X going] │  ← Heading + attendance pill
│ ┌─────────┐ ┌─────────┐        │
│ │★ Interest│ │✓ Going │        │  ← 2x2 status grid
│ └─────────┘ └─────────┘        │
│ ┌─────────┐ ┌─────────┐        │
│ │🎫 Need  │ │🎟️ Have │        │
│ └─────────┘ └─────────┘        │
│                                 │
│ ┌─────────────────────────────┐│
│ │    👥 View Squad / Go       ││  ← Prominent, full-width
│ │       Together              ││
│ └─────────────────────────────┘│
├─────────────────────────────────┤
│ Buy                            │
│ [Buy on Ticketmaster]          │  ← Full-width, TM blue
│ (disclaimer text)              │
├─────────────────────────────────┤
│ Explore                        │
│ ┌────┐ Artist Name             │  ← If image available
│ │ 🎵 │ Short description       │
│ └────┘ [genres] [Listen]       │
│   OR                           │
│ [Listen on Spotify]            │  ← If no image, just button
├─────────────────────────────────┤
│ About                          │  ← Moved to last
│ Description text...            │  ← Truncated, "Read more"
│ 📍 Venue Name, Address → Maps  │
└─────────────────────────────────┘
```

### Layout Overview (Desktop)

Same order, but:
- **Buy card and Explore card are side-by-side** (2-column grid at `lg` breakpoint)
- About card is full-width below the grid
- Max width: `max-w-5xl`

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `FriendsAndStatusCard` | `src/components/FriendsAndStatusCard.tsx` | Status toggles, attendance pill, View Squad CTA |
| `CombinedAttendanceModal` | `src/components/CombinedAttendanceModal.tsx` | Shows going + interested in one modal |
| `PrimaryCTACard` | `src/components/PrimaryCTACard.tsx` | Ticketmaster "Buy" button only |
| `ExploreCard` | `src/components/ExploreCard.tsx` | Artist image + info + Spotify, or just Spotify button |
| `AboutCard` | `src/components/AboutCard.tsx` | Description (truncated), venue link |
| `ShareButton` | `src/components/ShareButton.tsx` | Full button in header navigation |

### Design Decisions

#### Share Button
- **Location:** Top navigation bar, next to "All Events" back button
- **Rationale:** Prominent placement for easy sharing. Originally planned as icon in AboutCard header, but moved for visibility.

#### Status Toggles
- **Layout:** 2x2 grid, all 4 always visible
- **Sizing:** Compact (`px-2 py-1.5`, `text-xs sm:text-sm`)
- **Colors:**
  - Interested: Yellow (`bg-yellow-500`)
  - Going: Green (`bg-green-600`)
  - Need Tickets: Blue (`bg-blue-600`)
  - Have Tickets: Purple (`bg-purple-600`)

#### Attendance Summary
- **Format:** Clickable pill next to "What's your status?" heading
- **Text:** "X going, Y interested" (shows counts that exist)
- **Interaction:** Opens `CombinedAttendanceModal` showing both groups in one view
- **Modal design:** Color-coded sections — green dot + "X going" header, yellow dot + "Y interested" header
- **Rationale:** Originally planned as separate row with avatars. Simplified to pill for compactness. Combined modal reduces friction vs. separate modals per status.

#### View Squad Button
- **Placement:** Full-width, centered, between status section and CTAs
- **Styling:** Prominent, matches importance of status selection
- **Rationale:** Originally planned as Row 3 in a stacked layout. Made more prominent as it's a key action.

#### Primary CTAs (Buy + Explore)
- **Layout:** 2-column grid on desktop (`lg` breakpoint), stacked on mobile
- **Cards have matching heights** (`h-full flex flex-col`)

**Buy Card (PrimaryCTACard):**
- **Ticketmaster:** Full-width button, `#01579B` blue, with globe icon
- **Disclaimer:** Small gray text below TM button
- **Label:** "Buy" heading

**Explore Card (ExploreCard):**
- **Two modes:**
  1. **With artist image:** Shows image (w-20/w-24) + artist name + description (2 lines) + genres (up to 3) + "Listen on Spotify" pill button
  2. **Without image:** Shows full-width "Listen on Spotify" button only
- **Spotify:** `#1DB954` green
- **Label:** "Explore" heading

**About Card:**
- Moved to **last position** (below Buy/Explore grid)
- Reduces repetition, prioritizes primary actions

#### Event Header
- **Date format:** Compact single line: "Sat, Dec 14 • 8:00 PM"
- **Venue format:** "📍 Venue Name, City, State • Visit event website"
- **Event website link:** Inline with venue (added during implementation)
- **Badges:** NEW (emerald), Category (colored by type), Status (if not scheduled)

#### About Section
- **Position:** Last card on the page (below Buy/Explore grid)
- **Truncation:** 150 characters, then "Read more"
- **Venue link:** Opens Google Maps if address available, else venue URL
- **Rationale:** Moved to last to reduce repetition (event website link already in header) and prioritize actions

### Category Colors

```typescript
const categoryColors = {
  CONCERT: 'bg-purple-100 text-purple-800',
  COMEDY: 'bg-yellow-100 text-yellow-800',
  THEATER: 'bg-pink-100 text-pink-800',
  MOVIE: 'bg-red-100 text-red-800',
  SPORTS: 'bg-green-100 text-green-800',
  FESTIVAL: 'bg-orange-100 text-orange-800',
  OTHER: 'bg-gray-100 text-gray-800',
};
```

### Logged-Out State
- Status toggles: Disabled, grayed out
- "Sign in to mark your status" link below toggles
- View Squad button: Hidden
- Share button: Still visible

---

## Squad Page

**Route:** `/squads/[id]`  
**Status:** 🔲 Not yet implemented

### Planned Layout

*To be documented after implementation*

### Components

*To be documented after implementation*

### Design Decisions

*To be documented after implementation*

---

## Squad Modal

**File:** `src/components/squad/SquadModal.tsx`  
**Status:** 🔲 Pending slim-down refactor

### Current State

Full-featured modal with:
- Event header
- Status controls
- Squad snapshot (members, ticket status)
- Logistics (meetTime, meetSpot)
- Share buttons
- Leave Squad

### Planned Changes

After Squad page is built, modal becomes a "quick preview":
- Keep: Event header, your status, member summary
- Add: "View Full Squad →" button
- Remove: Detailed member list, logistics editing, share buttons

---

## Home Page / Event List

**Route:** `/`  
**Status:** ✅ Existing design (not recently changed)

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `EventCard` | `src/components/EventCard.tsx` | Event card in list view |
| `EventFilters` | `src/components/EventFilters.tsx` | Category + venue multi-select |
| `SocialTab` | `src/components/SocialTab.tsx` | Your Plans, Almost Plans |
| `ViewToggle` | `src/components/ViewToggle.tsx` | Calendar/Social toggle |

*Full documentation to be added when this page is redesigned*

---

## Social Tab

**File:** `src/components/SocialTab.tsx`  
**Status:** ✅ Existing design

### Layout

3-column grid on desktop, stacked on mobile:
1. **Your Plans** — Squads + events you're going to
2. **Almost Plans** — Events where you + friends overlap
3. **Community & Tickets** — Stubbed, "Coming Soon"

*Full documentation to be added when redesigned*

---

## Common Patterns

### Card Style
```css
bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6
```

### Button Styles

**Primary (filled):**
```css
px-6 py-3 text-white font-medium rounded-lg transition-colors hover:opacity-90
```

**Secondary (outline):**
```css
px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50
```

**Status toggle (inactive):**
```css
bg-white border border-gray-300 text-gray-700 hover:bg-gray-50
```

### Spacing
- Section gap: `mb-6`
- Card padding: `p-4 sm:p-6`
- Element gap within cards: `gap-2` or `gap-3`

### Responsive Breakpoints
- `sm`: 640px — Slight padding/text increases
- `lg`: 1024px — Side-by-side layouts (2-column grids)
- Max content width: `max-w-5xl`

### Avatar Display
- Utility: `src/lib/avatar.ts`
- Functions: `getAvatarStyle()`, `getInitials()`, `getDisplayName()`
- Size: `w-6 h-6` for inline, `w-8 h-8` for prominent

---

## Data Display Rules

### displayTitle
- **ALWAYS** use `displayTitle` from data layer
- **NEVER** compute title in components
- See `notes/data-model-101.md`

### Enrichment
- List views: Use `EnrichmentDisplay` subset (spotifyUrl, tmUrl, genres)
- Detail views: Fetch full `Enrichment` via `getEventEnrichment()`

### Social Signals
- Fetched via `getEventDetailedSocial()` for detail page
- Includes friends list with statuses, community attendance

---

## Changelog

| Date | Page | Change |
|------|------|--------|
| Nov 2025 | Event Detail | Phase 1 restructure — merged cards, moved decisions above fold |
| Nov 2025 | Event Detail | Combined attendance modal (going + interested in one view, color-coded) |
| Nov 2025 | Event Detail | CTA reorganization — Buy + Explore side-by-side, About moved to last |
| Nov 2025 | Event Detail | ExploreCard with artist image + listen layout when image available |

---

*Last Updated: November 2025*

