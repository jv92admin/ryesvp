# Social Layer Phase 5 - Invite Links

> **See also:** `PROJECT-ROADMAP.md` for overall project priorities
> **Status:** 🔲 IN PROGRESS

## Overview

Invite-only growth: Every external share includes an invite code. New users sign up via invite links and are auto-friended with the inviter.

---

## MVP Scope

### What We're Building

1. **One invite code per user** - Generated on first share
2. **Share button on events** - Copies invite link to clipboard
3. **Auto-friend on signup** - If `?ref=` present, create friendship
4. **Graceful fallback** - If already signed up, just show the event

### What We're NOT Building (Yet)

- ❌ Internal notification system
- ❌ "Share with specific friend" picker
- ❌ Phone number storage
- ❌ Multiple invite codes per user
- ❌ Invite expiration
- ❌ Referral analytics dashboard

---

## User Flow

### Sharing an Event

```
User clicks "Share" on event detail page
         ↓
Copy invite link to clipboard:
ryesvp.com/events/abc123?ref=xyz789
         ↓
Paste in text/email/social media
```

### Receiving a Shared Link

| Recipient Status | What Happens |
|------------------|--------------|
| **Not on platform** | See event → Signup banner → OAuth → Auto-friend → Back to event |
| **On platform, not friend** | See event (ref ignored) |
| **Already friend** | See event |

---

## Data Model

```prisma
model InviteCode {
  id          String   @id @default(uuid())
  code        String   @unique  // Short code, e.g. "abc123"
  userId      String   @unique  // One code per user
  user        User     @relation(fields: [userId], references: [id])
  usedCount   Int      @default(0)
  createdAt   DateTime @default(now())
  
  redemptions InviteRedemption[]
  
  @@index([code])
}

model InviteRedemption {
  id           String     @id @default(uuid())
  inviteCodeId String
  inviteCode   InviteCode @relation(fields: [inviteCodeId], references: [id])
  newUserId    String     @unique  // Each user can only be referred once
  newUser      User       @relation(fields: [newUserId], references: [id])
  createdAt    DateTime   @default(now())
}
```

---

## API Endpoints

### GET /api/invites/me

Get current user's invite code (create if doesn't exist).

**Response:**
```json
{
  "code": "abc123",
  "usedCount": 5,
  "createdAt": "2024-11-27T..."
}
```

### GET /api/invites/[code]

Validate an invite code (public endpoint).

**Response:**
```json
{
  "valid": true,
  "inviterName": "Alice"  // Display name or null
}
```

### POST /api/invites/[code]/redeem

Redeem invite code after signup. Called automatically by auth flow.

**Response:**
```json
{
  "success": true,
  "friendshipCreated": true,
  "inviterName": "Alice"
}
```

---

## Implementation Tasks

### 1. Database (15 min)
- [ ] Add InviteCode model to schema
- [ ] Add InviteRedemption model to schema
- [ ] Add relations to User model
- [ ] Run migration

### 2. Invite Code Logic (30 min)
- [ ] Create `src/db/invites.ts` with:
  - `getOrCreateInviteCode(userId)`
  - `validateInviteCode(code)`
  - `redeemInviteCode(code, newUserId)`

### 3. API Routes (30 min)
- [ ] `GET /api/invites/me`
- [ ] `GET /api/invites/[code]`
- [ ] `POST /api/invites/[code]/redeem`

### 4. Auth Flow Integration (45 min)
- [ ] Store `ref` param in localStorage before OAuth redirect
- [ ] After signup, check for stored ref
- [ ] Call redeem endpoint if ref exists
- [ ] Clear stored ref

### 5. Share Button Update (30 min)
- [ ] Modify ShareButton to include invite code
- [ ] Fetch user's invite code on mount
- [ ] Generate link: `{origin}/events/{id}?ref={code}`

### 6. Invite Banner (30 min)
- [ ] Show banner on event page when `?ref=` present and not logged in
- [ ] "Alice invited you! Sign up to connect."
- [ ] Banner links to OAuth signup

**Total: ~3 hours**

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| User tries to redeem own invite | Ignore silently |
| User already signed up, clicks invite link | Just show event |
| User already friends with inviter | Don't create duplicate friendship |
| Invalid/expired invite code | Show event without invite banner |
| User signed up via invite, inviter deleted account | Friendship already exists, no issue |

---

## Future Enhancements (Not MVP)

### Invite-Gated Signup (Priority)
When ready for true invite-only:
1. **Email-first flow**: User enters email on login page
2. **Check existing user**: If email exists → proceed to OAuth sign-in
3. **Check invite for new users**: If no invite code → "Request an invite" or waitlist
4. **With invite code**: Show inviter name → proceed to OAuth → auto-friend

This gates new signups while allowing existing users to sign in freely.

### Internal Sharing
- "Share with Friend" button for platform users
- Shows friend picker
- Sends in-app notification
- Requires notification system first

### Event-Specific Context
- Track which event was shared
- "Alice invited you to see Deadmau5!"
- Analytics: which events drive signups

### Multiple Invite Codes
- Create codes for different contexts
- "My EDM crew" vs "Work friends"
- Track which code performs best

### Referral Rewards
- Track referral chains
- Gamification: "You've invited 10 friends!"
- Eventually: perks for top referrers

---

## Success Metrics

- % of signups via invite link (goal: >80%)
- Invite link shares per active user
- Signup → first friend connection rate
- Events viewed after invite signup

---

**Last Updated:** November 2024
**Status:** Ready for Implementation

