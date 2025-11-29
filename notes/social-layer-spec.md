# Social Layer Specification (Friends & Communities)

> **See also:** `PROJECT-ROADMAP.md` for overall project priorities
> 
> **Note:** This spec covers Friends/Lists/Communities. For Squads (event-specific planning), see `squads-social-spec.md`.

## Overview

RyesVP's social layer enables users to discover events through their social network and coordinate attendance with friends. The model is built on three primitives:

1. **Friends** - Mutual trust relationships (15-20 people)
2. **Private Lists** - Personal filters for organizing friends
3. **Communities** - Shared interest groups for discovery

**Core Philosophy:**
- Friends are for trust. Communities are for discovery.
- You have to give to get (reciprocity-based visibility).
- Communities grow organically through friend invites (spam prevention).
- Small by design - this is for real friend groups, not the public internet.

---

## Core Concepts

### 1. Friends

**What:** Mutual relationships between users who know each other IRL.

**Properties:**
- Mutual (both users must accept)
- Request/accept flow
- ~15-20 friends per user (small by design)

**Privileges:**
- See all of each other's future events
- See each other's event history (past attendance)
- Appear in global "Friends Going" filter
- Can add each other to private lists
- Can invite each other to communities

### 2. Private Lists

**What:** Personal filters for organizing your friends. Only you see them.

**Properties:**
- You create them, you control them
- Members must be your friends
- No acceptance required (it's your filter)
- Others don't know they're on the list

**Use Cases:**
- "Are any work friends going?"
- "Text my closest 3 about this show"
- "Filter to just my college crew"

**Actions:**
- Create/edit/delete lists
- Add/remove friends from lists
- Filter events by list
- "Invite list to event" (sends invitations to all members)

### 3. Communities (Public Lists)

**What:** Shared interest groups for discovering events with like-minded people.

**Properties:**
- Invite-only membership
- Inviter must be a friend (spam prevention)
- Acceptance required to join
- Members can see each other and their event attendance
- Any member can invite their own friends

**Visibility (Reciprocity Model):**
- **Visible (default):** You see who's going, they see you
- **Hidden:** You see counts only ("5 members going"), you're not listed

**Use Cases:**
- "EDM Lovers" - find shows where fellow fans are going
- "Austin FC" - coordinate with soccer fans
- "Neighborhood Crew" - local event planning

**Discovery Flow:**
1. Join community via friend invite
2. See events where members are going
3. Discover new people with similar taste
4. Add them as friends for deeper access

---

## Friend vs. Community Member

| Capability | Friend | Community Member (not friend) |
|------------|--------|-------------------------------|
| See their future events | ✅ Everywhere | ✅ On community page only |
| See their past events | ✅ | ❌ |
| Appear in "Friends Going" filter | ✅ | ❌ |
| Add them to private lists | ✅ | ❌ |
| Invite them to communities | ✅ | ❌ |
| See their name on community events | ✅ | ✅ (if both visible) |

---

## Data Model

### Friendship

```prisma
model Friendship {
  id          String   @id @default(uuid())
  requesterId String   // User who sent the request
  addresseeId String   // User who received the request
  status      FriendshipStatus @default(PENDING)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  requester   User     @relation("SentFriendRequests", fields: [requesterId], references: [id], onDelete: Cascade)
  addressee   User     @relation("ReceivedFriendRequests", fields: [addresseeId], references: [id], onDelete: Cascade)
  
  @@unique([requesterId, addresseeId])
  @@index([requesterId])
  @@index([addresseeId])
  @@index([status])
}

enum FriendshipStatus {
  PENDING   // Request sent, awaiting acceptance
  ACCEPTED  // Mutual friendship
  DECLINED  // Request declined (can re-request later)
  BLOCKED   // User blocked (cannot interact)
}
```

### List (Private Lists & Communities)

```prisma
model List {
  id          String   @id @default(uuid())
  name        String
  description String?
  ownerId     String
  isPublic    Boolean  @default(false)  // false = private list, true = community
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  owner       User     @relation("OwnedLists", fields: [ownerId], references: [id], onDelete: Cascade)
  members     ListMember[]
  
  @@index([ownerId])
  @@index([isPublic])
}

model ListMember {
  id          String   @id @default(uuid())
  listId      String
  userId      String
  status      ListMemberStatus @default(PENDING)
  role        ListRole @default(MEMBER)
  invitedById String?  // Who invited this user (for communities)
  isVisible   Boolean  @default(true)  // Reciprocity toggle (communities only)
  joinedAt    DateTime @default(now())
  
  list        List     @relation(fields: [listId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  invitedBy   User?    @relation("Invitations", fields: [invitedById], references: [id])
  
  @@unique([listId, userId])
  @@index([listId])
  @@index([userId])
  @@index([status])
}

enum ListMemberStatus {
  PENDING   // Invitation sent (communities only)
  ACCEPTED  // Active member
  DECLINED  // Declined invitation
  LEFT      // Left the community
}

enum ListRole {
  OWNER   // Can delete list, manage all members
  ADMIN   // Can manage members (future)
  MEMBER  // Regular member
}
```

### User Model Updates

```prisma
model User {
  // ... existing fields ...
  
  // Friends
  sentFriendRequests     Friendship[] @relation("SentFriendRequests")
  receivedFriendRequests Friendship[] @relation("ReceivedFriendRequests")
  
  // Lists & Communities
  ownedLists             List[] @relation("OwnedLists")
  listMemberships        ListMember[]
  sentInvitations        ListMember[] @relation("Invitations")
}
```

---

## Visibility & Privacy Rules

### Friends
- Always mutual visibility
- No hiding from friends (they're your trust circle)
- Can unfriend to remove access

### Private Lists
- Only owner sees the list
- Members don't know they're on it
- No visibility toggles needed

### Communities

**Visibility Toggle (per community):**

| Setting | Your Events | What You See |
|---------|-------------|--------------|
| Visible (default) | Shown to members | Names of who's going |
| Hidden | Not shown | Counts only ("5 members going") |

**Rules:**
- Default: visible (opted in)
- User can toggle per community
- Reciprocity: hiding yourself hides others from you

**Future Expansion:**
- Event-level visibility: "Hide my attendance at this specific event"
- User-level default: "Default to hidden in all communities"

---

## Implementation Phases

### Phase 1: Friends Foundation
**Goal:** Make "Friends Going" actually mean something.

**Tasks:**
1. Add Friendship model to Prisma schema
2. Create database migration
3. Build friends API endpoints
4. Create `/friends` page:
   - List of friends
   - Pending requests (sent & received)
   - Search users by email
5. Add "Add Friend" button to user profiles
6. Update "Friends Going" filter to use real friendships
7. Add friend request notifications (UI indicator)

**API Endpoints:**
- `GET /api/friends` - List user's friends
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/accept` - Accept friend request
- `POST /api/friends/decline` - Decline friend request
- `DELETE /api/friends/[id]` - Remove friend
- `GET /api/users/search?email=` - Search users by email

**Estimated Time:** 3-4 hours

### Phase 2: Private Lists
**Goal:** Let users organize their friends into personal filters.

**Tasks:**
1. Add List and ListMember models (isPublic: false only)
2. Create database migration
3. Build private list API endpoints
4. Create list management UI:
   - Create/edit/delete lists
   - Add/remove friends from lists
5. Add "Filter by List" to event filters
6. Add "Invite List to Event" action

**API Endpoints:**
- `GET /api/lists` - List user's private lists
- `POST /api/lists` - Create private list
- `PUT /api/lists/[id]` - Update list
- `DELETE /api/lists/[id]` - Delete list
- `POST /api/lists/[id]/members` - Add friend to list
- `DELETE /api/lists/[id]/members/[userId]` - Remove from list

**Estimated Time:** 2-3 hours

### Phase 3: Communities
**Goal:** Enable discovery through shared interest groups.

**Tasks:**
1. Enable isPublic: true for List model
2. Build community invitation flow:
   - Invite friend to community
   - Accept/decline invitation
   - Check inviter is friend (spam prevention)
3. Create `/communities` page:
   - List of communities
   - Pending invitations
4. Create `/communities/[id]` page:
   - Member list
   - Events where members are going
   - Invite friends button
5. Add visibility toggle per community
6. Add "Community Members Going" display on events

**API Endpoints:**
- `GET /api/communities` - List user's communities
- `POST /api/communities` - Create community
- `GET /api/communities/[id]` - Community details
- `POST /api/communities/[id]/invite` - Invite friend
- `POST /api/communities/[id]/accept` - Accept invitation
- `POST /api/communities/[id]/leave` - Leave community
- `PUT /api/communities/[id]/visibility` - Toggle visibility

**Estimated Time:** 4-5 hours

### Phase 4: Enhanced Social Filtering
**Goal:** Surface social signals throughout the app.

**Tasks:**
1. Update home page event cards:
   - Show "3 friends going" badge
   - Show "5 EDM Lovers going" for communities
2. Add filter options:
   - Filter by specific friend
   - Filter by specific community
   - "Any friends going" toggle
3. Add friend-of-friend indicators (stretch)

**Estimated Time:** 2-3 hours

---

## UI Components

### New Pages
- `/friends` - Friends list, requests, search
- `/lists` - Private list management
- `/communities` - Community list, invitations
- `/communities/[id]` - Community detail page

### New Components
- `FriendCard` - Friend display with actions
- `FriendRequestCard` - Pending request with accept/decline
- `UserSearch` - Search users by email
- `ListCard` - Private list display
- `CommunityCard` - Community display
- `CommunityMemberList` - Members with visibility
- `InviteFriendModal` - Invite friend to community
- `VisibilityToggle` - Per-community visibility control

### Modified Components
- `EventCard` - Add friend/community going badges
- `EventFilters` - Add list/community filters
- `Header` - Add friends/communities navigation
- `EventDetailPage` - Show who's going (friends/community)

---

## Open Decisions (Deferred)

1. **Blocking** - How to block users in community context?
2. **Notifications** - Email vs in-app for friend requests?
3. **Community size limits** - Cap membership to maintain intimacy?
4. **Admin roles** - When to add granular permissions?
5. **Event-level visibility** - Toggle per event, not just per community?

---

## Success Metrics

- Users add friends within first session
- Users create at least one private list
- Users join at least one community
- "Friends Going" filter is used regularly
- Discovery: users friend people they met in communities

---

**Last Updated:** November 2024
**Status:** Ready for Implementation

