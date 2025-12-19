# Friend Links & Communities Spec

> **Status:** ✅ Phase 1 & 2 Complete (Dec 19, 2025)  
> **Goal:** Make friend-adding frictionless without phone/contact sync  
> **Replaces:** Separate "Invite to App" and manual friend search flows  
> **Approach:** Build Community model in backend, but hide from UI (friend-adding only)  
> **Related:** `engagement brainstorm.md` — Onboarding tips depend on this spec's CTAs  
> **Dec 16 Update:** Tips/onboarding refactored to DB-backed tracking  
> **Dec 19 Update:** Group Friend Links (Phase 2) complete

---

## Implementation Status

| Phase | Item | Status |
|-------|------|--------|
| **1a** | Profile page + Add Friend button | ✅ Done |
| **1a** | Avatars clickable → profile | ✅ Done |
| **1b** | "Add Friend" CTA (renamed from Invite) | ✅ Done |
| **1b** | Onboarding tips + modal | ✅ Done |
| **1b** | Social empty states | ✅ Done |
| **1b** | First engagement toast | ✅ Done |
| **2** | Community model (hidden) | ✅ Done |
| **2** | Group link generation | ✅ Done |
| **2** | Group join flow + auto-friend | ✅ Done |
| **2** | Batched notifications | ✅ Done |
| **2** | "Friend Groups" UI on Friends page | ✅ Done |
| **2** | Delete group (keeps friendships) | ✅ Done |

**Phase 1 Components:**
- `UserProfileContent.tsx` — Full profile page at `/users/[id]` with Add Friend, mutual friends, events
- `OnboardingModal.tsx` — First-time welcome
- `OnboardingTips.tsx` — "Mark Going/Interested" + "Add friends"
- `SignInTip.tsx` — Logged-out nudge
- `AddFriendCard.tsx` — Unified friend/invite CTA with Personal + Group link options
- `SocialSummaryChips.tsx` — Friends chip always visible

**Phase 2 Components (Group Friend Links):**
- `YourGroups.tsx` — "Friend Groups" section on Friends page
- `CreateGroupModal.tsx` — Name input + link generation
- `GroupJoinContent.tsx` — Join page at `/g/[code]` with member preview
- API routes: `/api/groups`, `/api/groups/[id]`, `/api/groups/join/[code]`
- Schema: Added `isHidden`, `inviteCode`, `autoFriend` to List model
- Notification: `GROUP_MEMBER_JOINED` type

**Clickable Avatars (all link to `/users/[id]`):**
- `EventSocialSection.tsx` — Friends going/interested on event pages
- `SquadMemberList.tsx` — Plan member avatars and names
- `CombinedAttendanceModal.tsx` — Attendance modal avatars
- `FriendCard.tsx` — Friends list avatars
- `FriendRequestCard.tsx` — Friend request avatars
- `CommunityDetailContent.tsx` — Community member and attendee avatars
- `UserProfileContent.tsx` — Mutual friend avatars

---

## Relationship to Engagement Spec

This spec provides the **infrastructure** that the engagement spec's CTAs point to.

| Engagement Spec Says | This Spec Provides |
|---------------------|-------------------|
| Tip 2: "Add friends" CTA on All Events | Profile page + share flow |
| Empty state: "Add friends" on Social view | The actual Add Friend button |
| Friend-related notifications | Notification wording + strategy |

**Build Sequence:** Friend-links infrastructure ships WITH the "Add friends" tip from engagement spec. The engagement polish (toasts, "Your Plans" tip) follows after validation.

See `engagement brainstorm.md` for tip copy and conditions.

---

## Problem

1. Users can't easily add friends — no phone sync, no username search
2. "Invite to App" feels like marketing, not personal connection
3. Group coordination (group chats, concert crews) requires everyone to add each other 1:1

---

## Solution: Shareable Friend Links

**One CTA, smart backend:**
- Share a link → recipient lands on profile or group page
- Existing user → becomes friend
- New user → signs up → becomes friend
- Both parties get notifications

---

## Phase 1: Profile-Based Friend Adding

### 1a. Profile Page with Add Friend Button

**URL:** `/users/[id]`

```
┌─────────────────────────────────┐
│  [Avatar]                       │
│  Alex Thompson                  │
│                                 │
│  12 friends · 8 events          │
│                                 │
│  [+ Add Friend]                 │  ← Primary CTA
│                                 │
│  Upcoming:                      │
│  • Lady Gaga @ Moody (Apr 22)   │
│  • Austin FC vs LA (Mar 15)     │
└─────────────────────────────────┘
```

**States:**
- Not friends → `[+ Add Friend]`
- Pending request → `[Request Sent]` (disabled)
- Already friends → `[✓ Friends]` or hidden

### 1b. Make Avatars Clickable → Profile

Everywhere avatars appear, clicking opens profile:
- "X people interested" on event cards
- "X going" badges
- Plan member lists
- Friend lists

This completes the existing "Avatar Popover" UX task — popover shows quick info, click-through goes to full profile.

### 1c. Unified Friend/Invite Link

**Current:** Two separate flows (invite code vs. friend request)

**New:** One personal link per user that handles both cases

**Link format:** `ryesvp.com/u/[username]` or `ryesvp.com/u/[userId]`

**Redemption logic:**
```
Visitor clicks link
    ↓
Logged in? ─── No ──→ Sign up flow → Return to profile → Add Friend
    │
   Yes
    ↓
Already friends? ─── Yes ──→ "You're already friends!"
    │
   No
    ↓
Create friendship + notifications for both
```

---

## Phase 2: Group Friend Links (Communities)

### The Use Case

Sharing to a group chat (WhatsApp, iMessage, Discord):
- Everyone should connect with everyone
- 1:1 links require O(n) sharing for n people
- Group link = O(1) — one link, everyone connected

### 2a. Add Friend CTA Options

```
[+ Add Friend]
      ↓
┌─────────────────────────┐
│ Share your profile      │  ← 1:1 adding
│ Create a group link     │  ← Group adding
└─────────────────────────┘
```

### 2b. Group Link = Community with Auto-Friend

**Creating a group:**
1. User taps "Create a group link"
2. Optional: Name it ("Concert Crew", "Work Friends")
3. Gets shareable link: `ryesvp.com/g/ABC123`
4. Shares to group chat

**Joining a group:**
```
┌─────────────────────────────────┐
│  👥 Join Alex's group           │
│                                 │
│  "Concert Crew"                 │
│                                 │
│  4 members:                     │
│  [Beth] [Carlos] [Dana] [Alex]  │
│                                 │
│  Join to connect with everyone! │
│                                 │
│  [Join Group]                   │
└─────────────────────────────────┘
```

**On join:**
- Create friendship with every existing member
- Add to community member list
- Notify all members: "X joined the group!"

### 2c. Auto-Friend Toggle

**The problem:** What if the link spreads beyond the intended group?

**Solution:** Creator can toggle auto-friend off after initial wave

```
┌─────────────────────────────────┐
│  ⚙️ Group Settings              │
│                                 │
│  Auto-friend new members        │
│  [✓ ON]  ← toggle               │
│                                 │
│  When OFF: new members join     │
│  the group but don't auto-      │
│  friend everyone.               │
└─────────────────────────────────┘
```

**Default:** ON (matches creation intent)  
**After toggling OFF:** Existing friendships remain, new joins don't auto-friend

---

## Group Join Scenarios

**Setup:** Alex creates a group link "Concert Crew" and shares to a group chat.

**Group chat contains:**
- **Beth** — Has account, already friends with Alex
- **Carlos** — Has account, NOT friends with Alex  
- **Dana** — No account yet

### Beth clicks (has account, already friends with Alex)

```
Beth clicks link → Logged in → Not in community yet
    ↓
Add Beth to community
    ↓
Check existing members (just Alex):
    → Already friends with Alex? YES → Skip
    ↓
Result: Beth joins community, no new friendships
    ↓
Notifications:
    → Alex: "Beth joined Concert Crew"
    → Beth: (visual confirmation on page, no push)
```

### Carlos clicks (has account, NOT friends with Alex)

```
Carlos clicks link → Logged in → Not in community yet
    ↓
Add Carlos to community
    ↓
Check existing members (Alex, Beth):
    → Already friends with Alex? NO → Create friendship
    → Already friends with Beth? NO → Create friendship
    ↓
Result: Carlos joins, now friends with Alex AND Beth
    ↓
Notifications:
    → Alex: "Carlos joined Concert Crew"
    → Beth: "Carlos joined Concert Crew"
    → Carlos: (visual confirmation: "You joined and connected with 2 people")
```

### Dana clicks (no account)

```
Dana clicks link → Not logged in
    ↓
Show: "Sign up to join Concert Crew"
    ↓
Dana signs up (Google OAuth)
    ↓
Redirect back → Add Dana to community
    ↓
Check existing members (Alex, Beth, Carlos):
    → Create friendship with each
    ↓
Result: Dana joins, friends with all 3
    ↓
Notifications:
    → Alex: "Dana joined Concert Crew"
    → Beth: "Dana joined Concert Crew"
    → Carlos: "Dana joined Concert Crew"
    → Dana: (visual confirmation: "Welcome! You joined and connected with 3 friends")
```

### Summary Table

| Person | Has Account? | Friends w/ Alex? | After Join |
|--------|--------------|------------------|------------|
| Beth | ✅ | ✅ Already | Joins group, no new friends |
| Carlos | ✅ | ❌ No | Joins, friends with Alex + Beth |
| Dana | ❌ | — | Signs up → Joins → Friends with all 3 |

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Already in community | "You're already a member of Concert Crew" |
| Creator clicks own link | Redirect to community management page |
| Auto-friend is OFF | Join community, but NO friendships created |
| Invalid/expired link | "This link is no longer valid" + app signup CTA |
| Clicking own profile link | Redirect to profile edit page |

---

## Notification Strategy

### The Problem

Naive approach creates notification spam:
- 5 people joining = 10 friendships = 20 "new friend" notifications
- Plus 5 "X joined" notifications = 25 total notifications
- Unacceptable UX

### The Solution: Batched, Context-Aware Notifications

**Principle:** One notification per person per event, not per friendship.

**For group joins:**
- Existing members get ONE notification: "X joined [Group Name]"
- The friendship is implied — no separate "X added you as a friend"
- Joiner sees visual confirmation on page, no push notification to self

**For 1:1 friend adds (Phase 1):**
- Both parties get notification: "X added you as a friend"
- This is appropriate because it's a direct, intentional action

### Notification Types

| Context | Recipient | Message |
|---------|-----------|---------|
| **1:1 friend add** | Other person | "Alex added you as a friend" |
| **Group join** | Each existing member | "Dana joined Concert Crew" |
| **Group join** | Joiner (new user) | (None — shown welcome page instead) |
| **Group join** | Joiner (existing user) | (None — visual confirmation on page) |

### Notification Wording

**1:1 Friend Add:**
```
🔔 Alex added you as a friend
   [View Profile]
```

**Group Join (to existing members):**
```
🔔 Dana joined Concert Crew
   [View Group]
```

**Group Join (to creator, first member):**
```
🔔 Beth joined Concert Crew
   You now have 2 members
   [View Group]
```

### Visual Confirmation (Not Push Notifications)

When joining a group, the joiner sees an on-page confirmation:

**Existing user joining:**
```
┌─────────────────────────────────┐
│  ✓ You joined Concert Crew!    │
│                                 │
│  Connected with 3 people:       │
│  [Alex] [Beth] [Carlos]         │
│                                 │
│  [View Your Friends]  [Done]    │
└─────────────────────────────────┘
```

**New user after signup:**
```
┌─────────────────────────────────┐
│  🎉 Welcome to RyesVP!          │
│                                 │
│  You joined Concert Crew and    │
│  connected with 3 friends.      │
│                                 │
│  [Explore Events]               │
└─────────────────────────────────┘
```

### Notification Volume Example

**Worst case: 5-person group, everyone joins sequentially**

| Joiner | Notifications sent |
|--------|-------------------|
| Alex (creator) | 0 (creates group) |
| Beth joins | 1 (to Alex) |
| Carlos joins | 2 (to Alex, Beth) |
| Dana joins | 3 (to Alex, Beth, Carlos) |
| Eve joins | 4 (to Alex, Beth, Carlos, Dana) |
| **Total** | **10 notifications** |

Compare to naive approach: 10 friendships × 2 = 20 "new friend" + 5 "joined" = 25 notifications.

**Reduction: 60% fewer notifications.**

---

## Data Model

```prisma
// Extend InviteCode or create new model
model Community {
  id            String   @id @default(uuid())
  name          String?
  code          String   @unique  // Short join code
  createdById   String
  creator       User     @relation(fields: [createdById], references: [id])
  autoFriend    Boolean  @default(true)
  createdAt     DateTime @default(now())
  members       CommunityMember[]
}

model CommunityMember {
  id          String    @id @default(uuid())
  communityId String
  community   Community @relation(fields: [communityId], references: [id])
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  joinedAt    DateTime  @default(now())
  
  @@unique([communityId, userId])
}
```

---

## What This Replaces

| Old | New |
|-----|-----|
| "Invite to App" button | Merged into "Add Friend" flow |
| Manual friend search | Profile links shared directly |
| Avatar popover (UX task) | Profile page + quick popover |

---

## Implementation Strategy: Hide Communities

### The Approach

**Backend:** Create `Community` model to track group links and members.

**UI:** Never surface "communities" as a concept. Users just think:
- "I shared a link"
- "We're all friends now"

### What We Build (Backend)

- `Community` table with `code`, `createdById`, `autoFriend`
- `CommunityMember` join table
- Join flow that creates friendships
- Group link generation

### What We DON'T Build (UI)

| Hidden | Why |
|--------|-----|
| Community name input | Optional, auto-generate if needed |
| Community list/tab | Users don't need to "manage" groups |
| Community settings page | Auto-friend toggle can wait |
| "Your communities" section | No UI surface yet |

### User Mental Model

**What users see:**
```
[+ Add Friend]
      ↓
"Share your profile" OR "Create a group link"
      ↓
(share link to group chat)
      ↓
"3 new friends added!"
```

**What users DON'T see:**
- "Concert Crew community"
- Community member list
- Community management

### Future Reveal

When/if we want communities as a feature:

> "By the way, remember those group links you've been using?  
> They now live in Communities. You can name them, manage members, and more."

The data is already there — we just expose the UI.

---

## What This Enables (Future)

- **Persistent communities:** Toggle `autoFriend: false`, group becomes a coordination space
- **Plan → Community:** "Add everyone from this plan as friends"
- **Event communities:** Optional, not automatic (avoids "too many groups" problem)

---

## Build Order

| Phase | Task | Est. |
|-------|------|------|
| **1a** | Profile page + Add Friend button | 0.5 day |
| **1b** | Avatars clickable → profile everywhere | 0.5 day |
| **1c** | Unified friend link + smart redemption | 0.5 day |
| **1d** | "Add friends" tip on All Events (from `engagement brainstorm.md`) | 0.25 day |
| **1e** | Friend-add notifications | 0.25 day |
| **—** | **Ship + validate** | — |
| **2a** | Community model (hidden) + group link generation | 0.5 day |
| **2b** | Group landing page + join flow (simple, no management UI) | 0.5 day |
| **—** | **Ship + validate** | — |
| **3a** | Social view empty states | 0.25 day |
| **3b** | First-plan toast + "Your Plans" tip | 0.25 day |
| **—** | **Ship** | — |
| **4** | (Future) Community UI reveal, settings, auto-friend toggle | TBD |

---

## Key Decisions

1. **Auto-friend on link click** — The link IS consent; no accept/decline needed
2. **Profile as landing** — More human than magic auto-friend URLs
3. **Group isolation** — Separate links for separate contexts (work vs. college friends)
4. **Event sharing stays simple** — No auto-community creation from event shares
5. **Communities evolve from friend circles** — Same model, different defaults

---

*Last Updated: December 2024*

---

## Open Questions for PM Review

1. **Group size limits?** Should we cap auto-friend groups at N members to prevent abuse?
2. **Group expiry?** Should group links expire after X days or remain permanent?
3. **Notification preferences?** Should users be able to mute group join notifications?

**Deferred (no community UI yet):**
- Group visibility / "Your communities" tab
- Leave group behavior
- Auto-friend toggle settings
- Community naming and management

