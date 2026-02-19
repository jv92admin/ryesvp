# Customer Communications Reference

> **Purpose:** Audit and manage all user-facing copy, share texts, notifications, and branding.

> **Philosophy:** All copy should highlight **the social graph** (friends, crews, groups) **and making plans/logistics easier** — ideally both.

> **Core message:** "This is where we organize together" — not just a link to an event.

---

## Share Text Templates

### 1. Personal Friend Invite (Add Friend)

**Files:** 
- `src/components/InviteLinkCard.tsx`
- `src/components/OnboardingModal.tsx` (Add Friends button)
- `src/components/OnboardingTips.tsx` (Add Friends link)
- `src/components/SocialEngagementPanel.tsx` (sidebar invite)

**Share title:** `Add me on RyesVP`

**Share text:**
```
Add me as a friend on RyesVP so we can spot Austin events and actually make plans to go.

{inviteLink}
```

**Used for:** Personal invite link (`/?ref=CODE`)

---

### 2. Group Friend Link

**File:** `src/components/CreateGroupModal.tsx`

**Clipboard copy:** URL only (e.g., `https://ryesvp.me/g/ABC123`)

**Modal copy:**
- "Share this link with your friends. Everyone who joins becomes friends with each other so future plans are easier."

**Used for:** Group invite links (`/g/CODE`)

---

### 3. Event Share

**Files:** 
- `src/components/ShareButton.tsx`
- `src/components/ShareIconButton.tsx` (icon-only variant)

**Share title:** `{eventTitle}`

**Share text (logged in):**
```
Hey! Check out this event:

🎵 {title}
📍 {venueName}
📅 {dateFormatted}

{eventUrl}?ref={inviteCode}

👋 Join me on RyesVP so we can see who's in and make a plan.
```

**Share text (logged out):**
```
Hey! Check out this event:

🎵 {title}
📍 {venueName}
📅 {dateFormatted}

{eventUrl}
```

---

### 4. Plan Share

**File:** `src/lib/squadShareText.ts`

**Variants:**

#### A) User is buying tickets for others:
```
I'm organizing {eventName} on {date} at {time} ({venue}). I'm getting tickets for people who say they're in by {deadline}. Mark your status in the plan so I can sort tickets and logistics: {eventLink}
```

#### B) User has tickets:
```
I'm going to {eventName} on {date} at {time}. If you're in, mark it in the plan and grab your ticket here so we can coordinate: {eventLink}
```

#### C) Default/Interested:
```
Thinking about {eventName} on {date} at {time} ({venue}). Mark if you're in and your ticket situation in the plan so we can see if this one comes together: {eventLink}
```

---

### 5. Day-of Share

**File:** `src/lib/squadShareText.ts`

**Share title:** `Day-of: {eventTitle}`

**Share text:**
```
Tonight: {eventName} at {time}! 🎵

📍 Meeting at {meetTime} at {meetSpot}, then heading to the show.

👥 Going: {memberNames}

Open the plan for all the details: {eventLink}
```

---

## Toast Notifications

### Plan Creation Toasts

**File:** `src/components/squad/SquadCreationModal.tsx`

| Scenario | Message |
|----------|---------|
| Created with friends | `Plan created! {N} friend{s} invited and notified.` |
| Created solo | `Plan created! Add friends to start planning together.` |
| Joined friend's plan | `You joined {friendName}'s plan!` |

### Start Plan Modal Toasts

**File:** `src/components/StartPlanModal.tsx`

| Scenario | Message |
|----------|---------|
| Added to existing plan | `Your friend has been added to your existing plan and notified.` |
| Created with pre-selected friend | `Plan created for {eventTitle}. Your friend has been notified.` |
| Created solo | `Plan created for {eventTitle}. Add friends to invite them.` |

### Squad Invite Modal Toasts

**File:** `src/components/squad/SquadInviteModal.tsx`

| Scenario | Message |
|----------|---------|
| Added 1 friend | `{friendName} has been added to your plan and notified.` |
| Added 2 friends | `{name1} and {name2} have been added to your plan and notified.` |
| Added 3+ friends | `{N} friends have been added to your plan and notified.` |

### Calendar Export Toasts

**File:** `src/components/CalendarDropdown.tsx`

| Scenario | Message |
|----------|---------|
| Google Calendar | `Opening Google Calendar...` |
| Apple/Outlook | `Calendar event downloaded!` |
| Error | `Failed to export to calendar` |

### First Engagement Toast

**File:** `src/components/EngagementToast.tsx`

| Element | Text |
|---------|------|
| Title | `Added to Your Events` |
| CTA | `View Your Events →` |

### Share/Copy Toasts

**File:** `src/lib/share.ts`

| Scenario | Message |
|----------|---------|
| Clipboard copy success | `Copied to clipboard!` |
| Share failed | `Failed to share` |

---

## In-App Notifications

**File:** `src/db/notifications.ts`

| Type | Template |
|------|----------|
| `FRIEND_REQUEST_RECEIVED` | `{actor} sent you a friend request.` |
| `FRIEND_REQUEST_ACCEPTED` | `{actor} accepted your friend request.` |
| `ADDED_TO_PLAN` | `{actor} added you to their plan for {event} on {date}.` |
| `PLAN_CANCELLED` | `Your plan for {event} on {date} was cancelled.` |
| `PLAN_MEMBER_JOINED` | `{actor} joined your plan for {event}.` |
| `PLAN_MEMBER_LEFT` | `{actor} left your plan for {event}.` |
| `TICKET_COVERED_FOR_YOU` | `{actor} is handling your ticket for {event} on {date}.` |
| `PLAN_MEETUP_CREATED` | `Meetup added for your {event} plan: {message}.` |
| `GROUP_MEMBER_JOINED` | `{actor} joined {groupName}.` |

---

## Onboarding Copy

### OnboardingModal (First Visit)

**File:** `src/components/OnboardingModal.tsx`

- **Headline:** `Discover. Connect. Plan. Go.`
- **Subhead:** `Find events with friends and keep each plan in one place.`
- **Bullets:** Discover → Connect → Plan → Go (with descriptions)

### OnboardingTips

**File:** `src/components/OnboardingTips.tsx`

| Condition | Tip |
|-----------|-----|
| No events marked | `Mark events as Going or Interested to start building your plans.` |
| No friends | `Add friends to see what they're into and make plans together.` |

---

## Metadata / OG Tags

### Global (Layout)

**File:** `src/app/layout.tsx`

```
title: "RyesVP - Events with Friends"
description: "Discover Austin events, see what friends are into, and make plans that actually happen."
```

### Group Join Page

**File:** `src/app/g/[code]/page.tsx`

```
title: "Join {groupName} | RyesVP"
description: "Join {groupName}, connect with {memberCount} people, and make future plans easier on RyesVP."
```

### Event Pages (Future)

**File:** `src/app/events/[id]/page.tsx`

When adding `generateMetadata`:
```
title: "{eventTitle} | RyesVP"
description: "See who's into {eventTitle}, mark if you're in, and keep your plan and tickets in one place."
```

---

## Branding Assets

### Current State

**Location:** `public/`

| File | Purpose | Status |
|------|---------|--------|
| `logo.svg` | SVG logo (extracted from `RyesVPLogo.tsx`) | ✅ Added |
| `og-image.png` | OG image for social shares (1200x630) | ✅ Added |

### React Logo Component

**File:** `src/components/brand/RyesVPLogo.tsx`

- `RyesVPLogo` — Square logo with "Tucked Y" checkmark design
- `RyesVPWordmark` — Text "RyesVP" with green y
- `RyesVPBrand` — Combined logo + wordmark (used in header)

### Future: Dynamic OG Images

For event-specific OG images (show event title/image when sharing):
- Use Next.js ImageResponse API
- Add `generateMetadata` to `src/app/events/[id]/page.tsx`
- Creates unique OG image per event page

---

## Google OAuth Branding

### Fix Applied ✅

1. **Supabase Dashboard** → **Project Settings** → **General**
   - Project Name: `RyesVP`

2. **Supabase Dashboard** → **Authentication** → **URL Configuration**
   - Site URL: `https://ryesvp.me`
   - Redirect URLs: `https://ryesvp.me/**`

3. **Google Cloud Console** → **OAuth consent screen**
   - App name: `RyesVP`
   - App logo: Uploaded
   - App domain: `https://ryesvp.me`

---

## Copy Guidelines

### Tone
- Casual, friendly, Austin-local
- Action-oriented ("Mark it", "Join", "Start a plan", "Make the night happen")
- No corporate speak

### Core Value Props
Always highlight either:
1. **The social graph** — friends, crews, groups, "see who's in"
2. **Making plans/logistics easier** — "in one place", "coordinate", "actually happen"

Ideally both in every share text.

### Terminology
- **Code:** "Squad" (database, files, types)
- **UI:** "Plan" (user-facing copy, buttons, toasts)
- **Brand:** "RyesVP" (one word, capital R and VP)

### Emoji Usage
- Sparingly in share texts (🎵 📍 📅 👋 👥)
- Never in buttons or headers
- Optional in toasts for positive feedback

---

*Created: December 21, 2025*
*Updated: December 21, 2025*
*Status: All copy updated, assets complete*
