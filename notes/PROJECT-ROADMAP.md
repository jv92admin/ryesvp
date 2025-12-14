# RyesVP Project Roadmap

## Overview

Master tracker for all workstreams. Individual specs contain implementation details.

**Spec Documents:**
- `data-model-101.md` - **Canonical event types & access patterns (READ FIRST)**
- `event-discovery-spec.md` - **Event Discovery & Performer Model**
- `friend-links-spec.md` - **Friend Links & Communities (ACTIVE)**
- `engagement brainstorm.md` - **Onboarding tips & nudges (ACTIVE)**
- `squads-social-spec.md` - Squads, Social Tab, Ticket Exchange
- `ui-polish-spec.md` - Visual improvements, event cards, layout
- `social-layer-spec.md` - Friends, lists, communities (legacy)
- `social-layer-phase5-spec.md` - Invite codes
- `data-enrichment-spec.md` - Knowledge Graph, Spotify integration (legacy - see event-discovery-spec)
- `scheduled-jobs-spec.md` - Cron for scraping + enrichment

---

## Current Priority Order

**Strategy:** Event Discovery Foundation → UX Quick Wins → User Testing → Data Enrichment

| Block | Phase | Description | Est. Time | Status |
|-------|-------|-------------|-----------|--------|
| **A** | **Event Discovery 0** | Scraper cleanup & stabilization | 1-2 days | ✅ Complete |
| **A** | **Event Discovery 1.1** | Priority venue identification | 0.5 day | ✅ Complete |
| **A** | **Event Discovery 1.2** | Add priority venue scrapers | 2-3 days | ✅ Complete (11/11) |
| **A** | **Event Discovery 1.3** | Comprehensive source audit | 1-2 days | ✅ Complete |
| **A** | **Event Discovery 1.4** | Performer entity design | 0.5 day | ✅ Complete |
| **A** | **Event Discovery 1.5** | Performer entity + modal UI | 2-3 days | ✅ Complete |
| **A** | **Event Discovery 1.6** | Search + Filter Strip redesign | 1-2 days | ✅ Complete |
| **B** | **UX: Friend Links + Onboarding** | Profile page, Add Friend, onboarding tips | 2 days | 🔄 In Progress |
| **B** | **UX: Group Friend Links** | Community backend (hidden), group join flow | 1 day | 🔲 |
| **B** | **UX: Transactional Emails** | Welcome, invites, reminders | 2-3 days | 🔲 |
| **B** | **UX: Bug Fixes** | Issues identified during build | 1-2 days | 🔲 |
| **C** | **User Testing** | Invite 20-30 users, collect feedback | 1-2 weeks | 🔲 |
| **D** | **Event Discovery 2.x** | Data enrichment (venue, event, performer) | 1-2 weeks | 🔲 |
| **D** | **Event Discovery 3.x** | Personalization + Spotify OAuth | 1 week | 🔲 |
| — | Create-Your-Own Event | User-generated events | 3-5 days | 🔲 Deferred |
| — | Communities v1 | Reimagined communities | 2-3 weeks | 🔲 Deferred |

**Note:** Event Discovery spec's **Performer** model replaces the original "Artist Foundation" (Phase 5). Event Discovery Phase 3 (Spotify) covers what was originally "Phase 6".

---

## Completed Phases (Legacy Numbering)

| # | Phase | Description | Status |
|---|-------|-------------|--------|
| 0 | Ticket Statuses | Expand UserEventStatus | ✅ Complete |
| 1 | Social Tab + Squads | Plans, social signals | ✅ Complete |
| 1.5 | Security - RLS | Row Level Security | ✅ Complete |
| 1.6 | In-App Notifications | Bell, triggers | ✅ Complete |
| 2 | Backend Reliability | Async jobs, cron | ✅ Complete |
| 3A | Start Plan Ingresses | Multiple entry points | ✅ Complete |
| 4B | Friend Profile Page | `/users/[id]`, "Start plan with X" | ✅ Complete |

---

## Block A: Event Discovery Foundation

**See:** `notes/event-discovery-spec.md` for full details.

**Goal:** Build robust event coverage and search before inviting more users.

### Phase 0: Scraper Cleanup & Stabilization ✅ COMPLETE

**Goal:** Fix and optimize existing 6 scrapers BEFORE expanding.

**Scrapers audited:**
- [x] Moody Center - ✅ Healthy (69 events)
- [x] ACL Live - ✅ Fixed infinite scroll + Load More (73 events to Dec 2026)
- [x] Paramount Theatre - ✅ Healthy (102 events)
- [x] Bass Concert Hall / Texas Performing Arts - ✅ Healthy (37 events)
- [x] Emo's - ✅ Fixed image extraction + hybrid JSON-LD/DOM parsing (37 events)
- [x] Long Center - ✅ Healthy (59 events)

**Output:** All scrapers working reliably, ~570 events across 15 venues.

### Phase 1.1: Priority Venue Identification

**Goal:** Identify gaps in venue coverage for Austin.

**Create:** `docs/priority-venues.md`

**Priority categories:**
- Major music venues (not yet covered)
- Sports stadiums (UT, Austin FC, minor league)
- Comedy clubs
- Theaters
- Bars with regular events

### Phase 1.2: Add Priority Venue Scrapers

**Goal:** Expand coverage to priority venues.

- Implement scrapers using patterns from Phase 0
- Ensure events link to Venue entity
- Test reliability before moving on

### Phase 1.3: Comprehensive Source Audit ✅ COMPLETE

**Goal:** Document what metadata is available across ALL sources.

**Output:** `docs/source-data-audit.md`
- Documented all 17 scrapers with field coverage
- Identified gaps: Antone's (door/age), Mohawk (venue type/age), Moody Amp (image)
- Identified common platforms: TicketWeb, JSON-LD, MEC, SeeTickets
- Created enhancement priorities for Phase 2 venue/event enrichment

### Phase 1.4: Performer Entity Design ✅ COMPLETE

**Goal:** Design Performer model based on audit findings.

**Key decisions:**
- Single `Performer` entity (not separate Artist/Team/etc.)
- `type` discriminator: ARTIST, TEAM, COMEDIAN, COMPANY, OTHER
- Event → Performer: Simple FK (not many-to-many, simplifies MVP)
- User → Performer: Junction table for follows (better query patterns)
- External IDs: Explicit columns (spotifyId, ticketmasterId, espnId) not JSON
- Universal `tags` array for genres/styles/leagues

**Output:** `docs/performer-model-design.md`

### Phase 1.5: Performer Entity Implementation ✅ COMPLETE

**Goal:** Create Performer model + basic UI.

- [x] Create Performer model in Prisma
- [x] Create UserPerformerFollow junction table
- [x] Add Event.performerId FK
- [x] Migration: `20251211041441_add_performer_entity`
- [x] Backfill script: 502 performers, 597 events linked
- [x] PerformerModal UI (click performer name → see bio, image, past/upcoming shows)
- [x] Integrate into Event page

**Future follow-ups (not MVP):**
- Follow button + notification when followed performer has new show
- Performer data cleanup (remove legacy artist fields from Enrichment)
- Full `/performers/[slug]` page (Phase 4.3)

### Phase 1.6: Search + Filter Strip Redesign ✅ COMPLETE

**Goal:** Enable search and redesign filter UI with instant apply.

**What was built:**
- [x] `pg_trgm` migration for fuzzy search indexes
- [x] Search across event title, performer name, venue name, genres, category
- [x] Partial genre matching (e.g., "rock" finds "alternative rock")
- [x] New `FilterStrip` component with instant URL-based filtering
- [x] `SearchInput` with 300ms debounce
- [x] `DateChips` — This Week, Weekend, custom date picker
- [x] `CategoryChips` — Concerts, Comedy, Theater, Sports, Other
- [x] `DiscoveryChips` — New (count), Presales (count)
- [x] All filters use URL params (`?q=`, `?when=`, `?categories=`, `?new=`, `?presales=`)
- [x] No "Apply" button — all filters instant
- [x] Removed legacy separate New/Presales views
- [x] Chip styling with borders + green hover accents

**Deleted:**
- `src/components/EventFilters.tsx`
- `src/components/DiscoveryStrip.tsx`

**New components:** `src/components/discovery/`

---

## Block B: UX Quick Wins

**Goal:** Polish UX before inviting real users.

**Specs:**
- `friend-links-spec.md` — Friend adding infrastructure
- `engagement brainstorm.md` — Onboarding tips and nudges

### Friend Links + Onboarding (was Avatar Popover)

**Goal:** Make friend-adding frictionless + teach users the product.

**Phase 1: Core Loop (2 days)** 🔄 IN PROGRESS
- [ ] Profile page with Add Friend button
- [ ] Avatars clickable → profile (everywhere: interested, going, plan members)
- [x] Unified friend/invite link → renamed to "Add Friend" CTA
- [x] "Add friends" tip on All Events page (from engagement spec)
- [x] Friend-add notifications (existing — inviter gets notified)

**Phase 1b: Onboarding UX (COMPLETE ✅)**
- [x] OnboardingModal — First-time user welcome ("Discover. Connect. Plan. Go.")
- [x] OnboardingTips — "Mark as Going/Interested" + "Add friends" tips
- [x] SignInTip — Nudge for logged-out users
- [x] SetNameBanner — Restyled to match tip aesthetic
- [x] ViewToggle reads `?view=social` URL param
- [x] SocialSummaryChips — Friends chip always visible (shows empty state)
- [x] Version flag for force-showing tips to legacy users

**Ship + validate:** Do people share friend links?

**Phase 2: Group Links (1 day)**
- [ ] Community model (hidden in UI, backend only)
- [ ] Group link generation + join flow
- [ ] Auto-friend on group join
- [ ] Batched notifications (one per person, not per friendship)

**Ship + validate:** Do people use group links for concert crews?

**Deferred (future Communities reveal):**
- Community name input, list/tab, settings page
- Auto-friend toggle UI

### Transactional Emails

**Goal:** Basic transactional emails for key moments.

**Emails to Build:**
- [ ] Welcome email (on signup)
  - "This is a small community project"
  - How to start a plan, how to invite friends
  - Privacy reassurance
- [ ] "You were added to a plan" email
- [ ] "Your event is tomorrow" reminder email

**Email Philosophy:**
- Low risk, high clarity
- Reply-to-act where possible (parse "I'm in, need 1 ticket")
- No journeys/drip campaigns yet — just transactional

### UX Bug Fixes

- [ ] Issues identified during Event Discovery build
- [ ] Any other friction points

---

## Block C: User Testing Pause

**Goal:** Validate foundation before investing in enrichment.

**Activities:**
- [ ] Invite 20-30 real users
- [ ] Collect feedback on event discovery, search, plan creation
- [ ] Fix top issues
- [ ] Huddle on technical roadmap for enrichment (Block D)

**Exit criteria:** TBD by PM based on user feedback.

---

## Block D: Data Enrichment & Personalization

**See:** `notes/event-discovery-spec.md` Phases 2-3 for full details.

### Event Discovery Phase 2: Data Enrichment

**Goal:** Enrich events, venues, and performers based on user feedback.

- 2.1 Enrichment use case selection (with PM)
- 2.2 Enrichment schema design
- 2.3 Venue enrichment
- 2.4 Event enrichment
- 2.5 Performer enrichment
- 2.6 Discovery upgrade (new filters based on enrichment)

### Event Discovery Phase 3: Personalization + Spotify

**Goal:** Personalized recommendations based on music taste.

- 3.1 Spotify OAuth flow
- 3.2 Fetch user's top artists, match to Performers
- 3.3 "For You" surface based on preferences

**Note:** This covers what was originally "Phase 6: Spotify v1" in the old roadmap.

---

## Deferred Work

### Create-Your-Own Event (was Phase 4A)

**Deferred because:** Core loop works well with scraped events. User events add complexity (moderation, spam, visibility). Will revisit after Event Discovery proves useful.

**When ready:**
- `/events/new` page
- Fields: Title, Date/time, Location (text + optional map), URL (optional), Description
- Creates event with `source: 'USER_CREATED'`
- Event page IS the plan (like Partiful)
- Invite friends flow

### Communities v1 (was Phase 7)

**Deferred because:** Communities need people to show up — ship last.

**When ready:**
- Plan → Community relation
- Start plan from community
- Simple community feed

---

## Historical: Completed Infrastructure

### Phase 2: Backend Reliability ✅ COMPLETE

**Goal:** Make the app stop feeling "dev-manually-powered" before widening usage.

**Cron Jobs Built:**
- [x] `/api/cron/scrape` — Daily venue scraping (6 venues)
- [x] `/api/cron/enrich` — LLM + KG + Spotify enrichment (with `force` option)
- [x] `/api/cron/tm-download` — Ticketmaster cache download
- [x] `/api/cron/tm-match` — TM event matching for buy links
- [x] `/api/cron/weather-precache` — Weather pre-caching

**Infrastructure:**
- [x] `src/lib/cron/auth.ts` — CRON_SECRET validation
- [x] `vercel.json` — Daily schedule (2-6 AM Central)
- [x] All routes authenticated with Bearer token
- [x] Console logging for job results (visible in Vercel logs)

**Bug Fixes:**
- [x] Scrape no longer overwrites LLM-assigned categories
- [x] Prisma config works on Vercel (process.env fallback)

**See:** `docs/phase2-backend-reliability-plan.md` and `notes/scheduled-jobs-spec.md`

---

### Phase 3A: Start Plan Ingresses ✅ COMPLETE

**Goal:** Make "start a plan" the obvious, easy action everywhere.

**Ingresses Built:**
- [x] Global header CTA: "Start a Plan" button opens modal → search events → create plan
- [x] Event cards: Going/Interested buttons → "Start Plan" appears after selection
- [x] Profile page: Quick Actions section with "Start a Plan" CTA
- [x] StartPlanModal: Search ~500 events, select, proceed to squad creation

**Architectural Improvements (based on feedback):**
- [x] DRY: `EventCardActions` component handles attendance + conditional Start Plan
- [x] Simplified header: Friends link moved into UserMenu dropdown
- [x] Header CTA: Outline button style matches SmartSquadButton for consistency
- [x] Progressive disclosure: Start Plan only appears after user shows intent (Going/Interested)

**Components Created/Modified:**
- `src/components/EventCardActions.tsx` — Compact ✓/★ buttons + conditional Start Plan
- `src/components/StartPlanButton.tsx` — Reusable header/profile CTA
- `src/components/StartPlanModal.tsx` — Event search → squad creation flow
- `src/components/UserMenu.tsx` — Added Friends link

**Deferred:**
- Friend profile "Start plan with X" (Phase 4B)
- Friend avatar popover (Phase 4C)

---

### Phase 1.5: Security - Enable RLS ✅ COMPLETE

**What:** Enabled Row Level Security on all 16 Supabase tables.

**Migration:** `prisma/migrations/20251202000000_enable_rls/migration.sql`

**What's protected:**
- User profiles (displayName public, email self-only)
- Friendships (participants only)
- UserEvent attendance (self + friends)
- Private lists (owner only)
- Invite codes (self only)
- Squads (members see full, friends see existence)
- Squad members, price guides, stops (squad members)
- Public data (Venue, Event, Enrichment, Weather) — read-only for users

**Helper functions created:**
- `get_user_id()` — Maps auth.uid() to User.id
- `are_friends(user1, user2)` — Checks ACCEPTED friendship
- `is_squad_member(squad_id, user_id)` — Checks squad membership

**Note:** App uses Prisma (direct DB connection), so RLS is defense-in-depth. Primary access control remains in API routes.

### Phase 0: Ticket Statuses ✅ COMPLETE
See `squads-social-spec.md` for full details.

**What we're adding:**
- Expand UserEventStatus: `INTERESTED | GOING | NEED_TICKETS | HAVE_TICKETS`
- Mutually exclusive statuses (one at a time)
- Richer friend summary on event detail: "3 Going · 1 Needs tickets · 2 Have tickets"
- Tappable lists for each status

**Value:** "Oh, Alex needs a ticket, I'll DM him" - no marketplace needed.

### Phase 1: Social Tab + Squads ✅ COMPLETE
See `squads-social-spec.md` for full details.

**What we built:**
- ✅ Kill SocialSidebar → New Social Tab toggle
- ✅ Section A: Your Plans (Squads + Going)  
- ✅ Section B: Almost Plans (You + friends overlapping)
- ✅ Section C: Community & Tickets (stubbed for Phase 2)
- ✅ Squad rooms with status, tickets, logistics
- ✅ "Go Together" button creates Squads
- ✅ Export "Share plan" text templates
- ✅ Squad data hygiene fixes (use enriched TM titles)
- ✅ Invite/referral system fixes (profile + event consistency)

### Data Model Cleanup ✅ COMPLETE
See `data-model-101.md` for full documentation.

### API Integration Status
- ✅ **Ticketmaster Discovery API** - Complete (cache + enrichment + UI)
- 🔲 **SeatGeek API** - Deprioritized

---

## In-App Notifications ✅ COMPLETE

**What:** Full in-app notification system with bell dropdown, replacing localStorage-based squad tracking.

**Schema:** `Notification` model with 8 notification types:
- `FRIEND_REQUEST_RECEIVED` / `FRIEND_REQUEST_ACCEPTED`
- `ADDED_TO_PLAN` / `PLAN_CANCELLED` / `PLAN_MEMBER_JOINED` / `PLAN_MEMBER_LEFT`
- `TICKET_COVERED_FOR_YOU` / `PLAN_MEETUP_CREATED`

**Components:**
- `NotificationBell` — Header dropdown with unread badge, scrollable list, mark-as-read
- API routes: `GET /api/notifications`, `POST /api/notifications` (mark all), `PATCH /api/notifications/[id]`

**Triggers:** Notifications created automatically on:
- Friend requests sent/accepted
- Added to plan, member joined/left plan
- Ticket coverage ("X is handling your ticket")

**Deprecated:**
- `src/lib/squadNotifications.ts` — Deleted (was localStorage-based)
- `src/lib/clearNotificationStuck.ts` — Deleted
- `isRecentSquadAddition` field — Removed from data layer
- Badge on ViewToggle — Removed (bell icon is the notification center)

**Migration:** `prisma/migrations/20251202000002_add_notifications/migration.sql`

## Delete Account Feature ✅ COMPLETE

- [x] Settings page with "Delete Account" section (Danger Zone)
- [x] Confirmation modal ("Type DELETE to confirm")
- [x] API endpoint: `DELETE /api/users/me`
- [x] Cascade delete all user data (UserEvents, Friendships, Lists, Communities, Invites)
- [x] Clear `ListMember.invitedById` references before delete
- [x] Delete Supabase Auth user (if service role key available)
- [x] Logout and redirect to home

**Future enhancements:**
- Data export before deletion (GDPR portability)
- Grace period / soft delete with recovery window

---

## Completed Work

### UI Polish ✅
- [x] Typography & Color (Geist Sans)
- [x] Event Card with Images (images, NEW badge, category badges)
- [x] Layout Improvements (max-w-6xl, 2-column layout)
- [x] Event Detail Polish (hero image, enrichment section)
- [x] Share Button (native share API, clipboard fallback)
- [x] Lazy Loading (50 events per page, "Load More" button)
- [x] Social Sidebar (right column with network, events, friend activity)
- [x] **Event Page Redesign** - Consolidated 4 separate cards into merged components (FriendsAndStatusCard, PrimaryCTACard, AboutCard). Moved share button to header, attendance pill next to status heading, prominent View Squad button. Ticketmaster and About cards side-by-side on desktop. Mobile-first layout with decisions above the fold.
- [x] **Squad Page Redesign** - Full page at `/squads/[id]` with Plan/Day-of toggle. New ticket model (YES/MAYBE/NO/COVERED), squad-level price guide, guests (+1/+2), compact member list with column headers. Inline pill UX for status/tickets/guests. Cover others flow with picker. Slimmed SquadModal to preview.

### Social Layer ✅
- [x] Friends Foundation (db, api, /friends page)
- [x] Private Lists (integrated into /friends)
- [x] Communities (/communities, reciprocal visibility)
- [x] User Profiles (display name, avatar colors)
- [x] Event Social Signals (friends going, community members)

### Data Enrichment ✅
- [x] Knowledge Graph Integration (bio, image, Wikipedia)
- [x] Spotify Integration (artist links, genres)
- [x] Category Inference (auto-categorize from KG types)
- [x] MOVIE category added
- [x] Event Card Badges (Spotify/Wikipedia icons)
- [x] Backfill existing events (230 processed)

### Invite Codes ✅
- [x] Invite code generation (one per user)
- [x] Share button includes `?ref=` code
- [x] Invite link card on /friends page
- [x] Invite banner on event pages (logged-out users)
- [x] Invite context on login page ("Alice invited you!")
- [x] Auto-friend on signup via invite
- [x] Simplified login to Google OAuth only

### Delete Account ✅
- [x] Danger Zone section in Profile Settings
- [x] Confirmation modal (type DELETE to confirm)
- [x] `DELETE /api/users/me` endpoint
- [x] Cascade delete all user data
- [x] Supabase Auth deletion (with service role key)

### LLM-First Enrichment ✅
- [x] OpenAI integration (gpt-4o-mini)
- [x] LLM categorization with performer extraction
- [x] llmCategory, llmPerformer, llmDescription, llmConfidence fields
- [x] Targeted Spotify/KG lookups using LLM-extracted performer
- [x] Dramatically improved categorization accuracy

### New Venue Scrapers ✅
- [x] Texas Performing Arts (Bass Concert Hall, McCullough, Bates Recital)
- [x] Long Center (Dell Hall, Rollins Studio, Terrace)
- [x] ~110 new events added

### Multi-Select Filters ✅
- [x] Category filter (multi-select with checkboxes)
- [x] Venue filter (multi-select with checkboxes)
- [x] Renamed "Friends" → "Show Events", "Everyone" → "All Events"
- [x] Compact filter UI

---

## Backlog (Future / Unscheduled)

| Item | Notes |
|------|-------|
| Plan Notes (Bulletin Board) | Freeform notes ("BYOB", "Meet at east entrance"). Price Guide covers structured case for now. |
| Activity Feed | Real-time friend/community activity in sidebar. Requires activity logging. |
| "New to You" Tracking | Requires `lastVisitAt` on User. |
| Dark Mode Polish | Exists but not styled. |
| Soft Reputation | Show-up signals, ticket trust. After communities. |
| Email Journeys | Multi-step flows, re-engagement. After transactional emails prove out. |
| Job Run Database Logging | Store job results in `JobRun` table for admin dashboard. |
| Smart Search (NL) | "Jazz concerts this weekend" → structured search. See event-discovery-spec Phase 4. |
| Performer/Venue Pages | Rich entity pages. See event-discovery-spec Phase 4.3. |

---

## Sprint Log

### Sprint: Social Layer Foundation (Complete)
- Friends, Lists, Communities
- Profile settings, avatar colors
- Reciprocal visibility

### Sprint: Data Enrichment (Complete)
- Knowledge Graph + Spotify
- Category inference
- Event card badges

### Sprint: Invite Codes (Complete ✅)
- Invite codes with auto-friend
- Share button integration
- Login page invite context
- Google OAuth only

### Sprint: UI Polish (Complete ✅)
- Lazy loading (50 per page)
- Social Sidebar with:
  - Your Network (friends + communities)
  - Your Events (upcoming)
  - Friends Going (friend activity)
  - Quick invite link copy
- Two-column responsive layout

### Sprint: Delete Account (Complete ✅)
- [x] DELETE /api/users/me endpoint
- [x] Danger Zone UI + confirmation modal
- [x] Cascade delete + Supabase Auth cleanup

### Sprint: LLM Enrichment + Venue Expansion (Complete ✅)
- [x] OpenAI gpt-4o-mini integration
- [x] LLM-first categorization with performer extraction
- [x] Targeted Spotify/KG lookups
- [x] Texas Performing Arts scraper (Puppeteer)
- [x] Long Center scraper (JSON-LD)
- [x] Multi-select filters (category + venue)
- [x] Filter UI improvements

### Sprint: Ticketmaster Integration (Complete ✅)
- [x] TM Discovery API client with rate limiting
- [x] TMEventCache for batch downloads (6 API calls for all venues)
- [x] LLM-powered event matching (chain-of-thought prompting, gpt-4o)
- [x] Schema cleanup: removed unreliable fields (price, source) from Discovery API
- [x] Captures: URLs, presales, genres, supporting acts, seatmaps, on-sale dates
- [x] `displayTitle` computed from enrichment (tmPreferTitle)
- [x] Scripts: download-tm-cache, enrich-tm-from-cache, check-tm-enrichment
- [x] Buy on Ticketmaster button (TM blue, with disclaimer)
- [x] UI polish: back button, input text colors

### Sprint: Phase 1 Social Tab + Squads (Complete ✅)
- [x] Calendar/Social view toggle
- [x] Social Tab with "Your Plans" and "Almost Plans" 
- [x] Squad data model and rooms
- [x] "Go Together" button creates Squads
- [x] Share plan text export
- [x] Squad data hygiene (TM enriched titles)
- [x] Profile invite link functionality
- [x] Invite/referral system consistency

### Sprint: Squad Page Refactor (Complete ✅)
- [x] Full squad page at `/squads/[id]` with Plan/Day-of mode toggle
- [x] Schema: SquadTicketStatus enum (YES/MAYBE/NO/COVERED), coveredById, guestCount
- [x] Schema: SquadPriceGuide model (squad-level ticket pricing, replaces per-person budget)
- [x] Removed per-person budget field
- [x] New ticket flow: Have/Getting vs Need, Cover others with Add picker
- [x] Compact member list with column headers (Going/Ticket)
- [x] Guests section (+1/+2/custom)
- [x] Apple-style Plan/Day-of toggle with sliding background
- [x] Slimmed SquadModal to preview with "View Squad Details" link
- [x] Share Squad / Share Day-of buttons
- [x] API routes: buy-for, price-guide CRUD
- [x] Data layer: buyForSquadMembers, uncoverSquadMember functions

### Auth Middleware Fix (Complete ✅)
- [x] Added `src/middleware.ts` for Supabase SSR session handling
- [x] Fixed "first login fails, refresh works" bug
- [x] Proper cookie handling in auth callback

### Day-of Mode + Weather (Complete ✅)
- [x] SquadStop model for itinerary
- [x] SquadStops component (add/edit/delete/reorder)
- [x] DayOfModeView layout with itinerary, weather, quick actions
- [x] WeatherCache model + Google Weather API integration
- [x] User-triggered weather with 1-hour cache TTL
- [x] Maps + Uber quick action buttons

**Note on Weather Caching:**
- Cache is at (lat, lng, date) level — one entry per venue location per forecast date
- ~10 Austin venues × dates users view = reasonable API usage
- May need optimization if usage grows (e.g., scheduled pre-caching for popular dates)
- See `notes/scheduled-jobs-spec.md` for future async weather refresh

**Note on Venue Lat/Lng:**
- ✅ All 9 venues have lat/lng populated in `prisma/seed.ts`
- Weather, Maps, and Uber quick actions all work correctly

### Sprint: Design System Foundation + Home Page Polish (Complete ✅)

**Design System Infrastructure:**
- [x] **Brand Color Tokens**: CSS variables in `globals.css` for single-file theming
  - `--brand-primary`, `--brand-primary-hover`, `--brand-primary-light`
  - `--brand-black`, `--brand-gray`, `--brand-border`, `--brand-danger`
  - All components reference variables, not hardcoded hex values
- [x] **Shared UI Components**: Centralized in `src/components/ui/`
  - `StatusBadge` — User status (Going, Interested, Need/Have Tickets)
  - `FriendCountBadge` — Friend activity with pill/text variants
  - `Button` — Primary, secondary, ghost, danger variants
  - `TagChip`, `Chip`, `Badge` — Consistent styling across app
- [x] **Brand Assets**: `src/components/brand/RyesVPLogo.tsx` (logo + wordmark)

**Terminology & Copy Standards:**
- [x] **"Plan" Terminology**: "Squad" → "Plan" in all user-facing UI
- [x] **Case Conventions**: Title Case for CTAs, sentence case for headers

**Component Updates:**
- [x] **SmartSquadButton**: Subtle outline style, consistent min-width
- [x] **Social Sections**: Green bold headers, full-width cards, shared badges
- [x] **Header**: Notification bell (SVG), tightened logo spacing
- [x] **ViewToggle**: "All Events" / "Your Events", no emojis
- [x] **EventFilters**: Two-row pill layout with quick date filters

**Bug Fixes:**
- [x] Fixed `getYourPlans()` to fetch friend activity data

**Documentation:**
- [x] `ui-design-reference.md` — Design system section with usage guidelines
- [x] Component inventory with file paths and purposes

### Sprint: Security - RLS (Complete ✅)
- [x] Helper functions (get_user_id, are_friends, is_squad_member)
- [x] Public tables: Venue, Event, Enrichment, WeatherCache (read-only)
- [x] User: displayName public, email self-only
- [x] Friendship: participants only
- [x] UserEvent: self + friends
- [x] List/ListMember: owner + self
- [x] InviteCode/InviteRedemption: self only
- [x] Squad family: members access, friends see existence
- [x] TMEventCache: service role only
- [x] Notification: self only

### Sprint: In-App Notifications (Complete ✅)
- [x] Notification model + NotificationType enum (8 types)
- [x] Data layer: createNotification, getNotifications, markAsRead, getUnreadCount
- [x] API routes: GET/POST /api/notifications, PATCH /api/notifications/[id]
- [x] NotificationBell component with dropdown UI
- [x] Triggers: friend requests, plan invites, member join/leave, ticket coverage
- [x] Deprecated localStorage-based squadNotifications system
- [x] Removed isRecentSquadAddition from data layer
- [x] Recent plans now bubble via unread ADDED_TO_PLAN notifications
- [x] Fixed nested button hydration error in Chip component

### Sprint: Backend Reliability / Cron Jobs (Complete ✅)
- [x] 5 cron API routes: scrape, enrich, tm-download, tm-match, weather-precache
- [x] `src/lib/cron/auth.ts` — CRON_SECRET bearer token validation
- [x] `vercel.json` — Daily schedule (staggered 2-6 AM Central)
- [x] Enrich route `force` option to re-process all events
- [x] Fix: Scrape no longer overwrites LLM-assigned categories
- [x] Fix: `prisma.config.ts` works on Vercel (process.env fallback)
- [x] All jobs tested locally and verified working
- [x] Docs: `docs/phase2-backend-reliability-plan.md`

### Sprint: Serverless Puppeteer Fix (Complete ✅)
- [x] `src/lib/browser.ts` — Shared browser launcher for local + serverless
- [x] `@sparticuz/chromium-min` + `puppeteer-core` for Vercel compatibility
- [x] Downloads chromium from GitHub releases at runtime (no bundled binaries)
- [x] Updated all 8 Puppeteer scrapers to use `launchBrowser()` utility
- [x] `next.config.ts` — `serverExternalPackages` for chromium/puppeteer
- [x] Verified: All 13 scrapers working on Vercel cron (578 events, 0 errors)

### Sprint: Plan Creation UX & Toast Notifications (Complete ✅)

**Toast Notification System:**
- [x] `Toast` component with light backgrounds, bold text, 8s duration
- [x] `ToastContext` for global toast management
- [x] Success/info/error variants with colored icon badges
- [x] Copy button replaced with clean copy icon (2 overlapping squares)
- [x] Mobile-friendly: full width on mobile, max-width on desktop
- [x] Smooth slide-up animation

**Plan Creation Flow Polish:**
- [x] Toast feedback for all plan creation flows:
  - Creating plan from header
  - Creating plan from event card
  - Adding friends to existing plan
  - Joining friend's plan
- [x] Consistent copy link action across all toasts

**Modal Improvements:**
- [x] `StartPlanModal` polish: rounded corners, green accents, better spacing
- [x] `SquadInviteModal` & `SquadCreationModal`: proper padding structure, no cramped edges
- [x] Custom branded checkboxes (green when selected, replaces browser default)
- [x] Friend cards: rounded-xl, green border on selection, ring effect
- [x] Better typography hierarchy in modals

**Squad Page Navigation:**
- [x] Back button: "Back to Event" with animated arrow
- [x] Home link: "Home" text on right side
- [x] Clean navigation header with balanced spacing

**Empty States:**
- [x] Members section: prominent "Add your first friend" callout when solo
- [x] Clean CTA without misleading affordances

### Sprint: Calendar Export & Share Improvements (Complete ✅)

**Calendar Export Feature:**
- [x] `calendarPreference` field added to User model
- [x] `src/lib/calendar.ts` — ICS generation + Google Calendar URLs
- [x] `CalendarDropdown` component with preference memory
- [x] API endpoint: `PATCH /api/users/me/calendar-preference`
- [x] Export options: Google Calendar (URL), Apple Calendar (ICS), Outlook (ICS)
- [x] First-time dropdown, then direct action button with change option

**Web Share API (Mobile Native Share):**
- [x] Smart share utility: `src/lib/share.ts`
- [x] Mobile: Opens native share sheet (Messages, WhatsApp, etc.)
- [x] Desktop: Falls back to clipboard copy
- [x] Implemented across: SquadPage, InviteLinkCard, SocialEngagementPanel, SquadPageModal

**UI Consistency Pass:**
- [x] Event page back button: Clean text link style (matches squad page)
- [x] ShareButton: Minimal text + icon (no borders, no background)
- [x] ShareIconButton: SVG icons, green hover states
- [x] CalendarDropdown: Clean dropdown without emoji icons
- [x] Unified styling: gray-600 text, green hover, `text-sm font-medium`

### Migration & Shadow Database Fix (Complete ✅)

**Issue Discovered:**
- Prisma shadow database fails on Supabase projects using `auth.uid()` 
- Additional issue: Enabling RLS on `_prisma_migrations` table breaks shadow DB

**Root Causes:**
1. RLS migration (`enable_rls`) uses `auth.uid()` — doesn't exist in shadow DB
2. `fix_rls_search_path` migration has `ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;` — breaks Prisma's migration tracking in shadow DB

**Solution Implemented:**
- [x] Created auth stub migration: `20251201235959_shadow_db_auth_stub`
  - Creates dummy `auth` schema and `auth.uid()` function for shadow DB
  - Production ignores it (uses real Supabase auth)
- [x] Commented out `_prisma_migrations` RLS line (already applied to prod)
- [x] Fixed checksum mismatches with `migrate resolve --applied`
- [x] Documented in migration file for future developers

**Lesson Learned:**
- Never modify Prisma's internal `_prisma_migrations` table in migrations
- Supabase-specific SQL (auth.uid(), etc.) needs stub migrations for shadow DB compatibility

### Sprint: Event Discovery Phase 0-1 + Bug Fixes (Complete ✅)

**New Venue Scrapers (11/11 priority venues complete):**
- [x] Emo's Austin - JSON-LD + DOM hybrid (37 events)
- [x] Mohawk - Puppeteer + "show me more" button (37 events)
- [x] Antone's - fetch + cheerio (57 events)
- [x] Moody Amphitheater - fetch + cheerio (9 events)
- [x] Scoot Inn - Puppeteer + JSON-LD (13 events)
- [x] Concourse Project - Puppeteer + AJAX Load More (25 events)
- [x] Radio East - Puppeteer + DICE JSON-LD (23 events)
- [x] Empire Control Room - Puppeteer + MEC Load More (47 events)
- [x] HEB Center - Puppeteer + Calendar view (61 events)
- [x] COTA - fetch + cheerio (9 events)
- [x] Q2 Stadium - fetch + cheerio (16 events)

**Deferred to Tier 2:**
- [ ] Parish - calendar empty (Dec 2025)
- [ ] Darrell K Royal Stadium - Texas football season over
- [x] Concourse Project - Puppeteer + AJAX Load More (25 events)
- [x] Antone's Nightclub - fetch + cheerio (57 events)
- [x] Moody Amphitheater - fetch + cheerio (9 events)
- [x] Scoot Inn - Puppeteer + JSON-LD (13 events)
- [x] Radio East - Puppeteer + DICE JSON-LD (23 events)

**Scraper Fixes:**
- [x] ACL Live - Fixed infinite scroll + Load More hybrid (was truncating at 2 months)
- [x] Emo's - Fixed image extraction (`item.image?.[0]` was returning just "h")

**Discovery UX Fixes:**
- [x] "New" filter - Now fetches total from API (was counting only loaded events)
- [x] "New" filter - Dedicated view with all new events from API
- [x] Presales filter - Fixed "presale contains resale" substring bug
- [x] Presales filter - Proper include/exclude logic for sale types
- [x] "Show all presales" link in desktop sidebar
- [x] URL param support (`?discovery=presales`, `?discovery=new`)
- [x] Removed verbose callout banners from filter views
- [x] Hide "Load more" when discovery filters active

**Scripts Added:**
- [x] `scripts/backdate-new-venues.ts` - Backdate createdAt for bulk imports
- [x] `scripts/debug/check-presales.ts` - Inspect presale data with filter status
- [x] `scripts/debug/test-presales-api.ts` - Test presale API logic directly

**Documentation:**
- [x] `docs/priority-venues.md` - Created and maintained

### Sprint: Search + Filter Strip Redesign (Complete ✅)

**Phase 1.6 — December 12, 2025**

**Data Layer:**
- [x] `pg_trgm` migration for fuzzy search indexes
- [x] Search across event title, performer name, venue name
- [x] Search by genre/tags (partial match)
- [x] Search by category (e.g., "comedy" → COMEDY enum)
- [x] `?when=thisWeek|weekend` date preset params
- [x] `?startDate=&endDate=` custom date range params
- [x] `?new=true` and `?presales=true` discovery params

**UI — FilterStrip Components:**
- [x] `FilterStrip` — Main container, replaces EventFilters
- [x] `SearchInput` — 300ms debounced search with instant URL update
- [x] `DateChips` — This Week, This Weekend, custom date picker dropdown
- [x] `CategoryChips` — Concerts, Comedy, Theater, Sports, Other
- [x] `DiscoveryChips` — New (count), Presales (count)
- [x] Chip borders + green hover accents for visual relief
- [x] All filters instant apply — no Apply button

**EventCard Redesign:**
- [x] Presale info as own row (not competing with title)
- [x] Clean title row with just NEW badge
- [x] Bottom row: Category + Status + Spotify + Social + Actions
- [x] Presale text truncated with ellipsis

**FriendsAndStatusCard Redesign (Event Page):**
- [x] 3-row hierarchy: Attendance → Planning → Tickets
- [x] Row 1: Interested/Going (primary, chip-style)
- [x] Row 2: Friends tile + Start Plan (equal width)
- [x] Row 3: Need Tickets / Selling Tickets (tertiary, muted)
- [x] Optimistic updates (no page reload)
- [x] Uses same `FriendCountBadge` as EventCard

**StartPlanModal Improvements:**
- [x] Server-side search (uses same `?q=` API as home)
- [x] Date filter chips (This Week, This Weekend, custom picker)
- [x] Same placeholder as home: "Lady Gaga, indie rock, Moody Center..."

**Cleanup:**
- [x] Deleted `EventFilters.tsx`
- [x] Deleted `DiscoveryStrip.tsx`
- [x] Removed separate New/Presales views from EventListWithPagination
- [x] Updated `ui-design-reference.md` with new patterns

**Deferred (per user feedback):**
- MorePanel.tsx (all categories inline, not needed)
- ActiveFilters.tsx (no venue filter in current UI)
- Mobile optimization (already looks good)
- Discover stub page (Phase 2)

---

**Last Updated:** December 13, 2025
**Active Spec:** `notes/event-discovery-spec.md` (Blocks A, D)

