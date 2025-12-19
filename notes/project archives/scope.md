 Austin Events Calendar – BRTD / Scoping Doc (Cursor-Facing)

## 1. Project Overview

You are helping build a web app that automatically aggregates **events in Austin, TX** (concerts, comedy shows, etc.) from:

- Venue websites (scraped)
- Event APIs (e.g., Ticketmaster, SeatGeek, etc.)

The app stores events in a database and exposes:

- A browsable **calendar / list** of events
- Basic **user accounts / profiles**
- A **social layer** where users can mark:
  - “Going”
  - “Interested”
  - Optional comments (e.g., seat/section)

The project must be **hosting-ready from day one**:

- Hosted on **Vercel** (Next.js app)
- Database and auth on **Supabase**
- Background ingestion via **Vercel cron** calling API routes
- No assumptions that anything runs only on a developer’s laptop or local DB

---

## 2. Goals and Non-Goals

### 2.1 MVP Goals

For the MVP, your responsibilities are:

1. **Data ingestion**
   - Scrape a small set of Austin venue websites.
   - (Optionally) integrate at least one event API (e.g., Ticketmaster) if feasible.
   - Normalize data into a standard `Event` schema.
   - Run ingestion **at least daily** via a scheduled job.

2. **Core data model**
   - Define and migrate database schemas for:
     - `Venue`
     - `Event`
     - `User`
     - `UserEvent` (users marking going/interested with an optional comment)
   - Design schema to be future-friendly for adding `Artist` and richer metadata later.

3. **User-facing app**
   - Next.js app with:
     - Event list view
     - Event detail page
     - Basic calendar-like grouping by date
   - Authenticated users can:
     - Sign in (email magic link or similar – via Supabase Auth)
     - Mark an event as “Going” or “Interested”
     - Add a short text comment for an event (e.g., “Sec 105, Row F, Seat 9”)

4. **Hosting-readiness**
   - App deployable on **Vercel** from the start (no refactor required).
   - Single Postgres DB on **Supabase** used for **both dev and prod** (or dev/prod DBs but always hosted, never local-only).
   - Use environment variables for all secrets (no hard-coded keys, no SQLite).

### 2.2 Non-Goals (for MVP)

- No need for:
  - Complex recommendation systems
  - Friend graphs or follow/unfollow features
  - Full-featured calendar UX (simple list/grouping is fine)
  - Perfect deduplication across all possible sources
  - Heavy search/filters beyond basic query & date filters

---

## 3. Tech Stack and Services

### 3.1 Core stack

- **Frontend + Backend**: Next.js (App Router) in **TypeScript**
- **Runtime**: Node.js
- **Styling**: Tailwind CSS
- **Database**: Postgres via **Supabase**
- **ORM**: Prisma
- **Auth**: Supabase Auth
- **Hosting**: Vercel
- **Background jobs**: Vercel Cron → hits Next.js API routes (e.g., `/api/ingest/all`)

### 3.2 Key Constraints for Hosting-Readiness

- Use a **hosted Postgres** instance from Supabase from day 1 for all environments.
- Do NOT use SQLite or a purely local DB.
- All configuration uses environment variables:
  - `DATABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only, never exposed client-side)
- Any scraping or ingestion must be able to run:
  - As a Vercel serverless function, triggered via cron, OR
  - Later be extracted into a separate worker service **without changing data contracts**.

---

## 4. High-Level Architecture

### 4.1 Modules

1. **Web app (`/app`)**
   - UI routes, server components, client components for:
     - `/` – Home page, upcoming events list
     - `/events` – Search/browse events
     - `/events/[id]` – Event detail (with “Going/Interested” UI)
     - `/profile` – User profile and events they’re going to

2. **API layer (`/app/api`)**
   - REST-like or route handlers for:
     - `GET /api/events` – List events with filters
     - `GET /api/events/[id]` – Get one event
     - `POST /api/events/[id]/attendance` – Set user’s status + comment
     - `POST /api/ingest/all` – Trigger all scrapers
     - `POST /api/ingest/[source]` – Trigger single source’s scraper (optional)

3. **Ingestion layer (`src/ingestion`)**
   - Pure TypeScript modules for scraping and API integrations.
   - Each venue/API is implemented as a separate module under a consistent interface.

4. **Data access layer (`src/db`)**
   - Prisma client and helper functions to:
     - Create/update venues and events
     - Upsert events based on source IDs
     - Record user attendance

---

## 5. Data Model (Conceptual)

You will represent the following entities:

### 5.1 Venue

- `id` (uuid)
- `name`
- `websiteUrl`
- `address`
- `city`
- `lat`, `lng` (optional)
- `sourceSlug` – Internal slug (e.g. `"moody-center"`)

### 5.2 Event

- `id` (uuid)
- `venueId` (FK → `Venue`)
- `title`
- `description` (nullable)
- `startDateTime`
- `endDateTime` (nullable)
- `url` (canonical link to tickets/info)
- `source` (enum: `VENUE_WEBSITE`, `TICKETMASTER`, `SEATGEEK`, etc.)
- `sourceEventId` (nullable, used when APIs provide stable IDs)
- `status` (enum: `SCHEDULED`, `CANCELLED`, `POSTPONED`)
- `category` (enum: `COMEDY`, `CONCERT`, `THEATER`, `OTHER`)
- `createdAt`
- `updatedAt`

### 5.3 User

- `id` (uuid)
- `authProviderId` (Supabase Auth user ID)
- `email`
- `displayName`
- `createdAt`

### 5.4 UserEvent (social layer)

- `userId`
- `eventId`
- `status` (enum: `GOING`, `INTERESTED`, `NOT_GOING`)
- `comment` (short text, e.g. seat/section)
- `createdAt`
- `updatedAt`

In the Prisma schema, ensure all relations, indexes, and uniqueness constraints are defined.

---

## 6. Ingestion Pipeline

### 6.1 NormalizedEvent type

Define a shared TypeScript type used by all scrapers:

```ts
// src/ingestion/types.ts
export type EventSource = 'VENUE_WEBSITE' | 'TICKETMASTER' | 'SEATGEEK';

export interface NormalizedEvent {
  venueSlug: string; // must map to an existing Venue
  title: string;
  description?: string | null;
  startDateTime: Date;
  endDateTime?: Date | null;
  url: string;
  category?: 'COMEDY' | 'CONCERT' | 'THEATER' | 'OTHER' | null;
  source: EventSource;
  sourceEventId?: string | null;
}
All scraping/API modules should return NormalizedEvent[].

6.2 Source modules
Under src/ingestion/sources/, implement one file per venue/source:

paramount.ts

moodyCenter.ts

ticketmasterAustin.ts

etc.

Each source must export a function like:

ts
Copy code
export async function fetchEventsFromParamount(): Promise<NormalizedEvent[]> {
  // 1) Fetch HTML or call an API
  // 2) Parse event details
  // 3) Map to NormalizedEvent[]
}
6.3 Upsert and dedup
Create a shared upsert function, e.g. src/ingestion/upsertEvents.ts:

For each NormalizedEvent:

Locate the corresponding Venue by venueSlug.

Try to find an existing Event in this priority order:

If sourceEventId is present: match (source, sourceEventId).

Otherwise: match by (venueId, startDateTime, normalizedTitle).

If found: update fields.

If not found: insert a new Event.

“normalizedTitle” = lowercase, stripped punctuation/whitespace.

6.4 Triggering ingestion
Implement an API route at POST /api/ingest/all that:

Calls each of the source modules in sequence (or parallel with care).

Uses upsertEvents() to store them.

This route will be called by a Vercel cron job (e.g. daily at 03:00 Austin time).

7. Hosting and Environments
7.1 Vercel
Target deployment environment is Vercel.

Configure vercel.json as needed (e.g., specific runtime if scrapers need Node).

Ensure file paths and imports are Node/Next-compatible on serverless functions.

7.2 Supabase
The Postgres DB for this app lives in Supabase.

Prisma uses DATABASE_URL from environment variables.

Supabase Auth is used for user authentication; integrate with the Next.js app via Supabase client/server helpers.

7.3 Environment variables
Expect these environment variables (non-exhaustive):

DATABASE_URL

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY (server only)

TICKETMASTER_API_KEY (if used)

Any per-source secrets/API keys as needed

Do not hardcode any secrets. Always rely on environment variables and reference them only in server-side code where appropriate.

8. Implementation Phases (Preferred Order)
Phase 1 – Data model + plumbing

Implement Prisma schema for Venue, Event, User, UserEvent.

Create initial migrations against Supabase.

Seed a few test venues and events.

Build a simple UI that lists events from the DB.

Phase 2 – Auth + UserEvent

Integrate Supabase Auth and basic login/logout.

Implement the User and UserEvent flows.

On event detail page, allow users to mark GOING or INTERESTED and leave comments.

Phase 3 – Ingestion

Implement NormalizedEvent type and ingestion framework.

Add at least one venue scraper.

Add /api/ingest/all and wire up the upsert logic.

Schedule Vercel cron to call /api/ingest/all.

Phase 4 – Polishing

Add additional venues/APIs.

Improve filters (date range, category).

Add basic deduplication improvements and error logging.

9. Coding Conventions and AI Usage
When you (Cursor) generate or modify code:

Always use TypeScript with strict types.

Prefer small, single-responsibility files over monoliths.

Use Prisma for all DB access (no raw SQL unless explicitly asked).

Use idiomatic Next.js App Router patterns (route handlers, server components, etc.).

Make components and functions pure where possible and easy to test.

When introducing a new pattern or abstraction, keep it simple and aligned with existing code.

When asked to “add a new venue,” reuse the existing ingestion abstractions:

Create a new module under src/ingestion/sources/.

Implement fetchEventsFor<NewVenue>() returning NormalizedEvent[].

Hook it into runAllScrapers() (or equivalent aggregator) and ensure it respects the NormalizedEvent contract.