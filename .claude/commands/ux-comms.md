# UX & Communications

You are working on user-facing copy, toasts, notifications, share texts, onboarding, or email templates.

## Lark Voice

> "The friend who always knows about the show before you do. Not loud, not tryhard — just naturally plugged in and always down to go."

### Product Language

| Word | Role | Example |
|------|------|---------|
| Lark | The platform | "I found it on Lark." |
| Plan | The thing you create & share | "I made a plan for Saturday." |
| on Lark | How you reference it | "Who's on Lark for Saturday?" |

**Note:** Code says "Squad" internally. Users **never** see "squad." Grep for it.

### Copy Principles

- **Highlight the social graph** — "your people", "friends", "crew", "together"
- **Sound like a friend, not software** — "Something's happening on Lark" not "New notification received"
- **Celebratory toasts** — "Plan created! 3 friends invited." not "Squad successfully created."
- **Title Case for CTAs** — "Start Plan", "Add Friends", "View Your Events"
- **Sentence case for body** — "Mark events as going or interested"
- **No emoji in UI chrome** — only as visual anchors in share texts (use sparingly)

## Visual Tone

Social/engagement surfaces use warm gold (`--action-engage`). This applies to:
- Toast action buttons for social actions (View Plan, Invite)
- Onboarding CTAs (Find Friends, Start Plan)
- Share flow highlights
- Active filter chips

Dark (`--action-primary`) for commercial/navigation: Buy Tickets, Done, Close, Get Started.

## Copy by Surface

| Surface | Example |
|---------|---------|
| Search bar | "What kind of night are we having?" |
| Hero / body | "Find something, bring your people." |
| Hero variant | "Plans with your people, not your inbox." |
| Empty state (no events) | "Nights start here. Begin by following a few venues or friends." |
| Empty state (no friends) | "Add a few friends to see who's going." |
| Empty state (solo plan) | "Plans are better with friends! Invite someone to join you." |
| CTA buttons | "Find Something Tonight" / "Plan with Your People" |
| Share link | "Friday at Mohawk — via Lark" |
| Push notification | "2 friends are in for Saturday on Lark" |
| Notification | "Something's happening on Lark." |

## Toast Inventory

| Context | Scenario | Message |
|---------|----------|---------|
| Plan creation | With friends | `Plan created! {N} friend(s) invited and notified.` |
| Plan creation | Solo | `Plan created! Add friends to start planning together.` |
| Plan creation | Joined existing | `You joined {friendName}'s plan!` |
| Squad invite | 1 friend | `{friendName} has been added to your plan and notified.` |
| Squad invite | 2 friends | `{name1} and {name2} have been added to your plan and notified.` |
| Squad invite | 3+ friends | `{N} friends have been added to your plan and notified.` |
| Calendar | Google | `Opening Google Calendar...` |
| Calendar | Apple/Outlook | `Calendar event downloaded!` |
| Share | Clipboard | `Copied to clipboard!` |
| First engagement | Going/Interested | Title: `Added to Your Events` — CTA: `View Your Events →` |

## Notification Types (9)

All stored in DB, display text computed server-side in `getNotificationText()` — never in components.

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

## Share Text Families (5)

All must render cleanly in iMessage/WhatsApp — no markdown, clean line breaks, emoji only as visual anchors.

1. **Personal friend invite** — "Add me on RyesVP so we can spot Austin events and actually make plans to go."
2. **Group invite** — URL-only clipboard with modal explanation copy
3. **Event share** (logged-in / logged-out variants) — Event details + referral link
4. **Plan share** (3 variants: buying-for-others / has-tickets / interested) — Context-aware logistics
5. **Day-of share** — Tonight details: time, meeting spot, who's going, plan link

Templates live in `src/lib/share.ts` and `src/lib/squadShareText.ts`.

## Key References

| File | Purpose |
|------|---------|
| `notes/reference/customer-comms.md` | Full copy template library |
| `notes/design/ui-reference.md` | Toast component patterns, onboarding flow |
| `src/components/ui/Toast.tsx` | Toast component (success/info/error, 8s duration) |
| `src/db/notifications.ts` | 9 notification types, display text computation |
| `src/lib/share.ts` | Native share API (mobile) with clipboard fallback (desktop) |
| `src/lib/squadShareText.ts` | Plan share text templates |
| `src/contexts/ToastContext.tsx` | Toast provider + `useToast()` hook |
