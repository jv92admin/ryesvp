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

### Clean UI Guidelines

**Minimize decorative emojis:**
- ❌ Avoid random emojis as visual decoration
- ✅ Use SVG icons for consistent styling and better accessibility
- ✅ Emojis acceptable for: category badges, user-generated content
- ✅ Icons should be monochrome (gray → green on hover)

**Navigation elements should be text links, not buttons:**
- ❌ `bg-white border border-gray-300 rounded-lg` (boxy, dated)
- ✅ `text-gray-600 hover:text-gray-900` (clean, minimal)

**Interaction patterns:**
- Hover: Text color change (gray → green or gray → dark)
- Active: Green text/icon color
- Copied/Success: Green checkmark icon

**Why this matters:**
- Cleaner aesthetic keeps focus on content
- SVG icons scale better and match brand colors
- Consistent interaction language across the app

### Input Fields & Forms

All text inputs, textareas, and form fields should follow this consistent pattern:

```tsx
className="w-full px-3 py-2 border border-gray-300 rounded-lg 
           text-gray-900 placeholder:text-gray-400 
           focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
```

**Required classes:**
- `text-gray-900` — Ensures typed text is dark and readable
- `placeholder:text-gray-400` — Ensures placeholder text is visible but clearly secondary
- `focus:ring-2 focus:ring-green-500` — Brand-consistent focus state

**Why `placeholder:text-gray-400`?**
Browser defaults for placeholder text are often too pale (gray-300 or lighter). Using `gray-400` ensures:
- Placeholder text is readable without squinting
- Clear visual distinction from actual input (gray-400 vs gray-900)
- Consistent appearance across browsers

**Example:**
```tsx
<input
  type="text"
  placeholder="Enter your name..."
  className="w-full px-3 py-2 border border-gray-300 rounded-lg 
             text-gray-900 placeholder:text-gray-400 
             focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
/>
```

---

## Design System & Shared Components

### Brand Color Tokens

All brand colors are defined as CSS variables in `src/app/globals.css`. Use these for consistent theming:

```css
--brand-primary: #16A34A;        /* Green "Go" action - buttons, active states */
--brand-primary-hover: #15803D;  /* Hover state */
--brand-primary-light: #DCFCE7;  /* Light backgrounds, highlights */
--brand-black: #171717;          /* Headers, body text */
--brand-gray: #FAFAFA;           /* Card backgrounds */
--brand-border: #E5E5E5;         /* Borders, dividers */
--brand-danger: #DC2626;         /* Destructive actions */
```

**Usage:** Always reference via `var(--brand-primary)` rather than hardcoding hex values. This enables future theme changes from a single file.

### Shared UI Components

Located in `src/components/ui/`:

| Component | File | Purpose |
|-----------|------|---------|
| `Button` | `ui/Button.tsx` | Primary, secondary, ghost, danger variants |
| `StatusBadge` | `ui/StatusBadge.tsx` | User status (Going, Interested, Need/Have Tickets) |
| `FriendAvatarStack` | `ui/FriendAvatarStack.tsx` | Stacked friend avatars (replaces FriendCountBadge) |
| `TagChip` | `ui/TagChip.tsx` | Removable filter chips |
| `Chip` | `ui/Chip.tsx` | Generic chip component |
| `Badge` | `ui/Badge.tsx` | Category and status badges |

**Usage Guidelines:**
- Import shared components: `import { StatusBadge } from '@/components/ui/StatusBadge'`
- Use `StatusBadge` for all user status displays (EventCard, SocialSectionA/B)
- Use `FriendAvatarStack` for friend social signals — shows actual friend avatars, not counts
- Extend shared components rather than creating one-off styled elements

### FriendAvatarStack Pattern

**Purpose:** Replace text-based "3 going" with actual friend avatars.

**Display:**
- 1-3 friends: Shows all avatars
- 4+ friends: Shows first 3 + `+N` overflow badge

**Sizes:**
- `size="sm"` (default): 24px avatars, `text-[10px]` initials
- `size="md"`: 28px avatars, `text-xs` initials

**Props:**
```tsx
<FriendAvatarStack
  friends={[...]}        // Array of { id, displayName, email }
  maxVisible={3}         // How many to show before overflow
  size="sm"              // "sm" | "md"
  onClick={() => {}}     // Optional click handler (opens modal)
  linkToProfiles={false} // If true, each avatar links to /users/[id]
/>
```

**Used in:**
- EventCard (event list)
- FriendsAndStatusCard (event detail page)
- SocialSectionA/B (Your Events tab)

### Brand Assets

Located in `src/components/brand/`:

| Component | File | Purpose |
|-----------|------|---------|
| `RyesVPLogo` | `brand/RyesVPLogo.tsx` | SVG logo mark (accepts `size` prop) |
| `RyesVPWordmark` | `brand/RyesVPLogo.tsx` | Text wordmark (accepts `className`) |

---

## Terminology & Copy Conventions

### "Plan" vs "Squad"

**Internal (code):** "Squad" — used in database, API routes, file names, types  
**User-facing (UI):** "Plan" — used in all visible copy, buttons, headers

| Context | Example |
|---------|---------|
| Button CTA | "Start Plan", "View Plan", "Join Plan" |
| Modal title | "Start a plan", "Invite friends to your plan" |
| Body copy | "You joined Maya's plan for Mt Joy" |
| Notification | "Alex invited you to their plan for Mt Joy on Dec 4" |

### Title Case Convention

**Buttons/CTAs:** Title Case  
- Start Plan, View Plan, Join Plan, Share Plan, Leave Plan

**Headers/labels:** Sentence case  
- "Your plans", "Friends' plans", "Plan overview"

**Body copy/notifications:** Natural sentences  
- "Alex invited you to their plan for Mt Joy on Dec 4."

---

## Event Detail Page

**Route:** `/events/[id]`  
**File:** `src/app/events/[id]/page.tsx`  
**Last updated:** November 2025

### Layout Overview (Mobile)

```
┌─────────────────────────────────┐
│ ← All Events           Share   │  ← Clean text links
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
│                                 │
│ [Start Plan] or [View Plan]    │  ← Subtle outline button
│                                 │
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

#### Navigation Bar
- **Back button:** Clean text link with left chevron, animated on hover
- **Share button:** Clean text link with share icon (no border, no background)
- **Styling:** `text-sm font-medium text-gray-600 hover:text-green-600`
- **Rationale:** Minimal UI keeps focus on event content. Matches squad page aesthetic.

#### Share Button
- **Location:** Top navigation bar, next to "All Events" back button
- **Style:** Minimal text link with SVG share icon
- **States:** 
  - Default: Gray text + share icon
  - Hover: Green text
  - Copied: Green checkmark + "Copied!" text
- **Mobile:** Opens native share sheet (Web Share API)
- **Desktop:** Falls back to clipboard copy

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

#### Plan Button (SmartSquadButton)
- **Placement:** Inline with social signals in event cards; below status section on detail page
- **Text:** "Start Plan" (no plan exists) / "View Plan" (user has plan)
- **Styling:** Subtle outline button (see Common Patterns > Plan Button Style)
- **Rationale:** Less prominent than before — doesn't compete with primary actions like Buy. Outline style feels clickable but minimal.

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

## Squad Page (Plan)

**Route:** `/squads/[id]`  
**File:** `src/app/squads/[id]/page.tsx`  
**Last updated:** December 2025

> **Note:** Internal name is "Squad" but user-facing copy says "Plan" everywhere. See Terminology section.

### Layout Overview (Mobile)

```
┌─────────────────────────────────┐
│ ← Back to Event           Home  │  ← Navigation header (text links)
├─────────────────────────────────┤
│ ┌─────────────┬───────────────┐ │  ← Apple-style toggle
│ │    Plan     │    Day-of     │ │     (sliding background)
│ └─────────────┴───────────────┘ │
├─────────────────────────────────┤
│ Event Title                     │  ← Compact header, no image
│ Sat, Dec 14 • 8PM • Moody Ctr  │     Links to event page
├─────────────────────────────────┤
│ Share            Add to Calendar▾│  ← Quick actions (text links)
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
│ [Share Plan] [Share Day-of]    │  ← Copy text buttons
├─────────────────────────────────┤
│ ┌─────────────────────────────┐│
│ │       Leave Plan            ││  ← Red button, prominent
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
| `CalendarDropdown` | `src/components/CalendarDropdown.tsx` | Export to Google/Apple/Outlook calendar |

### Design Decisions

#### Quick Actions Row
- **Layout:** Flex row with space-between, positioned below event header
- **Share:** Text link with share icon, green on hover
- **Calendar:** Text link with dropdown arrow, remembers preference
- **Styling:** Matches navigation header (clean text links, no borders)

#### Calendar Export
- **First use:** Dropdown with Google/Apple/Outlook options
- **After preference set:** Direct action button showing "Google Calendar" etc.
- **Dropdown arrow:** Separate tap target for changing preference
- **No emojis in dropdown:** Clean text labels only

#### Navigation Header
- **Layout:** Flex container with space-between
- **Left:** "Back to Event" with left arrow icon
  - Animated: arrow slides left on hover (`group-hover:-translate-x-0.5`)
  - Links to event detail page
- **Right:** "Home" text link
  - Same styling as back button for consistency
  - Links to home page
- **Typography:** `text-sm font-medium`, gray-600 → gray-900 on hover

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

**Empty State (Solo Plan):**
- Shows when only organizer is in plan
- Prominent light green callout with dashed border
- Heading: "Add your first friend"
- Subtitle: "Plans are better with friends! Invite someone to join you."
- Full-width green "Invite Friends" button
- Replaces the subtle "+ Invite friends" button when empty
- Once friends added: button changes to "+ Invite more friends"

#### Share Buttons
- **Two buttons side-by-side:** Share Plan | Share Day-of
- **Share Plan:** Copies invite text with link
- **Share Day-of:** Copies logistics text (disabled if no meetTime/meetSpot set)

#### Leave Plan Button
- **Prominent red button** with border
- **In its own card** at bottom
- **Confirms before leaving** ("Are you sure you want to leave this plan?")

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
**Status:** ✅ Redesigned (December 2025)

### Layout

```
┌────────────────────────────────────────────────────────────────┐
│ [🔍 Conan, indie rock, Moody Center...]                        │  ← Search input
├────────────────────────────────────────────────────────────────┤
│ [This Week] [Weekend] [Dates ▾] • [Concerts] [Comedy] ... [More]│  ← Filter chips
│                                                     [Clear all] │
├────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ Event Card                                                   ││
│ └──────────────────────────────────────────────────────────────┘│
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ Event Card                                                   ││
│ └──────────────────────────────────────────────────────────────┘│
```

### Filter Strip

**Purpose:** Unified filter UI with instant apply - no Apply button needed.

**Behavior:**
- All filters update URL immediately on click
- Search has 300ms debounce
- Back/forward navigation works
- Chips show active state with green background + border

**Filter Chips:**
| Chip Type | Options | Behavior |
|-----------|---------|----------|
| Date | This Week, Weekend, Dates dropdown | Mutually exclusive |
| Category | Concerts, Comedy, Theater, Sports, Other | Multi-select (OR) |
| Discovery | New (count), Presales (count) | Toggle on/off |

**URL Params:**
- `?q=` — Search query
- `?when=thisWeek|weekend` — Date preset
- `?startDate=&endDate=` — Custom date range
- `?categories=CONCERT,COMEDY` — Category filter
- `?new=true` — New listings (48h)
- `?presales=true` — Events with presales

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `FilterStrip` | `src/components/discovery/FilterStrip.tsx` | Main filter container |
| `SearchInput` | `src/components/discovery/SearchInput.tsx` | Debounced search |
| `DateChips` | `src/components/discovery/DateChips.tsx` | Date presets + picker |
| `CategoryChips` | `src/components/discovery/CategoryChips.tsx` | Category toggles |
| `DiscoveryChips` | `src/components/discovery/DiscoveryChips.tsx` | New + Presales |
| `EventCard` | `src/components/EventCard.tsx` | Event card in list view |
| `SocialTab` | `src/components/SocialTab.tsx` | Your Plans, Almost Plans |
| `ViewToggle` | `src/components/ViewToggle.tsx` | Calendar/Social toggle |

### Deprecated (Deleted)

- `EventFilters.tsx` — Replaced by FilterStrip
- `DiscoveryStrip.tsx` — Replaced by discovery/ components

---

## Event Card

**File:** `src/components/EventCard.tsx`  
**Last updated:** December 2025

### Layout

```
┌─────────────────────────────────────────────────┐
│ [Image]  Title Here (up to 2 lines)  [NEW][CAT] │
│          Venue Name • Sat, Dec 14 at 8PM       │
├─────────────────────────────────────────────────┤
│ [👥 2 going]              [🎵] [✓] [★] [Plan?] │
└─────────────────────────────────────────────────┘
```

### Structure

**Top section (clickable → event page):**
- Image: `w-16 h-16 sm:w-20 sm:h-20` (smaller than before)
- Title: `line-clamp-2`, with badges inline on right
- Venue + Date: Single line, truncated

**Bottom section (border-t separator):**
- Left: Social signals (friends going/interested, communities)
- Right: Spotify icon + `EventCardActions` (Going ✓, Interested ★, conditional Start Plan)

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `EventCard` | `src/components/EventCard.tsx` | Main card layout |
| `EventCardActions` | `src/components/EventCardActions.tsx` | Compact ✓/★ buttons + Start Plan |
| `FriendCountBadge` | `src/components/ui/StatusBadge.tsx` | "2 going" pill |

### Design Decisions

**Progressive disclosure for Start Plan:**
- ✓ (Going) and ★ (Interested) shown as compact icon buttons
- "Start Plan" button ONLY appears after user clicks one of them
- Reduces visual clutter — doesn't overwhelm with CTAs
- User shows intent first, then sees action

**EventCardActions component:**
- Self-contained client component
- Handles status toggle API calls
- Manages optimistic state for immediate feedback
- Shows "Start Plan" inline after selection

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
- "👥 2 going" instead of "👥 2 friends going"
- Max 1 community shown (previously 2)
- User's own status shown via EventCardActions buttons (green/yellow when active)

### Why This Works

- Title gets proper space to breathe
- Start Plan appears contextually (after intent shown)
- Less visual noise — buttons don't compete for attention
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

**Plan Button (SmartSquadButton):**
```css
min-w-[5.5rem] px-2.5 py-1 text-xs font-semibold rounded-md
text-[var(--brand-primary)] bg-white
border-2 border-green-300
hover:bg-[var(--brand-primary-light)] hover:border-green-400
```
- Consistent width via `min-w-[5.5rem]` (both "Start Plan" and "View Plan" same size)
- Outline style with brand green border
- Semibold text for clickability
- Subtle hover: light green background + darker border

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

## Toast Notifications

**File:** `src/components/ui/Toast.tsx`  
**Context:** `src/contexts/ToastContext.tsx`  
**Last updated:** December 2025

### Usage

```typescript
import { useToast } from '@/contexts/ToastContext';

const { showToast } = useToast();

showToast({
  message: 'Plan created! 2 friends invited and notified.',
  type: 'success',  // 'success' | 'info' | 'error'
  action: {
    label: 'Copy link',
    onClick: () => {
      navigator.clipboard.writeText(url);
    }
  }
});
```

### Design

**Layout:**
- Light backgrounds with subtle color tints (not dark/opaque)
- Small text: `text-xs font-bold`
- Duration: 8 seconds (2x longer than typical)
- Full width on mobile, max-width on desktop
- Bottom position: `bottom-4 left-4 right-4`

**Variants:**
- **Success:** Light green background (`--brand-primary-light`), green icon with ✓
- **Info:** Light gray background, gray icon with ℹ
- **Error:** Light red background, red icon with ✕

**Action Button:**
- Copy icon (2 overlapping squares) instead of text
- Green color matching brand
- Only shown when action is provided

**Mobile Optimization:**
- Full width prevents squished text
- Smaller font keeps it compact
- Bold text ensures readability on light backgrounds

### When to Use

**DO use toasts for:**
- Plan created confirmation
- Friends added to plan
- Success actions with optional copy link

**DON'T use toasts for:**
- Errors requiring action (use inline errors)
- Critical information (use modals)
- Multiple simultaneous messages (queue them)

---

## Data Display Rules

### displayTitle
- **ALWAYS** use `displayTitle` from data layer
- **NEVER** compute title in components
- See `notes/architecture/data-model.md`

### Enrichment
- List views: Use `EnrichmentDisplay` subset (spotifyUrl, tmUrl, genres)
- Detail views: Fetch full `Enrichment` via `getEventEnrichment()`

### Social Signals
- Fetched via `getEventDetailedSocial()` for detail page
- Includes friends list with statuses, community attendance

---

## Planned Pages (Phase 4+)

These pages don't exist yet. Document design decisions here as they're built.

### Create Event Page (Phase 4)

**Route:** `/events/new`  
**Status:** 🔲 Not started

**Target Layout:**

```
┌─────────────────────────────────┐
│ Create Event                    │  ← Header
├─────────────────────────────────┤
│ Title *                         │
│ [________________________]      │
│                                 │
│ Date *            Time          │
│ [__________]      [______]      │
│                                 │
│ Location                        │
│ [________________________]      │  ← Text + optional map search
│                                 │
│ Link (optional)                 │
│ [________________________]      │  ← TM, restaurant, etc.
│                                 │
│ Description                     │
│ [________________________]      │
│ [________________________]      │
│                                 │
│ Visibility                      │
│ (●) Public  ( ) Friends  ( ) Invite │
│                                 │
│ [Create Event]                  │  ← Primary CTA
└─────────────────────────────────┘
```

**Design Decisions (TBD):**
- Minimal fields, no friction
- Event page IS the plan for user-created events
- Consider: image upload? Cover photo?
- Consider: recurring events?

---

### Friend Profile Page (Phase 4)

**Route:** `/users/[id]` or `/u/[username]`  
**Status:** 🔲 Not started

**Target Layout:**

```
┌─────────────────────────────────┐
│ [← Back]                        │
├─────────────────────────────────┤
│ [Avatar]  Alex Chen             │
│           @alexc                │  ← Username if set
│           "Live music enthusiast"│  ← Bio
│                                 │
│ [Add Friend] or [Friends ✓]    │
│ Friends since Oct 2024          │
├─────────────────────────────────┤
│ Upcoming Plans                  │
│ ┌─────────────────────────────┐│
│ │ Mt Joy @ Moody • Dec 14    ││  ← Compact event cards
│ └─────────────────────────────┘│
│ ┌─────────────────────────────┐│
│ │ Comedy Show @ Creek • Dec 20││
│ └─────────────────────────────┘│
├─────────────────────────────────┤
│ [Start Plan with Alex]          │  ← Primary CTA
└─────────────────────────────────┘
```

**Design Decisions (TBD):**
- Keep minimal, action-oriented
- "Start Plan with X" is the main CTA
- Show mutual friends?
- Show shared communities?

---

### Friend Avatar Popover (Phase 4)

**Trigger:** Hover on friend avatar (desktop only)  
**Status:** 🔲 Not started

**Target Layout:**

```
┌─────────────────────────┐
│ [Avatar] Alex Chen      │
│ @alexc                  │
├─────────────────────────┤
│ [Start Plan with Alex]  │
│ [View Profile]          │
└─────────────────────────┘
```

**Design Decisions:**
- Small, non-intrusive popover
- 2 quick actions max
- Delay on hover (300ms?) to avoid accidental triggers
- Click avatar on mobile goes directly to profile

---

### Artist Page (Phase 5)

**Route:** `/artists/[id]`  
**Status:** 🔲 Future (after Artist data model)

**Target Layout:**

```
┌─────────────────────────────────┐
│ [← Back]                        │
├─────────────────────────────────┤
│ [Artist Image]                  │
│ Artist Name                     │
│ [Rock] [Alternative]            │  ← Genres
│                                 │
│ [♡ Follow] or [Following ✓]    │
│                                 │
│ [Listen on Spotify]             │
├─────────────────────────────────┤
│ Upcoming Austin Shows           │
│ ┌─────────────────────────────┐│
│ │ Dec 14 @ Moody Center       ││
│ │ [3 friends going]           ││
│ └─────────────────────────────┘│
└─────────────────────────────────┘
```

---

## About Page

**Route:** `/about`  
**File:** `src/app/about/page.tsx`  
**Last updated:** December 2025

### Layout Overview

```
┌─────────────────────────────────────────┐
│ [Header - sticky]                       │
├─────────────────────────────────────────┤
│                                         │
│   I built RyesVP for my friends         │  ← Centered, brand green
│       (and maybe yours)                 │  ← Gray, normal weight
│                                         │
│ Conversational prose about what/why...  │
│ Links: invite friends, email me         │
├─────────────────────────────────────────┤
│           How It Works                  │
│     Discover · Connect · Plan · Go      │
│                                         │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │Discover │ │ Connect │ │  Plan   │    │
│ │ [img]   │ │ [img]   │ │ [img]   │    │
│ │  copy   │ │  copy   │ │  copy   │    │
│ └─────────┘ └─────────┘ └─────────┘    │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │   Then just… Go.                  │   │  ← Green accent card
│ └───────────────────────────────────┘   │
├─────────────────────────────────────────┤
│ What I'm working on next                │  ← Gray-50 background
│                                         │
│ • Smarter discovery                     │
│ • User-created events                   │
│ • Communities                           │
│                                         │
│ Fixes / Improvements                    │
│ [Send me a note] (email CTA)            │
├─────────────────────────────────────────┤
│ © 2025 RyesVP · Austin, TX              │
└─────────────────────────────────────────┘
```

### Design Decisions

**Opening Statement:**
- Centered, `text-xl`, brand green, `font-semibold`
- "(and maybe yours)" on new line, gray-500, normal weight
- No large header — leads directly with personal statement

**How It Works — Card Grid:**
- 3-column grid on `md:` (stacked on mobile)
- Each card: label (colored small-caps) | headline, then image, then description
- Label colors: emerald (Discover), blue (Connect), purple (Plan)
- Image container: `w-[200px] h-[360px]`, rounded-2xl, shadow-xl

**Go Section:**
- White card with green border (`border-2 border-[var(--brand-primary)]`)
- Green drop shadow: `shadow-[0_4px_20px_rgba(22,163,74,0.15)]`
- "Go." in bold brand green
- Simple, elegant endpoint — not a CTA button

**What's Next — Patch Notes Style:**
- Gray-50 background, distinct from white sections
- Clear hierarchy: section header, subheading, then items
- Each item: bold title, descriptive paragraph
- "Fixes / Improvements" separated by border-t
- Email CTA: button style with envelope icon, light green bg

**Page Philosophy:**
- Minimal, personal, "founder voice"
- No marketing fluff — direct and conversational
- Inline links rather than buttons where appropriate
- Sticky header carried over from rest of app

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
| Dec 2025 | Terminology | "Squad" → "Plan" in all user-facing copy (internal code stays "Squad") |
| Dec 2025 | Copy | Title Case for button CTAs, sentence case for headers |
| Dec 2025 | Plan Button | Redesigned — subtle outline style, consistent min-width, semibold text |
| Dec 2025 | Design System | Brand color tokens in CSS variables for single-file theming |
| Dec 2025 | Design System | Shared StatusBadge and FriendCountBadge components |
| Dec 2025 | Home Page | Two-row filter layout with quick date pills (This Week, Next Week) |
| Dec 2025 | Home Page | ViewToggle renamed to "All Events" / "Your Events" |
| Dec 2025 | Social Sections | Green bold uppercase headers, full-width cards, removed double framing |
| Dec 2025 | Header | Notification bell icon, tightened logo/wordmark spacing |
| Dec 2025 | Header | "Start a Plan" CTA added; Friends moved to UserMenu dropdown |
| Dec 2025 | Event Card | EventCardActions: ✓/★ buttons → conditional Start Plan (progressive disclosure) |
| Dec 2025 | Planned | Added Create Event, Friend Profile, Avatar Popover, Artist Page specs |
| Dec 6, 2025 | Toast | New toast notification system — light backgrounds, 8s duration, bold text, copy icon |
| Dec 6, 2025 | Modals | StartPlanModal, SquadInviteModal, SquadCreationModal polish — proper padding, green accents |
| Dec 6, 2025 | Modals | Custom branded checkboxes — green when selected, replaces browser default |
| Dec 6, 2025 | Squad Page | Navigation header with "Back to Event" and "Home" links |
| Dec 6, 2025 | Squad Page | Empty state callout for solo plans — "Add your first friend" |
| Dec 6, 2025 | Squad Page | Quick actions row: Share + Calendar export (text link style) |
| Dec 6, 2025 | Calendar | CalendarDropdown component with Google/Apple/Outlook support |
| Dec 6, 2025 | Calendar | User preference stored in DB, direct action after first use |
| Dec 6, 2025 | Share | Web Share API for mobile native share sheet |
| Dec 6, 2025 | Event Page | Back button and share button redesigned to minimal text links |
| Dec 6, 2025 | Design System | Clean UI guidelines: minimize emojis, prefer SVG icons, text link navigation |
| Dec 12, 2025 | Home Page | FilterStrip replaces EventFilters — chip-based, instant apply, no Apply button |
| Dec 12, 2025 | Discovery | New discovery/ folder with SearchInput, DateChips, CategoryChips, DiscoveryChips |
| Dec 12, 2025 | Search | Debounced search across title, performer, venue, genres, category |
| Dec 12, 2025 | Filters | Date picker dropdown (From/To), replaces Today chip |
| Dec 12, 2025 | Chips | Added subtle borders + green hover accents for visual relief |
| Dec 12, 2025 | Deleted | EventFilters.tsx, DiscoveryStrip.tsx (replaced by discovery/ components) |
| Dec 21, 2025 | About Page | New `/about` page — intro, how it works (Discover/Connect/Plan/Go), roadmap notes |
| Dec 21, 2025 | About Page | Green-accented "Go" card, patch-notes style "What's next" section |
| Dec 21, 2025 | Header | Made sticky across all pages (`sticky top-0 z-50`) |
| Dec 21, 2025 | Groups | Expandable member list — click avatars to see all members with profile links |
| Dec 21, 2025 | Avatar | Fixed crash when displayName and email are null/empty |
| Dec 21, 2025 | Social Signals | FriendAvatarStack replaces FriendCountBadge — shows actual avatars instead of counts |
| Dec 21, 2025 | Data Layer | EventSocialSignals now includes friendsGoingList/friendsInterestedList for avatar display |

---

*Last Updated: December 21, 2025*

