# UI Restructure Tasks — Events Page & Squad Experience

> **For Junior LLM Execution**
> 
> This document contains phased tasks for restructuring the Events page and building out the Squad experience. Read each phase fully before starting. Flag any data model concerns before implementing.

---

## Critical Context

### Data Model Rules (DO NOT VIOLATE)

1. **`displayTitle` is computed at the data layer, NEVER in components.**
   - See `src/db/events.ts` and `src/db/squads.ts` for examples
   - If you need event title, use `displayTitle` from the data layer
   - Reference: `notes/data-model-101.md`

2. **Enrichment data comes in two forms:**
   - `EnrichmentDisplay` (subset for UI) — use for list views
   - Full `Enrichment` — fetch via `getEventEnrichment(id)` when needed
   - Don't fetch full enrichment unless you need bio, presales, etc.

3. **Social signals attach at query time** via `getEventDetailedSocial()` or `getEventsWithSocialSignals()`

### Key Files Reference

| Concern | File Path |
|---------|-----------|
| Event detail page | `src/app/events/[id]/page.tsx` |
| Event data layer | `src/db/events.ts` |
| Squad data layer | `src/db/squads.ts` |
| Squad modal | `src/components/squad/SquadModal.tsx` |
| Squad status controls | `src/components/squad/SquadStatusControls.tsx` |
| Squad snapshot | `src/components/squad/SquadSnapshot.tsx` |
| Squad logistics | `src/components/squad/SquadLogistics.tsx` |
| Attendance button | `src/components/AttendanceButton.tsx` |
| Attendance summary | `src/components/AttendanceSummary.tsx` |
| Social section | `src/components/EventSocialSection.tsx` |
| Enrichment display | `src/components/EventEnrichment.tsx` |
| Share button | `src/components/ShareButton.tsx` |
| Prisma schema | `prisma/schema.prisma` |

---

## Phase 1: Events Page Restructure

**Goal:** Reduce whitespace, move decisions above the fold, merge cards.

**No new data models. Purely UI restructure.**

### Current Problems
- 4 separate white cards with gray gaps (wasteful)
- "What's your status?" is too far down
- "Buy on Ticketmaster" buried under About
- Spotify isolated, not part of decision flow

### Target Layout (Mobile-First)

**Above the fold (single scroll):**
1. Event header (tightened): image, title, date+time (one line), venue (one line), category tag
2. Friends & Status card (MERGED): avatars + "3 going", status toggles (all 4 visible, smaller), "View Squad" CTA
3. Primary CTAs: `[Buy Tickets]` + `[Listen on Spotify]` stacked

**Below the fold:**
4. About card (compressed): 2-3 lines truncated, "Read more", venue link inline, share icon in header
5. Artist info (if enrichment exists): moved below About, compact

### Tasks

#### 1.1 Create new combined component: `FriendsAndStatusCard`
**Location:** `src/components/FriendsAndStatusCard.tsx`

This merges:
- `EventSocialSection` (friends going display)
- `AttendanceSummary` (X going, Y interested)
- `AttendanceButton` (status toggles)
- `SmartSquadButton` (View Squad CTA)

**Requirements:**
- Row 1: Friends avatars + summary ("Maya, Alex +2 going")
- Row 2: Status toggles — ALL 4 visible (Interested, Going, Need Tickets, Have Tickets) with smaller footprint
- Row 3: "View Squad" or "Go Together" CTA
- Must accept logged-out state (show disabled buttons + "Sign in to mark status")
- Reuse existing avatar utilities from `src/lib/avatar.ts`

**Data it needs (passed as props):**
- `socialSignals` (from `getEventDetailedSocial`)
- `userEvent` (current user's status)
- `userSquad` (user's squad for this event, if any)
- `eventId`
- `isLoggedIn`

**Validation:** Ensure `displayTitle` is NOT computed in this component.

#### 1.2 Create new combined component: `PrimaryCTACard`
**Location:** `src/components/PrimaryCTACard.tsx`

Contains:
- "Buy Tickets" button (Ticketmaster link from `enrichment.tmUrl`)
- "Listen on Spotify" button (from `enrichment.spotifyUrl`)
- Fallback: "View Event" button if no TM link (use `event.url`)

**Requirements:**
- Stacked layout on mobile
- Side-by-side on desktop (optional)
- TM button uses their blue (#026CDF)
- Spotify button uses their green (#1DB954)
- If neither exists, show "View Event" with venue link

**Data it needs:**
- `tmUrl` (from basicEnrichment)
- `spotifyUrl` (from basicEnrichment)
- `eventUrl` (fallback)

#### 1.3 Create new component: `AboutCard`
**Location:** `src/components/AboutCard.tsx`

Merges:
- Event description (truncated)
- Venue link (inline)
- Share button (icon in header)

**Requirements:**
- Show first 2-3 lines of description
- "Read more" expander if description > 150 chars
- Venue name + address as clickable link (to Google Maps or venue URL)
- Share icon (small) in card header, not a full row
- Reuse `ShareButton` logic but with icon-only variant

**Data it needs:**
- `description`
- `venue` (name, address, url)
- Share props (title, url, etc.)

#### 1.4 Restructure Event Page
**File:** `src/app/events/[id]/page.tsx`

**Changes:**
1. REMOVE: Separate `EventSocialSection`, `AttendanceSummary`, `AttendanceButton` renders
2. REMOVE: TM button from inside header card
3. REMOVE: Separate Share button row
4. ADD: `FriendsAndStatusCard` immediately after header
5. ADD: `PrimaryCTACard` after FriendsAndStatusCard
6. ADD: `AboutCard` after PrimaryCTACard
7. KEEP: `EventEnrichment` (artist info) at bottom, but make it optional/compact
8. TIGHTEN: Header card — remove description from header, keep only: image, title, date, venue, tag

**Visual order after changes:**
```
[Back button]
[Hero image]
[Header: Title + Date + Venue + Tag] — NO description here
[FriendsAndStatusCard]
[PrimaryCTACard]
[AboutCard] — description lives here
[EventEnrichment] — artist info, compact
```

#### 1.5 Tighten Event Header
**File:** `src/app/events/[id]/page.tsx` (within the header section)

**Changes:**
- Remove description from header card
- Combine date + time into single line: "Sat, Dec 14 • 8:00 PM"
- Combine venue into single line: "Moody Center, Austin"
- Keep category tag and status badges
- Reduce padding/margins

**Validation:** Ensure `displayTitle` still comes from data layer, not computed.

### Phase 1 Checklist
- [ ] Create `FriendsAndStatusCard.tsx`
- [ ] Create `PrimaryCTACard.tsx`
- [ ] Create `AboutCard.tsx`
- [ ] Restructure `page.tsx` to use new components
- [ ] Tighten header (remove description, compact date/venue)
- [ ] Test mobile layout (status + CTAs above fold)
- [ ] Test logged-out state
- [ ] Verify no data model violations

---

## Phase 2: Squad Full Page

**Goal:** Create `/squads/[id]` route with full Squad experience.

### New Files to Create

| File | Purpose |
|------|---------|
| `src/app/squads/[id]/page.tsx` | Squad full page |
| `src/components/squad/SquadPage.tsx` | Main content component (client-side) |
| `src/components/squad/PlanModeView.tsx` | Plan mode layout |
| `src/components/squad/DayOfModeView.tsx` | Day-of mode layout (Phase 6) |

### Tasks

#### 2.1 Create Squad Page Route
**File:** `src/app/squads/[id]/page.tsx`

**Requirements:**
- Server component that fetches squad data
- Use `getSquadById()` from `src/db/squads.ts`
- Get current user via `getCurrentUser()`
- Verify user is a member of the squad (or show 404/unauthorized)
- Pass data to client component `SquadPage`

**Data to fetch:**
- Squad with members, event, venue
- Full event enrichment (for Know-before-you-go: `tmPleaseNote`, `tmInfo`)
- Current user ID

**Validation:** `displayTitle` is already computed in `getSquadById()` — use it.

#### 2.2 Create SquadPage Client Component
**File:** `src/components/squad/SquadPage.tsx`

**Layout (Plan Mode — default):**
1. Event header (compact): image thumbnail, title, date, venue, tag
2. Plan summary card: avatars, "3 in · 1 thinking", your status picker
3. Detailed controls: ticket status, guests display as "Name (+2)"
4. Squad Notes section (Phase 4)
5. Vibe & Extras: Playlist link (collapsed)
6. Squad Stops section (Phase 5)

**Requirements:**
- Mode toggle: `[Plan] [Day-of]` — default to Plan
- Reuse `SquadStatusControls` for status picker
- Reuse avatar utilities from `src/lib/avatar.ts`
- "Share Plan" and "Share Day-of" buttons at bottom
- "Leave Squad" in footer

**State management:**
- Track current mode (plan vs day-of)
- Squad data refresh after status updates

#### 2.3 Extract Reusable Components from SquadModal

Look at `src/components/squad/SquadModal.tsx` and identify what can be reused:

| Component | Reuse? | Notes |
|-----------|--------|-------|
| `SquadStatusControls` | ✅ Yes | Already separate, reuse as-is |
| `SquadSnapshot` | ✅ Partially | Extract member list display, may need layout tweaks |
| `SquadLogistics` | ✅ Yes | Reuse for meetTime/meetSpot (will expand in Phase 5) |
| Share text generation | ✅ Yes | `src/lib/squadShareText.ts` already exists |

#### 2.4 Member Display with Guests
**File:** `src/components/squad/SquadMemberList.tsx` (new)

**Requirements:**
- Show each member with status icon
- If `buyingForCount > 0`, show as "Maya (+2)"
- Organizer badge
- Ticket status indicator

**Reuse:** Avatar utilities, status colors from `SquadSnapshot`

### Phase 2 Checklist
- [ ] Create `src/app/squads/[id]/page.tsx`
- [ ] Create `src/components/squad/SquadPage.tsx`
- [ ] Create `src/components/squad/PlanModeView.tsx`
- [ ] Create `src/components/squad/SquadMemberList.tsx`
- [ ] Wire up status updates (reuse existing API routes)
- [ ] Wire up logistics updates
- [ ] Add Share Plan / Share Day-of buttons
- [ ] Add Leave Squad button
- [ ] Test navigation from Event page "View Squad" → Squad page
- [ ] Test deep-link directly to `/squads/[id]`

---

## Phase 3: Squad Modal Slim Down

**Goal:** Refactor modal to be a quick preview, not the full experience.

### Tasks

#### 3.1 Simplify SquadModal
**File:** `src/components/squad/SquadModal.tsx`

**Keep:**
- Event header (compact)
- Your status controls
- Member summary ("3 in · 1 thinking")
- "View Full Squad →" link button

**Remove:**
- Detailed member list (move to page)
- Logistics editing (move to page)
- Share buttons (move to page)
- Leave Squad (move to page)

**Add:**
- Prominent "View Full Squad" button that navigates to `/squads/[id]`

#### 3.2 Update SmartSquadButton
**File:** `src/components/SmartSquadButton.tsx`

**If user has a squad:** Button should either:
- Open slim modal (current behavior), OR
- Navigate directly to `/squads/[id]` (consider this simpler)

**Recommendation:** Keep modal for "quick status update", add "View Full Squad" inside modal.

### Phase 3 Checklist
- [ ] Slim down `SquadModal.tsx`
- [ ] Add "View Full Squad" navigation
- [ ] Update `SmartSquadButton` behavior
- [ ] Test both entry points (modal from event page, direct link)

---

## Phase 4: Squad Notes

**Goal:** Add bulletin board notes to squads.

### New Data Model

**File:** `prisma/schema.prisma`

```prisma
model SquadNote {
  id        String   @id @default(uuid())
  squadId   String
  squad     Squad    @relation(fields: [squadId], references: [id], onDelete: Cascade)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  content   String
  isPinned  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([squadId])
  @@index([authorId])
}
```

**Update Squad model:**
```prisma
model Squad {
  // ... existing fields
  notes SquadNote[]
}
```

**Update User model:**
```prisma
model User {
  // ... existing fields
  squadNotes SquadNote[]
}
```

### Tasks

#### 4.1 Add Prisma Schema
**File:** `prisma/schema.prisma`

Add `SquadNote` model as shown above. Run migration:
```bash
npx prisma migrate dev --name add_squad_notes
```

#### 4.2 Create Data Layer Functions
**File:** `src/db/squadNotes.ts` (new)

Functions needed:
- `getSquadNotes(squadId: string)` — get all notes for a squad
- `createSquadNote(data: { squadId, authorId, content })` — anyone can add
- `deleteSquadNote(noteId: string, userId: string)` — only author or squad creator can delete
- `togglePinNote(noteId: string, userId: string)` — only squad creator can pin

**Permission logic:**
- Anyone in squad can add notes
- Author can delete their own notes
- Squad creator (organizer) can delete any note
- Only squad creator can pin/unpin

#### 4.3 Create API Routes
**File:** `src/app/api/squads/[id]/notes/route.ts`

| Method | Action | Who can do it |
|--------|--------|---------------|
| GET | List notes | Squad members |
| POST | Add note | Squad members |

**File:** `src/app/api/squads/[id]/notes/[noteId]/route.ts`

| Method | Action | Who can do it |
|--------|--------|---------------|
| DELETE | Delete note | Author or organizer |
| PATCH | Pin/unpin | Organizer only |

#### 4.4 Create UI Components
**File:** `src/components/squad/SquadNotes.tsx`

**Requirements:**
- Show last 2 notes inline (most recent or pinned first)
- "View all notes" expands to show all
- "Add note" input at bottom
- Delete button (X) visible only to author/organizer
- Pin icon for organizer

**File:** `src/components/squad/SquadNoteInput.tsx`

Simple textarea + submit button for adding notes.

#### 4.5 Integrate into Squad Page
**File:** `src/components/squad/SquadPage.tsx`

Add `SquadNotes` component in Plan mode view, after detailed controls.

### Phase 4 Checklist
- [ ] Add `SquadNote` model to schema
- [ ] Run migration
- [ ] Create `src/db/squadNotes.ts`
- [ ] Create API routes for notes
- [ ] Create `SquadNotes.tsx` component
- [ ] Create `SquadNoteInput.tsx` component
- [ ] Integrate into Squad page
- [ ] Test permissions (add, delete, pin)

---

## Phase 5: Squad Stops

**Goal:** Add freeform timeline stops for Day-of planning.

### New Data Model

**File:** `prisma/schema.prisma`

```prisma
model SquadStop {
  id        String    @id @default(uuid())
  squadId   String
  squad     Squad     @relation(fields: [squadId], references: [id], onDelete: Cascade)
  time      DateTime? // Optional, for ordering
  text      String    // Freeform: "Drinks at Lazarus — https://maps..."
  order     Int       // For manual ordering if no time
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([squadId])
}
```

**Update Squad model:**
```prisma
model Squad {
  // ... existing fields
  stops SquadStop[]
}
```

### Tasks

#### 5.1 Add Prisma Schema
Add `SquadStop` model. Run migration:
```bash
npx prisma migrate dev --name add_squad_stops
```

#### 5.2 Create Data Layer Functions
**File:** `src/db/squadStops.ts` (new)

Functions:
- `getSquadStops(squadId: string)` — ordered by time, then order field
- `createSquadStop(data: { squadId, time?, text, order })` — any member can add
- `updateSquadStop(stopId: string, data: { time?, text? })` — any member can edit
- `deleteSquadStop(stopId: string)` — any member can delete
- `reorderSquadStops(squadId: string, stopIds: string[])` — for drag-and-drop (future)

**Ordering logic:**
- If stop has time, sort by time
- If no time, sort by order field
- Auto-arrange: stops with times first (sorted), then stops without times (by order)

#### 5.3 Create API Routes
**File:** `src/app/api/squads/[id]/stops/route.ts`

| Method | Action |
|--------|--------|
| GET | List stops |
| POST | Add stop |

**File:** `src/app/api/squads/[id]/stops/[stopId]/route.ts`

| Method | Action |
|--------|--------|
| PUT | Update stop |
| DELETE | Delete stop |

#### 5.4 Create UI Components
**File:** `src/components/squad/SquadStops.tsx`

**Requirements:**
- Vertical timeline display
- Each stop shows: time (if set) + text
- Detect and linkify URLs (especially Google Maps links)
- "Add stop" button opens simple form
- Edit/delete inline

**File:** `src/components/squad/SquadStopForm.tsx`

Form with:
- Time input (optional)
- Text input (freeform)
- Save/Cancel buttons

**Hint for users:** "Paste a Google Maps link for easy navigation later"

#### 5.5 Integrate into Squad Page
Add `SquadStops` to both Plan mode and Day-of mode views.

### Phase 5 Checklist
- [ ] Add `SquadStop` model to schema
- [ ] Run migration
- [ ] Create `src/db/squadStops.ts`
- [ ] Create API routes for stops
- [ ] Create `SquadStops.tsx` component
- [ ] Create `SquadStopForm.tsx` component
- [ ] Integrate into Squad page
- [ ] Test add/edit/delete stops
- [ ] Test URL detection and linkification

---

## Phase 6: Day-of Mode

**Goal:** Add Day-of view with weather, know-before-you-go, and action buttons.

### Tasks

#### 6.1 Create DayOfModeView Component
**File:** `src/components/squad/DayOfModeView.tsx`

**Layout:**
1. Condensed event header (time, venue, who's going count)
2. Day-of essentials card:
   - Weather snippet (icon, temp, rain %)
   - Know-before-you-go (from TM enrichment)
3. Action buttons:
   - "Open Tickets" (deep-link to TM or venue)
   - "Get a Ride" (Uber/Lyft link — future, can stub)
   - "View Map" (venue location)
4. Squad Stops (timeline)
5. Pinned Squad Notes (top 1-2)

#### 6.2 Weather Integration
**File:** `src/lib/weather.ts` (new)

**Requirements:**
- Accept zipcode + date + time
- Return: icon, temperature range, precipitation chance
- API options: OpenWeatherMap, WeatherAPI, or similar
- Cache responses (weather doesn't change minute-to-minute)

**Venue zipcode:** Extract from `venue.address` or add `venue.zipcode` field if needed.

**If zipcode not available:** Fall back to Austin default (78701).

#### 6.3 Know-Before-You-Go
**File:** `src/components/squad/KnowBeforeYouGo.tsx`

**Data source:** `enrichment.tmPleaseNote` and `enrichment.tmInfo`

**Display:**
- Bullet points or simple text block
- Common info: doors time, bag policy, age requirements
- If no TM data, show "No additional info available"

#### 6.4 Mode Toggle in Squad Page
**File:** `src/components/squad/SquadPage.tsx`

**Requirements:**
- Segmented control: `[Plan] [Day-of]`
- Default to Plan mode
- When event is same-day or within 24 hours, show toast: "Day-of info available"
- Persist mode selection in component state (no need for URL/storage)

#### 6.5 Action Buttons
**File:** `src/components/squad/DayOfActions.tsx`

Buttons:
- "Open Tickets" → `enrichment.tmUrl` or `event.url`
- "Get a Ride" → Stub for now (can link to Uber app or just show "Coming soon")
- "View Map" → Google Maps link using venue address

### Phase 6 Checklist
- [ ] Create `DayOfModeView.tsx`
- [ ] Create `src/lib/weather.ts` with API integration
- [ ] Create `KnowBeforeYouGo.tsx`
- [ ] Create `DayOfActions.tsx`
- [ ] Add mode toggle to Squad page
- [ ] Wire up weather fetch (with venue zipcode)
- [ ] Test Day-of mode display
- [ ] Test mode toggle UX

---

## Validation Checklist (Run After Each Phase)

Before marking a phase complete, verify:

- [ ] **displayTitle:** Never computed in components — always from data layer
- [ ] **Enrichment:** Using `EnrichmentDisplay` subset for lists, full enrichment only when needed
- [ ] **Social signals:** Fetched via proper data layer functions
- [ ] **API routes:** Proper auth checks (user must be logged in, must be squad member)
- [ ] **Mobile-first:** Test on narrow viewport (375px)
- [ ] **Logged-out state:** Graceful fallbacks, "Sign in" prompts
- [ ] **No console errors:** Check browser console
- [ ] **TypeScript:** No type errors (`npm run build` passes)

---

## Notes for Roadmap

**Flag for future sprint:** Access controls across Squads and Communities
- Who can edit squad logistics?
- Who can delete notes?
- Community admin permissions?
- This needs a dedicated sprint after core features work.

**Weather API:** Choose one and add API key to `.env`:
- OpenWeatherMap (free tier: 1000 calls/day)
- WeatherAPI (free tier: 1M calls/month)
- Add `WEATHER_API_KEY` to environment variables

---

**Last Updated:** November 2025

