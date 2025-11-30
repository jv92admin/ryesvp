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
**File:** `src/app/squads/[id]/page.tsx`  
**Last updated:** November 2025

### Layout Overview (Mobile)

```
┌─────────────────────────────────┐
│ ┌─────────────┬───────────────┐ │  ← Apple-style toggle
│ │    Plan     │    Day-of     │ │     (sliding background)
│ └─────────────┴───────────────┘ │
├─────────────────────────────────┤
│ Event Title                     │  ← Compact header, no image
│ Sat, Dec 14 • 8PM • Moody Ctr  │     Links to event page
├─────────────────────────────────┤
│ Going?  [Yes] [Maybe] [No]     │  ← Inline pill buttons
│                                 │
│ Guests? [+1] [+2] [3+]         │  ← Toggle pills (click to deselect)
│                                 │
│ Ticket? [Have/Getting] [Need]  │  ← Two options only
│                                 │
│ Cover others? [Name ×] [+ Add] │  ← Pills for covered + Add button
│ ┌─────────────────────────────┐│     Picker dropdown when Add clicked
│ │ ☑ PersonA  ☑ PersonB       ││
│ │ [Cover 2 selected]          ││
│ └─────────────────────────────┘│
├─────────────────────────────────┤
│ Ticket Price Guide             │  ← Squad-level, not per-person
│ GA: ~$75-90 (added by Alex)    │
│ [+ Add price info]             │
├─────────────────────────────────┤
│ Member | Going | Ticket        │  ← Column headers
│ ───────────────────────────    │
│ [👤] Alex (Org)    ✓    🎫    │  ← Compact rows
│ [👤] Maya          ?    (A)   │  ← (A) = covered by Alex
│ [👤] Jordan        ✓    🎫    │
│                                 │
│ [+ Invite friends]             │  ← Opens invite modal
├─────────────────────────────────┤
│ [Share Squad] [Share Day-of]   │  ← Copy text buttons
├─────────────────────────────────┤
│ ┌─────────────────────────────┐│
│ │       Leave Squad           ││  ← Red button, prominent
│ └─────────────────────────────┘│
└─────────────────────────────────┘
```

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `SquadPage` | `src/components/squad/SquadPage.tsx` | Client wrapper, mode toggle, state |
| `PlanModeView` | `src/components/squad/PlanModeView.tsx` | Plan mode layout |
| `SquadStatusControls` | `src/components/squad/SquadStatusControls.tsx` | Going? Yes/Maybe/No pills |
| `SquadGuestsSection` | `src/components/squad/SquadGuestsSection.tsx` | Guests? +1/+2/3+ pills |
| `SquadTicketsSection` | `src/components/squad/SquadTicketsSection.tsx` | Ticket status + Cover others |
| `SquadPriceGuideCard` | `src/components/squad/SquadPriceGuideCard.tsx` | Squad-level price info |
| `SquadMemberList` | `src/components/squad/SquadMemberList.tsx` | Compact member table |
| `SquadInviteModal` | `src/components/squad/SquadInviteModal.tsx` | Invite friends to squad |

### Design Decisions

#### Mode Toggle (Plan / Day-of)
- **Style:** Apple-style segmented control with sliding white background
- **Full-width** at top of page, rounded-full
- **Colors:** Gray-100 background, white pill for selected

#### Event Header
- **No image/logo** — Save real estate, just text
- **Compact:** Title + date/time/venue on one line
- **Links to event page** on click

#### Status/Guests/Ticket Pills
- **Inline format:** `Label?  [Option1] [Option2] [Option3]`
- **Pill style:** `rounded-full`, `text-xs`, colored when selected
- **Colors:**
  - Yes/Going: Green (`bg-green-100 text-green-700`)
  - Maybe: Amber (`bg-amber-100 text-amber-700`)
  - No/Out: Red (`bg-red-100 text-red-700`)
  - Ticket Have: Green
  - Ticket Need: Amber
  - Guests: Purple when selected
- **Toggle behavior:** Guests pills can be clicked again to deselect (returns to 0)

#### Cover Others Flow
- **No Yes/No buttons** — Just show covered people + Add button
- **Covered people:** Inline pills with × to remove
- **Add button:** Opens picker, checkboxes for remaining people
- **Picker:** Shows only people who need tickets (not already covered)

#### Ticket Price Guide
- **Squad-level, not per-person** — Avoids social awkwardness of showing budgets
- **Crowdsourced:** Any member can add price info
- **Shows:** Label (GA, Balcony), price range, who added, when
- **Editable:** Creator can edit/delete their entries

#### Member List
- **Column headers:** Member | Going | Ticket
- **Compact rows:** Avatar + Name + badges on left, status icons on right
- **Going icon:** ✓ (green), ? (amber), ✗ (red)
- **Ticket icon:** 🎫 (has), — (needs), (X) = covered by X's initial
- **Org badge:** Small purple "Org" pill
- **No +N badge:** Removed — covered status shown via ticket column

#### Share Buttons
- **Two buttons side-by-side:** Share Squad | Share Day-of
- **Share Squad:** Copies invite text with link
- **Share Day-of:** Copies logistics text (disabled if no meetTime/meetSpot set)

#### Leave Squad Button
- **Prominent red button** with border
- **In its own card** at bottom
- **Confirms before leaving**

### Day-of Mode

**Status:** ✅ Implemented  
**File:** `src/components/squad/DayOfModeView.tsx`

```
┌─────────────────────────────────┐
│ Event Title                     │  ← Compact header
│ Sat, Dec 14 • 8PM • Moody Ctr  │
├─────────────────────────────────┤
│ 📋 Itinerary                   │  ← SquadStops
│ ───────────────────────────    │
│ 6:00 PM  Pre-drinks @ Bar      │
│ 7:30 PM  Head to venue         │
│ 8:00 PM  Concert!              │
│ [+ Add stop]                   │
├─────────────────────────────────┤
│ 🌤️ Weather for Dec 14         │  ← Blue gradient card
│ 72°F (feels 70°) • Partly Cloudy│
│ High: 75° Low: 58°             │
│ 💧 10% rain • 💨 8mph          │
├─────────────────────────────────┤
│ 📋 Know before you go          │  ← From TM enrichment
│ Event Info: ...                │     (tmInfo, tmPleaseNote)
│ Please Note: No bags > 12"...  │
├─────────────────────────────────┤
│ ⚡ Quick actions               │
│ [🗺️ Maps]  [🚗 Uber]          │  ← External links
└─────────────────────────────────┘
```

#### Components

| Component | File | Purpose |
|-----------|------|---------|
| `DayOfModeView` | `src/components/squad/DayOfModeView.tsx` | Day-of layout container |
| `SquadStops` | `src/components/squad/SquadStops.tsx` | Itinerary CRUD |
| Weather Card | Inline in DayOfModeView | Google Weather API display |

#### Design Decisions

**Itinerary (SquadStops):**
- Editable by any squad member
- Fields: Label, Time (optional), Location (optional), Notes (optional)
- Drag to reorder (sortOrder field)
- Flavor text encourages adding meetup points

**Weather Card:**
- Blue gradient background (`from-blue-50 to-blue-100`)
- Shows: High/Low temps, feels like, condition, precip chance, humidity, UV, wind
- Cached 1 hour per lat/lng/date
- Falls back gracefully if no data (shows "Forecast not available")
- Google Weather API with `pageSize` param to get all forecast days

**Know Before You Go:**
- Only shows if TM enrichment has `tmInfo` or `tmPleaseNote`
- Pulled from Ticketmaster event data
- White card, standard styling

**Quick Actions:**
- 2-column grid
- Maps: Google Maps search for venue
- Uber: Deep link with venue as destination

### Modal vs Page Behavior

**Key Principle:** Squad has a canonical URL (`/squads/[id]`) that works as both entry point AND destination.

**Desktop Behavior:**
- From event page → Opens as modal (via `SmartSquadButton`)
- Modal has "View Squad Details →" link to full page
- Direct URL / email / notification → Lands on full page
- Same `SquadPage` component, different container

**Mobile Behavior:**
- Always navigates to full page (no modal)
- Relies on native back (iOS swipe, Android back button)
- Natural for notifications, links, Plan My Day entry

**Implementation:**
- `SmartSquadButton` uses `useIsMobile()` hook (< 768px)
- Mobile: `router.push('/squads/[id]')` directly
- Desktop: Opens `SquadModal` (click outside to dismiss) which has "View Squad Details" link

**Why:**
- Browser back/forward works
- Can refresh without losing context
- Copy/paste shareable URL
- Notification deep links work naturally

---

## Squad Modal (Desktop)

**File:** `src/components/squad/SquadPageModal.tsx`  
**Status:** ✅ Full experience in modal

### Current State

Full squad experience rendered in a modal (same as page):
- Plan/Day-of toggle
- Event header
- Status/Guests/Tickets controls
- Cover others flow
- Member list
- Share buttons
- Leave squad

### Design Decisions

- **Full experience:** Same UI as squad page, not a slimmed-down preview
- **Reuses `PlanModeView`:** Single source of truth for squad UI
- **Click outside to dismiss:** Standard modal behavior
- **Deleted old `SquadModal.tsx`:** Was a barebones preview, now deprecated

---

## Home Page / Event List

**Route:** `/`  
**Status:** 🔄 Redesign planned (UX Charter)

### UX Charter Principles

> **Main content first.** The core event list should be visible as early as possible.  
> **Progressive discovery.** Extra sections feel like "oh nice" moments, not mandatory steps.  
> **No UI for non-existent capabilities.** Only show chips with real backing data.

### Target Layout (Mobile)

```
┌─────────────────────────────┐
│ Events        [Filters ▾]   │  ← Title/filters
├─────────────────────────────┤
│ [🆕 New] [🎫 Presales ◌]    │  ← Discovery strip (compact)
├─────────────────────────────┤
│ ┌─────────────────────────┐ │  ← Main event list starts
│ │ Event Card              │ │     IMMEDIATELY
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Event Card              │ │
│ └─────────────────────────┘ │
```

### Discovery Strip

**Purpose:** Compact row of chips for special subsets (New, Presales, For You)

**Behavior:**
- Chips are small, tappable pills
- Tap → Opens focused filtered view (bottom sheet or full-screen)
- Only show chips with **real backing data**
- "Coming soon" chips can be greyed out (executor's choice)

**Chips (v1):**
| Chip | Status | Backing Data |
|------|--------|--------------|
| 🆕 New | Ready when logic exists | `createdAt` < X days |
| 🎫 Presales | Future | TM presale windows |
| ✨ For You | Future | Recommendation signal |

**Design:**
```css
/* Active chip */
px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-700

/* Disabled/coming soon chip */
px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-400
```

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `DiscoveryStrip` | `src/components/DiscoveryStrip.tsx` | Chips row above event list |
| `EventCard` | `src/components/EventCard.tsx` | Event card in list view |
| `EventFilters` | `src/components/EventFilters.tsx` | Category + venue multi-select |
| `SocialTab` | `src/components/SocialTab.tsx` | Your Plans, Almost Plans |
| `ViewToggle` | `src/components/ViewToggle.tsx` | Calendar/Social toggle |

---

## Event Card

**File:** `src/components/EventCard.tsx`  
**Last updated:** November 2025

### Layout

```
┌─────────────────────────────────────────────────┐
│ [Image]  Title Here (up to 2 lines)  [NEW][CAT] │
│          Venue Name • Sat, Dec 14 at 8PM       │
├─────────────────────────────────────────────────┤
│ [✓ Going] [👥 2 going]        [🎵] [Go Together]│
└─────────────────────────────────────────────────┘
```

### Structure

**Top section (clickable → event page):**
- Image: `w-16 h-16 sm:w-20 sm:h-20` (smaller than before)
- Title: `line-clamp-2`, with badges inline on right
- Venue + Date: Single line, truncated

**Bottom section (border-t separator):**
- Left: Social signals (your status, friends, communities)
- Right: Spotify icon + Go Together button

### Design Decisions

**Cleaner layout:**
- Previous design had 4 horizontal columns fighting for space
- New design: 2-row layout with clear separation
- Social signals + actions in dedicated bottom row

**Smaller image:**
- Reduced from `w-20/w-24` to `w-16/w-20` to give more room to title

**Inline badges:**
- Category badge moved to same line as title (right-aligned)
- Smaller badge text: `text-[10px]`

**Compact social signals:**
- Shortened labels: "✓ Going" instead of "✓ You're going"
- "👥 2 going" instead of "👥 2 friends going"
- Max 1 community shown (previously 2)

**Actions grouped:**
- Spotify + Go Together button together on right
- Consistent placement regardless of social signals

### Why This Works

- Title gets proper space to breathe
- "Go Together" button has consistent position
- Social context visible but not overwhelming
- Clear visual hierarchy: Content → Social → Actions

---

## Social Tab

**File:** `src/components/SocialTab.tsx`  
**Status:** 🔄 Redesign planned (UX Charter)

### UX Charter Principles

> **One scrollable story.** Single vertical feed with smart anchors, not fragmented tabs.  
> **Summary chips communicate.** Show counts per section, let user jump with a tap.  
> **Only show sections with genuine content.** Hide empty sections entirely.

### Target Layout (Mobile)

```
┌─────────────────────────────┐
│ [Plans • 3] [Almost • 5]    │  ← Summary chips (sticky)
├─────────────────────────────┤
│ Your Plans                  │
│ ┌─────────────────────────┐ │
│ │ Plan Card               │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Plan Card               │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Almost Plans                │  ← Chip tap anchors here
│ ┌─────────────────────────┐ │
│ │ Almost Card             │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Community                   │  ← Only if content exists
│ ...                         │
└─────────────────────────────┘
```

### Summary Chips

**Purpose:** Scannable overview + jump-to navigation

**Behavior:**
- Show counts per section: `Plans • 3`
- Tap → Scrolls/anchors to that section (same screen)
- Sticky at top as user scrolls (optional v1)
- Only show chips for sections that have content

**Sections:**
| Section | Status | Definition |
|---------|--------|------------|
| Your Plans | Ready | Events you're "Going" to, or have Squad |
| Almost Plans | Ready when defined | Interested events with friend overlap |
| Community | Future | Community-level content |

**Design:**
```css
/* Summary chip */
px-3 py-1.5 text-sm font-medium rounded-full bg-gray-100 text-gray-700

/* Active/selected chip */
px-3 py-1.5 text-sm font-medium rounded-full bg-purple-600 text-white
```

### Vertical Order

1. **Your Plans** — Always first (if any)
2. **Almost Plans** — Second (if any)
3. **Community** — Third (if any)

### Current State (Before Redesign)

3-column grid on desktop, stacked on mobile:
1. **Your Plans** — Squads + events you're going to
2. **Almost Plans** — Events where you + friends overlap
3. **Community & Tickets** — Stubbed, "Coming Soon"

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
| Nov 2025 | Squad Page | Full page refactor — new ticket model, price guide, guests, compact member list |
| Nov 2025 | Squad Page | Apple-style Plan/Day-of toggle |
| Nov 2025 | Squad Page | Simplified UX — inline pills, Cover others with picker, no Yes/No buttons |
| Nov 2025 | Squad | Smart modal/page behavior — modal on desktop, direct navigation on mobile |
| Nov 2025 | Squad Modal | Replaced barebones preview with full SquadPageModal (same UI as page) |
| Nov 2025 | Squad Day-of | Itinerary (SquadStops), Weather card, KBYG from TM, Quick actions |
| Nov 2025 | Weather | Fixed Google API pagination (pageSize param) |
| Nov 2025 | Event Card | Redesigned layout — 2-row structure, social/actions in bottom row |
| Nov 2025 | Event List | UX Charter — Discovery strip pattern, main content first |
| Nov 2025 | Social Tab | UX Charter — Summary chips + anchored sections pattern |

---

*Last Updated: November 2025*

