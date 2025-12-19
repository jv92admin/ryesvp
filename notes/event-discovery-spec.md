# Event Discovery & Data Enrichment Spec

> **Purpose:** Build a robust event discovery system with rich metadata, smart search, and personalized recommendations.

> **Philosophy:** Audit first, document findings, THEN make schema decisions. Don't pre-engineer based on assumptions.

> **Cross-reference:** This spec drives Blocks A and D in `PROJECT-ROADMAP.md`. The Performer model here replaces the original "Artist Foundation" (Phase 5). Phase 3 (Spotify) here covers what was originally "Phase 6".

---

## Terminology Note

- **Code:** "Squad" everywhere — database tables, API routes, file names, types
- **UI:** "Plan" everywhere — buttons, modals, notifications, user-facing copy
- **This spec:** Uses "Performer" (the new unified entity) not "Artist"

---

## Current State (December 2025)

**What exists:**
- Venue model (first-class entity, **19 venues**)
- Event model with basic fields (~711 future events)
- **19 scrapers** covering major Austin venues (Phase 1.2 complete)
- Enrichment model with Spotify, Knowledge Graph, Ticketmaster fields
- LLM enrichment for category inference, performer extraction
- **Performer model** (first-class entity, 502 performers linked)
- **Fuzzy text search** (pg_trgm) across events, performers, venues, genres
- **Chip-based filter UI** with instant apply (no Apply button)
- **Profile pages** with Add Friend button, clickable avatars everywhere
- **Group friend links** for inviting concert crews

**What's missing:**
- Transactional emails (welcome, plan invites, reminders)
- Performer follow + notifications
- Personalization / "For You"

---

## Phase 0 – Scraper Cleanup & Stabilization

### 0.1 Current Scraper Cleanup

**Goal:** Fix and optimize existing scrapers BEFORE expanding or auditing.

**For each existing scraper (6 currently):**
1. Review current implementation for reliability issues
2. Fix any broken selectors, timing issues, pagination problems
3. Ensure events link to Venue entity (not inline strings)
4. Optimize to capture all fields the current schema supports
5. Verify scraper runs successfully end-to-end

**Output:** Working, reliable scrapers ready for expansion.

**Note:** Do NOT document metadata structure yet - that comes after expansion.

---

## Phase 1 – Expand Coverage, Then Audit Everything

### 1.1 Priority Venue Identification

**Goal:** Identify gaps in venue coverage for Austin.

**Create:** `docs/priority-venues.md`

| Venue | Category | Currently Covered? | Potential Source |
|-------|----------|-------------------|------------------|
| [Venue Name] | [Music/Sports/Comedy/etc.] | Yes/No/Partial | [Source if known] |

**Priority categories:**
- Major music venues
- Sports stadiums (UT, Austin FC, minor league)
- Comedy clubs
- Theaters
- Bars with regular events

### 1.2 Add Priority Venue Scrapers ✅ COMPLETE

**Status:** Completed December 8, 2025

**Goal:** Expand coverage to priority venues identified in 1.1.

**Results:**
- **11 priority venue scrapers** built (see `notes/priority-venues.md`)
- **19 total venues** now covered
- **~711 future events** in database
- All scrapers tested, events ingested, enriched, and backdated

**Scrapers added:**
- Emo's (JSON-LD + DOM hybrid)
- Mohawk (Puppeteer + "show me more")
- Antone's (fetch + cheerio)
- Moody Amphitheater (fetch + cheerio)
- Scoot Inn (Puppeteer + JSON-LD)
- Concourse Project (Puppeteer + AJAX Load More)
- Empire Control Room (Puppeteer + MEC Load More)
- HEB Center (Puppeteer + Calendar view)
- COTA (fetch + cheerio)
- Q2 Stadium (fetch + cheerio)
- Radio East (Puppeteer + DICE JSON-LD)

**Deferred to Tier 2:**
- Parish (calendar empty as of Dec 2025)
- Darrell K Royal Stadium (Texas football season over)

**Next:** Phase 1.3 - Comprehensive Source Audit

### 1.3 Comprehensive Source Audit (ALL Sources) ✅ COMPLETE

**Goal:** Now that ALL scrapers exist, document what metadata is available across the COMPLETE landscape.

**Output:** `notes/scraping docs/source-data-audit.md`

**For EACH source (original + new), document:**

```markdown
## [Source Name]

### Base URL / Endpoint
[URL or scrape target]

### Structure Type
[API JSON / HTML scrape / RSS / etc.]

### Fields Observed (Raw)
List ALL fields visible in source, whether we use them or not:
- [ ] Field name - description - example value
- [ ] ...

### Fields Currently Captured
- [x] Field → maps to Event.fieldName
- [ ] Field → NOT captured (reason)

### Potential Future Value
- Field X could enable [use case]
- Field Y could power [feature]

### Venue-Specific Fields Available
- [ ] What venue metadata does this source provide?
- [ ] About page? Capacity? Age restrictions?

### Gotchas / Limitations
- [reliability issues, inconsistencies, etc.]
```

**Also create:** `docs/venue-metadata-audit.md`
- What venue info is available across all sources
- What could be scraped from venue websites directly
- Venue enrichment possibilities

**This is the COMPREHENSIVE audit that informs all schema decisions.**

### 1.4 Performer Entity Design ✅ COMPLETE

**Goal:** Design Performer as first-class entity based on audit findings.

**Decisions made:**
- Single `Performer` entity (not separate Artist/Team/etc.)
- `type` discriminator: ARTIST, TEAM, COMEDIAN, COMPANY, OTHER
- Event → Performer: Simple FK (not many-to-many — simplifies MVP)
- User → Performer: Junction table for follows (better query patterns)
- External IDs: Explicit columns (spotifyId, ticketmasterId, espnId)
- Universal `tags` array for genres/styles/leagues

**Output:** `notes/project archives/performer-model-design.md`

### 1.5 Performer Entity Implementation ✅ COMPLETE

**Goal:** Create Performer model with basic UI.

**Completed:**
- [x] Performer model in Prisma
- [x] UserPerformerFollow junction table
- [x] Event.performerId FK
- [x] Migration: `20251211041441_add_performer_entity`
- [x] Backfill script: 502 performers, 597 events linked
- [x] PerformerModal UI (click performer → bio, image, upcoming shows)
- [x] Integrated into Event page

**Future:** Performer Follow + Notify, full `/performers/[slug]` pages (see Backlog)

### 1.6 Search + Filter Strip Redesign ✅ COMPLETE

**Goal:** Enable search and redesign filter UI with instant apply.

**Completed December 12, 2025**

**Search Implementation:**
- `pg_trgm` PostgreSQL extension for fuzzy matching
- GIN indexes on Event.title, Performer.name, Venue.name
- Searches: title, performer, venue, genres/tags, category
- Partial matching (e.g., "rock" finds "alternative rock")
- 300ms debounced input, instant results

**Filter Strip Redesign:**
- Replaced dropdown-based `EventFilters` with chip-based `FilterStrip`
- All filters instant apply — no "Apply" button
- URL params: `?q=`, `?when=`, `?categories=`, `?new=`, `?presales=`
- Components: `SearchInput`, `DateChips`, `CategoryChips`, `DiscoveryChips`

**Additional UI Improvements:**
- EventCard: Presale as own row, cleaner layout
- FriendsAndStatusCard: 3-row hierarchy (Attendance → Planning → Tickets)
- StartPlanModal: Server-side search + date filter chips
- Optimistic updates throughout (no page reloads)

**Deleted Legacy Code:**
- `src/components/EventFilters.tsx`
- `src/components/DiscoveryStrip.tsx`
- Separate New/Presales views in EventListWithPagination

**New Components:** `src/components/discovery/`

**Output:** `notes/discovery-filters-spec.md` (detailed spec)

---

## Planned Pause – UX Quick Wins & User Testing

**Goal:** Validate Phase 1 foundation before investing in enrichment.

**Timing:** After Phase 1.6 is complete (all of Event Discovery Foundation done).

**Cross-reference:** This is "Block B" and "Block C" in `PROJECT-ROADMAP.md`.

### UX Quick Wins (Block B)

Ship polish before inviting real users:

| Task | Description | Status |
|------|-------------|--------|
| **Friend Links + Profiles** | Profile pages, Add Friend button, clickable avatars | ✅ Complete |
| **Group Friend Links** | Community backend, `/g/[code]` join flow, auto-friend | ✅ Complete |
| **Onboarding Tips Refactor** | DB-backed engagement tracking (lastVisitAt, etc.) | ✅ Complete |
| **Welcome Email** | "This is a small community project" — how to start, privacy | 🔲 Next |
| **"Added to Plan" Email** | Notification when invited to a plan | 🔲 Next |
| **"Event Tomorrow" Reminder** | Day-before reminder for Going events | 🔲 Next |
| **UX Bug Fixes** | Issues identified during user testing | 🔲 |

**Note:** Friend Avatar Popover was replaced by profile pages (all avatars → `/users/[id]`).

### User Testing (Block C)

**Activities:**
- [ ] Invite 20-30 real users
- [ ] Collect feedback on event discovery, search, plan creation
- [ ] Fix top issues
- [ ] Huddle on technical roadmap for enrichment (Phase 2+)

**Exit criteria:** TBD by PM based on user feedback.

**Do not proceed to Phase 2 until pause complete.**

---

## Phase 2 – Data Enrichment

### 2.1 Enrichment Use Case Selection

**Goal:** Decide WHAT to enrich based on user value.

**Review:**
- Source Structure Log (what's available)
- User feedback from pause
- Discovery pain points

**With PM, select concrete use cases:**
- Example: Family-friendly filter
- Example: Genre-based discovery
- Example: Venue capacity/vibe info

**Output:** `docs/enrichment-use-cases.md`
- Each use case
- How it surfaces in product
- What data it requires

### 2.2 Enrichment Schema Design

**Goal:** Define minimal schema changes to support 2.1 use cases.

**Constraints:**
- Only fields tied to selected use cases
- Prefer enums/booleans over free-form
- Document source for each field

**Output:** `docs/enrichment-schema.md`

### 2.3 Venue Enrichment

**Goal:** Populate venue metadata from sources.

**Process:**
1. Use Source Structure Log to identify venue data sources
2. Implement enrichment (scrape about pages, APIs, manual, LLM-assisted)
3. Start with high-priority venues
4. Validate against schema

**Output:** `docs/venue-enrichment-process.md`

### 2.4 Event Enrichment

**Goal:** Derive enriched event metadata.

**Sources:**
- Raw event fields
- Enriched venue data
- Enriched performer data
- LLM classification (constrained to schema enums)

**Output:** `docs/event-enrichment-process.md`

### 2.5 Performer Enrichment

**Goal:** Enrich performers with external data.

**Potential sources (based on type):**
- Spotify API (artists)
- Sports APIs (teams) - if available
- Knowledge Graph
- LLM extraction

**Category-specific fields to consider:**
- Artists: Spotify ID, genres, popularity, images
- Teams: League, sport, team ID
- Comedians: Style, social links
- Movies/Theater: IMDB ID, genre

**Output:** `docs/performer-enrichment-process.md`

### 2.6 Discovery Upgrade

**Goal:** Surface enriched data in search/filters.

**Tasks:**
- Add filters based on enrichment use cases
- Update search to use enriched fields
- Validate user value

**Output:** `docs/discovery-v2.md`

---

## Phase 3 – Personalization & Recommendations

**Note:** This phase covers what was originally "Phase 6: Spotify v1" in `PROJECT-ROADMAP.md`.

### 3.1 Spotify Integration

**Goal:** Personalized recommendations based on music taste.

**Tasks:**
- Spotify OAuth flow
- Store refresh tokens securely
- Fetch user's top artists
- Match to Performer entities (type=ARTIST)
- "For You" surface

### 3.2 Interaction-Based Preferences

**Goal:** Learn from user behavior.

**Track:**
- Events viewed
- Events marked Going/Interested
- Performers followed (future)
- Venues favorited (future)

**Aggregate into preference signals.**

### 3.3 Simple Recommendations

**Goal:** Score events by user fit.

**Logic:**
- Match enriched event metadata to user preferences
- Boost events matching Spotify artists
- Boost events at venues user has attended

**Surface in "For You" section.**

---

## Phase 4 – Smart Search & Planning

### 4.1 Natural Language Query Parsing

**Goal:** "Jazz concerts this weekend" → structured search.

**Implementation:**
- LLM translates NL → filter params
- Constrained to existing schema (no hallucinated fields)
- Fallback to text search on parse failure

**Cost management:**
- Cache common queries
- Rate limit per user (beta)
- Fallback to structured search

### 4.2 Smart Planning / Itineraries

**Goal:** "Plan my Saturday night" → curated event set.

**Combines:**
- User preferences
- Enriched metadata
- Recommendations logic
- Time/location constraints

### 4.3 Performer & Venue Pages as Context

**Goal:** Rich entity pages that inform smart search.

- `/performers/[id]` - Upcoming events, similar performers
- `/venues/[id]` - Upcoming events, venue vibe, typical categories

**These pages provide context for smart search answers.**

---

## Future: User-Created Events

**Deferred.** See "Create-Your-Own Event" in `PROJECT-ROADMAP.md`.

**When ready:**
- Reuse Performer/Venue/Event models
- User creates Event with `source: 'USER_CREATED'`
- Can link to existing or new Performer
- Can link to existing or new Venue (with moderation?)
- Integrates into discovery and recommendations

**Separate project plan:** `docs/create-events-spec.md`

---

## Open Questions (Resolved & Remaining)

### Performer Model ✅ RESOLVED
- [x] Single-layer `tags[]` array for genres/styles/leagues
- [x] External IDs: `spotifyId`, `ticketmasterId`, `espnId` (explicit columns)
- [x] Simple Event → Performer FK (not many-to-many for MVP)
- [x] Type-specific fields: Just `type` enum + universal tags

### Venue Model (Phase 2)
- [ ] What venue metadata is worth enriching? (capacity, age restrictions, vibe)
- [ ] What's the value vs. effort for each field?

### Enrichment Sources (Phase 2)
- [x] Spotify API — working for artists
- [ ] Sports APIs — not explored yet (Austin FC, UT)
- [ ] Comedy APIs — likely manual/LLM only
- [x] LLM extraction — working for category, performer, description

---

## Documents to Produce

| Phase | Document | Status |
|-------|----------|--------|
| 1.1 | `notes/scraping docs/priority-venues.md` | ✅ Complete |
| 1.3 | `notes/scraping docs/source-data-audit.md` | ✅ Complete |
| 1.4 | `notes/project archives/performer-model-design.md` | ✅ Complete |
| 1.6 | `notes/project archives/discovery-filters-spec.md` | ✅ Complete |
| 2.1 | `docs/enrichment-use-cases.md` | 🔲 Phase 2 |
| 2.2 | `docs/enrichment-schema.md` | 🔲 Phase 2 |
| 2.3-2.5 | `docs/*-enrichment-process.md` | 🔲 Phase 2 |
| 2.6 | `docs/discovery-v2.md` | 🔲 Phase 2 |

---

## Success Metrics (TBD with PM)

- Event coverage: % of Austin events captured
- Search success: Users finding what they want
- Recommendation relevance: Click-through on "For You"
- User satisfaction: Feedback from cohort

---

*Created: December 6, 2025*
*Updated: December 19, 2025*
*Status: Block A (Phase 1) COMPLETE, Block B (UX) IN PROGRESS → Transactional Emails next*
*Cross-reference: PROJECT-ROADMAP.md (Blocks A, B, C, D)*

