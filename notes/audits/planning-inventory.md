# Planning Inventory

> Compiled 2026-02-19 from `ROADMAP.md`, `notes/ideas/`, `notes/specs/`, and `notes/vision/`.

---

## Active Roadmap Items

Priority order per ROADMAP.md strategy: **Event Discovery Foundation -> UX Quick Wins -> User Testing -> Data Enrichment**

| # | Block | Item | Status |
|---|-------|------|--------|
| 1 | A | Event Discovery 0-1.6 (scrapers, performer model, search, filters) | COMPLETE |
| 2 | B | UX: Friend Links + Onboarding | COMPLETE |
| 3 | B | UX: Group Friend Links | COMPLETE |
| 4 | B | **UX: Transactional Emails** | NOT STARTED -- next up |
| 5 | B | **UX: Bug Fixes** | NOT STARTED |
| 6 | C | **User Testing** (invite 20-30 users, collect feedback) | NOT STARTED |
| 7 | D | Event Discovery 2.x (data enrichment: venue, event, performer) | NOT STARTED -- blocked by C |
| 8 | D | Event Discovery 3.x (personalization + Spotify OAuth) | NOT STARTED -- blocked by 2.x |

**The immediate next work is Block B: Transactional Emails**, followed by bug fixes, then the Block C user testing pause.

### Transactional Emails (Block B detail)

Three emails to build:
1. **Welcome email** (on signup) -- "small community project," how to start a plan, privacy reassurance
2. **"You were added to a plan" email** -- notification when invited
3. **"Your event is tomorrow" reminder email** -- day-before reminder for Going events

Philosophy: low risk, high clarity. Reply-to-act where possible. No drip campaigns yet.

### User Testing Pause (Block C detail)

- Invite 20-30 real users
- Collect feedback on event discovery, search, plan creation
- Fix top issues
- Huddle on technical roadmap for enrichment (Block D)
- Exit criteria: TBD by PM based on user feedback
- **Gate:** Do not proceed to Phase 2 enrichment until pause complete

---

## Backlog

Items acknowledged in ROADMAP.md but not yet prioritized or scheduled. Grouped by domain.

### Discovery & Content
| Item | Notes |
|------|-------|
| Discover Page (`/discover`) | Stub page evolving into taste setup, tag browsing, "For You." Entry point from filter strip. |
| Clickable Tags on Event Cards | Tap genre/tag to filter events or open Discover pre-filtered. Subtle styling, hover feedback. |
| Typeahead Search Suggestions | As-you-type dropdown: performers, events, tags. Phase 2 of search. |
| Smart Search (NL) | "Jazz concerts this weekend" parsed to structured search. Event discovery spec Phase 4. |
| Performer/Venue Pages | Full `/performers/[slug]` and `/venues/[slug]` pages. Event discovery spec Phase 4.3. |
| Performer Follow + Notify | Follow button on performers; notification when followed performer has new show. |
| "New to You" Badges | `lastVisitAt` already exists. Build UI for "new since last visit" indicators. |
| Medium Events (Indie Venues) | Curated smaller venues (bars, indie rooms). High effort/maintenance. V2+ flavor. |

### Social & Friends
| Item | Notes |
|------|-------|
| "Start Plan with X" | From friend profile, start a plan and auto-invite that friend. |
| Friend Avatar Popover | Hover on avatar for quick actions popover. Currently all click goes to profile. |
| Discovery Chips: Friends Going | Friends Going filter chip on event list. |
| Discovery Chips: Trending | Trending chip based on friend/community activity. |
| Activity Feed | Real-time friend/community activity in sidebar. Requires activity logging. |
| Soft Reputation | Show-up signals, ticket trust. After communities. |

### Plans & Coordination
| Item | Notes |
|------|-------|
| Plan Notes (Bulletin Board) | Freeform notes ("BYOB", "Meet at east entrance"). Price Guide covers structured now. |
| Playlist within Plans | "Here's what we're listening to before the show." Spotify link or embed. |
| Plan Link Onboarding | `/squads/[id]` currently requires login. Add join flow for non-users (preview then sign up then auto-join). |

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
| Taste Setup Onboarding | First-run flow: "Pick artists, tags, scenes, venues you like." Seeds preferences. |
| Taste Graph | Attendance history + playlist + friend overlap builds preference profile. Powers "For You." |
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
| Email Reply-to-Act | Reply "I'm in, need 1 ticket" parsed and updates status. |
| Weekly Digest Email | Events this week + "just listed" matching your tastes. Opt-in. |
| SMS Day-of Logistics | "Tonight: 5:30 Drinks then 8:00 Show." Last-mile only, not engagement. |

### Account & Privacy
| Item | Notes |
|------|-------|
| Data Export (GDPR) | Export user data before deletion. |
| Soft Delete / Grace Period | Recovery window before permanent account deletion. |

### Moonshots
| Item | Notes |
|------|-------|
| "Plan My Night" AI | "I'm going to Khruangbin. Plan my evening." Dinner, pregame, afterparty suggestions. |
| Conversational Planning | "Add me to the Khruangbin plan" via SMS parsed and executed. |

---

## Ideas (Not Yet Committed)

### Enrichment APIs (`notes/ideas/enrichment-apis.md`)

Comprehensive design document for performer enrichment across domains. Not yet prioritized -- feeds into Block D (Phase 2.5 Performer Enrichment).

**Music enrichment:**
- Spotify API -- artist identity, images, genres, popularity, related artists, discography, user taste
- Setlist.fm API -- recent setlists, tour name, opener/headliner relationships, touring activity score

**Sports enrichment:**
- TheSportsDB -- teams, logos, fixtures, results, form stats, stadium info
- Use cases: enriched sports event cards, audience hype ranking, "Austin FC Home Matches This Month"

**Comedy enrichment (hardest domain):**
- Wikidata API -- canonical identity, aliases, occupations, nationality, images, classification
- YouTube Data API -- subscriber count as popularity proxy, clip carousels, topic/style extraction
- Google Knowledge Graph API -- entity classification fallback, confidence scoring, auto-tagging

**Unifying model proposed:**
- Single canonical performer model enriched by all sources
- Inputs: raw name + venue context + event metadata + API lookups
- Outputs: identity, occupation, tags, images, popularity, recent content, LLM-composed bio

**Use cases identified:**
1. Enriched event cards (images, tags, setlist snippets, form stats)
2. Performer pages (bio, popularity, similar performers, clips)
3. Discovery feed ranking (Spotify taste, YouTube popularity, setlist recency, team form)
4. Social features ("Fans of X also follow Y", trending performers)
5. Notifications/emails ("Your top artists playing this week")

---

## Shipped Specs (Kept as Rationale)

### `notes/specs/event-discovery-spec.md`

The canonical spec covering Blocks A and D. Documents the entire event discovery system.

**Shipped phases (Block A -- all COMPLETE):**
- Phase 0: Scraper cleanup and stabilization (6 original scrapers fixed)
- Phase 1.1: Priority venue identification
- Phase 1.2: 11 new venue scrapers added (19 total, ~711 events)
- Phase 1.3: Comprehensive source audit across all scrapers
- Phase 1.4: Performer entity design (single Performer model, type discriminator, FK to Event, junction table for follows, explicit external ID columns, universal tags array)
- Phase 1.5: Performer entity implementation (502 performers, 597 events linked, PerformerModal UI)
- Phase 1.6: Search + filter strip redesign (pg_trgm fuzzy search, chip-based FilterStrip, instant apply, URL params)

**Key design decisions documented:**
- Single `Performer` entity with `type` discriminator (ARTIST, TEAM, COMEDIAN, COMPANY, OTHER)
- Simple Event-to-Performer FK (not many-to-many for MVP)
- User-to-Performer junction table for follows
- Explicit external ID columns (spotifyId, ticketmasterId, espnId)
- Universal `tags[]` array for genres/styles/leagues

### Archived specs (`notes/archive/`)

19 archived documents covering completed work:
- `scope.md` -- original project scope
- `implementation-plan.md` / `implementation-plan-v2.md` -- early implementation plans
- `llm-tasks.md` / `llm-tasks-v2.md` -- LLM task definitions
- `ui-polish-data-enrichment.md` -- UI polish pass
- `social-layer-phase5-spec.md` -- social layer design
- `data-enrichment-spec.md` -- original enrichment spec
- `Social layer phase 2.md` -- social layer iteration
- `squads-social-spec.md` -- squads/plans social features
- `phase1-social-squads-tasks.md` -- social squads task breakdown
- `scheduled-jobs-spec.md` -- cron job design
- `phase2-backend-reliability-plan.md` -- backend reliability
- `calendar-export-implementation.md` -- calendar export feature
- `performer-model-design.md` -- performer model design decisions
- `discovery-sandbox-proposal.md` -- discovery exploration
- `discovery-filters-spec.md` -- filter strip redesign spec
- `engagement brainstorm.md` -- engagement strategy
- `friend-links-spec.md` -- friend links feature

---

## Pending Specs

### Event Discovery Phase 2: Data Enrichment (in `event-discovery-spec.md`)

Not yet built. Gated behind Block C (user testing). Six sub-phases:

| Phase | Description | Status |
|-------|-------------|--------|
| 2.1 | Enrichment use case selection (with PM) | NOT STARTED |
| 2.2 | Enrichment schema design | NOT STARTED |
| 2.3 | Venue enrichment | NOT STARTED |
| 2.4 | Event enrichment | NOT STARTED |
| 2.5 | Performer enrichment | NOT STARTED |
| 2.6 | Discovery upgrade (new filters from enrichment) | NOT STARTED |

Documents to produce: `enrichment-use-cases.md`, `enrichment-schema.md`, venue/event/performer enrichment process docs, `discovery-v2.md`.

### Event Discovery Phase 3: Personalization + Spotify (in `event-discovery-spec.md`)

Not yet built. Blocked by Phase 2.

| Phase | Description | Status |
|-------|-------------|--------|
| 3.1 | Spotify OAuth flow | NOT STARTED |
| 3.2 | Fetch user's top artists, match to Performers | NOT STARTED |
| 3.3 | "For You" surface based on preferences | NOT STARTED |

### Event Discovery Phase 4: Smart Search & Planning (in `event-discovery-spec.md`)

Not yet built. Furthest-out phase.

| Phase | Description | Status |
|-------|-------------|--------|
| 4.1 | Natural language query parsing (LLM-powered) | NOT STARTED |
| 4.2 | Smart planning / itineraries ("Plan my Saturday night") | NOT STARTED |
| 4.3 | Performer and venue pages as rich context | NOT STARTED |

### Create-Your-Own Event (deferred, no dedicated spec yet)

Explicitly deferred in ROADMAP. However, product vision elevates this as "the big bet" and "near-term unlock." When ready: `/events/new` page, user-generated events with `source: USER_CREATED`, event page IS the plan. Positioned to compete in the Partiful space.

### Communities v1 (deferred, no dedicated spec yet)

Deferred because communities need people to show up first. When ready: Plan-to-Community relation, start plan from community, simple community feed. Backend already exists (hidden groups).

---

## Cross-Domain Dependencies

### Transactional Emails -> Brand/Design
- Welcome email needs brand templates, copy standards
- Email design system doesn't exist yet
- Cross-reference: `notes/reference/customer-comms.md` has copy guidelines, but no email templates

### Transactional Emails -> Reply-to-Act
- "Added to plan" email envisions reply-to-act ("I'm in, need 1 ticket" parsed from reply)
- Reply-to-act is a separate backlog item that requires email infrastructure first
- Dependency: build basic transactional emails first, reply parsing later

### Data Enrichment -> User Testing Feedback
- Phase 2 enrichment use cases are explicitly gated on Block C user testing
- What to enrich depends on what users actually want (PM decision)
- Cannot sequence Phase 2 work until user feedback collected

### Enrichment APIs -> Performer Model
- `notes/ideas/enrichment-apis.md` proposes multi-source enrichment (Spotify, Setlist.fm, TheSportsDB, Wikidata, YouTube, Google KG)
- Current performer model has external ID columns (spotifyId, ticketmasterId, espnId) ready
- Phase 2.5 performer enrichment needs to decide which APIs to integrate
- Performer data cleanup (remove legacy artist fields from Enrichment model) should happen before or during Phase 2

### Spotify OAuth -> Taste Graph -> Personalization
- Phase 3.1 (Spotify OAuth) is prerequisite for music taste data
- Taste Graph (backlog) combines Spotify + attendance + friend overlap
- "For You" surface (Phase 3.3) depends on both
- Taste Setup Onboarding (backlog) could work independently of Spotify (manual preference picks)

### Create-Your-Own Events -> Plan Model
- Vision doc says "the event page IS the plan" for user-created events
- Current Plan (Squad) model is separate from Event model
- Merging these concepts or creating a unified view is a design challenge
- Depends on: Plan model maturity, community readiness

### Communities Reveal -> Friend Graph Density
- Communities need enough users and friend connections to feel alive
- Gated behind: user testing (Block C), possibly behind create-your-own events
- Community Feed (backlog) requires activity logging infrastructure

### Performer Follow + Notify -> Performer Enrichment
- Following performers is a backlog item, but the junction table already exists
- Notifications when followed performers have new shows need enriched performer data
- Better performer pages (Phase 4.3) make following more compelling

### Plan Link Onboarding -> Non-User Experience
- Currently `/squads/[id]` requires login
- Building a preview-then-signup flow for plan links is independent but affects growth
- Relevant to user testing (Block C) -- friction point for inviting new users

### Weekly Digest Email -> Enrichment + Taste
- "Just listed matching your tastes" requires either manual preferences or Spotify/enrichment data
- Basic version could work with just friend activity ("events your friends are attending this week")

### Dark Mode -> Design System
- Dark mode exists but isn't styled
- Needs design tokens and component audit before polish

---

## Vision/Strategy Notes

Source: `notes/vision/product-vision.md`

### Core Philosophy

> "The real product is the night out, not the app."

The app exists to help people say "yes," show up, and have a good time. It is not optimizing for time-in-app or DAU.

### Key Strategic Beliefs

1. **Organic, invite-based networks over growth hacking.** 50 clusters of real show-goers beats 50k half-signed-up accounts.
2. **Layer around existing tools, not a replacement.** iMessage, WhatsApp, Instagram aren't going away. RyesVP fits around them.
3. **Meet people where they are.** SMS users participate from SMS. Group chat users get clean summaries to paste. Reply-to-act in email.
4. **No empty or bait notifications.** Every notification tied to something concrete. No "we miss you" pings.
5. **SMS is last-mile only.** Day-of logistics, never engagement bait.
6. **We are not a messaging app.** No DMs, no chat. Notes are for shared context, not live conversation.

### Event Taxonomy (strategic framing)

| Type | Role | Priority |
|------|------|----------|
| **Large Events** | Backbone. Easiest to source, where Plans naturally form. Already working. | Lowest PM attention needed. |
| **Medium Events** | "Around town" flavor. Indie venues, bars. High effort per unit value. | V2+ enhancement. Curated, not comprehensive. |
| **People-Created Events** | **"The big bet."** Unique data (wine night, house shows, watch parties). Builds retention and social gravity. | **Near-term unlock** per vision, though deferred in roadmap. |

Note the tension: the roadmap defers create-your-own events, but the vision doc calls it "a near-term unlock, not a 'someday' feature" and "where RyesVP stops being events + social overlay and becomes where my people host and plan nights."

### Success Metrics (from vision)

Not DAU. Not time-in-app. Instead:
- More people saying "yes" to going out
- More plans that actually happen
- Fewer logistics lost in group chats
- Organic growth through invites

### The Plan as Atomic Unit

The Plan (Squad) is the core coordination primitive. It answers "Who's actually in, what's the logistics, what do I need to know?" Two modes: Plan Mode (pre-event decisions) and Day-of Mode (execution). Multiple entry points: from events, from friends, global.

### Engagement Philosophy (Seven Principles)

1. Real-world plans over app time
2. UI first, channels as escalations
3. No empty or bait notifications
4. Respect the user's current channel (reply-to-act)
5. We are not a messaging app
6. SMS is last-mile only
7. Organic discovery over dark patterns

---

## Summary: Critical Path

```
DONE: Block A (Event Discovery Foundation)
DONE: Block B partial (Friend Links, Group Links, Onboarding)

NOW:  Block B remainder
       -> Transactional Emails (welcome, plan invite, reminder)
       -> Bug fixes

NEXT: Block C (User Testing)
       -> 20-30 real users
       -> Feedback collection
       -> Top issue fixes
       -> PM huddle on enrichment direction

THEN: Block D (Data Enrichment)
       -> Phase 2: Venue/Event/Performer enrichment
       -> Phase 3: Spotify OAuth + personalization
       -> Phase 4: Smart search + planning

DEFERRED (but strategically important):
       -> Create-Your-Own Events (vision calls this "the big bet")
       -> Communities v1 (backend exists, UI hidden)
```

---

*Generated from: `notes/ROADMAP.md`, `notes/ideas/enrichment-apis.md`, `notes/specs/event-discovery-spec.md`, `notes/vision/product-vision.md`, and 19 archived specs in `notes/archive/`.*
