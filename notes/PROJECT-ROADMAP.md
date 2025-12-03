# RyesVP Project Roadmap

## Overview

Master tracker for all workstreams. Individual specs contain implementation details.

**Spec Documents:**
- `data-model-101.md` - **Canonical event types & access patterns (READ FIRST)**
- `squads-social-spec.md` - **Squads, Social Tab, Ticket Exchange (ACTIVE)**
- `ui-polish-spec.md` - Visual improvements, event cards, layout
- `social-layer-spec.md` - Friends, lists, communities (legacy)
- `social-layer-phase5-spec.md` - Invite codes
- `data-enrichment-spec.md` - Knowledge Graph, Spotify integration
- `scheduled-jobs-spec.md` - Cron for scraping + enrichment

---

## Current Priority Order

Based on strategic review: **Infra → Core Loop → Surfaces → Flavor → Social Graph**

| # | Phase | Description | Est. Time | Status |
|---|-------|-------------|-----------|--------|
| 0 | **Ticket Statuses** | Expand UserEventStatus | 1-2 days | ✅ Complete |
| 1 | **Social Tab + Squads** | Plans, social signals | 2-3 weeks | ✅ Complete |
| 1.5 | **Security - RLS** | Row Level Security | 1-2 days | ✅ Complete |
| 1.6 | **In-App Notifications** | Bell, triggers | 1 day | ✅ Complete |
| **2** | **Backend Reliability** | Async jobs, logging | 2-3 days | 🔲 **Next** |
| **3** | **Core Planning Loop** | More ingresses + emails | 1 week | 🔲 After Phase 2 |
| **4** | **Event + Social Surfaces** | Create event, profiles | 1-2 weeks | 🔲 After Phase 3 |
| **5** | **Artist Foundation** | Data model, event links | 3-5 days | 🔲 After Phase 4 |
| **6** | **Spotify v1** | OAuth, top artists | 1 week | 🔲 After Phase 5 |
| **7** | **Communities v1** | Reimagined communities | 2-3 weeks | 🔲 Last |

---

## Next Up: Phase 2-7 Details

### Phase 2: Backend Reliability 🔲 NEXT

**Goal:** Make the app stop feeling "dev-manually-powered" before widening usage.

**Async Jobs:**
- [ ] Scheduled event refresh (daily)
- [ ] Weather enrichment job (pre-cache popular dates)
- [ ] Data enrichment / cleanup job
- [ ] TM cache refresh

**Job Requirements:**
- Idempotent (safe to re-run)
- Start with daily; tighten later if needed
- Log job runs somewhere inspectable

**Logging/Monitoring:**
- [ ] Basic error logging for jobs & key flows
- [ ] Job run history (when, success/fail, duration)

**See:** `scheduled-jobs-spec.md` for implementation details.

---

### Phase 3: Core Planning Loop 🔲

**Goal:** Make "start a plan" the obvious, easy action everywhere.

**More Ingresses to "Start a Plan":**
- [ ] On event cards: Promote Going/Interested buttons → morph to "Start Plan"
- [ ] Global CTA: Persistent "Start a Plan" button (header or FAB)
- [ ] From your profile: Start plan → pick event + friends
- [ ] From friend's profile: Start plan with them pre-selected
- [ ] Friend avatar popover: "Start plan with X", "View profile"

**Basic Emails (ready now):**
- [ ] Welcome email (on signup)
  - "This is a small community project"
  - How to start a plan, how to invite friends
  - Privacy reassurance
- [ ] "You were added to a plan" transactional email
- [ ] "Your event is tomorrow" reminder email

**Email Philosophy:**
- Low risk, high clarity
- Reply-to-act where possible (parse "I'm in, need 1 ticket")
- No journeys/drip campaigns yet — just transactional

---

### Phase 4: Event + Social Surfaces 🔲

**Goal:** Create-your-own events + minimal profiles = unlock for real usage.

**4A. Create-Your-Own Event Page:**
- [ ] `/events/new` page
- [ ] Fields: Title, Date/time, Location (text + optional map), URL (optional), Description
- [ ] Creates event with `source: 'USER'` or similar
- [ ] Event page IS the plan (like Partiful)
- [ ] Invite friends flow

**4B. Minimal Friend Profile Page:**
- [ ] `/users/[id]` or `/profile/[username]` page
- [ ] Shows: Name, photo, short blurb
- [ ] "Add friend" or "Friends since..."
- [ ] Their upcoming events/plans
- [ ] "Start plan with X" CTA

**4C. Friend Avatar Popover (desktop):**
- [ ] Hover on any friend avatar → popover
- [ ] Quick actions: "Start plan with X", "View profile"

---

### Phase 5: Artist Foundation 🔲

**Goal:** Make artists first-class entities (groundwork for Spotify + follows).

**Data Model:**
- [ ] `Artist` table: id, name, spotifyId, image, bio, genres
- [ ] `EventPerformer` table: eventId, artistId, role (headliner/opener)
- [ ] Migration + seed data

**Populate Artists:**
- [ ] Extract from existing enrichment data
- [ ] Script to backfill from events
- [ ] Link events to artists via `EventPerformer`

**Optional: Artist Stub Page:**
- [ ] `/artists/[id]` page
- [ ] Name, image, upcoming Austin shows
- [ ] "Follow" button (stores UserArtistFollow)
- [ ] Links to Spotify

---

### Phase 6: Spotify v1 🔲

**Goal:** Personalized discovery via music taste.

**OAuth + Storage:**
- [ ] Spotify OAuth flow
- [ ] Store refresh tokens securely
- [ ] Fetch user's top artists

**Simple Discovery Surfaces:**
- [ ] "Your top artists playing in the next 30 days"
- [ ] "Top artists in Austin among your friends" (if enough data)

**Keep v1 small and opinionated.**

---

### Phase 7: Communities v1 🔲

**Goal:** Communities need people to show up — ship last.

**Data Model (sketch now):**
- [ ] `Community` table (exists)
- [ ] `CommunityMember` table (exists)
- [ ] Optional: Plan → Community relation (so a plan can belong to a community)

**UI:**
- [ ] Create/join community
- [ ] Start plan from community
- [ ] Simple community feed (events & plans in that community)

**Prerequisites:** Core planning loop + reasonable event coverage + some friend graph.

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
| Venue Lat/Lng Backfill | Geocode venue addresses. Required for weather. Use Google Geocoding API or manual entry. |
| Plan Notes (Bulletin Board) | Freeform notes ("BYOB", "Meet at east entrance"). Price Guide covers structured case for now. |
| Activity Feed | Real-time friend/community activity in sidebar. Requires activity logging. |
| "New to You" Tracking | Requires `lastVisitAt` on User. |
| Search Functionality | Not scoped yet. |
| Dark Mode Polish | Exists but not styled. |
| Soft Reputation | Show-up signals, ticket trust. After communities. |
| Email Journeys | Multi-step flows, re-engagement. After transactional emails prove out. |

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
- Venue lat/lng is currently NULL for existing venues (not populated in seed)
- Weather feature requires lat/lng — need to backfill existing venues
- Options: Manual entry in seed, or use Google Geocoding API to convert address → lat/lng
- Maps and Uber quick actions also benefit from accurate lat/lng
- **TODO:** Create script to geocode venue addresses and populate lat/lng

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

---

**Last Updated:** December 2, 2025

