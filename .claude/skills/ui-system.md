# UI System

You are working on the user interface: components, styling, layout, or responsive design.

## Design Authority

**You do not make design decisions.** The design system is the source of truth for all visual choices — colors, spacing, typography, elevation, motion, component specs. The agent pipeline enforces it.

| Source of Truth | What It Decides | Owner |
|----------------|----------------|-------|
| `/lark-design-system` skill | All tokens, component specs, visual rules, elevation, imagery | design-director agent |
| `/ux-comms` skill | All user-facing copy, voice, product vocabulary | design-director agent |
| `.claude/agents/motion-choreographer.md` | All animation, gestures, haptics, spring configs | motion-choreographer agent |

**Invoke `/lark-design-system` before writing any visual code. This is not optional.**

If you encounter a visual decision that isn't covered by the design system (a new component, an edge case, a state that doesn't have a spec), **stop and flag it** to the design-director agent. Do not invent tokens, colors, spacing values, or animation timing. Consistency requires centralized specification.

### The One Rule

**The UI is monochrome. Event imagery is the only color.**

The only non-monochrome element in the entire app is `--status-need-ticket` (`#FF4444`) for the "Need Ticket" alert state. Everything else — category tags, status chips, navigation highlights, icons, badges — is grayscale. Event posters and venue photos provide all the color. If you're about to add a colored element to the UI chrome, you're wrong.

## Token Migration

The codebase is migrating from the old RyesVP token system to Lark's monochrome dark-mode tokens. Both may exist in `src/app/globals.css` during migration. **Always use new tokens. Never reference old tokens in new code.**

### Old → New Token Map

| Old Token (Kill) | New Token (Use) | Notes |
|-------------------|-----------------|-------|
| `--surface-bg: #FAFAFA` | `--bg-primary: #0A0A0A` | Light → dark canvas |
| `--surface-card: #FFFFFF` | `--bg-elevated: #141414` | White cards → dark cards |
| `--surface-inset: #F5F5F5` | `--bg-surface: #1E1E1E` | Inputs, recessed areas |
| `--border-default: #E5E5E5` | `--border-subtle: #2A2A2A` | Default dividers |
| `--border-strong: #D4D4D4` | `--border-visible: #3A3A3A` | Emphasis borders |
| `--text-primary: #171717` | `--text-primary: #F5F5F5` | Dark text → light text |
| `--text-secondary: #525252` | `--text-secondary: #A0A0A0` | |
| `--text-muted: #A3A3A3` | `--text-muted: #666666` | |
| `--action-primary: #171717` | `--accent: #E8E8E8` | Primary interactive → near-white |
| `--action-primary-hover: #404040` | `--accent-hover: #FFFFFF` | |
| `--action-engage: #B45309` | `--accent: #E8E8E8` | Warm gold → monochrome accent |
| `--action-engage-hover: #92400E` | `--accent-hover: #FFFFFF` | |
| `--action-engage-light: #FFFBEB` | *(removed)* | No warm glow in monochrome system |
| `--signal-going: #16A34A` | `--accent: #E8E8E8` | Green "Going" → monochrome |
| `--signal-going-light: #DCFCE7` | *(removed)* | No colored tints |
| `--signal-interested: #F59E0B` | `transparent` + `--border-visible` | Amber → outlined chip |
| `--signal-interested-light: #FEF3C7` | *(removed)* | |
| `--signal-danger: #DC2626` | `--status-need-ticket: #FF4444` | Only red in the app |
| `--signal-info: #3B82F6` | *(removed)* | No blue in monochrome system |
| `--brand-primary` | *(removed)* | Legacy alias — delete |
| `--brand-primary-light` | *(removed)* | Legacy alias — delete |
| `--brand-border` | *(removed)* | Legacy alias — delete |

### CTA Hierarchy (Simplified)

The old system had three tiers (structural dark, engagement gold, signal colors). The new system has two:

| Tier | Token | Appearance | When |
|------|-------|-----------|------|
| **Primary** | `--accent` | Near-white filled (`#E8E8E8` bg, `#0A0A0A` text) | Start Plan, Invite Friends, Going, Buy Tickets, Done |
| **Secondary** | `--bg-surface` + `--border-subtle` | Dark outlined | Maybe, Interested, secondary actions, filter chips |

**There is no engagement color.** The old warm gold tier is gone. All actions are monochrome. The visual hierarchy comes from filled vs. outlined, not from color.

### Migration Grep Targets

Run these to find old tokens that need updating:

```bash
# Old color tokens (all should be zero matches when migration is complete)
grep -rn "action-engage\|action-primary\|signal-going\|signal-interested\|signal-info" src/
grep -rn "surface-bg\|surface-card\|surface-inset" src/
grep -rn "brand-primary\|brand-border" src/
grep -rn "border-default\|border-strong" src/

# Hardcoded colors (should always be zero — use tokens)
grep -rn "#B45309\|#92400E\|#16A34A\|#F59E0B\|#3B82F6\|#FAFAFA\|#FFFFFF\|#171717\|#525252\|#E5E5E5" src/components/

# Shadows (should be zero — Lark uses surface color stepping)
grep -rn "shadow-sm\|shadow-md\|shadow-lg\|shadowColor\|shadowOffset\|boxShadow" src/components/

# Old utility classes
grep -rn "btn-engage\|btn-going" src/
```

## Implementation Patterns

These are codebase-specific conventions for *how* to implement the design system. The design system says *what*; this section says *how in this repo*.

### Design Tokens Live in `src/app/globals.css`

All tokens defined as CSS custom properties on `:root`. Components reference tokens via `var()` in Tailwind arbitrary values or direct CSS. Never import token values as JS constants.

```css
/* In globals.css — source of truth */
:root {
  --bg-primary: #0A0A0A;
  --bg-elevated: #141414;
  --bg-surface: #1E1E1E;
  --bg-hover: #2A2A2A;
  --border-subtle: #2A2A2A;
  --border-visible: #3A3A3A;
  --text-primary: #F5F5F5;
  --text-secondary: #A0A0A0;
  --text-muted: #666666;
  --text-inverse: #0A0A0A;
  --accent: #E8E8E8;
  --accent-hover: #FFFFFF;
  --status-need-ticket: #FF4444;
  --card-radius: 12px;
  --chip-radius: 20px;
  --image-radius: 8px;
  --screen-padding: 20px;
  --card-padding: 16px;
}
```

```tsx
// In components — always reference tokens
<div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--card-radius)]">
```

### Easing Curves in `globals.css`

```css
:root {
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);      /* Default. Color shifts, fades */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);    /* Slides, reveals, toasts */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* Chip toggles, scale pops */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
}
```

Motion specs (what uses which curve, stagger intervals, spring configs) are owned by the motion-choreographer agent (`.claude/agents/motion-choreographer.md`). Full timing tables live in `/lark-design-system`.

### Tailwind Conventions

```tsx
// CORRECT — token references
className="bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border-subtle)]"

// WRONG — hardcoded values
className="bg-[#141414] text-[#F5F5F5] border-[#2A2A2A]"

// WRONG — old Tailwind color utilities (these bypass the token system)
className="bg-neutral-900 text-neutral-100 border-neutral-800"
```

**No Tailwind color utilities** (`bg-red-500`, `text-green-600`, `border-amber-300`, etc.) in components. All colors come through CSS custom properties. The only exceptions are Tailwind structural utilities (`rounded-lg`, `p-4`, `flex`, etc.) which don't involve color.

### Utility Classes

Define these in `globals.css` to reduce repetition:

```css
.btn-primary {
  background: var(--accent);
  color: var(--text-inverse);
  border-radius: var(--chip-radius);
  transition: background var(--duration-fast) var(--ease-smooth);
}
.btn-primary:hover { background: var(--accent-hover); }

.btn-secondary {
  background: var(--bg-surface);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--chip-radius);
  transition: all var(--duration-fast) var(--ease-smooth);
}
.btn-secondary:hover {
  border-color: var(--border-visible);
  background: var(--bg-hover);
}

.btn-danger {
  background: var(--status-need-ticket);
  color: #FFFFFF;
  border-radius: var(--chip-radius);
}
```

**Kill these old classes:** `.btn-engage`, `.btn-going`. They reference the old color system.

## Shared Primitives (`src/components/ui/`)

| Component | Variants | Usage |
|-----------|----------|-------|
| `Button` | primary, secondary, ghost, danger | Sizes: xs, sm, md, lg. Supports `loading` prop |
| `Badge` | count, status, label | Monochrome only — no color variants |
| `StatusBadge` | GOING, INTERESTED, NEED_TICKETS, HAVE_TICKETS | Monochrome chips. NEED_TICKETS is only colored state (`--status-need-ticket`) |
| `Chip` | toggle, tag, status | Sizes: xs, sm, md. Two visual states: default (outlined) and selected (filled `--accent`) |
| `Toast` | success, info, error | Via `useToast()` context. Single toast at a time, 8s default |
| `Dialog` | — | Compound component: Dialog, DialogContent, DialogHeader, DialogTitle |
| `FriendAvatarStack` | sm, md | Overlapping avatars (max 3 visible), "+N" overflow |

**Migration note:** `Badge` color variants (primary, danger, warning, info, success) should be collapsed to monochrome. Remove colored variant props. `StatusBadge` green "GOING" and amber "INTERESTED" variants become monochrome filled and outlined respectively.

Check these exist before creating new UI primitives. Prefer extending over duplicating. Create new primitives only when a pattern repeats 3+ times.

### Primitives Must Enforce the System

Components like `Button`, `Chip`, and `Badge` should NOT accept arbitrary color props. They render from a fixed set of variants that map to design system tokens. This is the first line of defense against design drift.

```tsx
// CORRECT — variant maps to design system
<Button variant="primary">Start Plan</Button>    // renders --accent bg
<Button variant="secondary">Maybe</Button>        // renders --bg-surface + --border-subtle
<Chip active>Going</Chip>                          // renders --accent bg
<Chip>Interested</Chip>                            // renders --bg-surface, outlined

// WRONG — arbitrary color
<Button className="bg-amber-700">Start Plan</Button>
<Chip className="bg-green-100 text-green-800">Going</Chip>
```

## Brand Components (`src/components/brand/`)

**Migration required.** The old RyesVP brand components need replacement:

| Old Component | Status | Replacement |
|--------------|--------|-------------|
| `RyesVPLogo` | **Kill** | `LarkMark` — abstract white mark on dark bg |
| `RyesVPWordmark` | **Kill** | `LarkWordmark` — "Lark" in display typeface, `--text-primary` |
| `RyesVPBrand` | **Kill** | `LarkBrand` — wordmark only in nav (no combined logo+text) |

## Avatar System (`src/lib/avatar.ts`)

- `getAvatarStyle(userId)` — **Migration needed.** Currently returns colorful gradients (12 gradient pairs). Should return monochrome treatment: `--bg-surface` background, `--text-secondary` initials. No colorful avatar rings.
- `getInitials(displayName, email)` — Keep as-is (1-2 character initials)
- `getDisplayName(displayName, email)` — Keep as-is (falls back to email username)

## Toast Notifications

```typescript
const { showToast } = useToast();
showToast({
  message: 'Plan created!',
  type: 'success',
  action: { label: 'View', onClick: () => router.push(`/plans/${id}`) },
});
```

- Wrap app in `ToastProvider` (already done in layout)
- Single toast at a time (last wins)
- 8s auto-dismiss (configurable via `duration`)
- Fixed bottom-4, dark treatment: `--bg-elevated` bg, `--border-subtle` border, `--text-primary` text
- **Note:** Toast routes still use `/squads/` paths internally. Update to `/plans/` when URL migration happens. User-facing text already says "plan" (see `ux-comms.md`).

## Composition Pattern

```
Primitives (Button, Badge, Chip, Toast, Dialog)
    ↓
Components (EventCard, PlanCard, FriendsAndStatusCard, PlanMemberList)
    ↓
Sections (DiscoveryFeed, PlanModeView, DayOfModeView)
    ↓
Pages (HomePageContent, PlanPage, UserProfileContent)
```

Build from existing primitives. The component-builder agent spec (`.claude/agents/component-builder.md`) defines the full architectural layering.

**Naming migration:** `SquadMemberList` → `PlanMemberList`, `SquadPage` → `PlanPage`, etc. Code says "Squad" internally; users never see "squad." Rename components as you touch them.

## Responsive Patterns (Mobile-First)

```
Padding:     p-4 sm:p-5 lg:p-6
Images:      w-16 h-16 sm:w-20 sm:h-20
Typography:  text-sm sm:text-base
Grid:        grid grid-cols-1 sm:grid-cols-2
Sidebar:     hidden lg:block lg:w-80
Dropdowns:   fixed sm:absolute top-14 sm:top-auto
Content:     max-w-6xl mx-auto (page width)
Plan page:   max-w-lg mx-auto px-4 py-6
```

Always design mobile-first. Desktop is the enhancement. Test at 375px (iPhone SE) during development, not as an afterthought.

## Elevation via Surface Stepping

**Lark does not use shadows.** Depth is created through background color increments:

| Level | Token | Usage |
|-------|-------|-------|
| 0 — Canvas | `--bg-primary` | App background |
| 1 — Card | `--bg-elevated` + `1px --border-subtle` | Event cards, plan cards |
| 2 — Sheet | `--bg-surface` + `1px --border-visible` | Bottom sheets, modals, popovers |
| 3 — Floating | `--bg-hover` + `1px --border-visible` | Tooltips, dropdowns |

Grep for and remove: `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, any `boxShadow` in style objects.

## Image Handling

Event imagery is the only color in the app. Treat it as sacred:

- **Never** apply `tintColor`, `opacity` reduction, or CSS filters to event images
- **Never** add gradient overlays on thumbnails or hero images
- `border-radius`: `var(--image-radius)` (8px) in cards, `0` in detail page hero (full bleed)
- Fallback (no image): `--bg-surface` background, Lark mark centered in `--border-subtle`. No stock photos, no generic icons.
- Use `next/image` for all images. Proper caching and progressive loading.

## Key Files

| File | Purpose |
|------|---------|
| `src/app/globals.css` | Design tokens (CSS custom properties), utility classes, animations |
| `src/components/ui/*.tsx` | Shared primitives |
| `src/components/brand/*.tsx` | Lark logo, wordmark (migrate from RyesVP) |
| `src/lib/avatar.ts` | Avatar styles + initials (migrate to monochrome) |
| `src/contexts/ToastContext.tsx` | Toast provider + hook |
| `.claude/skills/lark-design-system.md` | **Source of truth** — all design tokens, component specs |
| `.claude/agents/motion-choreographer.md` | **Source of truth** — all animation specs |
| `.claude/agents/design-director.md` | Design authority agent |
| `.claude/agents/component-builder.md` | Implementation patterns agent |
| `.claude/agents/qa-reviewer.md` | Review checklist agent |
