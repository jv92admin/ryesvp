# Motion Choreographer Audit

**Auditor:** Motion Choreographer Agent
**Date:** 2026-02-22
**Scope:** Full motion system — specs, implementation, gaps, opportunities
**Verdict:** The spec is ambitious and well-reasoned. The implementation is barren. The gap between what's written and what ships is the entire motion system.

---

## What's Working

### 1. The motion philosophy is correct

"Earn every animation" and "the app should feel responsive, not animated" are the right north stars. The spec correctly prioritizes performance (transform + opacity only) and explicitly calls out reduced-motion accessibility. These principles should survive any refactor.

### 2. The easing token system is well-structured

Three curves that cover the real use cases:

| Token | Value | Role |
|-------|-------|------|
| `--ease-smooth` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default. Color shifts, fades |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Slides, reveals, toasts |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Chip toggles, scale pops |

These are defined in `globals.css` and the design system. They exist as CSS custom properties. That's a solid foundation.

### 3. The duration tokens are reasonable

`--duration-fast` (150ms), `--duration-normal` (250ms), `--duration-slow` (400ms). Three tiers. Not too many. These are actually wired into the CSS and referenced in at least two places (Button's `transition-colors` and the Toast's `animate-slide-up`).

### 4. The reduced-motion fallback exists in globals.css

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

This is the nuclear option but it works. All transitions and animations are killed. Correct baseline.

### 5. The Toast slide-up animation is the one real implementation

```css
@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-slide-up {
  animation: slide-up var(--duration-normal) var(--ease-out-expo);
}
```

This is properly implemented: uses the tokens, animates only transform + opacity, and the Toast component (`src/components/ui/Toast.tsx`) applies it. This is the ONLY custom keyframe animation in the entire codebase.

### 6. The Dialog mount/unmount transition is competent

`src/components/ui/dialog.tsx` uses a proper two-phase mount pattern: `mounted` controls DOM presence, `visible` controls the CSS transition. The 200ms transition with `translate-y-4` on mobile and `scale-95` on desktop is reasonable. The backdrop fades from `bg-black/0` to `bg-black/50`. This works.

---

## What's Questionable

### 1. The easing curves are "fine" — not distinctive

`cubic-bezier(0.4, 0, 0.2, 1)` is Material Design's standard easing. It's the CSS equivalent of a stock photo. Every React app that bothered to add custom easing uses this curve. It doesn't feel like anything; it just doesn't feel bad. For a dark, high-contrast nightlife app, the motion language should have more snap, more authority.

**The problem:** `--ease-smooth` is doing all the heavy lifting. Nearly every component uses `transition-colors` with no explicit easing (so it defaults to `ease`, which is `cubic-bezier(0.25, 0.1, 0.25, 1)`) or hardcodes duration via Tailwind. The tokens exist but aren't used consistently.

**Evidence:** The `Button` component uses `duration-[var(--duration-fast)]` for its transition but doesn't specify an easing function. That means it falls back to CSS default `ease`. The design system tokens are partially orphaned.

### 2. The Dialog transition is generic

200ms, translate-y, opacity, scale. This is the default pattern from every Headless UI tutorial. It's functional, but it makes every modal feel the same: the filter drawer, the start-plan modal, the squad creation modal, the invite modal — they all use the same `Dialog` component with the same 200ms transition. There's no differentiation between a quick utility sheet (filters) and a significant action sheet (start a plan).

**Specific issue:** The dialog uses `transition-all duration-200` which animates EVERYTHING, not just transform and opacity. If any layout property changes during the transition, it'll cause layout thrashing. This contradicts the spec's "only animate transform and opacity" rule.

### 3. The 120ms card press duration feels wrong for a dark UI

The spec says 120ms `ease-out` for card press. But in the actual `EventCard` component, the transition is `transition-colors` on hover for border changes. There's no press feedback at all — no scale, no background shift on active, no immediate visual acknowledgment that "I'm pressing this card." On a dark UI where contrast is already high, the lack of press feedback makes cards feel unresponsive.

**Compare to reference apps:** Things 3 has a barely-perceptible scale (0.98) with a spring back. Linear has an instant background darken. Telegram uses a slight scale + opacity shift. Lark has... a border color change on hover (desktop only).

### 4. Chip selection has no motion

The spec says 150ms `ease-out` for chip selection (background-color, color swap). The actual `Chip` component (`src/components/ui/Chip.tsx`) has `transition-colors` in the `toggle` variant, which means it's using Tailwind's default 150ms duration. But there's no easing specified, and critically, there's no scale/spring feedback. Toggling a chip (Going/Interested, filter selection) should feel like pressing a physical button. It currently feels like a CSS class swap because that's literally all it is.

### 5. The stagger system is completely unimplemented

The spec defines careful stagger choreography:
- Feed cards: 60ms stagger, max 5
- Filter chips: 40ms stagger
- Plan member avatars: 50ms stagger
- RSVP chips: 80ms stagger

**Implementation reality:** Zero stagger anywhere. The `EventListWithPagination` component renders all cards simultaneously. The `FilterStrip` renders all chips simultaneously. The `PlansStrip` renders all plan cards simultaneously. The stagger values exist only in markdown.

### 6. Duration values are sometimes hardcoded, bypassing tokens

The Dialog uses `duration-200` (Tailwind utility = 200ms) instead of `duration-[var(--duration-normal)]` (250ms). The `transition-colors` used across 72 files inherits Tailwind's default 150ms, which happens to match `--duration-fast`, but it's a coincidence rather than intentional token usage. If the token values change, half the app won't update.

---

## What's Missing

### 1. No page transitions at all

The spec defines:
- Push (feed to event detail): shared element transition or slide from right, 250ms spring
- Back navigation: reverse of push
- Tab switch (bottom nav): crossfade, 150ms

**Reality:** Next.js App Router renders new pages with zero transition. Navigating from the feed to an event detail page is an instant jump cut. Going back is another jump cut. There is no crossfade, no slide, no shared element. This is the single most noticeable motion gap in the app. Every reference app (Apple Music, Airbnb, Telegram) has page transitions. Lark has none.

### 2. No sheet behavior — the "sheet" is just a dialog

The motion-choreographer spec defines detailed sheet behavior: spring animation (damping 26, stiffness 170), drag handle, 1:1 finger tracking, dismiss threshold (40% + velocity), detents (peek/full), background interaction at peek height.

**Reality:** There are no sheets. The `FilterDrawer` and all modals use the same `Dialog` component which has a fixed enter/exit transition. No drag. No snap-to-detent. No velocity-based dismiss. No spring physics. The component renders as `size="sheet"` in the filter drawer but it's cosmetic — the behavior is identical to every other dialog.

**This is a major experience gap.** On mobile, sheets are the primary interaction surface. A sheet that can't be dragged feels broken in 2026.

### 3. No gesture support whatsoever

Zero gesture handling in the entire codebase:
- No swipe-to-dismiss on cards or sheets
- No swipe-to-go-back
- No pull-to-refresh (the spec says "standard platform behavior" but there's no implementation)
- No horizontal swipe on plan cards in the strip
- No long-press for quick actions
- No pinch-to-zoom on event images

This is a web app (Next.js), which makes gesture support harder than native. But it's 2026 — libraries like `@use-gesture/react` and `framer-motion` exist. The spec assumes native-level gesture support that the implementation cannot currently deliver.

### 4. No spring physics anywhere

The motion-choreographer spec defines five spring configurations with specific damping, stiffness, and mass values. Zero of these are implemented. There are no spring-based animations in the codebase. There's no animation library installed that supports springs (no framer-motion, no react-spring, no @use-gesture).

**The entire spec table is fiction:**
| Context | Damping | Stiffness | Mass | Status |
|---------|---------|-----------|------|--------|
| Sheet snap-to-position | 26 | 170 | 1 | Not implemented |
| Sheet dismiss | 20 | 150 | 1 | Not implemented |
| Card press scale | 35 | 300 | 1 | Not implemented |
| Pull-to-refresh bounce | 15 | 120 | 1 | Not implemented |
| Chip toggle | 30 | 250 | 1 | Not implemented |

### 5. No haptic feedback

The spec defines a detailed haptic map: `impactLight` on chip selection, `impactMedium` on "Need Ticket", `impactLight` on card press, etc.

**Reality:** Zero haptic calls in the codebase. No `navigator.vibrate()`. No haptic library. No conditional logic for devices that support haptics. The entire haptic system is unimplemented.

This matters less on web than on native, but the Vibration API is available in Chrome on Android, and haptic-like feedback can be simulated through micro-animations and audio cues even where the API isn't available.

### 6. No loading state transitions

When data loads (events, plans, friends), components jump from skeleton to content with zero transition. The `PlansStrip` goes from `animate-pulse` skeleton to fully rendered cards in a single frame. The `EventListWithPagination` goes from spinner to full list. The `EventPlanPanel` goes from `animate-pulse` to rendered content.

Every skeleton-to-content transition should be a fade or a subtle reveal. This is low-hanging fruit for perceived performance.

### 7. No list entrance choreography

The spec's "List Entrance Choreography" section describes a detailed sequence: search bar + chips instant, YOUR PLANS fade in (200ms), section header appears, first card 300ms entrance, cards 2-5 stagger at 60ms.

**Reality:** All list items render simultaneously. There is no entrance choreography. The "heartbeat of the app's motion language" (stagger timing) is silent.

### 8. No tab transition in EventContentTabs

The Plan/Day Of/Explore tabs in `EventContentTabs` (`src/components/EventContentTabs.tsx`) swap content with zero animation. The spec says tab switches should "fade in, 200ms, opacity only." The implementation just conditionally renders different components with no transition wrapper.

### 9. No notification dropdown animation

The `NotificationBell` dropdown (`src/components/NotificationBell.tsx`) appears and disappears instantly. No entrance animation, no exit animation. It's a conditional render gated by `isOpen` state. Compare to Telegram's notification panel which slides down with a spring, or Apple's notification center which has a smooth pull-down.

### 10. No scroll-driven animations

The spec mentions the nav bar sticks on scroll. The header does have `sticky` behavior. But there's no scroll-driven visual change — no opacity shifts, no progressive blur, no compact mode. The sticky header just... sticks. Fine but forgettable.

---

## What's Generic

### 1. Every interactive element uses `transition-colors`

Across 72 component files, there are 186 occurrences of `transition-colors` / `transition-all` / `transition-opacity` / `transition-transform`. The vast majority are `transition-colors`, which is the CSS equivalent of "I knew I should add some animation but I didn't think about what." It makes hover states fade in. That's it. That's the entire motion language of the shipping product.

### 2. `animate-pulse` is the only loading pattern

Every loading state across the app uses Tailwind's `animate-pulse` — the default pulsing opacity animation. It's the same animation Stripe uses, that Vercel uses, that every Next.js template uses. It works, but it's the motion equivalent of using the default font.

### 3. `animate-spin` is the only activity indicator

Loading spinners throughout the app use `animate-spin` on an SVG circle/path. Same spinner in every context: loading events, creating plans, inviting friends, fetching notifications. No variation, no branding, no personality.

### 4. The dialog is the only modal pattern, used for everything

Filters, plan creation, squad invites, performer details, community creation, list management — they all use the same `Dialog` component with the same transition. A filter drawer should feel different from a creation flow. A performer peek should feel different from a confirmation modal. They all feel identical.

### 5. No exit animations anywhere except Dialog

When a toast disappears, it just unmounts (no exit animation — the CSS `animate-slide-up` only covers entrance). When the notification dropdown closes, it disappears. When a plan card is removed, it vanishes. Only the Dialog has a visible exit transition.

---

## Provocations

### 1. Signature Motion: The "Snap"

Lark is a nightlife app. Its design language is "high-contrast, monochrome, raw but refined." The motion equivalent of that aesthetic is **snap** — fast attack, controlled settle, zero drift.

Every interaction should feel like a camera shutter or a drumstick hitting a snare: immediate impact, tight decay. No swoopy easing, no slow fades, no Material Design "meaningful motion."

**Concrete proposal:** Replace `--ease-smooth` (Material's standard) with something tighter:
```css
--ease-snap: cubic-bezier(0.2, 0, 0, 1);  /* fast attack, abrupt deceleration */
```
Duration bias should shift down: where the spec says 250ms, ship 180ms. Where it says 150ms, ship 100ms. Lark should feel fast even for an app that feels fast.

### 2. Card Press: Scale + Darken, Spring Return

Every tappable card should have:
- Press down: `scale(0.98)` + background darkens one step (e.g., `--bg-elevated` to `--bg-primary`)
- Duration: 60ms down (instant feel)
- Release: spring back to `scale(1)` with config `{ stiffness: 400, damping: 30 }`
- This should be a reusable hook: `usePressAnimation()`

**Reference:** Things 3's list items have this exact pattern. It's the single biggest contributor to the "this feels good to touch" sensation.

### 3. Sheet System: Build a Real One

The Dialog component needs to be split into two primitives:
- **`Modal`** — centered overlay, scale transition, for confirmations and creation flows
- **`Sheet`** — bottom-mounted, spring-driven, draggable, for quick actions and browsing

The Sheet should support:
- Drag to dismiss (velocity-aware: flick = dismiss, slow drag = snap back)
- Multiple detents (peek at 40% height, full at 90%)
- Background content dimming tied to drag position (not binary)
- `overscroll-behavior: contain` to prevent body scroll
- Native-feeling spring physics via `framer-motion` or `motion` library

**This is not optional.** FilterDrawer, performer peek, invite friends, squad details — all of these should be sheets on mobile. Currently they're all centered modals. This is the single highest-impact motion improvement.

### 4. List Entrance: "The Cascade"

Implement the stagger system. It's already specced. It just needs code.

```tsx
// Pseudocode for a stagger reveal hook
function useStaggerReveal(itemCount: number, staggerMs = 60, maxAnimated = 5) {
  return items.map((item, i) => ({
    style: i < maxAnimated
      ? {
          opacity: 0,
          transform: 'translateY(12px)',
          animation: `reveal 300ms var(--ease-out-expo) ${i * staggerMs}ms forwards`
        }
      : undefined
  }));
}
```

Add a `@keyframes reveal` alongside the existing `@keyframes slide-up`:
```css
@keyframes reveal {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### 5. Page Transitions: Shared Element on Event Image

When tapping an event card in the feed, the card's 72x72 thumbnail should expand into the event page's hero image. This is the "oh, this app is polished" moment.

Implementation path:
- Use the View Transitions API (`document.startViewTransition()`) — supported in Chrome, Safari 18+, progressive enhancement for other browsers
- Assign `view-transition-name: event-image-{id}` to the thumbnail
- Assign the same name to the hero image on the event page
- The browser handles the cross-fade and position interpolation

Fallback for unsupported browsers: simple crossfade (opacity 0 to 1, 200ms).

**This is achievable in Next.js** with the `useTransitionRouter` pattern from `next-view-transitions` or manual `startViewTransition` calls.

### 6. Chip Selection: Micro-Scale Pop

When a filter chip or RSVP chip toggles, add:
- Scale to 1.05 over 80ms (using `--ease-spring` with its 1.56 overshoot)
- Return to 1.0 over 120ms
- Combine with the existing color transition

This is tiny. It takes 5 lines of CSS. It makes chip selection feel like pressing a button instead of flipping a switch.

```css
.chip-toggle:active {
  transform: scale(0.95);
  transition: transform 60ms var(--ease-snap);
}
```

### 7. Skeleton-to-Content: Fade Reveal

Every skeleton state should cross-fade to real content:
```css
.skeleton-reveal {
  animation: fade-in 200ms var(--ease-smooth);
}
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

Apply this class when content loads and replaces a skeleton. Simple. Immediately improves perceived performance.

### 8. Toast Exit Animation

Currently the toast just unmounts. Add:
```css
@keyframes slide-down {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(20px); }
}
```
Trigger this before unmounting (set an `exiting` state, wait for animation to complete, then unmount). Same pattern as the Dialog's exit transition.

### 9. Scroll-Linked Header Refinement

When the user scrolls past the first screen of content:
- Header background should gain a subtle border-bottom or darken slightly
- The transition should be tied to scroll position (CSS `scroll-timeline` or a lightweight scroll listener), not a binary class toggle

This is how Apple Music, Linear, and Airbnb handle sticky headers. The progressive visual change communicates "you've scrolled" without being intrusive.

### 10. Haptic Hooks (Progressive Enhancement)

Even on web, create a `useHaptic()` hook:
```typescript
function useHaptic() {
  return {
    light: () => navigator.vibrate?.(10),
    medium: () => navigator.vibrate?.(25),
    heavy: () => navigator.vibrate?.(50),
  };
}
```
Call `haptic.light()` on chip toggles, `haptic.medium()` on plan creation, etc. Works on Android Chrome. No-ops everywhere else. Costs nothing to add.

---

## Priority Ranking

If I could only ship five motion improvements, in order:

1. **Card press feedback** (scale + darken on touch) — highest frequency interaction, zero current feedback
2. **List entrance stagger** — the feed is the most-seen screen, stagger is the personality
3. **Sheet primitive** (draggable, spring-driven) — the filter drawer and invite flows desperately need this
4. **Page transitions** (View Transitions API on event card to detail) — the "this is polished" moment
5. **Chip scale pop on toggle** — high-frequency, near-zero implementation cost

Everything else is iteration on top of these five.

---

## Technical Dependencies

| Improvement | Requires |
|-------------|----------|
| Card press, chip pop | CSS only — no library needed |
| List stagger | CSS @keyframes + JS index-based delay — no library needed |
| Sheet primitive | `framer-motion` or `motion` (Motiondivision's lightweight fork) for spring physics + gesture |
| Page transitions | View Transitions API (native) or `next-view-transitions` package |
| Haptics | Native Vibration API — no library needed |
| Spring-based interactions | `framer-motion` recommended — covers sheets, gestures, springs, and layout animations |

**Recommendation:** Install `framer-motion` (or its lighter fork `motion`). It's the standard for React animation in 2026, it handles springs and gestures, and it'll unblock sheet behavior, card press springs, and gesture-driven interactions in one dependency.

---

## Appendix: Animation Usage Inventory (Current State)

| Pattern | Count | Notes |
|---------|-------|-------|
| `transition-colors` | ~140 | Hover state fades. The only motion most elements have. |
| `transition-all` | ~30 | Overly broad — animates everything including layout properties. |
| `transition-opacity` | ~10 | Used on avatar stacks and social elements. |
| `animate-pulse` | ~15 | Skeleton loading states. |
| `animate-spin` | ~12 | Loading spinners. |
| `animate-slide-up` | 1 | Toast entrance. The only custom keyframe animation. |
| Dialog enter/exit | 1 | CSS transition, 200ms, translate + scale + opacity. |
| Spring animations | 0 | Spec defines 5 configs. None implemented. |
| Stagger reveals | 0 | Spec defines 5 intervals. None implemented. |
| Gesture handling | 0 | No swipe, drag, pull-to-refresh, or long-press. |
| Page transitions | 0 | No cross-fade, slide, or shared element. |
| Haptic feedback | 0 | No vibration API calls. |
| Scroll-driven animation | 0 | Sticky header exists but no visual progression. |

---

*This audit is a snapshot. The spec is good. The gap is implementation. Ship the press feedback and stagger first — they're CSS-only and will immediately change how the app feels under a thumb.*
