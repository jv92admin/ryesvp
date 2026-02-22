# Component Builder Audit

**Date:** 2026-02-22
**Auditor:** Component Builder Agent
**Branch:** `revamp/ux-architecture`

---

## Executive Summary

The codebase is in a state of deep identity crisis. The Lark design system spec describes a monochrome, dark-mode-first, nighttime aesthetic. The actual codebase is a light-mode app drowning in warm golds, greens, ambers, blues, purples, and pinks. Not a single component has been migrated to the Lark token system. The design system document exists as aspirational fiction -- the code implements the old RyesVP identity in its entirety.

The migration debt is not "some cleanup." It is a full visual rewrite of every component in the application.

---

## Architecture Assessment

### Component Hierarchy

The spec calls for: `Primitives -> Components -> Sections -> Pages`

What actually exists:

```
src/components/
  ui/              # 10 primitives (partially token-aware, wrong tokens)
  brand/           # 1 file (RyesVPLogo.tsx -- still the old brand)
  discovery/       # 6 filter-related components (functional, decent separation)
  squad/           # 11 squad/plan components (large, monolithic)
  [43 flat files]  # Everything else, no further organization
```

**The hierarchy is flat, not layered.** There is no `patterns/` or `sections/` directory. Components like `EventCard`, `SocialProofCard`, `EventPlanPanel`, `EventHero`, and `EventActionBar` are all siblings in a flat `src/components/` directory alongside modals, banners, tips, and utility components. Finding related components requires reading imports, not scanning directory structure.

**Assessment:** The directory structure communicates nothing about component relationships. A new developer would have no idea that `EventCardActions` is a child of `EventCard`, or that `SmartSquadButton` is a child of `EventCardActions`, without tracing imports.

### Components That Should Be Split

1. **`EventCard.tsx` (320 lines):** Contains inline SVG icon definitions (70+ lines of category icons), presale parsing logic (`getPresaleInfo` function), and rendering. The presale logic and category icons should be extracted.

2. **`EventPlanPanel.tsx` (541 lines):** This is a God component. It handles: data fetching, status controls, ticket controls, member list with avatars, meetup editing with form state, share functionality, leave plan, and invite modal triggering. It has 10 pieces of local state. This should be 4-5 smaller components.

3. **`EventHero.tsx` (266 lines):** Handles two completely different layouts (with image vs. without image) plus attendance toggle logic with API calls. The attendance logic duplicates what `EventCardActions` does.

### Components That Should Be Merged

1. **`StartPlanButton` and `SmartSquadButton`:** Both render a "Start Plan" / "View Plan" button with modal triggering. `SmartSquadButton` has a `variant` prop; `StartPlanButton` has a `variant` prop. They are parallel implementations of the same concept.

2. **`StatusBadge` (in `ui/StatusBadge.tsx`) and the StatusBadge export from `ui/Badge.tsx`:** Two separate components with the same name solving different problems. The `ui/StatusBadge.tsx` handles user event status (GOING, INTERESTED). The `Badge.tsx` exports a `StatusBadge` for event meta-status (NEW, PRESALE, SOLD OUT). This naming collision is a bug waiting to happen.

3. **`ShareButton` and `ShareIconButton`:** Two share components that likely duplicate share logic.

### Components That Should Be Deleted

1. **`RyesVPLogo.tsx`:** The design system says this is dead. The wordmark already renders "Lark" but the SVG logo is still the old RYVP grid with green checkmark. The aria-label says "Lark Logo" on an SVG that draws R, Y, V, P.

2. **`EventSocialSection.tsx`:** Uses hardcoded Tailwind colors everywhere (`bg-green-50`, `text-green-600`, `bg-amber-50`, `text-amber-600`, `text-gray-500`, `text-gray-900`). Zero token usage. Also uses emoji icons (`"Friends"`, `"Community Name"`). This component is a pre-design-system artifact.

3. **`SocialEngagementPanel.tsx`:** References `brand-primary` tokens 4 times. Likely superseded by newer components.

### Unnecessary Abstraction

The `ToggleChip` and `TagChip` wrapper components in `ui/Chip.tsx` are thin enough to be props on `Chip` itself. They add indirection without meaningful encapsulation.

### Not Enough Abstraction

1. **Avatar rendering is duplicated everywhere.** `EventPlanPanel`, `EventSocialSection`, `FriendAvatarStack`, `PeopleList`, `SquadMemberList` all manually call `getAvatarStyle()`, `getInitials()`, render a div with rounded-full, and set inline gradient styles. There is no `<Avatar>` primitive component.

2. **Attendance toggle buttons are duplicated.** `EventHero` (lines 234-256), `EventCardActions` (lines 62-106), and `EventPlanPanel` (lines 265-291) all implement their own attendance/status toggle buttons with slightly different styling. No shared `AttendanceChipRow` or `StatusChipRow` pattern component.

3. **Section headers are ad-hoc.** `EventPlanPanel` manually renders `<h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">` in three places. `PlansStrip` renders a similar header. There is no `<SectionHeader>` component despite the design system specifying one.

4. **Inline SVG icons are everywhere.** Every component defines its own SVGs. `EventCard` has 70+ lines of icon definitions. `EventPlanPanel` has inline SVGs for location, clock, close, and ticket icons. There is no icon component or icon library integration (the design system recommends Lucide).

---

## Design System Compliance

### The Gap Between Spec and Code

**The gap is total.** The Lark design system spec describes a dark-mode monochrome app. The actual codebase is a light-mode app with a warm color palette. Here is the honest state:

| Design System Says | Code Actually Does |
|---|---|
| `--bg-primary: #0A0A0A` (dark canvas) | `bg-gray-50`, `bg-white` everywhere |
| `--bg-elevated: #141414` (dark cards) | `bg-white` cards with `bg-[var(--surface-card)]` = `#FFFFFF` |
| `--accent: #E8E8E8` (near-white) | `--action-engage: #B45309` (warm gold) for primary CTAs |
| No shadows | `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl` across 26 components |
| Monochrome category tags | `text-purple-700`, `text-amber-700`, `text-pink-700`, `text-red-700`, `text-blue-700` in `categoryColors.ts` |
| Status chips are monochrome | `--signal-going: #16A34A` (green), `--signal-interested: #F59E0B` (amber) |
| "No colorful avatar rings" | `getAvatarStyle()` returns gradients from 12 pairs of vivid colors (rose, orange, lime, emerald, cyan, indigo, violet, fuchsia, red, green, teal) |
| Event imagery is the only color | Category tags, status chips, attendance buttons, friend avatars, presale indicators, and community badges all use color |

**The Lark design tokens do not exist in `globals.css`.** The file defines `--surface-bg`, `--surface-card`, `--surface-inset` (the OLD tokens), not `--bg-primary`, `--bg-elevated`, `--bg-surface` (the NEW tokens). The new token system from the design spec has never been implemented.

### Migration Grep Results

These are the actual violation counts from running the grep targets specified in `/ui-system`:

| Grep Target | Expected | Actual | Files Affected |
|---|---|---|---|
| `action-engage\|action-primary\|signal-going\|signal-interested\|signal-info` | 0 | **134** | 35 files |
| `surface-bg\|surface-card\|surface-inset` | 0 | **85** | 33 files |
| `brand-primary\|brand-border` | 0 | **90** | 30 files |
| `border-default\|border-strong` | 0 | **95** | 36 files |
| `shadow-sm\|shadow-md\|shadow-lg\|shadow-xl\|boxShadow` | 0 | **46** | 26 files |
| `btn-engage\|btn-going` (old utility classes) | 0 | **4** | 1 file (globals.css) |
| Hardcoded hex colors in components | 0 | **10** | 1 file (RyesVPLogo.tsx) |
| Tailwind `bg-{color}-{shade}` in components | 0 | **166** | 45 files |
| Tailwind `text-{color}-{shade}` in components | 0 | **423** | 53 files |
| Tailwind `border-{color}-{shade}` in components | 0 | **122** | 39 files |

**Total old-system violations: ~1,165+ across 53+ files.**

The migration has not started. The token system in `globals.css` still defines the old RyesVP values. The `@theme inline` block still exposes old tokens to Tailwind. The `.btn-going` and `.btn-engage` utility classes are still defined and should have been removed.

### Specific Token Violations in Primitives

The UI primitives (the components that should be the FIRST line of defense) are themselves violators:

**`ui/Button.tsx`:**
- Uses `--action-primary`, `--action-primary-text`, `--action-primary-hover` (old tokens, 3 occurrences)
- Uses `--action-engage`, `--action-engage-text`, `--action-engage-hover` (old tokens, 3 occurrences)
- Uses `--signal-going`, `--signal-going-hover` (old tokens, 2 occurrences)
- Uses `--border-default`, `--border-strong`, `--surface-inset` (old tokens, 4+ occurrences)
- Has `signal` and `engage` variant types that should not exist under the new system

**`ui/Chip.tsx`:**
- Uses `--action-engage`, `--action-engage-light`, `--signal-going-light`, `--signal-going` (old tokens)
- Has `primary`, `accent`, `category`, `warning`, `success` color types -- the design system only allows `default` and `selected`
- Uses 9 Tailwind `bg-{color}-{shade}` classes and 5 `text-{color}-{shade}` classes
- Uses `bg-white` (hardcoded light-mode color)

**`ui/Badge.tsx`:**
- Uses `--brand-primary-light`, `--brand-primary` (legacy aliases marked for deletion)
- Has 6 color variants (`default`, `primary`, `danger`, `warning`, `info`, `success`) -- the design system says monochrome only

**`ui/StatusBadge.tsx`:**
- Uses `--signal-going-light`, `--signal-going`, `--signal-interested-light`, `--signal-interested`, `--signal-info` (old tokens)
- Uses emoji icons (`"Need Tickets"`, `"Have Tickets"`) -- design system prohibits decorative emoji

**`ui/Toast.tsx`:**
- Uses `--brand-primary`, `--brand-primary-light`, `--brand-primary-hover` (legacy aliases)
- Uses `bg-gray-50`, `bg-red-50`, `bg-gray-700`, `bg-red-600` (Tailwind colors)
- Uses `shadow-lg` -- design system says no shadows

**`ui/dialog.tsx`:**
- Uses `--surface-card`, `--border-default`, `--surface-inset` (old tokens)
- Uses `shadow-xl` -- design system says no shadows

**`ui/FriendAvatarStack.tsx`:**
- Uses `border-2 border-white` (hardcoded white, should be `--bg-elevated`)
- Uses `shadow-sm` (design system says no shadows)
- Uses `bg-gray-200`, `text-gray-600` (Tailwind colors)
- Calls `getAvatarStyle()` which returns colorful gradients (should be monochrome)

**`ui/IconButton.tsx`:**
- Uses `--surface-card`, `--surface-inset`, `--border-default`, `--border-strong` (old tokens)
- Uses `--action-primary`, `--action-primary-text`, `--action-primary-hover` (old tokens)

**`ui/Input.tsx`:**
- Uses `--surface-card`, `--border-default`, `--signal-danger`, `--action-primary` (old tokens)

**`ui/PeopleList.tsx`:**
- Uses `--surface-inset` (old token)
- Calls `getAvatarStyle()` which returns colorful gradients

**Conclusion: Every single UI primitive uses old tokens.** The design system enforcement layer is itself unenforceable.

---

## Component Quality

### Well-Built Components

1. **`ui/dialog.tsx`:** Despite using old tokens, the architecture is solid. Compound component pattern (Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogContent). Proper focus trap, scroll lock, escape key handling, mount/unmount transitions. Good accessibility (role="dialog", aria-modal). This is the closest thing to a well-engineered component in the codebase.

2. **`discovery/FilterStrip.tsx`:** Clean separation of concerns. URL-driven state management. Good composition of child components. The filter logic is coherent and the component does one thing well.

3. **`discovery/SearchInput.tsx`:** Simple, focused, well-typed. Proper keyboard handling, URL sync, clear behavior. Good placeholder text from the brand language.

4. **`PlansStrip.tsx`:** Small, focused. Proper loading skeleton. Clean data fetching with cancellation.

### Messy Components

1. **`EventPlanPanel.tsx` (541 lines):** 10 pieces of local state (`squad`, `currentUserId`, `loading`, `showInvite`, `copying`, `updatingStatus`, `updatingTicket`, `editingMeetup`, `meetSpotDraft`, `meetTimeDraft`, `savingMeetup`, `removingMemberId`). Mixes data fetching, form management, share logic, member management, and rendering. Inline styles mixed with token references. This component needs to be decomposed.

2. **`EventCard.tsx` (320 lines):** 70+ lines of inline SVG icon definitions at the top of the file. A `getPresaleInfo` utility function living inside the component file. The actual card component is reasonable but is buried under infrastructure that belongs elsewhere.

3. **`EventHero.tsx` (266 lines):** Two completely different layout paths (image vs. no-image) with attendance toggle logic duplicated from `EventCardActions`. Uses 3 different old signal tokens for attendance buttons. Inline styles for pill buttons defined as string variables (`pill`, `pillOff`).

4. **`EventActionBar.tsx`:** Three states (A, B, C) that are essentially the same bar with different buttons. States B and C are identical code. The `primaryBtn` style is a giant string literal with old engagement tokens.

5. **`EventSocialSection.tsx`:** Zero token usage. All Tailwind color utilities. Emoji icons. Deeply nested loops with repeated avatar+link rendering patterns. This component looks like it was written before the token system existed and never touched again.

### Props and Typing

**Generally acceptable.** Components use TypeScript interfaces consistently. No `any` types found in the UI components. Prop interfaces are explicit.

**Problems:**

1. **Prop drilling in the event page.** The `EventPage` server component creates an `eventObj`, a `heroEvent`, `shareProps`, and passes various slices of data to 5+ child components. Each child re-derives what it needs. The event data is serialized/deserialized multiple times (`.toISOString()` calls in the page, then parsed back in children).

2. **The `event` prop shape is inconsistent.** `EventActionBar`, `SocialProofCard`, `SmartSquadButton`, and `SquadCreationModal` all accept an `event` prop with slightly different shapes (`{ id, title, startDateTime, venue: { name } }` vs the full `EventDisplay`). This forces the page to construct adapter objects.

3. **`className` prop inconsistency.** Some components accept `className` and merge it (Button, Chip, IconButton). Others use `className` with default values (`className = ''`). Some components don't accept `className` at all. No consistent pattern.

### Dead Code and Legacy Patterns

1. **`getAvatarGradient()` in `src/lib/avatar.ts`:** Marked as "Deprecated" and returns empty string. Dead code.

2. **`btn-going` and `btn-engage` utility classes in `globals.css`:** The ui-system doc says to kill these. They are still defined.

3. **Legacy aliases in `globals.css`:** 8 `--brand-*` aliases are defined and still referenced by 30 files. The comment says "keep during migration, remove when done" -- migration has not happened.

4. **`@theme inline` block in `globals.css`:** Exposes old tokens to Tailwind (`--color-action-engage`, `--color-signal-going`, etc.) plus legacy Tailwind aliases (`--color-brand-primary`, etc.). This entire block needs to be rewritten for Lark tokens.

5. **`signal` and `engage` button variants:** The Button component has variant types that map to old color semantics. Under the Lark system, there is no "signal" or "engage" tier.

6. **`badge.tsx` color variants:** `primary`, `danger`, `warning`, `info`, `success` color types all use old-system colors. Under Lark, badges are monochrome.

7. **`chip.tsx` color variants:** `primary`, `accent`, `category`, `warning`, `success` all use old warm-gold/green/amber/blue semantics. Under Lark, chips have exactly two states: default (outlined) and selected (filled `--accent`).

---

## What's Missing

### Components the Design System Specs But Nobody Has Built

| Component | Spec Location | Status |
|---|---|---|
| `LarkMark` / `LarkWordmark` / `LarkBrand` | ui-system.md, lark-design-system.md | Not built. `RyesVPLogo.tsx` still exists with old brand. The wordmark text says "Lark" but the SVG draws RYVP. |
| `Avatar` primitive | Component builder spec: `components/primitives/Avatar.tsx` | Not built. Avatar rendering is duplicated in 5+ components using raw `getAvatarStyle()` calls. |
| `Text` primitive | Component builder spec: `components/primitives/Text.tsx` with enforced type scale | Not built. Typography is ad-hoc Tailwind classes everywhere. |
| `SectionHeader` | Design system: `--type-micro`, uppercase, `--text-secondary` | Not built. Section headers are manually styled `<h3>` or `<span>` elements. |
| `StatusChipRow` | Component builder spec: "Going/Interested chips, or Yes/Maybe/No row" | Not built. Status toggle rows are hand-coded in 3 components. |
| `FilterBar` | Component builder spec | Partially built as `FilterStrip`, but not a reusable primitive. |
| `BottomSheet` | Component builder spec, design system elevation spec (Level 2 Sheet) | Not built. Dialog acts as a bottom sheet on mobile (rounded-t-2xl) but has no gesture support. |
| `Icon` wrapper | Component builder spec: "Wraps icon set, enforces sizes and colors" | Not built. Every component has inline SVGs with inconsistent sizing. |

### Patterns Repeated 3+ Times Without Abstraction

1. **Avatar circle with initials:** `getAvatarStyle(id)` + `getInitials(name, email)` + `<div className="w-N h-N rounded-full flex items-center justify-center text-white font-medium" style={...}>` -- appears in EventPlanPanel, EventSocialSection, FriendAvatarStack, PeopleList, SquadMemberList, and more. At least 8 instances.

2. **Status toggle button row (Yes/Maybe/No or Going/Interested):** Inline button groups with conditional active classes. Appears in EventHero, EventCardActions, EventPlanPanel. Each with different styling.

3. **Section header (uppercase micro label):** `<h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">` or similar. Appears 5+ times across EventPlanPanel, PlansStrip, SquadMemberList, etc.

4. **SVG icon inline definitions:** Close icon (X), location pin, clock, chevron-left, checkmark, star. Each defined inline as `<svg>` elements. Some components define the same icon multiple times.

5. **"Invite Friends" button with modal:** `<button onClick={() => setShowInvite(true)}>Invite Friends</button>` + `{showInvite && <SquadInviteModal ...>}` -- appears in EventPlanPanel, EventActionBar, and likely squad components.

### Responsive Gaps

1. **No testing evidence at 375px.** The ui-system.md says "Test at 375px (iPhone SE) during development." Components use `sm:` breakpoints but many have fixed pixel values that may overflow on small screens (e.g., `min-w-[200px]` plan cards, `min-w-[5.5rem]` buttons).

2. **EventActionBar fixed bottom bar:** Uses `bg-white/95 backdrop-blur-sm` which is a light-mode pattern. On dark mode (if implemented) this would need to change. Also, the safe-area-inset handling is good but the bar itself has no max-width constraint, potentially spanning full width on ultra-wide screens.

3. **EventCard layout:** The flex layout with 72px thumbnail + text works well on mobile but the `md:border md:hover:border` responsive border changes suggest desktop treatment was an afterthought.

4. **No `max-w-6xl` enforcement on EventCard list:** The HomePageContent uses `max-w-6xl` on the page wrapper, but cards within fill the full width of their container. On very wide screens, cards stretch too wide.

---

## What Would a Senior Engineer Change?

### Critical Path (Do First)

1. **Implement the actual Lark tokens in `globals.css`.** The new token system (`--bg-primary`, `--bg-elevated`, `--accent`, etc.) does not exist in the stylesheet. Everything downstream is blocked on this. This is 30 minutes of work that unlocks the entire migration.

2. **Build the `Avatar` primitive.** Avatar rendering is the most duplicated pattern in the codebase. One component, monochrome treatment per the design system, replaces 8+ inline implementations.

3. **Build the `Icon` system.** Install Lucide. Create an `Icon` component that enforces the three sizes (16/20/24px) and stroke width (1.5px). Replace hundreds of inline SVGs. This is high-effort but eliminates a massive source of inconsistency and reduces bundle size.

4. **Decompose `EventPlanPanel`.** Extract: `StatusChipRow`, `TicketChipRow`, `MemberList`, `MeetupSection`. The parent becomes a layout shell. This enables reuse and testing.

### High-Impact Refactoring

5. **Merge `StartPlanButton` and `SmartSquadButton`** into one `PlanButton` component with clear variants. The current split creates confusion about which to use.

6. **Create a `SectionHeader` component.** Replace 5+ manual implementations. Enforce the type scale (`--type-micro`, uppercase, `--text-secondary`).

7. **Organize the flat component directory.** Move components into subdirectories: `event/` (EventCard, EventHero, EventActionBar, EventCardActions, EventContentTabs, ExploreCard, AboutCard), `social/` (SocialProofCard, EventSocialSection, FriendCard, AddFriendCard), `plan/` (EventPlanPanel, PlansStrip, StartPlanButton, SmartSquadButton). The current 43-file flat directory is unnavigable.

8. **Standardize the event data prop.** Create one `EventSummary` type that all action components accept instead of each component defining its own inline `event: { id, title, startDateTime, venue }` shape.

### "Good Enough" But Not "Great"

- **`ui/dialog.tsx`:** The compound component pattern is correct, but the animations use `translate-y-4 sm:translate-y-0 sm:scale-95` which is a mixed desktop/mobile approach. The design system specifies specific easing curves for sheet open/close that are not used.

- **`FilterStrip.tsx`:** Functionally solid but uses old tokens. The chip color system (`primary` = warm gold) will need to change to the monochrome system.

- **`Toast.tsx`:** Good UX (auto-dismiss, action support) but visually wrong (light backgrounds, shadows, legacy token colors). The design system specifies `--bg-elevated` bg with `--border-subtle` border.

---

## Provocations

### Compound Components Are Underused

Only `Dialog` uses a compound component pattern (Dialog + DialogHeader + DialogTitle + DialogBody + DialogFooter). This pattern should be used for:

- **`EventCard`:** `EventCard.Root` + `EventCard.Image` + `EventCard.Content` + `EventCard.Actions` -- currently `EventCard` and `EventCardActions` are separate components with coupled logic.
- **`PlanPanel`:** `PlanPanel.Root` + `PlanPanel.StatusRow` + `PlanPanel.TicketRow` + `PlanPanel.MemberList` + `PlanPanel.MeetupSection` -- currently one monolithic component.
- **`ChipGroup`:** A container that manages selection state for a row of chips (single-select or multi-select), so individual chips do not need to manage their own toggle logic.

### The Styling Approach Is Correct But Undisciplined

Using Tailwind arbitrary values with CSS custom properties (`bg-[var(--bg-elevated)]`) is actually a good pattern. It keeps the design system in CSS (where it belongs), gives Tailwind its utility-class ergonomics, and avoids the runtime cost of CSS-in-JS.

**The problem is not the approach. The problem is discipline.** Components bypass the token system whenever convenient:
- `bg-white` instead of `bg-[var(--surface-card)]`
- `text-gray-500` instead of `text-[var(--text-muted)]`
- `border-gray-200` instead of `border-[var(--border-default)]`
- `bg-green-50` instead of `bg-[var(--signal-going-light)]`

If the team chose the approach, they need to commit to it. Every Tailwind color utility (`bg-{color}-{shade}`, `text-{color}-{shade}`, `border-{color}-{shade}`) in a component file is a bug. There are currently **711** such violations across 53 files.

A possible enforcement mechanism: a custom ESLint rule (or a simple grep in CI) that flags any Tailwind color utility in `src/components/`. It takes 20 minutes to set up and prevents regression permanently.

### Patterns From Best-in-Class React Codebases

1. **Radix UI primitives pattern:** Unstyled, composable primitives (ToggleGroup, RadioGroup, Select) that handle accessibility and state, with styling applied via Tailwind. The `Chip` component tries to do too much (toggle state, remove behavior, icon rendering, coming-soon state, 6 color variants). A `ToggleGroup` primitive from Radix would eliminate the `StatusChipRow` abstraction gap.

2. **CVA (Class Variance Authority):** Replace the `Record<Variant, string>` pattern in Button, Chip, Badge with CVA. It provides type-safe variant composition, handles compound variants cleanly, and integrates with Tailwind. The current approach (hand-rolled variant maps joined with `.join(' ')`) works but does not scale when you need compound variants (e.g., `variant=primary` + `size=sm` + `loading=true`).

3. **Slot pattern (Radix `asChild`):** The `Button` component forces a `<button>` element. When you need a link that looks like a button (e.g., "Sign In to Plan" in EventActionBar), you end up with `<Link className={primaryBtn}>` duplicating the button styles as a string literal. A `Slot` pattern lets `<Button asChild><Link href="/login">Sign In</Link></Button>` work naturally.

4. **Data loading patterns:** `EventPlanPanel` fetches data in a `useEffect` with manual loading state. Modern Next.js patterns (React Server Components + Suspense) or React Query / SWR would eliminate the manual loading/error state management. Since the squad page already uses server components for initial data, the plan panel could receive its data as a prop from the server component rather than client-fetching.

### The Biggest Unasked Question

**Should the migration happen all at once or incrementally?**

The ui-system.md describes a gradual migration ("Both may exist during migration"). But with 1,165+ violations across 53 files, an incremental migration means every feature built during the transition will need to be touched twice. The codebase is small enough (53 component files) that a focused migration sprint (2-3 days) would be more efficient than months of partial updates.

The alternative is to accept that the Lark design system is not yet implemented and stop pretending it is. Update the documentation to reflect reality, pick a migration date, and do it as a dedicated effort rather than accreting technical debt in every feature PR.

---

## Summary Scoreboard

| Dimension | Score | Notes |
|---|---|---|
| Directory structure | 3/10 | Flat, no layering, no discoverability |
| Token compliance | 0/10 | Zero Lark tokens implemented. Old system everywhere. |
| Component reuse | 4/10 | Some good primitives (Dialog, Chip) but massive duplication in avatars, status rows, icons |
| Prop design | 5/10 | Types are clean but prop shapes are inconsistent across similar components |
| Code organization | 4/10 | Some good patterns (discovery/, squad/) but mostly flat file soup |
| Accessibility | 5/10 | Dialog has proper a11y. Button has proper a11y. But attendance buttons have no aria labels, EventCard actions have no screen reader context. |
| Responsive | 5/10 | Mobile-first breakpoints exist. But no evidence of 375px testing. |
| Motion | 3/10 | Toast animation works. Dialog transitions work. Nothing else uses the motion tokens from the design system. |
| Dead code | 3/10 | Legacy aliases, deprecated functions, old utility classes, old brand components |
| Overall | 3.5/10 | Functional but visually disconnected from the stated design system |

---

*This audit is intentionally harsh. The codebase works -- it ships, it serves users, the features are functional. But the gap between the design system vision and the implementation reality is a full rewrite's worth of work. Acknowledging that gap honestly is the first step toward closing it.*
