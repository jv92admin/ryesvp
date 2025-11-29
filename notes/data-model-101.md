# Data Model 101

**Last Updated:** November 29, 2025

This document defines the canonical data types and access patterns for RyesVP. Follow these conventions to maintain consistency.

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

### ❌ Computing displayTitle in components

```typescript
// BAD - don't do this
function EventCard({ event }) {
  const displayTitle = event.enrichment?.displayTitle || event.title;
}
```

### ❌ Creating new event types for specific views

```typescript
// BAD - don't create alternative types
type SidebarEvent = { title: string; date: Date; };
```

### ❌ Fetching event without enrichment for title

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

## File Locations

| Concern | File |
|---------|------|
| Types & list fetching | `src/db/events.ts` |
| Full enrichment fetch | `src/db/enrichment.ts` |
| Enrichment component | `src/components/EventEnrichment.tsx` |
| Event card | `src/components/EventCard.tsx` |
| Events API | `src/app/api/events/route.ts` |

---

## Adding New Enrichment Fields to UI

1. Add to `EnrichmentDisplay` type in `src/db/events.ts`
2. Add to `getEnrichmentForDisplay()` select query
3. Add to the mapping in `getEventsWithSocialSignals()`
4. Add to `getEventDisplay()` return object
5. Use in components

Don't add fields you don't need in the UI - keep `EnrichmentDisplay` lean.

