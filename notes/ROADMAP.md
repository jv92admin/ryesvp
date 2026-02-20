# RyesVP Project Roadmap

## Overview

Master tracker for all workstreams. Individual specs contain implementation details.

**Active Docs:**
- `architecture/data-model.md` — Canonical event types & access patterns (READ FIRST)
- `specs/event-discovery-spec.md` — Event Discovery & Performer Model (ACTIVE)
- `design/ui-reference.md` — Design system, component patterns
- `reference/customer-comms.md` — Share texts, toasts, notifications, copy guidelines
- `ingestion/source-audit.md` — Scraper field coverage & enrichment pipeline
- `vision/product-vision.md` — Product philosophy & strategy
- `architecture/technical-overview.md` — Stack, pipeline, security

**Archived Specs:** See `archive/` for completed specs (friend-links, engagement, social-layer, etc.)

---

## Current Priority Order

**Strategy:** Event Discovery Foundation → UX Quick Wins → User Testing → Data Enrichment

| Block | Phase | Description | Status |
|-------|-------|-------------|--------|
| **A** | **Event Discovery 0–1.6** | Scrapers, performer model, search, filters | ✅ Complete |
| **B** | **UX: Friend Links + Onboarding** | Profile page, Add Friend, onboarding tips | ✅ Complete |
| **B** | **UX: Group Friend Links** | Community backend (hidden), group join flow | ✅ Complete |
| **B** | **UX: Transactional Emails** | Welcome, invites, reminders | 🔲 |
| **B** | **UX: Bug Fixes** | Issues identified during build | 🔲 |
| **UX** | **UX Revamp: Design Foundation (Inc 0)** | Tokens, constants, primitives, monochrome palette | ✅ Complete |
| **UX** | **UX Revamp: Modal & People System (Inc 1)** | Dialog primitive, PeopleList, 4 modal migrations | ✅ Complete |
| **UX** | **UX Revamp: Filter Cleanup (Inc 2)** | FilterDrawer, FilterStrip rewrite, search → 3 chips → overflow | ✅ Complete |
| **UX** | **UX Revamp: Lark Visual Identity (Inc 3)** | Warm gold CTAs, de-SaaS cards, monochrome badges, chip migration | ✅ Complete |
| **UX** | **UX Revamp: Editorial Polish (Inc 3.5)** | Typography density, text-only badges, breathing room, action button polish | ✅ Complete |
| **UX** | **UX Revamp: Social-First Home (Inc 4)** | Kill ViewToggle, PlansStrip, inline social on EventCard, Friends chip | ✅ Complete |
| **UX** | **UX Revamp: Event Page Hierarchy (Inc 5)** | 5-zone layout, Buy above fold, split FriendsAndStatusCard | ✅ Complete |
| **UX** | **UX Revamp: Plan-on-Event-Page (Inc 6)** | Inline plan panel, kill navigate-away | 🔲 |
| **UX** | **UX Revamp: Groups Surfacing (Inc 7)** | Group labels, group filter, group activity | 🔲 |
| **C** | **User Testing** | Invite 20-30 users, collect feedback | 🔲 |
| **D** | **Event Discovery 2.x** | Data enrichment (venue, event, performer) | 🔲 |
| **D** | **Event Discovery 3.x** | Personalization + Spotify OAuth | 🔲 |
| — | Create-Your-Own Event | User-generated events | 🔲 Deferred |
| — | Communities v1 | Reimagined communities | 🔲 Deferred |

---

## Completed Phases

| # | Phase | Description | Status |
|---|-------|-------------|--------|
| 0 | Ticket Statuses | Expand UserEventStatus | ✅ Complete |
| 1 | Social Tab + Squads | Plans, social signals | ✅ Complete |
| 1.5 | Security - RLS | Row Level Security on all 16 tables | ✅ Complete |
| 1.6 | In-App Notifications | Bell, 8 notification types | ✅ Complete |
| 2 | Backend Reliability | 5 cron jobs, async pipeline | ✅ Complete |
| 3A | Start Plan Ingresses | Multiple entry points | ✅ Complete |
| 4B | Friend Profile Pages | `/users/[id]`, clickable avatars | ✅ Complete |
| A.0 | Scraper Cleanup | 6 original scrapers fixed | ✅ Complete |
| A.1 | Venue Expansion | 11 new venue scrapers (19 total) | ✅ Complete |
| A.2 | Source Audit | Field coverage for all scrapers | ✅ Complete |
| A.3 | Performer Model | Performer entity + modal UI | ✅ Complete |
| A.4 | Search + Filters | pg_trgm search, FilterStrip, instant apply | ✅ Complete |
| — | Calendar Export | Google/Apple/Outlook export | ✅ Complete |
| — | Day-of Mode | Itinerary, weather, quick actions | ✅ Complete |
| — | Delete Account | Cascade delete + Supabase Auth | ✅ Complete |
| — | Design System | Brand tokens, shared UI components | ✅ Complete |
| — | About Page | `/about` with How It Works | ✅ Complete |
| UX.0 | Design Foundation | Lark tokens, constants, monochrome palette shift | ✅ Complete |
| UX.1 | Modal & People System | Dialog primitive (focus trap, sheet), PeopleList, 4 modals migrated | ✅ Complete |
| UX.2 | Filter Cleanup | FilterDrawer (sheet), FilterStrip rewrite, deprecated old chips | ✅ Complete |
| UX.3 | Lark Visual Identity | Warm gold CTAs, de-SaaS cards, monochrome badges, 15 files changed | ✅ Complete |
| UX.3.5 | Editorial Polish | Text-only badges, editorial date headers, card breathing room, underline tabs | ✅ Complete |
| UX.4 | Social-First Home | Kill ViewToggle, PlansStrip, Friends chip, delete 7 social components | ✅ Complete |
| UX.5 | Event Page Zones | 5-zone layout, Buy above fold, AttendanceButtons + SocialProofCard | ✅ Complete |

---

## Block A: Event Discovery Foundation ✅ COMPLETE

**See:** `specs/event-discovery-spec.md` for full details.

All phases (0–1.6) complete. 19 venue scrapers, 700+ events, 500+ performers, fuzzy search, instant-apply filters. Key design decisions documented in `architecture/data-model.md`.

---

## UX Revamp (branch: `revamp/ux-architecture`)

**Spec:** `specs/ux-revamp-spec.md`
**Goal:** Redesign the UI architecture toward the Lark brand — monochrome-first, progressive disclosure, social signal as the product.

| Inc | Name | Status | Key Deliverables |
|-----|------|--------|------------------|
| 0 | Design Foundation | ✅ | Lark token system (`--surface-*`, `--text-*`, `--action-*`, `--signal-*`), constants extraction (categoryColors, statusColors, externalBrands), Button/IconButton/Input primitives, legacy aliases for incremental migration |
| 1 | Modal & People System | ✅ | Dialog primitive (focus trap, scroll lock, escape, fade+scale, 4 size variants incl. sheet), PeopleList component, 4 modals migrated (SquadCreation, SquadInvite, SquadPage, StartPlan) |
| 2 | Filter Cleanup | ✅ | FilterDrawer (Dialog sheet, 4 sections: When/Category/Discovery/Venues), FilterStrip rewrite (search → 3 quick chips → Filters overflow), active filter tags with dismissal, venue name resolution, old chips deprecated |
| 3 | Lark Visual Identity | ✅ | Button `engage` variant, Chip `primary` → warm gold, de-SaaS cards (shadow removal, border-b mobile, hover border desktop), monochrome event badges, scoped legacy token cleanup (15 files) |
| 3.5 | Editorial Polish | 🔲 | Text-only category badges, editorial date headers, card breathing room, ViewToggle softening, sign-in prompt warmth, action button visibility |
| 4 | Social-First Home | 🔲 | Kill ViewToggle, PlansStrip, social signals on EventCard, Friends Going filter |
| 5 | Event Page Hierarchy | 🔲 | 5-zone layout, Buy above fold, SocialProofCard separated |
| 6 | Plan-on-Event-Page | 🔲 | Inline plan panel on event page, kill navigate-away |
| 7 | Groups Surfacing | 🔲 | Group labels on avatars, group filter, group activity in PlansStrip |

**Design audit & open questions:** See `specs/ux-revamp-audit.md`

---

## Block B: UX Quick Wins

**Goal:** Polish UX before inviting real users.

Friend Links, Group Links, and Onboarding are complete. Remaining:

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

**See:** `specs/event-discovery-spec.md` Phases 2-3 for full details.

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

## Backlog (Future / Unscheduled)

### Discovery & Content
| Item | Notes |
|------|-------|
| Discover Page (`/discover`) | Stub page → evolves into taste setup, tag browsing, "For You". Entry point from filter strip. |
| Clickable Tags on Event Cards | Tap genre/tag → filter events or open Discover pre-filtered. Subtle styling, hover feedback. |
| Typeahead Search Suggestions | As-you-type dropdown: performers, events, tags. Phase 2 of search. |
| Smart Search (NL) | "Jazz concerts this weekend" → structured search. See event-discovery-spec Phase 4. |
| Performer/Venue Pages | Full `/performers/[slug]` and `/venues/[slug]` pages. See event-discovery-spec Phase 4.3. |
| Performer Follow + Notify | Follow button → notification when followed performer has new show. |
| "New to You" Badges | `lastVisitAt` exists. Build UI for "new since last visit" indicators on events. |
| Medium Events (Indie Venues) | Curated smaller venues (bars, indie rooms). High effort/maintenance. V2+ flavor. |

### Social & Friends
| Item | Notes |
|------|-------|
| "Start Plan with X" | From friend profile, start a plan and auto-invite that friend. |
| Friend Avatar Popover | Hover on avatar → quick actions popover. Currently all click → profile. |
| Discovery Chips: Friends Going | Friends Going filter chip on event list. |
| Discovery Chips: Trending | Trending chip based on friend/community activity. |
| Activity Feed | Real-time friend/community activity in sidebar. Requires activity logging. |
| Soft Reputation | Show-up signals, ticket trust. After communities. |

### Plans & Coordination
| Item | Notes |
|------|-------|
| Plan Notes (Bulletin Board) | Freeform notes ("BYOB", "Meet at east entrance"). Price Guide covers structured now. |
| Playlist within Plans | "Here's what we're listening to before the show." Spotify link or embed. |
| Plan Link Onboarding | Currently `/squads/[id]` requires login. Add join flow for non-users (preview → sign up → auto-join). |

### Communities (when ready to reveal)
| Item | Notes |
|------|-------|
| Community UI Reveal | Surface hidden groups as named communities with settings. |
| Community Settings | Auto-friend toggle, link expiry, multiple invite links. |
| Group Size Limits | Cap auto-friend groups at N members to prevent abuse. |
| Community Feed | Simple activity feed per community. |

### Onboarding & Engagement
| Item | Notes |
|------|-------|
| Taste Setup Onboarding | First-run flow: "Pick artists, tags, scenes, venues you like." Seeds preferences for recommendations. |
| Taste Graph | Attendance history + playlist + friend overlap → preference profile. Powers "For You." |
| Announcement Sequencing | Queue tips/feature announcements with priority + conditions. Foundation ready (lastVisitAt, engagement API). |
| Email Journeys | Multi-step flows, re-engagement. After transactional emails prove out. |

### Technical / Infrastructure
| Item | Notes |
|------|-------|
| Job Run Database Logging | Store job results in `JobRun` table for admin dashboard. |
| Performer Data Cleanup | Remove legacy artist fields from Enrichment model. |
| Dark Mode Polish | Exists but not styled. |

### Communications (Beyond Transactional)
| Item | Notes |
|------|-------|
| Email Reply-to-Act | Reply "I'm in, need 1 ticket" → parsed and updates status. |
| Weekly Digest Email | Events this week + "just listed" matching your tastes. Opt-in. |
| SMS Day-of Logistics | "Tonight: 5:30 Drinks → 8:00 Show." Last-mile only, not engagement. |

### Account & Privacy
| Item | Notes |
|------|-------|
| Data Export (GDPR) | Export user data before deletion. |
| Soft Delete / Grace Period | Recovery window before permanent account deletion. |

### Moonshots
| Item | Notes |
|------|-------|
| "Plan My Night" AI | "I'm going to Khruangbin. Plan my evening." → dinner, pregame, afterparty suggestions. |
| Conversational Planning | "Add me to the Khruangbin plan" via SMS → parsed and executed. |

---

**Last Updated:** February 20, 2026
**Active Specs:** `specs/event-discovery-spec.md` (Blocks A, D), `specs/ux-revamp-spec.md` (UX Revamp)
