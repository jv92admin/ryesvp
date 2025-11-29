# Squads & Social Coordination Spec

**Last Updated:** November 29, 2025
**Status:** Planning

---

## TL;DR

RyesVP has three distinct social layers:

1. **Friends Network** – People you actually know; the foundation for everything
2. **Squads** – Event-specific micro-spaces for coordination ("Are we going? Who's buying tickets?")
3. **Communities** – Larger groups for discovery, graph expansion, and trusted ticket exchange

This spec defines the phased rollout from ticket statuses → Squads → reimagined Communities.

---

## Core Principles

1. **Don't replace group chats** – Squads streamline the boring parts; texts stay fun
2. **One event, one card** – No duplication across Social Tab sections
3. **Design for organizers** – Assume only 1-2 people are "power planners"
4. **Ticket exchange, not marketplace** – Scoped to trusted network, no payments/escrow
5. **Layered value** – Each phase justifies the next

---

## Phase 0: Ticket Statuses (Foundation)

**Goal:** Add Need/Have tickets to event data model + surface in event view

### Data Model

Expand `UserEventStatus` enum:

```prisma
enum UserEventStatus {
  INTERESTED      // Maybe, on my radar
  GOING           // Committed, have ticket or will get one
  NEED_TICKETS    // Actively looking
  HAVE_TICKETS    // Have extras to share/sell
}
```

**Rules:**
- Mutually exclusive (one status per user per event)
- Switching status clears the previous one
- Auto-logic (optional): If "Going" and previously "Need tickets", tiny prompt: "Did you get a ticket?"

### Event Detail UI Changes

Richer friend summary:

```
Your Network
├── 3 friends Going
├── 1 friend Interested  
├── 1 friend Needs tickets
└── 2 friends Have tickets
```

Each line is tappable → shows list of people with that status.

**Value even without Squads:** "Oh, Alex needs a ticket, I'll DM him."

### Implementation Tasks

- [ ] Add `NEED_TICKETS`, `HAVE_TICKETS` to UserEventStatus enum
- [ ] Migration to update existing data (no changes needed, just schema)
- [ ] Update AttendanceButton to show 4 options (or 2 rows of chips)
- [ ] Update event detail social summary to show all 4 statuses
- [ ] Add tappable lists for each status

**Estimated time:** 1-2 days

---

## Phase 1: Social Tab + Squads

**Goal:** Replace sidebar with Social Tab, add Squad rooms for coordination

### Navigation Change

**Before:**
- Main view: Calendar (events list)
- Right sidebar: Social signals

**After:**
- Toggle at top: `Calendar | Social`
- Calendar tab: Events list
- Social tab: Your Plans / Almost Plans / Ticket Activity
- **New Sidebar** (replaces social sidebar): "Just Listed", "Presales", "Your Calendar"
  - Non-social, calendar-esque features
  - Always visible on events page regardless of tab

### Social Tab Structure

#### Section A: Your Plans
Events you're committed to or coordinating.

**Inclusion logic (priority order):**
1. Events where you have a Squad
2. Events where you're Going

**Card shows:**
- Event info (title, time, venue)
- Squad summary if exists: "Squad with 4 friends · 2 bought tickets"
- If no squad: "You're going · 2 friends interested" + [Start Squad]

#### Section B: Almost Plans
Events that could become plans with 1-2 taps.

**Inclusion logic:**
- You are Interested or Going
- AND at least 1 friend is Interested or Going
- AND no Squad exists yet for you + this event

**Card shows:**
- "You're Interested"
- "2 friends Interested (Alex, Priya)"
- [Go Together] button

**Important:** Once Squad created, event moves A → removes from B.

#### Section C: Ticket Activity
Ticket-related activity in your network.

**Content:**
- "3 friends need tickets this weekend"
- "Alex has 2 extras for Tame Impala"
- Scoped to friends only (community-level in Phase 2)

**Card shows:**
- Event + who needs/has
- Tappable to see details + contact

### Squad Creation

#### Primary Path: "Go Together" Button

On event detail page:
- If no Squad exists → Create Squad, open room
- If Squad exists and you're a member → Open existing room
- If Squad exists via shared link → Add user, open room

#### Secondary Path: Share with Squad Checkbox

When sharing an event:
- Custom share screen shows: `[ ] Also create a Squad for this event`
- If checked: Squad created, link becomes `ryesvp.me/squad/<id>`

### Squad Room UX

#### Header
- Event name, date, time, venue
- "Your Squad" label with avatar stack

#### Section 1: Your Status
Compact card with segmented controls:

```
Are you going?     [ Thinking ] [ In ] [ Out ]
Budget             [ No pref ] [ <$50 ] [ $50-100 ] [ $100+ ]
Tickets            [ Not bought ] [ Buying own ] [ Buying for others ]
```

- Auto-save on tap
- Budget is approximate/max - powers the "Share plan" text
- If "Buying for others" → optional: "How many?" (+1/+2/Custom)

#### Section 2: Squad Snapshot
Human-readable summary:

```
Squad snapshot
5 invited · 3 In · 1 Thinking · 1 Out
2 have bought tickets · 1 is buying for 2 more

Progress: ████░░ 2/4 people In have tickets
```

If someone is "Buying for others":
- "Vignesh is buying for 2"
- Optional deadline toggle: "Set a purchase deadline?"

#### Section 3: Logistics
Appears once at least 1 person has tickets bought.

```
Plan the night
Meet: 7:30 pm          [time picker]
Where: Lazarus Brewing [text/search]
```

One meet time + one spot for v1. Keep it opinionated.

#### Section 4: Playlist (Nice-to-have)
```
Squad playlist (optional)
[Paste Spotify link]
```

Just a text field that accepts a link. Shows as "🎵 Squad playlist: [Open in Spotify]"

### Roles

- **Organizer** (Squad creator): Can set/edit logistics, deadlines
- **Member**: Can set own status, opt in/out

Keep roles minimal.

### Export Moments (Text Bridges)

#### Share Plan (Pre-purchase)
Button generates text based on user's ticket role:

**If buying for others:**
> "I'm organizing Tame Impala on Sat. Budget around $75-100. I'm grabbing tickets for people who are in by Thu 7pm. Mark your status here: [Squad link] and send me your Venmo!"

**If buying own:**
> "Thinking of Tame Impala on Sat (budget $75-100). If you're in, mark it and grab a ticket so we can coordinate: [Squad link]"

**If undecided:**
> "Interested in Tame Impala on Sat. Mark if you're in & your budget, we'll figure out tickets: [Squad link]"

#### Share Day-of Details
> "Tonight: Tame Impala! Meeting at 7:30 pm at Lazarus Brewing, then heading to the show. Squad details: [Squad link]"

### Data Model

```prisma
model Squad {
  id          String   @id @default(uuid())
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id])
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])
  
  // Logistics
  meetTime    DateTime?
  meetSpot    String?
  deadline    DateTime?  // For ticket purchase
  playlistUrl String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  members     SquadMember[]
  
  @@index([eventId])
  @@index([createdById])
}

model SquadMember {
  id        String   @id @default(uuid())
  squadId   String
  squad     Squad    @relation(fields: [squadId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  
  // Status within squad
  status    SquadMemberStatus @default(THINKING)
  budget    SquadBudget?      // Approximate max budget
  ticketStatus SquadTicketStatus @default(NOT_BOUGHT)
  buyingForCount Int?  // If buying for others, how many
  
  isOrganizer Boolean @default(false)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([squadId, userId])
  @@index([userId])
}

enum SquadBudget {
  NO_PREFERENCE
  UNDER_50
  FIFTY_TO_100
  OVER_100
}

enum SquadMemberStatus {
  THINKING
  IN
  OUT
}

enum SquadTicketStatus {
  NOT_BOUGHT
  BUYING_OWN
  BUYING_FOR_OTHERS
}
```

### Implementation Tasks

- [ ] Kill SocialSidebar component
- [ ] Create Social Tab with toggle UI
- [ ] Build Section A (Your Plans)
- [ ] Build Section B (Almost Plans)
- [ ] Build Section C (Ticket Activity - friends only)
- [ ] Add Squad/SquadMember models to schema
- [ ] Create Squad room UI
- [ ] "Go Together" button logic
- [ ] Share with Squad checkbox
- [ ] Export text generators
- [ ] Move sidebar content to Calendar tab ("Just Listed", "Presales")

**Estimated time:** 2-3 weeks

---

## Phase 2: Communities Reimagined

**Goal:** Redefine communities as trusted networks for discovery AND ticket exchange

### Current State

Communities exist with:
- ✅ Invite/join flow
- ✅ Shared visibility of members' events
- ✅ Basic admin moderation

Missing:
- ❌ Ticket exchange board
- ❌ Section C in Social Tab (community discovery)
- ❌ Rich community profiles/themes
- ❌ Multi-admin support
- ❌ Content beyond events

### Community Tickets Board

Each community gets a "Tickets" tab:

```
Tickets in Austin Indie

Tame Impala – Sat
├── 3 members Need tickets
└── 2 members Have tickets

Basement Jazz – Thu
└── 1 member Has tickets

[View all →]
```

Tapping an entry shows details:

```
Tame Impala – Tickets

Vignesh – Have tickets
  "2 GA at face, prefers Venmo"
  [View Profile] [Contact]

Sam – Need tickets
  "Looking for 1, flexible on price"
  [View Profile] [Contact]
```

**Contact options:**
- For now: assume friends/community members know how to reach each other
- Future: store phone numbers privately, enable "Text them" action
- **Never display phone/email publicly** - contact flows through the app
- No in-app messaging for v2

### "Have Tickets" Details (Optional Enhancement)

When marking "Have tickets", optional fields:
- Quantity: 1 / 2 / 3+
- Price: Face / Below face / Flexible
- Payment: Venmo / Cash / Flexible
- Note: free text ("Section 102, row 5")

Keep it dead simple for v2; can enhance later.

### Section C: Community Discovery

In Social Tab, Section C shows:

```
From your communities

Afrobeats Night – Sun 10pm
├── Trending in 3 communities you're in
└── 12 community members going/interested
[View Event]
```

**Inclusion logic:**
- Events "hot" in user's communities
- User is NOT yet Interested/Going
- No Squads, no/weak friends signal

**Movement:**
- User marks Interested → Event moves C → B
- User creates Squad → Event moves C → A

### Community Moderation

**Admin capabilities:**
- Remove members
- Delete inappropriate ticket posts
- Set community rules/description
- Approve join requests (optional: open vs approval-required)

**Multi-admin (stub for later):**
- Invite other admins
- Admin audit log

### Community Content Possibilities (Future Ideas)

These are stubs for future exploration:

1. **Event Recommendations**
   - Admins can "feature" events
   - "Recommended by Austin Indie" badge

2. **Discussion Threads**
   - Per-event threads within community
   - NOT a full forum, just "anyone going to this?"

3. **Community Playlists**
   - Spotify playlist tied to community vibe
   - Members can contribute

4. **Recurring Events**
   - "Every Thursday jazz night at..."
   - Community calendar

5. **Venue Partnerships**
   - Venues could create/manage communities
   - Presale codes for community members

### Marketplace-Adjacent Ideas (Explicitly NOT Building Yet)

These are documented to show what we're consciously avoiding:

❌ **Payment processing** - No escrow, no fees, no Stripe integration
❌ **Price enforcement** - No "must sell at face value" rules
❌ **Ticket verification** - No QR codes, no transfer tracking
❌ **Ratings/reviews** - Covered by soft reputation (Phase 3)
❌ **Bidding/offers** - Just "I need" / "I have"

**Why:** Marketplace mechanics attract scalpers and bad actors. Keeping it social keeps it trusted.

### Implementation Tasks

- [ ] Community Tickets tab UI
- [ ] "Have tickets" detail fields
- [ ] Section C in Social Tab
- [ ] Community moderation tools
- [ ] Contact mechanism (profile phone/IG)
- [ ] Multi-admin support (stub)

**Estimated time:** 2-3 weeks

---

## Phase 3: Soft Reputation

**Goal:** Ambient trust signals without ratings/reviews

### Profile Enhancements

When viewing someone's profile (or hover card):

```
Alex Chen
Member since Jan 2025
────────────────────
📅 42 events tracked
👥 12 squads joined
🎭 Communities: Austin Indie, East Side Nights

Relationship: Friend of friend (via Priya)
```

### Trust Signals

| Signal | What It Shows |
|--------|---------------|
| Member tenure | "Member since Jan 2025" |
| Activity level | "42 events tracked" |
| Social proof | "12 squads joined" |
| Network overlap | "Friend" / "Friend of friend" / "Same community" / "No mutuals" |
| Communities | Which communities they're in |

### Relationship Context

When viewing ticket needs/haves or Squad members:

```
Sam – Need tickets
  🔗 Friend of friend (via Alex)
  🎭 Same community: East Side Nights
```

This helps answer: "Do I trust this person enough to sell them my ticket?"

### Implementation Tasks

- [ ] Profile enhancement UI
- [ ] Compute activity stats (events tracked, squads joined)
- [ ] Relationship computation (friend, FoF, same community, no mutuals)
- [ ] Hover/profile card component

**Estimated time:** 1 week

---

## Summary: What We're Building

| Phase | Focus | Key Deliverable |
|-------|-------|-----------------|
| **0** | Foundation | Need/Have ticket statuses |
| **1** | Core Experience | Social Tab + Squads |
| **2** | Network Expansion | Communities + Ticket Exchange |
| **3** | Trust | Soft Reputation |

---

## What We're NOT Building

- ❌ In-app messaging/chat
- ❌ Payment processing
- ❌ Star ratings/reviews
- ❌ One user in multiple squads for same event (v2) - block/error if already in a squad
- ❌ Friend badges ("5 shows together") (v2)
- ❌ Auto-generated playlists (v2)
- ❌ Push notifications (in-app alerts only)

**Note on multiple squads:** An event CAN have multiple squads (different friend groups). But one user can only be in ONE squad per event. If someone tries to add a user who's already in a squad for that event → show error/block. Future: allow user to switch or be in multiple.

---

## Success Metrics

**Phase 0:**
- % of users who set Need/Have tickets status
- Ticket status → actual exchange (qualitative)

**Phase 1:**
- Social Tab engagement (views, time spent)
- Squads created per event
- "Share plan" texts sent
- Squad → actual attendance correlation

**Phase 2:**
- Community ticket board usage
- Cross-community ticket exchanges
- Community growth rate

**Phase 3:**
- Profile views
- Trust signals impact on exchange willingness (qualitative)

---

## Open Questions (Resolved)

1. ✅ **Budget in Squads** - Keep as approximate max budget (powers Share text)
2. ✅ **Contact mechanism** - For now: friends know how to reach each other. Future: store phone numbers privately for texting. **Never display phone/email publicly anywhere.**
3. ✅ **"Just Listed" / Presales** - New sidebar on events page (replaces social sidebar)
4. ✅ **Multiple squads per event** - Event can have multiple squads, but user can only be in ONE. Block/error if already in a squad. Multi-squad per user is v2.

---

**Next Steps:**
1. Review this spec
2. Finalize open questions
3. Create implementation tickets for Phase 0

