# Squad Page UX Revision

> **For Junior LLM Execution**
> 
> This document revises the Squad page UX based on feedback. It supersedes the ticket/status sections of the original task list for Phase 2.

---

## Summary of Changes

1. **Ticket coordination model** — "I'm buying for Y" covers Y, who no longer sees ticket questions
2. **"Buy for all" action** — One-tap to cover everyone who needs tickets
3. **Tri-state model** — Both Attendance and Tickets use Yes/Maybe/No
4. **Budget** — Soft numeric cap with chip shortcuts, not fixed categories
5. **Layout** — Remove SquadSnapshot (redundant), ticket summary near questions, logistics deferred

---

## 1. Attendance & Ticket Model

### Attendance (per person)
Everyone sets their attendance:

| State | UI Label | Meaning |
|-------|----------|---------|
| `IN` | ✅ Yes | I'm going |
| `THINKING` | ❓ Maybe | Interested, not committed |
| `OUT` | ❌ No | Not going |

**If OUT:** No ticket questions shown. Done.

### Tickets (per person, only if Yes/Maybe)

**Two paths:**

**Path A: Covered by group buy**
- Someone else is buying their ticket
- Show: `🎟 Covered by [Name]`
- Ticket controls hidden/disabled
- Small text: "Your ticket is being handled by [Name]"

**Path B: Not covered (handles own ticket)**

| State | UI Label | Meaning |
|-------|----------|---------|
| `TICKET_YES` | ✅ Yes | I have / will get my own ticket |
| `TICKET_MAYBE` | ❓ Maybe | Open to getting one, not committed |
| `TICKET_NO` | ❌ No | Not planning to get a ticket |

### Data Model Changes

**Current `SquadMember` fields:**
```prisma
status: SquadMemberStatus  // THINKING, IN, OUT
ticketStatus: SquadTicketStatus  // NOT_BOUGHT, BUYING_OWN, BUYING_FOR_OTHERS
buyingForCount: Int?
buyingForIds: String[]
budget: SquadBudget?  // NO_PREFERENCE, UNDER_50, FIFTY_TO_100, OVER_100
```

**Revised `SquadMember` fields:**
```prisma
status: SquadMemberStatus  // THINKING, IN, OUT (keep as-is)
ticketStatus: SquadTicketStatus  // YES, MAYBE, NO, COVERED (new enum values)
coveredById: String?  // userId of person covering this member's ticket
buyingForIds: String[]  // userIds this member is buying tickets for
// REMOVED: budget, budgetMax — replaced by Squad-level price guide
// REMOVED: buyingForCount — derive from buyingForIds.length
```

**New `SquadPriceGuide` model:**
```prisma
model SquadPriceGuide {
  id        String   @id @default(uuid())
  squadId   String
  squad     Squad    @relation(fields: [squadId], references: [id], onDelete: Cascade)
  label     String?  // "GA", "Balcony", etc.
  priceMin  Int
  priceMax  Int?     // null if single price
  source    String?  // "Ticketmaster", etc.
  addedById String
  addedBy   User     @relation(fields: [addedById], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([squadId])
}
```

**Migration needed:**
- Add `coveredById` field to SquadMember
- Change `SquadTicketStatus` enum: `NOT_BOUGHT` → `MAYBE`, `BUYING_OWN` → `YES`, add `NO`, add `COVERED`
- Remove `buyingForCount` (derive from `buyingForIds.length`)
- Remove `budget` field entirely (no replacement on member)
- Add new `SquadPriceGuide` model

---

## 2. "Buy for Others" Flow

### When it appears
The "Buy for others" option **only shows after you set your ticket to YES**.

Flow:
1. User sets attendance: Yes/Maybe
2. User sets their ticket: Yes/Maybe/No
3. **If ticket = YES** → "Buy for others" section appears below
4. If ticket = Maybe/No → no buying option shown

### UI (after selecting Ticket = YES)
```
┌─────────────────────────────────────────┐
│ Tickets                                 │
├─────────────────────────────────────────┤
│ Your ticket: [✅ Yes] [❓ Maybe] [❌ No] │
│                                         │
│ ─────────────────────────────────────── │
│ Buy for others? (optional)              │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🎫 Buy for all who need (3)         │ │  ← One-tap action
│ └─────────────────────────────────────┘ │
│                                         │
│ Or pick individuals:                    │
│ ☐ Yoda (needs ticket)                   │
│ ☐ Leia (maybe)                          │
│ ☐ Han (needs ticket)                    │
│ ─ Chewie (not going)                    │  ← Greyed out, can't select
└─────────────────────────────────────────┘
```

### Logic
1. "Buy for others" section hidden until user's ticket = YES
2. "Buy for all" button shows count of members with `ticketStatus = MAYBE` or `NO` who are not OUT
3. Clicking it:
   - Sets those members' `ticketStatus = COVERED`
   - Sets their `coveredById = currentUserId`
   - Adds their IDs to current user's `buyingForIds`
4. Individual checkboxes allow selective picking
5. OUT members shown greyed out (can't be selected)
6. If user unchecks someone, that person's `coveredById` is cleared, `ticketStatus` reverts

---

## 3. Per-Member Row Display (Compact)

**Design principle:** One line per member. Use icons, not text. Covered shows initial.

### Icon Legend
| Icon | Meaning |
|------|---------|
| ✅ | Going (attendance = Yes) |
| ❓ | Maybe (attendance = Maybe) |
| ❌ | Not going (attendance = Out) |
| 🎫 | Has/getting own ticket |
| 🎫(V) | Covered by Vignesh (shows first initial) |
| 🎫+2 | Buying for 2 others |

### Row Format
```
[Avatar] Name [+N]    [Attendance Icon] [Ticket Icon]
```

### Examples

**Going, has own ticket:**
```
👤 Jabba              ✅  🎫
```

**Going, buying for 2 others:**
```
👤 Jabba (+2)         ✅  🎫+2
```

**Going, covered by Vignesh:**
```
👤 Yoda               ✅  🎫(V)
```

**Maybe, ticket undecided:**
```
👤 Leia               ❓  🎫?
```

**Not going:**
```
👤 Chewie             ❌
```
(No ticket icon — they're out)

### Full Member List Example
```
┌─────────────────────────────────────────┐
│ Members (5)                             │
├─────────────────────────────────────────┤
│ 👤 Vignesh (+2)     ✅  🎫+2  [Organizer]│
│ 👤 Yoda             ✅  🎫(V)            │
│ 👤 Leia             ✅  🎫(V)            │
│ 👤 Han              ✅  🎫               │
│ 👤 Chewie           ❌                   │
└─────────────────────────────────────────┘
```

### Hover/Tap for Details
On tap/hover, show tooltip or expand with details:
- "Covered by Vignesh"
- "Buying for: Yoda, Leia"
- Ticket status if relevant

---

## 4. Ticket Price Guide (Replaces Per-Person Budget)

### Why kill per-person budget
- **Socially awkward:** "I can only do $40" vs "I'm fine with $200" is loaded
- **Hidden complexity:** If not displayed, it's admin confusion
- **Cognitive load:** Users have to invent a number about themselves

### New model: Squad-level price guide
Instead of "what are you willing to spend?" → "what have people seen out there?"

### Data Model
```prisma
model SquadPriceGuide {
  id        String   @id @default(uuid())
  squadId   String
  squad     Squad    @relation(fields: [squadId], references: [id], onDelete: Cascade)
  label     String?  // "GA", "Balcony", "Section 108", etc.
  priceMin  Int      // e.g. 75
  priceMax  Int?     // e.g. 90 (null if single price)
  source    String?  // "Ticketmaster", "Venue site", etc.
  addedById String
  addedBy   User     @relation(fields: [addedById], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([squadId])
}
```

### UI — Empty state
```
┌─────────────────────────────────────────┐
│ Ticket price guide                      │
│                                         │
│ No one has shared price info yet.       │
│ If you've seen tickets, add a rough     │
│ range to help everyone decide.          │
│                                         │
│ [+ Add price info]                      │
└─────────────────────────────────────────┘
```

### UI — With data
```
┌─────────────────────────────────────────┐
│ Ticket price guide                      │
│                                         │
│ GA floor: ~$75–90                       │
│ Added by Jabba · 2h ago                 │
│                                         │
│ Balcony: ~$45–60                        │
│ Added by Yoda · 1d ago                  │
│                                         │
│ [+ Add another range]                   │
└─────────────────────────────────────────┘
```

### Add/Edit form
```
┌─────────────────────────────────────────┐
│ Add price info                          │
│                                         │
│ Label (optional):                       │
│ [GA / Balcony / Section 108...]         │
│                                         │
│ Price range:                            │
│ From: $[___]  To: $[___] (optional)     │
│                                         │
│ Source (optional):                      │
│ [Ticketmaster / Venue site / ...]       │
│                                         │
│ [Cancel]  [Save]                        │
└─────────────────────────────────────────┘
```

Helper copy: "Ballpark only — just to give people a sense of typical prices."

### Permissions
- **Anyone** in the Squad can add/edit
- Show "Added by [name]" for transparency
- Future: restrict to organizer if needed

---

## 5. Layout Revision

### Remove
- **SquadSnapshot** — Redundant with Members section
- **SquadLogistics** — Defer to Day-of mode (Phase 6). Don't show meetTime/meetSpot in Plan mode.

### New Layout (Plan Mode)

```
┌─────────────────────────────────────────┐
│ ← Back to event                         │
│ [Thumbnail] Event Title                 │
│ Sat, Dec 14 • 8:00 PM • Moody Center   │
├─────────────────────────────────────────┤
│ Your Status                             │
│ [✅ Yes] [❓ Maybe] [❌ No]              │
├─────────────────────────────────────────┤
│ Tickets                                 │
│ Your ticket: [✅ Yes] [❓ Maybe] [❌ No] │
│                                         │
│ (If ticket = Yes, show:)                │
│ ─────────────────────────────────────── │
│ Buy for others?                         │
│ [🎫 Buy for all who need (3)]           │
│ ☐ Yoda  ☐ Leia  ☐ Han                   │
│                                         │
│ Summary: 2 covered by you, 1 has own    │
├─────────────────────────────────────────┤
│ Ticket price guide                      │
│ GA: ~$75–90 (Jabba · 2h ago)            │
│ [+ Add price info]                      │
├─────────────────────────────────────────┤
│ Members (5)                             │
│ 👤 You (+2)         ✅  🎫+2 [Organizer]│
│ 👤 Yoda             ✅  🎫(Y)           │
│ 👤 Leia             ✅  🎫(Y)           │
│ 👤 Han              ✅  🎫              │
│ 👤 Chewie           ❌                  │
├─────────────────────────────────────────┤
│ [+ Invite Friends]                      │
├─────────────────────────────────────────┤
│ [Share Plan]  [Share Day-of]            │
├─────────────────────────────────────────┤
│ [Leave Squad]                           │
└─────────────────────────────────────────┘
```

### Section Order
1. Event header (compact, links to event)
2. Your Status (attendance)
3. Tickets (your ticket + buy for others if applicable)
4. Ticket price guide (Squad-level, optional)
5. Members (compact, one line each)
6. Invite Friends
7. Share buttons
8. Leave Squad

### Ticket Summary Line
Near the ticket controls, show a quick summary:
- "2 covered by you, 1 has own ticket, 2 still deciding"
- Helps organizer see status at a glance

---

## 6. Implementation Tasks

### 6.1 Schema Migration
**File:** `prisma/schema.prisma`

1. Update `SquadTicketStatus` enum:
```prisma
enum SquadTicketStatus {
  YES      // Has/will get own ticket
  MAYBE    // Open to getting one
  NO       // Not buying
  COVERED  // Someone else is buying
}
```

2. Update `SquadMember` model:
```prisma
model SquadMember {
  // ... existing fields
  ticketStatus   SquadTicketStatus @default(MAYBE)
  coveredById    String?  // Who is covering this member's ticket
  coveredBy      User?    @relation("CoveredByUser", fields: [coveredById], references: [id])
  buyingForIds   String[] // Who this member is buying tickets for
  // REMOVE: budget, buyingForCount
}
```

3. Add `SquadPriceGuide` model:
```prisma
model SquadPriceGuide {
  id        String   @id @default(uuid())
  squadId   String
  squad     Squad    @relation(fields: [squadId], references: [id], onDelete: Cascade)
  label     String?
  priceMin  Int
  priceMax  Int?
  source    String?
  addedById String
  addedBy   User     @relation(fields: [addedById], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([squadId])
}
```

4. Update `Squad` model to include relation:
```prisma
model Squad {
  // ... existing
  priceGuides SquadPriceGuide[]
}
```

5. Run migration

### 6.2 Data Migration Script
Convert existing data:
- `NOT_BOUGHT` → `MAYBE`
- `BUYING_OWN` → `YES`
- `BUYING_FOR_OTHERS` → `YES` (keep buyingForIds)
- Drop `budget` field (no conversion needed — just remove)

### 6.3 API Updates

**Update:** `src/app/api/squads/[id]/status/route.ts`
- New ticket status values
- `coveredById` field
- "Buy for all" action (set multiple members' `coveredById` at once)

**New:** `src/app/api/squads/[id]/price-guide/route.ts`
- GET: List price guides for squad
- POST: Add new price guide entry

**New:** `src/app/api/squads/[id]/price-guide/[guideId]/route.ts`
- PUT: Update price guide entry
- DELETE: Remove price guide entry

### 6.4 New Component: SquadStatusSection
**File:** `src/components/squad/SquadStatusSection.tsx`

Your attendance: Yes/Maybe/No toggle

### 6.5 New Component: SquadTicketsSection
**File:** `src/components/squad/SquadTicketsSection.tsx`

- Your ticket status: Yes/Maybe/No toggle (hidden if covered by someone)
- If ticket = YES: Show "Buy for others" section
  - "Buy for all who need (N)" button
  - Individual checkboxes
- Summary line: "2 covered by you, 1 has own"

### 6.6 New Component: SquadPriceGuide
**File:** `src/components/squad/SquadPriceGuide.tsx`

- Empty state with "Add price info" button
- List of price ranges with attribution
- Add/edit form modal

### 6.7 Update: SquadMemberList
**File:** `src/components/squad/SquadMemberList.tsx`

**Compact one-line format:**
- Avatar + Name + (+N if buying for others)
- Attendance icon (✅/❓/❌)
- Ticket icon:
  - 🎫 = has own
  - 🎫+N = buying for N others
  - 🎫(X) = covered by X (show first initial)
  - 🎫? = undecided
  - (none) = not going
- Organizer badge if applicable

### 6.8 Update: PlanModeView
**File:** `src/components/squad/PlanModeView.tsx`

New order:
1. Event header (compact, links to event)
2. SquadStatusSection (your attendance)
3. SquadTicketsSection (your ticket, buy for others, summary)
4. SquadPriceGuide (ticket price guide)
5. SquadMemberList (compact, one line each)
6. Invite Friends button
7. Share buttons
8. Leave Squad

Remove:
- SquadSnapshot (redundant)
- SquadLogistics (deferred to Day-of mode)

### 6.9 Update: SquadModal
**File:** `src/components/squad/SquadModal.tsx`

Slim down to:
- Event header (compact)
- Your status (Yes/Maybe/No)
- Quick ticket status (Yes/Maybe/No, or "Covered by X")
- Member summary ("3 going, 1 maybe")
- "View Full Squad →" link

No price guide, no buy-for-others in modal — that's on the full page.

---

## 7. Validation Checklist

Before marking complete:
- [ ] Schema migration runs without errors
- [ ] Existing data migrated correctly (ticket status values converted)
- [ ] "Buy for others" section only shows when your ticket = YES
- [ ] "Buy for all" correctly sets `coveredById` on all targets
- [ ] Covered members don't see ticket controls
- [ ] Uncovering someone clears their `coveredById` and reverts their status
- [ ] Price guide CRUD works (add, edit, delete)
- [ ] Price guide shows "Added by [name]" attribution
- [ ] Summary line counts are accurate
- [ ] Member list is compact (one line per member, icons only)
- [ ] Covered members show initial of coverer: 🎫(V)
- [ ] Modal is slimmed down, links to full page
- [ ] No TypeScript errors
- [ ] Mobile layout works (test at 375px)

---

## 8. Data Model Summary

### Before
```
SquadMember:
  status: THINKING | IN | OUT
  ticketStatus: NOT_BOUGHT | BUYING_OWN | BUYING_FOR_OTHERS
  budget: NO_PREFERENCE | UNDER_50 | FIFTY_TO_100 | OVER_100
  buyingForCount: Int?
  buyingForIds: String[]
```

### After
```
SquadMember:
  status: THINKING | IN | OUT (unchanged)
  ticketStatus: YES | MAYBE | NO | COVERED (new values)
  coveredById: String? (new — who is covering this member)
  buyingForIds: String[] (who this member is buying for)
  // REMOVED: budget, buyingForCount

NEW MODEL:
SquadPriceGuide:
  id, squadId, label?, priceMin, priceMax?, source?, addedById, createdAt
```

---

*Last Updated: November 2025*

