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

| # | Item | Spec | Est. Time | Status |
|---|------|------|-----------|--------|
| 1 | **Phase 0: Ticket Statuses** | `squads-social-spec.md` | 1-2 days | ✅ Complete |
| 2 | **Phase 1: Social Tab + Squads** | `squads-social-spec.md` | 2-3 weeks | ✅ Complete |
| 3 | **Phase 2: Communities Reimagined** | `squads-social-spec.md` | 2-3 weeks | 🔲 Next |
| 4 | **Phase 3: Soft Reputation** | `squads-social-spec.md` | 1 week | 🔲 After Phase 2 |
| 5 | **TM Data Display** | - | 1-2 hrs | 🔲 When time permits |
| 6 | **Scheduled Jobs** | `scheduled-jobs-spec.md` | 2-3 hrs | 🔲 Later |

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

## Backlog (Future)

| Item | Spec | Notes |
|------|------|-------|
| Activity Feed | `ui-polish-spec.md` | Real-time friend/community activity in sidebar. Requires activity logging. |
| Invite-Gated Signup | `social-layer-phase5-spec.md` | Email-first flow, require invite for new users. **Deprioritized** - current soft invite approach works well for now. |
| "New to You" Tracking | `ui-polish-spec.md` | Requires `lastVisitAt` on User |
| User Discovery | `social-layer-phase5-spec.md` | Find friends without email |
| "Go Together" | `social-layer-phase5-spec.md` | Coordinate attendance |
| Dark Mode Polish | - | Exists but not styled |
| Search Functionality | - | Not scoped yet |

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

### Sprint: API Integration (Next)
- [ ] SeatGeek API integration (pending approval)  
- [ ] Artist entity model (foundation for "follow artist")

### Sprint: Infrastructure (Future)
- [ ] Scheduled jobs (cron)
- [ ] Artist caching

---

**Last Updated:** November 29, 2025

