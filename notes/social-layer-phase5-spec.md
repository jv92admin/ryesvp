# Social Layer Phase 5 - Invites, Discovery & Coordination

## Overview

Phase 5 focuses on friend discovery, invite management, and event coordination features. This is the "next level" social networking layer.

> **Note:** This was originally Phase 4 but was split out. Phase 4 now covers event badges and filters (simpler scope).

---

## Goals

1. **Invite codes** - Generate invite links that auto-add friends on signup
2. **User discovery** - Discover new friends through shared event interest  
3. **"Go together" coordination** - Share events, coordinate attendance
4. **Referral tracking** - Track who invited whom

---

## Feature 1: Invite Codes & Referral Links

### Problem
- Currently anyone can sign up, no way to track who invited whom
- Friends have to manually search by exact email to connect
- No incentive/tracking for organic growth

### Solution
- Users can generate invite links with unique codes
- When someone signs up via link, they're auto-added as friend
- Referral tracked for analytics

### Implementation

```
Invite Link: ryesvp.com/join?ref=abc123

Flow:
1. User A generates invite link
2. User B clicks link, signs up
3. On signup completion:
   - Create friendship (auto-accepted)
   - Store referral record
4. Both users see "Connected via invite!"
```

### Data Model

```prisma
model InviteCode {
  id        String   @id @default(uuid())
  code      String   @unique
  userId    String   // Who created the invite
  user      User     @relation(fields: [userId], references: [id])
  maxUses   Int?     // null = unlimited
  usedCount Int      @default(0)
  expiresAt DateTime?
  createdAt DateTime @default(now())
  
  redemptions InviteRedemption[]
  
  @@index([code])
  @@index([userId])
}

model InviteRedemption {
  id           String   @id @default(uuid())
  inviteCodeId String
  inviteCode   InviteCode @relation(fields: [inviteCodeId], references: [id])
  newUserId    String   // Who signed up
  newUser      User     @relation(fields: [newUserId], references: [id])
  createdAt    DateTime @default(now())
  
  @@unique([inviteCodeId, newUserId])
}
```

### API Endpoints
- `POST /api/invites` - Generate new invite code
- `GET /api/invites` - List my invite codes
- `GET /api/invites/[code]` - Validate code (public)
- `POST /api/invites/[code]/redeem` - Called on signup

---

## Feature 2: User Discovery from Events

### Actions on Attendee Avatars
When viewing someone's avatar on an event page:

| User Type | Available Actions |
|-----------|-------------------|
| Friend | View profile, Message |
| Community member (not friend) | Add Friend, View profile |
| Non-friend, non-community | (Hidden - spam prevention) |

### "Add Friend" Flow
1. User sees community member's avatar on event
2. Clicks avatar → mini profile card appears
3. "Add Friend" button sends friend request
4. Notification badge appears for recipient

### Privacy Rules
- Only show users who have opted in to visibility
- Community members only visible to other community members
- No random user discovery (must share a community)

---

## Feature 3: "Go Together" Coordination

### Option A: Share Link (Simple)
- Generate shareable event link
- Recipients see your name + "is going to this event"
- No phone numbers needed

### Option B: Native Share (Recommended)
- Use Web Share API
- Pre-filled message: "Hey! I'm going to [Event] on [Date]. Want to join?"
- Works with any messaging app (iMessage, WhatsApp, etc.)

### Option C: In-App Messaging (Complex - Future)
- Real-time chat per event
- Requires WebSocket infrastructure
- Privacy/moderation concerns
- **Recommendation:** Defer to Phase 5+

---

## Feature 4: Event Cards Social Enhancement

### Current State
- Event cards show basic info only

### Target State
- Show social indicators on event cards:
  - "3 friends going" badge
  - "EDM Lovers: 5 going" badge (if in that community)
  - Priority: Friends > Communities > General

### Visual Design
```
┌─────────────────────────────────────┐
│ Event Title                         │
│ Dec 15 · Moody Center               │
│ ┌─────────────────────────────────┐ │
│ │ 👥 3 friends   🎵 5 EDM Lovers  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Data Requirements

### New API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events/[id]/social` | GET | Social signals for event |
| `/api/events/[id]/share` | POST | Generate share link |

### New/Modified DB Queries

```typescript
// Get social signals for an event
async function getEventSocialSignals(eventId: string, userId: string) {
  // Friends going
  const friendIds = await getFriendIds(userId);
  const friendsGoing = await getUserEventsForUsers(eventId, friendIds);
  
  // Communities breakdown
  const communities = await getUserCommunities(userId);
  const communitySignals = await Promise.all(
    communities.map(async (c) => ({
      community: c,
      going: await getCommunityMembersAtEvent(c.id, eventId, userId),
    }))
  );
  
  // De-duplicate: remove friends from community counts
  // ...
  
  return { friendsGoing, communitySignals };
}
```

---

## Privacy & Reciprocity Rules

### Visibility Matrix

| Viewer Status | Can See |
|---------------|---------|
| Visible in community | Names of visible members |
| Hidden in community | Counts only |
| Friend | Always see friend's attendance |
| Not connected | Cannot see attendance |

### Edge Cases
- User is friend AND community member → Show once under "Friends"
- User is in multiple communities → Show in first community alphabetically
- User has hidden visibility → Show in counts, not names

---

## Implementation Phases

### Phase 4a: Event Page Social (Priority)
1. Add `/api/events/[id]/social` endpoint
2. Update event detail page with social section
3. Implement friend/community breakdown
4. Respect visibility rules

**Estimated:** 3-4 hours

### Phase 4b: Event Card Badges
1. Modify event query to include social counts
2. Update EventCard component with badges
3. Performance optimization (caching)

**Estimated:** 2-3 hours

### Phase 4c: User Discovery
1. Add mini profile card component
2. "Add Friend" from event attendee list
3. Friend request notification polish

**Estimated:** 2-3 hours

### Phase 4d: Go Together / Share
1. Implement native Web Share API
2. Generate shareable event links
3. "Going with you" indicator

**Estimated:** 2-3 hours

---

## Open Questions

1. **Performance:** How to efficiently query social signals for many events?
   - Option: Batch query, cache results
   - Option: Load on demand (lazy load)

2. **Notification overload:** How to avoid spamming users?
   - Option: Daily digest
   - Option: Only notify for close friends

3. **Phone numbers:** Do we need them for messaging?
   - Recommendation: Avoid storing phone numbers
   - Use native share instead

4. **Profile pages:** Should users have public profiles?
   - Currently: No public profiles
   - Consideration: Profile visible to friends only

---

## Success Metrics

- Users click on social indicators
- Friend requests sent from event pages increase
- "Going" conversions increase when friends are attending
- Share link usage

---

## Dependencies

- Phase 1: Friends Foundation ✅
- Phase 2: Private Lists ✅
- Phase 3: Communities ✅
- Profile/Display Names ✅

---

**Last Updated:** November 2024
**Status:** Ready for Implementation

