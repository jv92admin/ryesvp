# UI Polish Specification

> **See also:** `PROJECT-ROADMAP.md` for overall project priorities

## Overview

This spec covers visual improvements to make the app feel polished and engaging, independent of the social layer. Focus is on quick wins with maximum impact.

---

## Current Issues

1. **No images** - `imageUrl` is captured but not displayed
2. **Generic typography** - Arial font feels like a dev placeholder
3. **Loading 1000 events** - No pagination or lazy loading
4. **Narrow layout** - Lots of wasted whitespace on desktop
5. **No "new" indicators** - Hard to spot recently added events
6. **Flat visual hierarchy** - All events look the same

---

## Implementation Phases

### Phase 1: Typography & Color (30 min)

**Goal:** Make it not look like a dev prototype.

**Changes:**

1. **Font**: Swap Arial for a modern font
   - Option A: Inter (clean, highly readable)
   - Option B: Space Grotesk (more character)
   - Option C: DM Sans (friendly, approachable)
   
   ```css
   /* globals.css */
   @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
   
   body {
     font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
   }
   ```

2. **Color Palette**: More intentional colors
   - Background: Keep `gray-50` or try subtle warm tone
   - Accent: A signature color for CTAs (current blue-600 is fine)
   - Text: Improve contrast hierarchy

3. **Spacing**: Tighten up padding/margins for density

---

### Phase 2: Event Card Redesign (45 min)

**Goal:** Cards that show images and are scannable.

**New Card Layout:**
```
┌────────────────────────────────────────────────┐
│ [IMAGE]  │  🆕 NEW   [CONCERT]   [SOLD OUT]   │
│  100x100 │                                     │
│          │  Event Title Here                   │
│          │  📍 Moody Center                   │
│          │  📅 Sat, Jan 15 • 8:00 PM          │
│          │  👥 3 friends going (later)        │
└────────────────────────────────────────────────┘
```

**Implementation:**

```tsx
// EventCard.tsx changes
export function EventCard({ event }: EventCardProps) {
  const isNew = isWithinHours(event.createdAt, 48);
  
  return (
    <Link href={`/events/${event.id}`} className="...">
      <div className="flex gap-4">
        {/* Image */}
        {event.imageUrl ? (
          <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            <img 
              src={event.imageUrl} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center">
            <span className="text-3xl">🎵</span>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex items-center gap-2 mb-1">
            {isNew && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500 text-white rounded">
                NEW
              </span>
            )}
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${categoryColors[event.category]}`}>
              {event.category}
            </span>
            {statusBadge}
          </div>
          
          {/* Title */}
          <h3 className="font-semibold text-gray-900 line-clamp-2">
            {event.title}
          </h3>
          
          {/* Meta */}
          <p className="text-sm text-gray-600 mt-1">
            📍 {event.venue.name}
          </p>
          <p className="text-sm text-gray-500">
            📅 {formatEventDate(event.startDateTime)}
          </p>
        </div>
      </div>
    </Link>
  );
}
```

**Helper function:**
```ts
// utils.ts
export function isWithinHours(date: Date, hours: number): boolean {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  return diff < hours * 60 * 60 * 1000;
}
```

---

### Phase 3: Lazy Loading / Infinite Scroll (45 min)

**Goal:** Don't load 1000 events at once.

**Approach:** Use cursor-based pagination with "Load More" button (simpler than infinite scroll).

**Changes:**

1. **API Update** (`/api/events`):
   ```ts
   // Add cursor-based pagination
   export async function GET(request: Request) {
     const { searchParams } = new URL(request.url);
     const cursor = searchParams.get('cursor'); // last event ID
     const limit = 20; // events per page
     
     const events = await prisma.event.findMany({
       take: limit + 1, // fetch one extra to check if more exist
       cursor: cursor ? { id: cursor } : undefined,
       skip: cursor ? 1 : 0,
       orderBy: { startDateTime: 'asc' },
       // ... rest of query
     });
     
     const hasMore = events.length > limit;
     const items = hasMore ? events.slice(0, -1) : events;
     const nextCursor = hasMore ? items[items.length - 1].id : null;
     
     return { events: items, nextCursor };
   }
   ```

2. **Client Component** for "Load More":
   ```tsx
   'use client';
   
   export function EventList({ initialEvents, initialCursor }) {
     const [events, setEvents] = useState(initialEvents);
     const [cursor, setCursor] = useState(initialCursor);
     const [loading, setLoading] = useState(false);
     
     const loadMore = async () => {
       setLoading(true);
       const res = await fetch(`/api/events?cursor=${cursor}`);
       const data = await res.json();
       setEvents([...events, ...data.events]);
       setCursor(data.nextCursor);
       setLoading(false);
     };
     
     return (
       <>
         {/* Event list */}
         {cursor && (
           <button onClick={loadMore} disabled={loading}>
             {loading ? 'Loading...' : 'Load More Events'}
           </button>
         )}
       </>
     );
   }
   ```

**Note:** This is simplified. Actual implementation needs to handle date grouping properly.

---

### Phase 4: Layout Improvements (30 min)

**Goal:** Better use of screen space.

**Changes:**

1. **Wider content area**:
   ```tsx
   // Current: max-w-3xl (768px)
   // New: max-w-5xl (1024px) or max-w-6xl (1152px)
   <div className="max-w-5xl mx-auto px-4 py-8">
   ```

2. **Two-column grid on desktop** (optional):
   ```tsx
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
     {events.map(event => <EventCard key={event.id} event={event} />)}
   </div>
   ```

3. **Sticky date headers** (already there, just verify it works):
   ```tsx
   <h2 className="sticky top-0 bg-gray-50 py-2 z-10">
     {formatDateHeading(dateKey)}
   </h2>
   ```

---

### Phase 5: Event Detail Page Polish (45 min)

**Goal:** Make the detail page feel complete.

**Changes:**

1. **Hero Image**:
   ```tsx
   {event.imageUrl && (
     <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden mb-6">
       <img 
         src={event.imageUrl} 
         alt={event.title}
         className="w-full h-full object-cover"
       />
     </div>
   )}
   ```

2. **"New" Badge** on detail page:
   ```tsx
   {isNew && (
     <span className="inline-flex items-center px-2 py-1 bg-emerald-500 text-white text-xs font-semibold rounded mb-2">
       🆕 NEW LISTING
     </span>
   )}
   ```

3. **External Links Section** (placeholder for data enrichment):
   ```tsx
   <div className="flex gap-3 mt-4">
     {/* These will be populated later with Spotify/YouTube data */}
     {/* For now, just the ticket link */}
     {event.url && (
       <a href={event.url} className="...">
         Get Tickets →
       </a>
     )}
   </div>
   ```

4. **Notes/Description Formatting**:
   - If description exists, display with proper line breaks
   - Consider markdown rendering later

---

### Phase 6: "New to You" Tracking (30 min)

**Goal:** Track when users last visited and highlight events added since then.

**Changes:**

1. **Add to User model**:
   ```prisma
   model User {
     // ... existing fields
     lastVisitAt  DateTime?  // Last time user viewed events list
   }
   ```

2. **Update on page load** (server action):
   ```ts
   // In page.tsx or a server action
   await prisma.user.update({
     where: { id: user.id },
     data: { lastVisitAt: new Date() }
   });
   ```

3. **Pass to EventCard**:
   ```tsx
   <EventCard 
     event={event} 
     isNewToUser={user?.lastVisitAt && event.createdAt > user.lastVisitAt}
   />
   ```

4. **Display badge**:
   ```tsx
   {isNewToUser && (
     <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500 text-white rounded">
       NEW TO YOU
     </span>
   )}
   ```

---

## Implementation Order

| Phase | What | Time | Priority | Status |
|-------|------|------|----------|--------|
| 1 | Typography & Color | 30 min | High | ✅ Done |
| 2 | Event Card with Images | 45 min | High | ✅ Done |
| 3 | Lazy Loading | 45 min | Medium | 🔲 Pending |
| 4 | Layout Improvements | 30 min | Medium | ✅ Done |
| 5 | Event Detail Polish | 45 min | Medium | ✅ Done |
| 6 | "New to You" Tracking | 30 min | Low (needs login) | 🔲 Pending |

**Total: ~4 hours**

### Implementation Notes (Nov 2024)

**Completed:**
- Typography: Using Geist Sans (Next.js default modern font)
- Event Cards: Images display with fallback emoji, NEW badge for 48hrs, category/status badges
- Layout: Expanded to `max-w-5xl` on home and event detail pages
- Event Detail: Hero image, NEW badge, proper date formatting, Share button
- Share Button: Native share API on mobile, clipboard fallback with toast

**Deferred:**
- Lazy Loading: Still loading up to 1000 events (acceptable for current scale)
- "New to You": Requires User model migration, will revisit with social layer

---

## Dependencies

- **None** - All of this is independent of the social layer
- Can be done before or in parallel with Friends implementation
- "Friends Going" badges will be added later (Phase 4 of social layer)

---

## Schema Changes Required

```prisma
model User {
  // Add this field
  lastVisitAt  DateTime?
}
```

One migration: `npx prisma migrate dev --name add_last_visit_at`

---

---

### Phase 7: Share Event with Social Invite (1 hour)

**Goal:** Let users share events AND grow their network organically.

**Why This Matters:**
Sharing becomes a growth engine without being annoying. The recipient gets value (cool event) + social connection (friend/community invite). It's contextual, not spammy.

---

**UX Flow:**

1. Click "Share" button on event detail page
2. **Share Modal** opens with options:
   - Default: Copy link
   - Optional: Include friend request
   - Optional: Invite to community
3. Preview updates based on selections
4. Copy to clipboard
5. Toast: "Copied! Paste into your group chat"

---

**Share Modal Wireframe:**

```
┌─────────────────────────────────────────────┐
│ Share This Event                        ✕   │
├─────────────────────────────────────────────┤
│                                             │
│ ─── Make it personal ───                    │
│                                             │
│ [✓] Include friend request                  │
│     "When they sign up, you'll be friends"  │
│                                             │
│ [ ] Invite to community                     │
│     [Select community ▾]                    │
│                                             │
│ ─────────────────────────────────────────── │
│                                             │
│ Preview:                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ Hey! Check out this event:              │ │
│ │                                         │ │
│ │ 🎵 Deadmau5                             │ │
│ │ 📍 Moody Center                         │ │
│ │ 📅 Saturday, Jan 15 at 8:00 PM          │ │
│ │                                         │ │
│ │ https://ryesvp.com/e/abc?ref=xyz        │ │
│ │                                         │ │
│ │ 👋 Join me on RyesVP!                   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [📋 Copy to Clipboard]                      │
└─────────────────────────────────────────────┘
```

---

**Link Structure:**

| Scenario | URL Format |
|----------|------------|
| Basic share | `/events/abc123` |
| With friend invite | `/events/abc123?ref=INVITE_CODE` |
| With community invite | `/events/abc123?ref=INVITE_CODE&community=COMMUNITY_ID` |

The `ref` code encodes: who invited, what type of invite (friend/community).

---

**Recipient Experience:**

1. **Click link** → See event page (works without login)
2. **Sign up / Log in** → Prompted with pending invites:
   ```
   ┌─────────────────────────────────────────┐
   │ 👋 Alice invited you!                   │
   │                                         │
   │ ☑ Accept friend request from Alice      │
   │ ☑ Join "EDM Lovers" community           │
   │                                         │
   │ [Accept All]  [Decline]                 │
   └─────────────────────────────────────────┘
   ```
3. **Accept** → Immediately friends / in community

---

**Data Model Addition:**

```prisma
model Invite {
  id            String      @id @default(uuid())
  code          String      @unique  // Short code for URL
  inviterId     String
  inviter       User        @relation(fields: [inviterId], references: [id])
  eventId       String?     // Event being shared (optional)
  event         Event?      @relation(fields: [eventId], references: [id])
  communityId   String?     // Community invite (optional)
  community     List?       @relation(fields: [communityId], references: [id])
  includeFriend Boolean     @default(false)  // Include friend request
  claimedById   String?     // User who claimed the invite
  claimedBy     User?       @relation("ClaimedInvites", fields: [claimedById], references: [id])
  claimedAt     DateTime?
  expiresAt     DateTime?   // Optional expiry
  createdAt     DateTime    @default(now())
  
  @@index([code])
  @@index([inviterId])
}
```

---

**API Endpoints:**

```
POST /api/invites
  Body: { eventId, includeFriend, communityId }
  Returns: { code, shareUrl, shareText }

GET /api/invites/[code]
  Returns: { inviter, event, community, includeFriend }

POST /api/invites/[code]/claim
  Claims the invite for the current user
  Creates friendship and/or community membership
```

---

**Implementation Notes:**

1. **Invite codes** - Use short, URL-safe codes (e.g., `nanoid(10)`)
2. **Expiry** - Optional, but could expire invites after 30 days
3. **One-time use?** - Decide if invites are single-use or reusable
   - Recommendation: Reusable for simplicity (one link for a group chat)
4. **Guest view** - Event page should work without login, show "Sign up to connect with Alice"

---

**Simple Version First:**

For MVP, could simplify to:
1. Just copy link (no modal)
2. Link includes `?ref=USER_ID` 
3. On signup, show "Alice shared this with you - add as friend?"

This is less flexible but faster to build. Upgrade to full modal later.

---

**Placement:**
- Event detail page: Prominent "Share" button next to "Get Tickets"
- Event cards: Small share icon (opens same modal)

---

### Phase 8: Social Engagement Panel (45 min)

**Goal:** Drive friend/community building from the home page.

**Note:** This depends on the social layer being built (Friendship model). Scope with Phase 1 of social layer.

**Panel Placement:** Above or beside event filters on home page.

**Context-Aware States:**

| User State | Panel Content |
|------------|---------------|
| Not logged in | "Sign in to see who's going" |
| New user (0 friends) | "Add friends to see who's going to events" |
| Has pending requests | "2 friend requests waiting" → link to /friends |
| Has friends, no lists | "Create a list to organize your crew" |
| Has community invites | "You've been invited to EDM Lovers" |
| Active user (has friends + lists) | Minimize or show stats ("3 friends going this week") |

**Wireframe:**
```
┌─────────────────────────────────────────────────────┐
│ 👋 Get more out of RyesVP                           │
│                                                     │
│ Add friends to see who's going to events.           │
│                                                     │
│ [Add Friends]  [Create a List]                      │
│                                                     │
│ ─────────────────────────────────────────────────── │
│ 📬 2 friend requests waiting →                      │
└─────────────────────────────────────────────────────┘
```

**Implementation:**

```tsx
// components/SocialEngagementPanel.tsx
interface SocialEngagementPanelProps {
  user: User | null;
  friendCount: number;
  pendingRequests: number;
  pendingCommunityInvites: number;
}

export function SocialEngagementPanel({ 
  user, 
  friendCount, 
  pendingRequests,
  pendingCommunityInvites 
}: SocialEngagementPanelProps) {
  if (!user) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-900">
          <Link href="/login" className="font-semibold underline">Sign in</Link>
          {' '}to see who's going to events
        </p>
      </div>
    );
  }
  
  if (friendCount === 0) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">👋 Get more out of RyesVP</h3>
        <p className="text-gray-600 mb-3">Add friends to see who's going to events.</p>
        <div className="flex gap-3">
          <Link href="/friends" className="px-4 py-2 bg-purple-600 text-white rounded-lg">
            Add Friends
          </Link>
          <Link href="/lists" className="px-4 py-2 border border-gray-300 rounded-lg">
            Create a List
          </Link>
        </div>
      </div>
    );
  }
  
  // Has friends - show pending items or minimize
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
      {pendingRequests > 0 && (
        <Link href="/friends" className="flex items-center text-blue-600 hover:underline">
          📬 {pendingRequests} friend request{pendingRequests > 1 ? 's' : ''} waiting →
        </Link>
      )}
      {pendingCommunityInvites > 0 && (
        <Link href="/communities" className="flex items-center text-purple-600 hover:underline">
          🎉 {pendingCommunityInvites} community invite{pendingCommunityInvites > 1 ? 's' : ''} →
        </Link>
      )}
      {pendingRequests === 0 && pendingCommunityInvites === 0 && (
        <p className="text-gray-600 text-sm">
          ✨ {friendCount} friend{friendCount > 1 ? 's' : ''} connected
        </p>
      )}
    </div>
  );
}
```

---

## Updated Implementation Order

| Phase | What | Time | Dependency | Status |
|-------|------|------|------------|--------|
| 1 | Typography & Color | 30 min | None | ✅ Done |
| 2 | Event Card with Images | 45 min | None | ✅ Done |
| 3 | Lazy Loading | 45 min | None | 🔲 Deferred |
| 4 | Layout Improvements | 30 min | None | ✅ Done |
| 5 | Event Detail Polish | 45 min | None | ✅ Done |
| 6 | "New to You" Tracking | 30 min | User logged in | 🔲 Deferred |
| 7 | Share Event | 30 min | None | ✅ Done |
| 8 | Social Engagement Panel | 45 min | **Social Layer Phase 1** | 🔲 Blocked |

**Total: ~5.5 hours** (Phase 8 is after social layer)

---

## Out of Scope (For Now)

- Dark mode polish (exists but not styled)
- Animation/transitions (nice to have)
- Skeleton loading states
- Mobile-specific optimizations beyond responsive grid
- Search functionality
- In-app messaging (use external text groups instead)

---

**Last Updated:** November 2024
**Status:** Core UI Polish Complete - Phases 1, 2, 4, 5, 7 implemented.

---

## Project Status Summary

### ✅ Completed

**UI Polish:**
- Phase 1: Typography & Color (Geist Sans, clean spacing)
- Phase 2: Event Card with Images (images, NEW badge, category badges)
- Phase 4: Layout Improvements (max-w-5xl, better density)
- Phase 5: Event Detail Polish (hero image, share button)
- Phase 7: Share Event (native share API, clipboard fallback)

**Social Layer:**
- Phase 1: Friends Foundation (db, api, /friends page)
- Phase 2: Private Lists (integrated into /friends)
- Phase 3: Communities (/communities, detail pages, reciprocal visibility)

**Data Enrichment:**
- Phase 1: Knowledge Graph (bio, image, Wikipedia, category inference)
- Phase 2: Spotify (artist links, genres for music events)
- Phase 4: Backfill (all 230 existing events processed)
- Spotify/Wikipedia badges on event cards + detail pages
- MOVIE category added for films

### 🔲 Pending / Deferred

**Social Layer (Priority):**
| Item | Notes | Priority |
|------|-------|----------|
| **Invite Codes** | Shareable links that add friends/join communities. Key growth mechanism! See `/notes/social-layer-phase5-spec.md` | **Next** |
| User Discovery | Find friends without knowing email. Profile pages, suggested friends. | Future |
| "Go Together" | Coordinate attendance with friends. | Future |
| Event Badges/Filters | "X friends going" badge. Already partially done via event cards. | Low |

**UI Polish:**
| Item | Notes | Priority |
|------|-------|----------|
| Lazy Loading (Phase 3) | Loading ~300 events at once. "Load More" pagination needed for scale. | Medium |
| Social Engagement Panel (Phase 8) | Home page side panel prompting friend adds, showing activity. See wireframe below. | Medium |
| "New to You" Tracking (Phase 6) | Show events added since last visit. Requires adding `lastVisitAt` field to User model (small migration, not fundamental). | Low |

**Data Enrichment:**
| Item | Notes | Priority |
|------|-------|----------|
| Category Refinement | Fuzzy matches still happening (sports, generic events). | **Next** |
| Artist Caching | Wire up ArtistCache to reduce API calls. | **Next** |
| Scheduled Jobs | Cron for enrichment + scraping. Will build together. See `/notes/scheduled-jobs-spec.md` | Later |

---

## Social Engagement Panel (Phase 8 Detail)

**Goal:** Drive friend/community building from the home page.

**Placement:** Above or beside event filters on home page (responsive).

**States:**

| User State | Panel Content |
|------------|---------------|
| Not logged in | "Sign in to see who's going" |
| New user (0 friends) | "Add friends to see who's going to events" + CTAs |
| Has pending requests | "2 friend requests waiting" → link to /friends |
| Has friends, no activity | Minimize or show stats ("3 friends going this week") |

**Wireframe:**
```
┌─────────────────────────────────────────────────────┐
│ 👋 Get more out of RyesVP                           │
│                                                     │
│ Add friends to see who's going to events.           │
│                                                     │
│ [Add Friends]  [Create a List]                      │
│                                                     │
│ ─────────────────────────────────────────────────── │
│ 📬 2 friend requests waiting →                      │
└─────────────────────────────────────────────────────┘
```

---

## Next Sprint Suggestions

**Priority Order:**

1. **Data Enrichment Refinement** (1-2 hrs)
   - Fix fuzzy category matches (sports, generic events)
   - Wire up ArtistCache to reduce API calls

2. **Invite Codes** (half day) - `/notes/social-layer-phase5-spec.md`
   - Key growth mechanism: share event → friend joins
   - Makes the social layer actually useful for acquisition

3. **UI Quick Wins** (1-2 hrs each)
   - Lazy loading / "Load More" for events
   - Social Engagement Panel on home page

4. **Scheduled Jobs** (later, combine with scraping)
   - Cron for enrichment + event scraping
   - Build together as one infrastructure sprint

---

