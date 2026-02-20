# UI System

You are working on the user interface: components, styling, layout, or responsive design.

## Lark Visual Direction

The UI follows the Lark brand identity: **monochrome canvas + warm engagement layer**. Read `notes/specs/ux-revamp-audit.md` (Resolution section) and `notes/design/ui-reference.md` (Lark Visual Direction section) for full rationale.

### CTA Hierarchy (Three Tiers)

| Tier | Color | Token | When |
|------|-------|-------|------|
| **Structural** | Dark `#171717` | `--action-primary` | Buy Tickets, Done, Close, Get Started |
| **Engagement** | Warm gold `#B45309` | `--action-engage` | Start Plan, Invite, active filter chips, Friends filter |
| **Signal** | Green/Amber/Red | `--signal-*` | Going badge, Interested badge — **never a CTA** |

**Green is NEVER an action color.** It is a state indicator only (Going, Confirmed). If you're about to make something green and clickable, use `--action-engage` (warm gold) for social actions or `--action-primary` (dark) for structural actions.

### De-SaaS Cards

- **Mobile:** No `shadow-sm`. Whitespace + `border-b border-[var(--border-default)]` between cards.
- **Desktop:** `border border-transparent hover:border-[var(--border-default)]` — borders on hover only.
- Shadows are SaaS. Whitespace and borders are editorial.

### Unified Badges

All status markers (NEW, PRESALE, SOLD OUT) use one treatment: `font-semibold uppercase tracking-wide text-[10px]`, monochrome. Category badges keep subtle color tint but match sizing.

## Design Tokens (Source of Truth: `src/app/globals.css`)

```css
/* SURFACES */
--surface-bg: #FAFAFA;              /* page background */
--surface-card: #FFFFFF;            /* card / elevated */
--surface-inset: #F5F5F5;           /* recessed areas, input backgrounds */

/* TEXT */
--text-primary: #171717;            /* headlines, body */
--text-secondary: #525252;          /* supporting text */
--text-muted: #A3A3A3;             /* hints, placeholders */

/* BORDERS */
--border-default: #E5E5E5;          /* card borders, dividers */
--border-strong: #D4D4D4;           /* hover borders, emphasis */

/* ACTION — structural (dark) */
--action-primary: #171717;          /* Buy Tickets, Done, Close, Get Started */
--action-primary-hover: #404040;
--action-primary-text: #FFFFFF;

/* ACTION — engagement (warm gold) */
--action-engage: #B45309;            /* Start Plan, Invite, active chips */
--action-engage-hover: #92400E;
--action-engage-text: #FFFFFF;
--action-engage-light: #FFFBEB;      /* warm glow for active chip backgrounds */

/* SIGNALS — state only, never CTAs */
--signal-going: #16A34A;            /* Going badge */
--signal-going-light: #DCFCE7;      /* Going background tint */
--signal-interested: #F59E0B;       /* Interested badge */
--signal-interested-light: #FEF3C7; /* Interested background tint */
--signal-danger: #DC2626;           /* errors, Leave Plan */
--signal-danger-hover: #B91C1C;
--signal-info: #3B82F6;             /* links, informational */

/* LEGACY ALIASES (prefer new tokens; remove when zero references) */
--brand-primary → --signal-going
--brand-primary-light → --signal-going-light
--brand-border → --border-default
```

**Utility classes:** `.btn-primary` (dark), `.btn-engage` (warm gold), `.btn-going` (green state), `.btn-danger` (red).

## Motion & Transitions

The UI should feel alive but never distracting. Motion communicates state changes — it doesn't decorate.

### Motion Philosophy

- **Fast and purposeful.** 150ms for hovers, 250ms for reveals. Nothing lingers.
- **Decelerate into position.** Elements arrive fast and settle — never linear, never bounce excessively.
- **Earn every animation.** If it doesn't help the user understand a state change, don't animate it.
- **Respect the user.** `prefers-reduced-motion` disables all animation (already in globals.css).

### Easing Curves (from `globals.css`)

| Token | Curve | When |
|-------|-------|------|
| `--ease-smooth` | `cubic-bezier(0.4, 0, 0.2, 1)` | **Default.** Hover color shifts, fades, opacity changes |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Slides, reveals, toasts — snappy deceleration |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Chip toggles, popovers, scale pops — slight overshoot |

### Duration Tokens

| Token | Value | When |
|-------|-------|------|
| `--duration-fast` | `150ms` | Hover states, color changes, micro-interactions |
| `--duration-normal` | `250ms` | Toast entrances, content reveals, chip state changes |
| `--duration-slow` | `400ms` | Page-level transitions, large layout shifts (rare) |

### Transition Patterns by Element Type

| Element | Transition | Duration | Easing | Example |
|---------|-----------|----------|--------|---------|
| **Buttons** | `transition-colors` | `--duration-fast` | default | All `Button`, `IconButton` |
| **Chips/Filters** | `transition-all` | `--duration-fast` | default | Active state: color + border |
| **Cards (desktop)** | `transition-colors` | `--duration-fast` | default | Border reveal on hover |
| **Links** | `transition-colors` | `--duration-fast` | default | Text color shift |
| **Toasts** | `@keyframes slide-up` | `--duration-normal` | `--ease-out-expo` | Enter from bottom |
| **Modals/Dialogs** | `animate-in fade-in` | `--duration-normal` | `--ease-out-expo` | Fade + scale |
| **Loading spinners** | `animate-spin` | — | linear | Continuous rotation |
| **Skeleton loaders** | `animate-pulse` | — | default | Content placeholders |
| **Icon micro-motion** | `transition-transform` | `--duration-fast` | default | Arrow shift on group-hover |

### Rules

1. **`transition-colors` is the default.** Use it unless you're animating size, position, or opacity.
2. **`transition-all` is for cards only** — when shadow + border + color change together.
3. **Never animate layout properties** (`width`, `height`, `top`, `left`) — use `transform` instead.
4. **No delays** (`delay-*`) on hover states — interaction feedback must be instant.
5. **Loading states use `animate-spin`** (small spinners) or `animate-pulse` (skeleton screens).
6. **Group hovers** (`group-hover:`) only for icon micro-motion (arrow slides, chevron shifts).

### Hover States by Component

| Component | Hover Behavior |
|-----------|----------------|
| **Button (primary)** | `bg → --action-primary-hover` (darker) |
| **Button (secondary)** | `bg → --action-secondary-hover` + `border → --border-strong` |
| **Button (ghost)** | `text → --text-primary` + `bg → --surface-inset` |
| **Button (engage)** | `bg → --action-engage-hover` (deeper gold) |
| **Chip (inactive)** | `border → --border-strong` + `bg → --surface-inset` |
| **Chip (active engage)** | Already warm gold — slightly deeper on hover |
| **Card (desktop)** | `border → --border-default` (reveal from transparent) |
| **Card (mobile)** | No hover effect — touch targets, not pointer |
| **Link (text)** | `text → --text-primary` + underline |
| **Link (avatar/image)** | `opacity → 0.8` |
| **IconButton** | `text → --text-primary` + `bg → --surface-inset` (ghost) |
| **FriendAvatar** | `scale → 1.1` (subtle pop) |

## Typography Scale

Geist Sans. Clean, readable, no decorative fonts. The type does the work.

### Hierarchy

| Level | Size | Weight | Tracking | Use |
|-------|------|--------|----------|-----|
| **Page title** | `text-2xl` | `font-bold` | default | Page headers, hero headings |
| **Section title** | `text-lg` | `font-semibold` | default | Card titles, modal headers |
| **Body** | `text-base` | regular | default | Descriptions, long-form content |
| **UI label** | `text-sm` | `font-medium` | default | Button labels, form labels, chips, secondary headers |
| **Caption** | `text-xs` | `font-medium` | default | Timestamps, metadata, helper text |
| **Micro label** | `text-[10px]` | `font-semibold` | `tracking-wide` | Uppercase badges (NEW, PRESALE, SOLD OUT) |
| **Section marker** | `text-xs uppercase` | `font-semibold` | `tracking-wider` | Section dividers, group headers |

### Rules

- **`font-medium` for interactions** — buttons, chips, links, form labels
- **`font-semibold` for local hierarchy** — card titles, section headers, badge text
- **`font-bold` for page-level emphasis** — page titles, brand headers only
- **`leading-snug` for multi-line headings** — event titles that wrap to 2 lines
- **`leading-relaxed` for body copy** — descriptions, about sections, long text
- **No `text-xl`** — jump from `text-lg` to `text-2xl` keeps the hierarchy clean
- **`line-clamp-2`** for event titles, `line-clamp-3` for descriptions — truncate, don't overflow

## Shared Primitives (`src/components/ui/`)

| Component | Variants | Usage |
|-----------|----------|-------|
| `Button` | primary, secondary, ghost, danger | Sizes: xs, sm, md, lg. Supports `loading` prop |
| `Badge` | count, status, label | Colors: default, primary, danger, warning, info, success |
| `StatusBadge` | GOING, INTERESTED, NEED_TICKETS, HAVE_TICKETS | User event attendance display |
| `Chip` | toggle, tag, status, info | Sizes: xs, sm, md. Supports `active` state + `onRemove` |
| `Toast` | success, info, error | Via `useToast()` context. Single toast at a time, 8s default |
| `Dialog` | — | Compound component: Dialog, DialogContent, DialogHeader, DialogTitle |
| `FriendAvatarStack` | sm, md | Overlapping avatars (max 3 visible), "+N" overflow |

Check these exist before creating new UI primitives. Prefer extending over duplicating.

## Brand Components (`src/components/brand/`)

- `RyesVPLogo` — SVG square logo (R, Y-checkmark, P)
- `RyesVPWordmark` — Text "RyesVP" with colored Y and V
- `RyesVPBrand` — Combined logo + wordmark for header

## Avatar System (`src/lib/avatar.ts`)

- `getAvatarStyle(userId)` — Deterministic gradient background from user ID hash (12 gradient pairs)
- `getInitials(displayName, email)` — 1-2 character initials
- `getDisplayName(displayName, email)` — Falls back to email username

## Toast Notifications

```typescript
const { showToast } = useToast();
showToast({
  message: 'Plan created!',
  type: 'success',
  action: { label: 'View', onClick: () => router.push(`/squads/${id}`) },
});
```

- Wrap app in `ToastProvider` (already done in layout)
- Single toast at a time (last wins)
- 8s auto-dismiss (configurable via `duration`)
- Fixed bottom-4 on mobile, centered on desktop

## Composition Pattern

```
Primitives (Button, Badge, Chip, Toast, Dialog)
    ↓
Components (EventCard, SocialEventCard, FriendsAndStatusCard, SquadMemberList)
    ↓
Sections (SocialSectionA/B, PlanModeView, DayOfModeView)
    ↓
Pages (HomePageContent, SquadPage, UserProfileContent)
```

Build from existing primitives. Create new primitives only when a pattern repeats 3+ times.

## Responsive Patterns (Mobile-First)

```
Padding:     p-4 sm:p-5 sm:p-6
Images:      w-16 h-16 sm:w-20 sm:h-20
Typography:  text-sm sm:text-base
Grid:        grid grid-cols-1 sm:grid-cols-2
Sidebar:     hidden lg:block lg:w-80
Dropdowns:   fixed sm:absolute top-14 sm:top-auto
Content:     max-w-6xl mx-auto (page width)
Squad page:  max-w-lg mx-auto px-4 py-6
```

Always design mobile-first. Desktop is the enhancement.

## Design Rules

- No decorative emojis — use SVG icons
- Title Case for button CTAs ("Start Plan", "Add Friend")
- Sentence case for headers ("Your events", "Friends going")
- **Warm gold for social actions** (Start Plan, Invite, active chips) — `--action-engage`
- **Dark for structural actions** (Buy, Done, Close, Get Started) — `--action-primary`
- **Green for state only** (Going badge, Confirmed status) — never a CTA
- **No shadows on cards** — whitespace separators on mobile, hover borders on desktop
- Optimistic updates — UI responds immediately before API confirms
- Sticky header with z-50, border using `var(--border-default)`
- Input focus ring: `focus:ring-[var(--action-engage)]` (warm gold, not green)

## Key Files

| File | Purpose |
|------|---------|
| `src/app/globals.css` | Design tokens, utility classes, animations |
| `src/components/ui/*.tsx` | Shared primitives |
| `src/components/brand/*.tsx` | Logo, wordmark |
| `src/lib/avatar.ts` | Avatar colors + initials |
| `src/contexts/ToastContext.tsx` | Toast provider + hook |
| `notes/design/ui-reference.md` | Full design system documentation |
| `notes/specs/ux-revamp-spec.md` | UX revamp spec with increment details |
| `notes/specs/ux-revamp-audit.md` | Design audit with Lark Visual Identity resolution |
