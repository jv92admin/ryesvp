# Engagement Audit

**Date:** 2026-02-19
**Auditor:** Engagement Agent
**Scope:** All user-facing messaging -- toasts, notifications, share texts, onboarding, CTAs, headers, error feedback

---

## Blockers (Must Fix)

1. **`src/lib/squadShareText.ts:114` -- "squad" in user-visible share text**
   `check the squad!` appears in `generateDayOfText()` when no meetup details are set.
   Should be: `check the plan!`

2. **`src/app/api/squads/[id]/meetup/route.ts` -- `PLAN_MEETUP_CREATED` notification never triggered**
   The `PUT /api/squads/[id]/meetup` endpoint updates meetTime/meetSpot but never creates a notification. All squad members should be notified when logistics are set or changed. The notification type exists in the DB schema and `getNotificationText()` already handles it.

3. **`src/components/AddFriendCard.tsx:88-90` -- Uses native `alert()` for friend request feedback**
   `alert('Friend request sent!')` and `alert(err.message)` are used instead of the toast system. This is jarring, non-brand, and breaks the flow. Should use `showToast()`.

4. **`src/components/squad/SquadMemberList.tsx:82` -- Uses native `alert()` for remove member error**
   `alert('Failed to remove member')` -- should use `showToast({ message: '...', type: 'error' })`.

5. **`src/components/InviteFriendsModal.tsx:55` -- Uses native `alert()` for invite failure**
   `alert(err.message)` -- should use toast system.

6. **`src/components/CommunitiesContent.tsx:86` -- Uses native `alert()` for community creation failure**
   Should use toast system.

7. **`src/components/CommunityDetailContent.tsx:142` -- Uses native `alert()` for leave community failure**
   Should use toast system.

8. **`src/components/ListDetailModal.tsx:75` -- Uses native `alert()` for add member failure**
   Should use toast system.

9. **`src/components/ListsContent.tsx:71` -- Uses native `alert()` for create list failure**
   Should use toast system.

10. **`src/components/social/CommunitySoonStub.tsx:86` -- Stale date**
    `Expected: Early 2025` -- it is now February 2026. This makes the product look abandoned.

11. **`src/components/social/CommunitySoonStub.tsx:11-16` -- Email "notify me" form is fake**
    `handleNotifySubmit` has `// TODO: Actually save the email for notifications`. It shows "Thanks! We'll let you know." but discards the email. Users are being misled.

---

## Toast Inventory

### Complete catalog of every toast message in the codebase:

| Component | Scenario | Current Message | Type | Issues? |
|-----------|----------|-----------------|------|---------|
| `SquadCreationModal` | Created with friends | `Plan created! {N} friend{s} invited and notified.` | success | Good -- social graph language |
| `SquadCreationModal` | Created solo | `Plan created! Add friends to start planning together.` | success | Good -- nudges social action |
| `SquadCreationModal` | Joined friend's plan | `You joined {friendName}'s plan!` | success | Good |
| `StartPlanModal` | Added to existing plan | `Your friend has been added to your existing plan and notified.` | success | Minor: "Your friend" is vague when we know who it is |
| `StartPlanModal` | Created with pre-selected friend | `Plan created for {eventTitle}. Your friend has been notified.` | success | Minor: same "Your friend" issue |
| `StartPlanModal` | Created solo | `Plan created for {eventTitle}. Add friends to invite them.` | success | Good |
| `StartPlanModal` | Added to existing (409 path) | `Your friend has been added to your existing plan and notified.` | success | Duplicate of above |
| `SquadInviteModal` | Added 1 friend | `{friendName} has been added to your plan and notified.` | success | Good |
| `SquadInviteModal` | Added 2 friends | `{name1} and {name2} have been added to your plan and notified.` | success | Good |
| `SquadInviteModal` | Added 3+ friends | `{N} friends have been added to your plan and notified.` | success | Good |
| `CalendarDropdown` | Google Calendar | `Opening Google Calendar...` | success | Good |
| `CalendarDropdown` | Apple/Outlook | `Calendar event downloaded!` | success | Good |
| `CalendarDropdown` | Export error | `Failed to export to calendar` | error | Good |
| `share.ts` | Clipboard copy | `Copied to clipboard!` | success | Good |
| `share.ts` | Share failed | `Failed to share` | error | Good |
| `EngagementToast` | First engagement | Title: `Added to Your Events`, CTA: `View Your Events -->` | custom | Good -- drives discovery |

### Missing toasts (actions with no feedback):

| Component | Scenario | What happens | Should show |
|-----------|----------|-------------|-------------|
| `FriendsContent` | Accept friend request | Silent refetch | Toast: `{name} added as friend!` |
| `FriendsContent` | Decline friend request | Silent refetch | Toast: `Request declined` |
| `FriendsContent` | Remove friend | Silent refetch (after confirm()) | Toast: `Friend removed` |
| `AddFriendCard` | Friend request sent | `alert()` | Toast: `Friend request sent to {name}!` |
| `AddFriendCard` | Request failed | `alert(error)` | Toast: error type |
| `EventCardActions` | Attendance toggle | Silent | (Acceptable -- optimistic UI) |
| `SquadLogistics` | Save meetup details | Silent | Toast: `Meetup details updated!` |
| `SquadLogistics` | Save failed | `console.error()` only | Toast: error type |
| `SquadTicketsSection` | Ticket status changed | Silent | (Acceptable -- inline UI feedback) |
| `SquadTicketsSection` | Cover selected members | Silent | Toast: `Covering {N} friend's tickets!` |
| `SquadGuestsSection` | Guest count changed | Silent | (Acceptable -- inline UI) |
| `SquadStops` | Add/update/delete stop | Silent | (Acceptable for inline) |
| `SquadMemberList` | Remove member | `alert()` on error only | Toast for both success and error |
| `SquadPage` | Leave plan | Redirects, no feedback | Toast: `You left the plan` (on redirected page) |
| `SquadPage` | Share Plan / Day-of (clipboard) | Visual "Copied!" state only | (Acceptable -- inline button state change) |
| `ShareButton` | Clipboard copy | Visual "Copied!" state only | Inconsistent with `share.ts` which shows toast |
| `ShareIconButton` | Clipboard copy | Visual "Copied!" state only | Same inconsistency |
| `OnboardingTips` | Copy invite link | Visual "Link copied!" state only | Inconsistent with toast pattern |

---

## Notification Inventory

| Type | Template | Trigger Point | Status |
|------|----------|---------------|--------|
| `FRIEND_REQUEST_RECEIVED` | `{actor} sent you a friend request.` | `POST /api/friends/request` | **Active** |
| `FRIEND_REQUEST_RECEIVED` | (same) | `POST /api/users/[id]` (legacy path) | **Active** (duplicate trigger path) |
| `FRIEND_REQUEST_ACCEPTED` | `{actor} accepted your friend request.` | `POST /api/friends/accept` | **Active** |
| `FRIEND_REQUEST_ACCEPTED` | (same) | `POST /api/users/[id]` (legacy path) | **Active** (duplicate trigger path) |
| `FRIEND_REQUEST_ACCEPTED` | (same) | `src/db/invites.ts` (ref-code auto-accept) | **Active** |
| `ADDED_TO_PLAN` | `{actor} added you to their plan for {event} on {date}.` | `POST /api/squads` (batch during create) | **Active** |
| `ADDED_TO_PLAN` | (same) | `POST /api/squads/[id]/members` (individual add) | **Active** |
| `PLAN_MEMBER_JOINED` | `{actor} joined your plan for {event}.` | `POST /api/squads/[id]/members` (self-join) | **Active** |
| `PLAN_MEMBER_LEFT` | `{actor} left your plan for {event}.` | `DELETE /api/squads/[id]/members` (self-leave) | **Active** |
| `TICKET_COVERED_FOR_YOU` | `{actor} is handling your ticket for {event} on {date}.` | `POST /api/squads/[id]/buy-for` | **Active** |
| `GROUP_MEMBER_JOINED` | `{actor} joined {groupName}.` | `POST /api/groups/join/[code]` | **Active** |
| `PLAN_MEETUP_CREATED` | `Meetup added for your {event} plan: {message}.` | `PUT /api/squads/[id]/meetup` | **NOT TRIGGERED** |
| `PLAN_CANCELLED` | `Your plan for {event} on {date} was cancelled.` | No cancel endpoint exists | **NOT TRIGGERED** (no endpoint) |

### Notification issues:

1. **`PLAN_MEETUP_CREATED` is fully defined but never called.** The `PUT /api/squads/[id]/meetup` route should create notifications for all squad members when meetup details are set.
2. **`PLAN_CANCELLED` has no trigger** -- squad deletion happens only when the last member leaves (line 193 of members/route.ts), and at that point there is nobody to notify. If a "cancel plan" feature is added, this type is ready.
3. **Duplicate trigger paths for FRIEND_REQUEST_RECEIVED and FRIEND_REQUEST_ACCEPTED** -- both `/api/friends/request` and `/api/users/[id]` routes create these notifications. The legacy `/api/users/[id]` path should be audited for whether it is still used.
4. **No notification when organizer removes a member** -- `DELETE /api/squads/[id]/members` only notifies when it is a self-leave. If the organizer kicks someone, the removed user gets no notification.

---

## Share Text Inventory

| Variant | Template | Source File | Issues? |
|---------|----------|-------------|---------|
| **Personal friend invite** | `Add me as a friend on RyesVP so we can spot Austin events and actually make plans to go. {link}` | `AddFriendCard.tsx`, `OnboardingTips.tsx`, `SocialEngagementPanel.tsx` | Clean. Social graph language. |
| **Group invite** | URL only (clipboard) + modal explanation | `CreateGroupModal.tsx` | Modal copy is good. No toast after copy in CreateGroupModal (just visual state). |
| **Event share (logged in)** | `Hey! Check out this event: {emoji lines} {url}?ref={code} Join me on RyesVP...` | `ShareButton.tsx`, `ShareIconButton.tsx` | Good. Social graph CTA. |
| **Event share (logged out)** | Same but without ref code and CTA | `ShareButton.tsx`, `ShareIconButton.tsx` | Good. Clean. |
| **Plan share: buying for others** | `I'm organizing {event}... I'm getting tickets for people who say they're in{deadline}. Mark your status in the plan so I can sort tickets and logistics: {link}` | `squadShareText.ts` | Good. Action-oriented. |
| **Plan share: has tickets** | `I'm going to {event}... If you're in, mark it in the plan and grab your ticket here so we can coordinate: {link}` | `squadShareText.ts` | Good. |
| **Plan share: default/interested** | `Thinking about {event}... Mark if you're in and your ticket situation in the plan so we can see if this one comes together: {link}` | `squadShareText.ts` | Good. |
| **Plan share: generic (non-member)** | Same as default/interested | `squadShareText.ts` | Fine. |
| **Day-of share** | `Tonight: {event} at {time}! Meeting at... Going: {names} Open the plan for all the details: {link}` | `squadShareText.ts` | **BUG**: When no meetup details: `check the squad!` -- should be `check the plan!` |
| **Day-of share: partial meetup (time only)** | `Meeting at {time} (location TBD).` | `squadShareText.ts` | Good. |
| **Day-of share: partial meetup (spot only)** | `Meeting at {spot} (time TBD).` | `squadShareText.ts` | Good. |

### Share text issues:

1. **"check the squad!" on line 114** of `squadShareText.ts` -- the only user-visible "squad" leak in share text.
2. **`ShareButton.tsx` and `ShareIconButton.tsx` don't use `shareWithFeedback()`** from `src/lib/share.ts`. They handle clipboard manually with local state instead of using the centralized toast-based feedback. This means no toast on desktop copy -- just a visual state change on the button.
3. **`SocialEngagementPanel.tsx` share text** uses a single-line format `Add me as a friend on RyesVP... {url}` (space, not `\n\n`). All other personal invite texts use double newline before the URL. Minor inconsistency.

---

## Copy Violations

### Squad --> Plan violations (user-visible):

| File | Line | Current Text | Should Be |
|------|------|-------------|-----------|
| `squadShareText.ts` | 114 | `check the squad!` | `check the plan!` |

All other "squad" references in `.tsx` files are in code-level identifiers (variable names, prop names, interface names, import paths, API URLs) -- which is correct per convention. User-visible strings consistently use "Plan".

### CTA Casing Issues (should be Title Case):

| File | Line | Current | Should Be |
|------|------|---------|-----------|
| `SquadMemberList.tsx` | 101 | `Invite Friends` | Correct (Title Case) |
| `SquadMemberList.tsx` | 201 | `+ Invite more friends` | `+ Invite More Friends` |
| `SquadSnapshot.tsx` | 93 | `Add your first friend` (header) | Acceptable as header (sentence case) |
| `AddFriendCard.tsx` | 143 | `Share Link` | Correct |
| `AddFriendCard.tsx` | 154 | `Find by Email` | Correct |
| `AddFriendCard.tsx` | 191 | `Create Group` | Correct |
| `AddFriendCard.tsx` | 199 | `View Groups` | Correct |
| `CreateGroupModal.tsx` | 192 | `Create & Copy Link` | Correct |
| `SocialEngagementPanel.tsx` | 154 | `Copy Invite Link` (with emoji) | Emoji in CTA violates brand rules |
| `SocialEngagementPanel.tsx` | 189 | `Invite Friends` (with emoji) | Emoji in CTA violates brand rules |
| `SquadTicketsSection.tsx` | 245 | `Cover {N} selected` | `Cover {N} Selected` |
| `CommunitySoonStub.tsx` | 71 | `Notify Me` | Correct |
| `PlanModeView.tsx` | 202 | `Share Plan` | Correct |
| `PlanModeView.tsx` | 212 | `Share Day-of` | Correct |
| `PlanModeView.tsx` | 225 | `Leave Plan` | Correct |

### Header Casing Issues (should be sentence case):

| File | Line | Current | Issue? |
|------|------|---------|--------|
| `OnboardingModal.tsx` | 83 | `Discover. Connect. Plan. Go.` | Fine -- tagline |
| `SocialSectionA.tsx` | 42 | `Your plans` | Correct (sentence case) |
| `SocialSectionB.tsx` | 43 | `Friends' plans` | Correct |
| `SquadCreationModal.tsx` | 195 | `Start a plan` | Correct |
| `SquadInviteModal.tsx` | 152 | `Invite friends to your plan` | Correct |
| `StartPlanModal.tsx` | 272 | `Start a Plan` | Mixed -- `Start a Plan` has Title Case on "Plan". Should be `Start a plan` |
| `CreateGroupModal.tsx` | 138 | `Create Group Link` | Should be `Create group link` (sentence case for header) |
| `CreateGroupModal.tsx` | 92 | `Group Created!` | Should be `Group created!` |
| `CommunitySoonStub.tsx` | 25 | `Coming Soon` | Should be `Coming soon` |
| `CommunitySoonStub.tsx` | 26 | `Community & Tickets` | Should be `Community & tickets` |

### Emoji violations in buttons/CTAs:

| File | Line | Text | Issue |
|------|------|------|-------|
| `SocialEngagementPanel.tsx` | 154 | `Copy Invite Link` (with emoji prefix `🔗`) | Emojis should not appear in CTAs |
| `SocialEngagementPanel.tsx` | 189 | `Invite Friends` (with emoji prefix `🔗`) | Same |
| `SocialEngagementPanel.tsx` | 99 | `👋` emoji in sign-in prompt | Decorative emoji |
| `SocialEngagementPanel.tsx` | 133 | `👋` emoji in "no friends" state | Decorative emoji |
| `SocialEngagementPanel.tsx` | 170 | `✨` emoji in stats | Decorative emoji |
| `CommunitySoonStub.tsx` | 24 | `🚧` emoji heading | Decorative emoji in header |

---

## Missing Engagement Touchpoints

### Actions that should have feedback but do not:

1. **Friend request accepted** (`FriendsContent.tsx`) -- User taps Accept, data refetches silently. Should show toast: `You and {name} are now friends!`

2. **Friend request declined** (`FriendsContent.tsx`) -- Silent. Should show brief toast: `Request declined`.

3. **Friend removed** (`FriendsContent.tsx`) -- Uses `confirm()` dialog, then silent refetch. Should show toast: `{name} removed from friends`.

4. **Meetup logistics saved** (`SquadLogistics.tsx`) -- `handleSave()` succeeds silently. Should show toast: `Meetup details saved! Your friends can see them in the plan.` (highlight social graph).

5. **Meetup logistics save failed** (`SquadLogistics.tsx`) -- `console.error()` only. User has no idea it failed.

6. **Plan creation failed** (`StartPlanModal.tsx:245`) -- `console.error('Failed to create squad:')` with no user feedback. The user clicked "Start Plan" and nothing happened.

7. **Status update failed** (`SquadPage.tsx:101`) -- `console.error('Error updating status:')` with no user feedback.

8. **Attendance change failed** (`FriendsAndStatusCard.tsx:111`) -- Optimistic update rolls back silently. User may not notice their tap was reverted.

9. **Attendance change failed** (`EventCardActions.tsx:50`) -- `console.error()` only. No feedback.

10. **Leave plan -- no confirmation toast on destination page** (`SquadPage.tsx:122`) -- User confirms via `window.confirm()` then is redirected. No toast on the event page confirming they left.

11. **Ticket cover action has no feedback** (`SquadTicketsSection.tsx:101-104`) -- Covering a friend's ticket is a meaningful social action. Should show toast: `{name}'s ticket is covered!`

12. **Share button clipboard copy inconsistency** -- `ShareButton.tsx` and `ShareIconButton.tsx` use local state instead of `shareWithFeedback()`. On desktop, users see a checkmark icon but no toast. The `share.ts` utility exists specifically for this.

---

## Onboarding Assessment

### OnboardingModal:
- **Trigger logic:** DB-backed (`onboardingCompletedAt`). Fires on home page for first visit. Skipped on deep links. Good.
- **Copy:** `Discover. Connect. Plan. Go.` -- strong, aligned with brand.
- **Bullets:** Four-step flow clearly explains the value prop.
- **CTAs:** `Explore Events` (correct Title Case) and `Learn More` (correct Title Case). Good.
- **Missing:** No "Add Friends" CTA in the onboarding modal. The agent definition mentions this as a known gap. Given that the social graph is the core differentiator, the modal should have a path to adding friends.

### OnboardingTips:
- **Tip 1 (no events):** Good -- contextual, disappears after user marks Going/Interested. Session-dismissable.
- **Tip 2 (no friends):** Good -- includes share action inline. "Add friends" is clickable.
- **Issue:** Tip 2's clipboard copy uses local state (`copied`/`Link copied!`) instead of the toast system. Minor inconsistency.

### Engagement Tracking:
- `onboardingCompletedAt` -- set on modal dismiss. Good.
- `firstEngagementAt` -- set on first Going/Interested action. Triggers one-time toast. Good.
- `lastVisitAt` -- updated each visit. Good.
- **Missing:** No tracking of first plan created, first friend added, or first share action. These are key activation milestones that would help identify drop-off points.

### Social Graph Language in Onboarding:
- Modal mentions "friends" in subhead and bullet 2. Good.
- Tip 2 explicitly mentions friends. Good.
- **Missing:** After first engagement toast ("Added to Your Events"), there is no prompt to add friends or start a plan. This is the warmest moment to nudge social connection.

---

## Suggestions (Should Fix)

1. **Replace all `alert()` calls with toast system.** There are 8 instances across AddFriendCard, CommunitiesContent, CommunityDetailContent, InviteFriendsModal, ListDetailModal, ListsContent, and SquadMemberList. Each should use `showToast()` with appropriate type.

2. **Replace `window.confirm()` with a custom confirmation modal.** The 2 instances in SquadPage and SquadPageModal break the UI consistency. A simple confirmation dialog component would feel branded.

3. **Wire `PLAN_MEETUP_CREATED` notification.** When `PUT /api/squads/[id]/meetup` succeeds, create notifications for all squad members (excluding the person who set the details). This is the #1 missing engagement trigger.

4. **Standardize clipboard copy feedback.** `ShareButton.tsx`, `ShareIconButton.tsx`, and `OnboardingTips.tsx` should use `shareWithFeedback()` from `src/lib/share.ts` instead of managing local state. This ensures consistent toast feedback.

5. **Add "Add Friends" CTA to OnboardingModal.** Either as a third button or replace "Learn More" with it. The modal is the first impression and should push toward the core loop (friends -> events -> plans).

6. **Add toast for friend request accept/decline.** Users who accept a friend request should see `You and {name} are now friends!` -- this is a celebratory moment.

7. **Add toast for meetup logistics saved.** `Meetup details saved! Your plan members will see the update.` -- reinforces that the action has social impact.

8. **Add error toasts for all silent failure paths.** Every `catch` block that only `console.error`s should show a brief error toast. Priority: plan creation, status updates, attendance changes.

9. **Remove decorative emojis from CTAs in SocialEngagementPanel.** Replace `🔗 Copy Invite Link` and `🔗 Invite Friends` with plain text versions. Replace `✨` and `👋` with SVG icons or remove.

10. **Fix CommunitySoonStub.** Either remove the stale "Expected: Early 2025" date, update it, or remove the stub entirely. Wire the email form to actually save emails (or remove the form).

11. **Add activation milestone tracking.** Track `firstPlanCreatedAt`, `firstFriendAddedAt`, and `firstShareAt` in the engagement table. These help identify where users drop off in the activation funnel.

12. **Post-first-engagement nudge.** After the first engagement toast, consider a delayed tip (next session) that says: "You have events marked! Add friends to see if they're going too." This closes the loop from engagement to social connection.

13. **Fix header casing.** `Start a Plan` -> `Start a plan`, `Create Group Link` -> `Create group link`, `Group Created!` -> `Group created!`, `Coming Soon` -> `Coming soon`.

14. **Add notification for organizer-removed member.** When the organizer removes someone from a plan, the removed user should get a notification.

15. **Fix CTA casing.** `+ Invite more friends` -> `+ Invite More Friends`, `Cover {N} selected` -> `Cover {N} Selected`.

---

## Summary

The engagement system has a solid foundation: notification types are well-designed, toast messages use social graph language, share texts are platform-aware, and the onboarding flow is DB-backed. The codebase correctly uses "Plan" in user-facing copy with one exception.

**Strengths:**
- Social graph language is strong in toasts and share texts ("friends invited and notified", "friends have been added to your plan")
- Notification text is computed server-side in one place (`getNotificationText()`)
- Share texts work for iMessage/WhatsApp (no markdown, clean line breaks)
- Toast system exists and works; most plan-related actions have good feedback
- Engagement tracking is DB-backed, not localStorage

**Critical gaps:**
- **8 uses of native `alert()`** instead of the toast system, creating a jarring UX
- **`PLAN_MEETUP_CREATED` is never triggered** -- the most important unwired notification
- **1 "squad" leak** in user-visible share text
- **Multiple silent failure paths** where users get no feedback (plan creation failure, status updates, attendance changes, logistics save)
- **Share clipboard feedback is inconsistent** -- some paths use toasts, others use local button state

**Overall assessment:** The messaging framework is well-architected but ~30% of user actions lack proper feedback. The highest-impact fixes are: (1) wiring the meetup notification, (2) replacing all `alert()` calls with toasts, (3) adding error feedback to silent failure paths, and (4) standardizing clipboard copy feedback. These changes would bring the engagement system to full coverage without requiring new infrastructure.
