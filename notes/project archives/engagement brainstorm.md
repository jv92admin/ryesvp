# Proposal: Default Landing, Tips, and Social Nudge UX

> **Status:** ✅ Complete (Dec 19, 2025)  
> **Related:** `friend-links-spec.md` — Provides the Add Friend infrastructure this spec's CTAs depend on

---

## Implementation Status

| Item | Status | Notes |
|------|--------|-------|
| Default landing = All Events | ✅ Done | Already default |
| Tip 1: "Mark as Going/Interested" | ✅ Done | `OnboardingTips.tsx` |
| Tip 2: "Add friends" | ✅ Done | `OnboardingTips.tsx` |
| First-time modal | ✅ Done | `OnboardingModal.tsx` — "Discover. Connect. Plan. Go." |
| Sign-in tip (logged out) | ✅ Done | `SignInTip.tsx` |
| Set name banner | ✅ Done | `SetNameBanner.tsx` — restyled |
| Social empty states | ✅ Done | "Browse Events" + "Add Friends" CTAs |
| First engagement toast | ✅ Done | `EngagementToast.tsx` |
| Version flag for legacy users | ✅ Done | Force-shows tips once to all users |

**~~Future TODO:~~ DONE (Dec 16, 2025):** Migrated from localStorage to DB-backed engagement tracking (`lastVisitAt`, `onboardingCompletedAt`, `firstEngagementAt` on User model). See PROJECT-ROADMAP.md sprint log.

---

## Relationship to Friend-Links Spec

This spec's "Add friends" CTAs require working friend-add flows to be meaningful.

| This Spec Says | Friend-Links Provides |
|----------------|----------------------|
| Tip 2: "Add friends" button | Profile share flow, group links |
| Empty state: "Add friends" | Profile page + Add Friend button |
| Friend-related nudges | Auto-friend on link click |

**Build Sequence:**
1. **Phase 1 (together):** Profile page + Add Friend + "Add friends" tip
2. **Phase 2 (after validation):** Toasts, "Your Plans" tip, empty states polish

See `friend-links-spec.md` for the Add Friend infrastructure.

---

## 1. Goals

* Make the **first experience** clear and self-explanatory: “This is an events app.”
* Gradually introduce the **social value** (plans + friends) without overwhelming new users.
* Use **lightweight tips and toasts** to teach people:

  * How to turn events into “Your Plans”
  * Why adding friends makes the app more interesting
* Keep logic simple enough that an LLM agent can implement it from high-level rules.

---

## 2. High-Level Behavior

### 2.1 Default Landing

* **Default landing view for all users:**
  **All Events** (the main event list).
* The **Social / Your Events** view is still available via navigation, but is *not* the first thing new users see.

Rationale (for coder context):
The All Events view immediately answers “What is this thing?” without requiring any prior data (friends, plans, interest).

---

## 3. Teaching the Product with Tips on All Events

We introduce **two lightweight “tips”** on the All Events screen, each controlled by simple conditions:

1. **“Turn this into Your Plans” tip**
2. **“Add friends” tip**

These are small, dismissible banners or inline hints that appear above the event list, below the header/filters (exact placement can be decided in implementation).

### 3.1 Tip 1 – “Turn events into Your Plans”

**Purpose:**
Teach a new user that marking events as Going/Interested and starting plans will populate the Social / Your Events view.

**Where it shows:**

* On the **All Events** screen, near the top (e.g., under the title/filters).

**When it is visible:**

* Show this tip **until** at least one of the following is true:

  * User has marked **any event** as Going/Interested, **or**
  * User is a member of **at least one plan**.

In other words:

```text
Show Tip 1 if:
  user.going_count == 0
  AND user.interested_count == 0
  AND user.plan_membership_count == 0
```

**Copy (example, editable):**

> **Make it your world**
> Tap ★ Interested or Start Plan on events you like. They’ll show up in Your Plans.

Optional CTA:

* Button: `View Your Plans` (takes them to Social / Your Events view)
* Or simple inline link: `See Your Plans`

### 3.2 Tip 2 – “Add friends”

**Purpose:**
Teach new users that adding friends unlocks the “Friends’ plans” side of the experience.

**Where it shows:**

* Also on **All Events**, near Tip 1 (stacked or alternating; implementation choice).

**When it is visible:**

* Show this tip **until** the user has added at least one friend **beyond** the person who invited them.

* In practice, this can be:

  ```text
  inviter_id = the user who invited this user to RyesVP (if any)

  friends_excluding_inviter_count = total_friends_count
                                    - (1 if inviter_id is in friend list else 0)

  Show Tip 2 if:
    friends_excluding_inviter_count == 0
  ```

* If there is no known inviter, just use `total_friends_count == 0`.

**Copy (example, editable):**

> **See what your friends are planning**
> Add friends to see their plans and almost-plans in Your Events.

CTA:

* Button: `Add friends` (opens friend-add flow)

---

## 4. Social / Your Events View – Empty States

The Social / Your Events view (whatever it’s called in nav) should **explain itself** via friendly empty states when the user’s graph is still empty.

### 4.1 “Your plans” section empty

**Condition:**

* User has no plans and no Going/Interested events.

**Empty state copy:**

> You don’t have any plans yet.
> Browse events and tap ★ Interested or Start Plan to see them here.

CTA:

* Button: `Browse events`

  * Navigates to All Events view.

### 4.2 “Friends’ plans” section empty

**Condition:**

* User has no friends, or friends exist but none have plans/activity yet.

**Empty state copy:**

> Add friends to see what they’re planning and thinking about going to.

CTA:

* Button: `Add friends`

  * Opens friend-add flow.

These empty states should remain even after the All Events tips are gone; they’re local to the Social view and help users who arrive there first via nav.

---

## 5. Toasts / Nudges After Key Actions

We use **non-blocking toasts** to gently nudge users toward the Social / Your Events view at key “first-time” moments.

### 5.1 After the user shows interest or creates their first plan

**Triggers (either of these):**

1. User marks **their first event** as Going or Interested.
2. User creates **their first plan**.

We treat both as:

> “You’ve now done something that populates Your Plans.”

**Toast behavior:**

* Show once when the user crosses from zero → one in either category.
* Do not spam on subsequent actions.

**Example condition:**

```text
before_action:
  my_items_count = user.going_count + user.interested_count + user.plan_membership_count

after_action:
  if my_items_count == 0 and new_my_items_count > 0:
      show toast
```

**Toast copy (example):**

> **Added to Your Plans**
> We’ve added this event to Your Plans.
> [View Your Plans]

* Button `View Your Plans` deep-links to the Social / Your Events view.

### 5.2 Toast implementation notes (conceptual)

* Toasts should be:

  * Non-blocking (no modal)
  * Auto-dismiss after a few seconds
  * Still actionable while visible (tap button to navigate)
* They do **not** need to write anything new to the notifications bell; the main goal here is **immediate orientation**, not logging.

---

## 6. Summary of Required Changes (Conceptual)

For an LLM coder or engineer, the work breaks down as:

1. **Default view behavior**

   * Ensure the app lands on **All Events** by default for all users (including first-time).

2. **All Events tips**

   * Implement **Tip 1** (“Make it your world”) with visibility conditioned on:

     * `no Going/Interested events` AND `no plans`.
   * Implement **Tip 2** (“Add friends”) with visibility conditioned on:

     * `no friends beyond inviter` (or `no friends` if inviter unknown).
   * Place these tips near the top of All Events (final layout up to implementer).
   * Include CTAs: `View Your Plans` and `Add friends` respectively.

3. **Social / Your Events empty states**

   * Implement clear empty states for “Your plans” and “Friends’ plans” sections:

     * “No plans yet” → `Browse events` CTA.
     * “No friends’ plans yet” → `Add friends` CTA.

4. **Toasts after first engagement**

   * Implement a toast that fires once when:

     * User goes from **0 → 1** in:

       * Going/Interested events
       * or plan memberships.
   * Toast text suggests:

     * “This event has been added to Your Plans”
     * and includes a `View Your Plans` button that opens the Social view.
   * Ensure the toast is non-blocking and auto-dismisses.

5. **Routing and naming**

   * The implementation can choose specific component names, routing hooks, and file structure.
   * The only requirements are the **behaviors and conditions** described above.

---
