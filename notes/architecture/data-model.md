# Data Model Reference

**Last Updated:** February 2026

This document defines the canonical data types, access patterns, and key schema decisions for RyesVP. Follow these conventions to maintain consistency.

---

## Core Principle

> **displayTitle is computed ONCE at the data layer, never in components.**

All event display uses the same shape. No creating alternative types for sub-use-cases.

---

## Canonical Types

### EventDisplay (THE event type for UI)

```typescript
// src/db/events.ts
export type EventDisplay = EventWithVenue & {
  displayTitle: string;           // ALWAYS resolved - never null
  enrichment?: EnrichmentDisplay; // Optional UI subset
  social?: EventSocialSignals;    // Optional social data
};
```

**Rules:**
- `displayTitle` = TM title if `tmPreferTitle` is true, else `event.title`
- Computed in data layer functions, NOT in components
- All UI components receive this shape

### EnrichmentDisplay (UI subset of enrichment)

```typescript
export type EnrichmentDisplay = {
  spotifyUrl: string | null;
  wikipediaUrl: string | null;
  genres: string[];
  tmUrl: string | null;
};
```

**What it excludes:** Full enrichment has 30+ fields (Spotify IDs, KG data, TM matching data). UI only needs links and genres.

### EventSocialSignals

```typescript
export type EventSocialSignals = {
  userStatus: 'GOING' | 'INTERESTED' | null;
  friendsGoing: number;
  friendsInterested: number;
  communitiesGoing: { communityId: string; communityName: string; count: number }[];
};
```

---

## Data Access Functions

### For Event Lists

```typescript
// Returns EventDisplay[] with displayTitle computed
const events = await getEventsWithSocialSignals({
  userId: user.dbUser.id,
  // ...filters
});
```

**Used by:** Home page, filtered views, `/api/events`

### For Single Event (Detail Page)

```typescript
// Returns EventDisplay with displayTitle computed
const event = await getEventDisplay(id);

// For full enrichment (Spotify embed, bio, etc.)
const fullEnrichment = await getEventEnrichment(id);
```

**Used by:** Event detail page

### For APIs (Sidebar, etc.)

APIs that return events MUST compute `displayTitle`:

```typescript
// In API route
const displayTitle = event.enrichment?.tmPreferTitle && event.enrichment?.tmEventName
  ? event.enrichment.tmEventName
  : event.title;

return { title: displayTitle, ... };
```

---

## Anti-Patterns (Don't Do This)

### Computing displayTitle in components

```typescript
// BAD - don't do this
function EventCard({ event }) {
  const displayTitle = event.enrichment?.displayTitle || event.title;
}
```

### Creating new event types for specific views

```typescript
// BAD - don't create alternative types
type SidebarEvent = { title: string; date: Date; };
```

### Fetching event without enrichment for title

```typescript
// BAD - will show wrong title
const event = await prisma.event.findUnique({ where: { id } });
return { title: event.title }; // Missing TM-preferred title!
```

---

## When to Use Full Enrichment

The `EventDisplay.enrichment` is a **subset** for common UI needs.

Use `getEventEnrichment(id)` (returns full `Enrichment` record) when you need:
- Spotify embed/player
- Artist bio from Knowledge Graph
- TM presale dates
- Supporting acts
- Any field not in `EnrichmentDisplay`

---

## Adding New Enrichment Fields to UI

1. Add to `EnrichmentDisplay` type in `src/db/events.ts`
2. Add to `getEnrichmentForDisplay()` select query
3. Add to the mapping in `getEventsWithSocialSignals()`
4. Add to `getEventDisplay()` return object
5. Use in components

Don't add fields you don't need in the UI - keep `EnrichmentDisplay` lean.

---

## File Locations

| Concern | File |
|---------|------|
| Types & list fetching | `src/db/events.ts` |
| Full enrichment fetch | `src/db/enrichment.ts` |
| Enrichment component | `src/components/EventEnrichment.tsx` |
| Event card | `src/components/EventCard.tsx` |
| Events API | `src/app/api/events/route.ts` |
| Prisma schema | `prisma/schema.prisma` |

---

## Schema Decisions

Key decisions about why the data model is structured the way it is. These capture architectural intent so you don't re-litigate settled questions.

### Performer: Single entity, not separate Artist/Team/etc.

**Decision:** One `Performer` model with a `type` discriminator (`ARTIST`, `TEAM`, `COMEDIAN`, `COMPANY`, `OTHER`).

**Why not separate models?** All performer types share the same fields (name, bio, image, tags, external IDs). Separate models would mean duplicate schema, duplicate queries, and type gymnastics in the UI. The `type` field handles any behavioral differences.

### Event → Performer: Simple FK, not many-to-many

**Decision:** `Event.performerId` is a nullable FK to `Performer`.

**Why not M:M?** Most scraped events have one headliner. Supporting acts come from Ticketmaster enrichment (`tmSupportingActs` JSON field on Enrichment) and don't need first-class Performer records. A junction table would add query complexity for a rare case. If we later need M:M (e.g., festivals), we can migrate then.

### User → Performer Follow: Junction table, not JSON array

**Decision:** `UserPerformerFollow` junction table with `(userId, performerId)` unique constraint.

**Why not a JSON array on User?** Junction table enables: querying "who follows this performer?" efficiently, counting followers, and indexing. JSON arrays can't be indexed for reverse lookups.

### External IDs: Explicit columns, not JSON

**Decision:** `Performer` has explicit `spotifyId`, `ticketmasterId`, `espnId` columns (not a `externalIds: Json` blob).

**Why?** Explicit columns are queryable, indexable, and type-safe. We know exactly which external systems we integrate with. A JSON blob would require casting and can't be indexed.

### Enrichment: One-to-one with Event, not embedded

**Decision:** Separate `Enrichment` model with `eventId` FK, not fields on `Event`.

**Why?** Enrichment has 30+ fields from 4 different sources (KG, Spotify, LLM, Ticketmaster). Embedding them on Event would make the Event model enormous and every Event query would fetch data rarely needed. Separate model keeps Event queries fast and enrichment optional.

### Friendship: Bidirectional with requester/addressee

**Decision:** `Friendship` has `requesterId` and `addresseeId`. Status is `PENDING → ACCEPTED`. One row per friendship, not two.

**Why one row?** Two rows (A→B and B→A) creates sync problems. One row means one source of truth. Querying "all friends of X" requires `OR (requesterId = X, addresseeId = X) AND status = ACCEPTED`, which is slightly more complex but correct.

### Squad (code) / Plan (UI): Terminology split

**Decision:** Database tables, API routes, file names, and types all use "Squad." All user-facing UI says "Plan."

**Why not rename everything?** A full rename would touch 50+ files, every API route, the database schema, and all tests. The cost is high and the benefit is zero — users never see "Squad." The split is documented here so new developers aren't confused.

### List model: Dual-purpose (private lists + hidden communities)

**Decision:** `List` serves both private user lists and hidden group-invite communities. Differentiated by `isHidden` and `autoFriend` flags.

**Why not separate models?** They share identical structure (owner, members, invite code). Group links are just lists with `isHidden: true, autoFriend: true`. When communities are revealed publicly, they'll be lists with `isPublic: true`.

### AttendanceStatus: Mutually exclusive, not flags

**Decision:** `UserEvent.status` is a single enum (`INTERESTED`, `GOING`, `NEED_TICKETS`, `HAVE_TICKETS`, `NOT_GOING`), not separate boolean flags.

**Why?** A user can only have one relationship to an event at a time. Flags would allow invalid states (both GOING and NOT_GOING). The enum enforces one status and makes queries simple (`WHERE status = 'GOING'`).

### RLS: Defense-in-depth, not primary access control

**Decision:** Row Level Security is enabled on all 16 Supabase tables, but primary access control is in API routes.

**Why not RLS-only?** The app uses Prisma with a direct DB connection (not Supabase client), so RLS policies don't apply to most queries. RLS is a safety net if someone bypasses the API, not the primary enforcement. API route guards remain the source of truth.

### Event deduplication: (source, sourceEventId) unique constraint

**Decision:** Events are uniquely identified by the combination of `source` (enum) and `sourceEventId` (string).

**Why?** Different sources might use overlapping IDs. The composite key ensures each source's events are deduplicated independently. Scrapers use `upsert` on this key to avoid duplicates on re-runs.

---

## Enums Reference

| Enum | Values | Used By |
|------|--------|---------|
| `PerformerType` | ARTIST, TEAM, COMEDIAN, COMPANY, OTHER | Performer.type |
| `EventSource` | VENUE_WEBSITE, TICKETMASTER, SEATGEEK, MANUAL | Event.source |
| `EventStatus` | SCHEDULED, CANCELLED, POSTPONED, SOLD_OUT | Event.status |
| `EventCategory` | CONCERT, COMEDY, THEATER, MOVIE, SPORTS, FESTIVAL, OTHER | Event.category |
| `AttendanceStatus` | INTERESTED, GOING, NEED_TICKETS, HAVE_TICKETS, NOT_GOING | UserEvent.status |
| `FriendshipStatus` | PENDING, ACCEPTED, DECLINED, BLOCKED | Friendship.status |
| `SquadMemberStatus` | THINKING, IN, OUT | SquadMember.status |
| `SquadTicketStatus` | YES, MAYBE, NO, COVERED | SquadMember.ticketStatus |
| `NotificationType` | 9 types (FRIEND_REQUEST_*, PLAN_*, TICKET_*, GROUP_*) | Notification.type |
| `EnrichmentStatus` | PENDING, PROCESSING, COMPLETED, PARTIAL, FAILED, SKIPPED | Enrichment.status |
