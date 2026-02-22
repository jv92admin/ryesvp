# Lark Design System Reference

> Source of truth for the Lark visual system as implemented in code. Every token, variant, and pattern documented here maps directly to a file in `src/`.

---

## 1. Lark Visual Identity

### Philosophy: "The house lights go down."

Lark's UI is a dark monochrome environment. The interface itself disappears so the content -- event imagery, artist photos, show posters -- becomes the only color on screen. This is the same principle as a concert venue: when the house lights dim, the stage is all you see.

**Core tenets:**

- **Dark canvas, bright content.** The UI is `#0A0A0A` near-black. Event images are the only chromatic elements.
- **Monochrome chrome.** Every button, badge, chip, and border lives in the grayscale range from `#0A0A0A` to `#F5F5F5`. The accent color itself is near-white (`#E8E8E8`), not a hue.
- **One controlled explosion.** `#FF4444` (Need Ticket) is the single chromatic color in the entire UI system. It earns its redness by being alone.
- **No shadows. Ever.** Depth comes from surface layering (`--bg-primary` < `--bg-elevated` < `--bg-surface`) and subtle borders, not box-shadows.
- **Film grain texture.** A fractal noise SVG overlay at `opacity: 0.03` on `body::before` transforms flat black into a tactile, cinematic surface.

### Brand mark

"Lark" in Space Grotesk 700, `--lark-text-primary` (`#F5F5F5`). Accompanied by a pipe `|` divider in `--border-visible` and the tagline "Nights start here." in Space Grotesk, `--lark-text-muted`, `text-xs`. All elements sit on a shared `items-baseline` alignment.

---

## 2. Design Tokens

All tokens defined in `:root` in `src/app/globals.css` and exposed to Tailwind via the `@theme inline` block.

### Surfaces

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0A0A0A` | Page background, near-black canvas |
| `--bg-elevated` | `#141414` | Cards, modals, toasts, header |
| `--bg-surface` | `#1E1E1E` | Inputs, interactive surfaces, avatar backgrounds |
| `--bg-hover` | `#2A2A2A` | Hover state for ghost buttons, list rows |

### Borders

| Token | Value | Usage |
|-------|-------|-------|
| `--border-subtle` | `#2A2A2A` | Card borders, dividers, dialog outlines |
| `--border-visible` | `#3A3A3A` | Secondary button borders, chip outlines, focus rings |

### Text

| Token | Value | Usage |
|-------|-------|-------|
| `--lark-text-primary` | `#F5F5F5` | Headlines, body text, primary content |
| `--lark-text-secondary` | `#A0A0A0` | Supporting text, metadata, inactive labels |
| `--lark-text-muted` | `#666666` | Hints, placeholders, disabled text, tagline |
| `--text-inverse` | `#0A0A0A` | Text on accent backgrounds (dark on light) |

### Accent

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#E8E8E8` | Primary CTA background, active chip fill, Going/Have Tickets badge |
| `--accent-hover` | `#FFFFFF` | Primary CTA hover state |
| `--accent-muted` | `#3A3A3A` | Disabled primary button background |

### Semantic (Status)

| Token | Value | Usage |
|-------|-------|-------|
| `--status-going` | `#E8E8E8` | Going badge (same as accent) |
| `--status-interested` | `transparent` | Interested badge (outlined, not filled) |
| `--status-need-ticket` | `#FF4444` | Need Ticket state -- THE ONLY CHROMATIC COLOR |
| `--status-have-ticket` | `#E8E8E8` | Have Ticket badge (same as accent) |

### Layout

| Token | Value | Usage |
|-------|-------|-------|
| `--card-radius` | `12px` | Cards, search input |
| `--chip-radius` | `20px` | Chips (rounded-full) |
| `--image-radius` | `8px` | Event thumbnails |
| `--screen-padding` | `20px` | Horizontal page padding |
| `--card-padding` | `16px` | Internal card padding |
| `--chip-height` | `36px` | Standard chip touch target |
| `--thumb-size` | `72px` | Event thumbnail size reference |
| `--avatar-sm` | `28px` | Small avatar |
| `--avatar-md` | `36px` | Medium avatar |

### Spacing

| Token | Value |
|-------|-------|
| `--space-xs` | `4px` |
| `--space-sm` | `8px` |
| `--space-md` | `12px` |
| `--space-lg` | `16px` |
| `--space-xl` | `24px` |
| `--space-2xl` | `32px` |
| `--space-3xl` | `48px` |

### Typography

| Token | Value |
|-------|-------|
| `--font-display` | Space Grotesk, system fallback |
| `--font-body` | System font stack (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto) |

### Motion

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-snap` | `cubic-bezier(0.2, 0, 0, 1)` | Primary easing -- reveal animations, fade-in |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Toast entrance, slide-up |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Slight overshoot -- popovers, toggles |
| `--ease-smooth` | `cubic-bezier(0.4, 0, 0.2, 1)` | Hover colors, general transitions |
| `--duration-fast` | `150ms` | Hover states, color changes |
| `--duration-normal` | `250ms` | Reveals, toast entrances, chip toggles |
| `--duration-slow` | `400ms` | Large layout shifts (rare) |

---

## 3. Typography

### Font families

**Space Grotesk** (600, 700) for display elements: wordmark, section headers, event titles, search placeholder, dialog titles, date section headers. Applied via `style={{ fontFamily: 'var(--font-display)' }}`.

**System font stack** for everything else: body text, metadata, button labels, form labels.

### Type scale

| Level | Classes | Font | Usage |
|-------|---------|------|-------|
| Wordmark | `text-lg font-bold tracking-tight` | Space Grotesk | "Lark" in header |
| Event title (featured) | `text-lg font-semibold leading-snug line-clamp-2` | Space Grotesk | FeaturedEventCard title |
| Event title (card) | `font-semibold leading-snug line-clamp-2` | Space Grotesk | EventCard title |
| Dialog title | `text-lg font-semibold` | Space Grotesk | Modal/dialog headings |
| Section header | `text-xs font-semibold uppercase tracking-wider` | Space Grotesk | Date group headings ("FRIDAY, FEB 21") |
| Body | `text-sm` | System | Venue + date lines, descriptions |
| UI label | `text-sm font-medium` | System | Button labels, form labels |
| Caption | `text-xs font-medium` | System | Input labels, friend count text |
| Micro label | `text-[10px] font-semibold uppercase tracking-wide` | System | Status badges (NEW, PRESALE, SOLD OUT), category labels |
| Muted label | `text-xs tracking-wide` | Space Grotesk | Header tagline |

### Typography rules

- `leading-snug` for multi-line headings (event titles wrapping to 2 lines)
- `line-clamp-2` for titles, `line-clamp-3` for descriptions
- `font-medium` for interactions, `font-semibold` for local emphasis, `font-bold` for wordmark only
- No decorative fonts beyond Space Grotesk + system stack

---

## 4. Color Philosophy

### Monochrome-first

The entire UI palette lives in grayscale:
- Background: `#0A0A0A` to `#2A2A2A` (4 surface levels)
- Borders: `#2A2A2A` to `#3A3A3A` (2 levels)
- Text: `#666666` to `#F5F5F5` (3 levels)
- Accent: `#E8E8E8` to `#FFFFFF` (near-white, not a hue)

Color enters the UI from exactly three sources:

### 1. Event imagery (the stage)

Event photos, artist images, and show posters are the only saturated color users see while browsing. This is intentional -- the content is the star, the chrome disappears.

### 2. The controlled explosion: `#FF4444`

Need Ticket (`--status-need-ticket`) is the single chromatic color in the system. It appears on:
- Need Tickets status badge
- Danger buttons (delete, leave)
- Error states (`bg-red-500/10 text-red-400`)
- Alert chip state
- Input error borders
- Error toast icon

Its power comes from isolation. In an all-gray UI, red is unmissable.

### 3. External brand colors (exceptions, not the rule)

Third-party service colors are allowed but quarantined in `src/lib/constants/externalBrands.ts`:

| Brand | Color | Usage |
|-------|-------|-------|
| Spotify | `#1DB954` | Listen button background |
| YouTube | `#FF0000` | Video link background |
| Ticketmaster | `#01579B` | Buy button background |
| Instagram | Gradient | Social link |

These never leak into Lark's own components. They exist only on branded action buttons that link to external services.

### What is NOT in the palette

- No green brand color (`#16A34A` was removed)
- No warm gold (`#B45309` was removed)
- No colored category badges (all categories are `--lark-text-secondary`)
- No colored status pills (Going = accent, Interested = outlined, not yellow/green)
- No light-mode surfaces (`#FAFAFA`, `#FFFFFF` backgrounds are gone)

---

## 5. UI Primitives

### Button (`src/components/ui/Button.tsx`)

Four variants, four sizes.

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| `primary` | `--accent` (#E8E8E8) | `--text-inverse` (#0A0A0A) | none | Main CTAs: Get Started, Save |
| `secondary` | transparent | `--lark-text-primary` | `--border-visible` | Supporting: Share, Cancel |
| `ghost` | transparent | `--lark-text-secondary` | none | Inline actions, minimal weight |
| `danger` | `--status-need-ticket` (#FF4444) | white | none | Destructive: Delete, Leave |

**Sizes:** `xs` (px-2 py-1 text-xs), `sm` (px-3 py-1.5 text-sm), `md` (px-4 py-2 text-sm), `lg` (px-6 py-3 text-base)

**States:**
- Hover: `--accent-hover` (primary), `--bg-hover` + muted border (secondary), `--bg-hover` + primary text (ghost), `brightness(1.1)` (danger)
- Focus: `ring-2 ring-[var(--border-visible)] ring-offset-2 ring-offset-[var(--bg-primary)]`
- Disabled: `--accent-muted` bg + `--lark-text-muted` text, `cursor-not-allowed opacity-50`
- Loading: Animated spinner SVG prepended to children

**Transition:** `transition-colors duration-[var(--duration-fast)]` -- never `transition-all`.

### IconButton (`src/components/ui/IconButton.tsx`)

Square icon-only buttons with three variants:

| Variant | Style |
|---------|-------|
| `ghost` | Transparent, `--lark-text-secondary`, hover: `--bg-hover` + primary text |
| `outline` | Transparent, `--border-visible` border, hover: `--lark-text-muted` border |
| `solid` | `--accent` bg, `--text-inverse` text, hover: `--accent-hover` |

**Sizes:** `sm` (28px), `md` (36px), `lg` (44px)

### Chip (`src/components/ui/Chip.tsx`)

Interactive pills with two visual states and haptic feedback.

**Visual states (priority: alert > active > default):**

| State | Background | Text | Border |
|-------|-----------|------|--------|
| Default | transparent | `--lark-text-secondary` | `--border-visible` |
| Active (selected) | `--accent` | `--text-inverse` | `--accent` |
| Alert | `--status-need-ticket` | white | `--status-need-ticket` |
| Coming soon | `--bg-surface` | `--lark-text-muted` | `--border-subtle`, opacity-40 |

**Variants:** `toggle` (rounded-full, font-medium, cursor-pointer), `tag` (rounded-full, font-normal), `status` (rounded-md, font-medium), `info` (rounded-full, font-normal), `coming-soon` (rounded-full, disabled)

**Sizes:** `xs`, `sm`, `md`

**Behavior:**
- `:active` scale-95 press feedback via `active:scale-95 transition-transform`
- Haptic feedback via `useHaptic()` hook (10ms vibration on mobile)
- Removable tags show `x` button with `--lark-text-muted` color

**Convenience wrappers:**
- `ToggleChip` -- pre-wired toggle variant
- `TagChip` -- pre-wired removable tag with active state

### Badge (`src/components/ui/Badge.tsx`)

Non-interactive status markers.

**Colors:** `default` (`--bg-surface` bg, `--lark-text-secondary` text) and `danger` (`--status-need-ticket` bg, white text). No other colors.

**Variants:**
- `count` -- Notification bubble (rounded-full, bold, centered)
- `status` -- Event status (rounded, semibold, uppercase, tracking-wide)
- `label` -- Category label (rounded, medium weight)

**Derived components:**
- `CountBadge` -- Notification count, defaults to danger color, hides when count <= 0
- `StatusBadge` (in Badge.tsx) -- Maps status strings to labels: NEW, PRESALE, SOLD OUT (danger), LIMITED, FEATURED
- `CategoryBadge` -- Always default color, displays category name

### StatusBadge (`src/components/ui/StatusBadge.tsx`)

User attendance status badges with monochrome styling.

| Status | Style | Dot color |
|--------|-------|-----------|
| GOING | `--accent` bg, `--text-inverse` text | `--accent` |
| INTERESTED | transparent bg, `--border-visible` border, `--lark-text-secondary` text | `--lark-text-secondary` |
| NEED_TICKETS | `--status-need-ticket` bg, white text | `--status-need-ticket` |
| HAVE_TICKETS | `--accent` bg, `--text-inverse` text | `--accent` |

Also exports `FriendCountBadge` with two variants:
- `text`: Plain text "X going" or "X interested"
- `pill`: `--bg-surface` rounded-full pill

### Input (`src/components/ui/Input.tsx`)

Dark surface inputs.

```
bg-[var(--bg-surface)]
text-[var(--lark-text-primary)]
border border-[var(--border-subtle)]
placeholder:text-[var(--lark-text-muted)]
rounded-lg px-3 py-2 text-sm
```

**States:**
- Focus: `ring-2 ring-[var(--border-visible)] border-[var(--border-visible)]`
- Error: `border-[var(--status-need-ticket)] ring-[var(--status-need-ticket)]`
- Error message: `text-xs text-[var(--status-need-ticket)]`

**Label:** `text-xs font-medium text-[var(--lark-text-secondary)]`

### Dialog (`src/components/ui/dialog.tsx`)

Modal dialog with dark surfaces and no shadows.

**Structure:**
- Overlay: `bg-black/60` backdrop, transition from `bg-black/0`
- Content: `bg-[var(--bg-elevated)]`, `border border-[var(--border-subtle)]`
- Mobile: slides up from bottom, `rounded-t-2xl`
- Desktop: centered, `rounded-xl`, scale transition

**Sizes:** `sm`, `md`, `lg`, `sheet`

**Sub-components:**
- `DialogHeader` -- `px-8 py-5`, border-bottom, optional close IconButton
- `DialogTitle` -- `text-lg font-semibold`, Space Grotesk
- `DialogBody` -- `px-8 py-5`, scrollable overflow
- `DialogFooter` -- `px-8 py-5`, border-top, `--bg-surface` background

**Features:** Focus trap, scroll lock, Escape key dismissal, click-outside dismissal.

### Toast (`src/components/ui/Toast.tsx`)

Bottom-anchored notification.

**Surface:** `bg-[var(--bg-elevated)]`, `border border-[var(--border-subtle)]`, `rounded-xl`

**Icon types:**
- Success: checkmark, `--lark-text-primary`
- Info: "i", `--lark-text-secondary`
- Error: "!", `--status-need-ticket`

**Layout:** Icon + message (`text-xs font-medium`) + optional action (copy icon) + close button

**Animation:** Framer Motion spring entrance (`stiffness: 400, damping: 30`), 8-second auto-dismiss.

**Position:** `bottom-4 left-4 right-4` on mobile, centered on `sm+`.

---

## 6. Component Patterns

### Header (`src/components/Header.tsx`)

Sticky header with scroll-linked border.

```
bg-[var(--bg-primary)]
sticky top-0 z-50
border-b border-transparent  (hidden at rest)
```

When scrolled (`scrollY > 0`), `HeaderScrollEffect` adds `.header-scrolled` class which sets `border-bottom-color: var(--border-subtle)`.

**Left:** Lark wordmark (Space Grotesk 700, `text-lg`) | pipe divider | tagline

**Right (authenticated):** StartPlanButton (header variant) + NotificationBell + UserMenu

**Right (anonymous):** "Get Started" primary button

### StartPlanButton (`src/components/StartPlanButton.tsx`)

Three placement variants:

| Variant | Style |
|---------|-------|
| `header` | Ghost style, `+` icon, "New Plan" text (hidden on mobile), `hover:bg-[var(--bg-hover)]` |
| `profile` | `--bg-elevated`, `border-2 border-[var(--border-visible)]`, hover: `--accent` border |
| `fab` | Fixed bottom-right, `--accent` bg, `--text-inverse` text, rounded-full |

### EventCard (`src/components/EventCard.tsx`)

Compact list card with Framer Motion press feedback.

**Surface:** `bg-[var(--bg-elevated)]`, `rounded-[var(--card-radius)]`

**Border strategy:**
- Mobile: `border-b border-[var(--border-subtle)]` only (bottom separator)
- Desktop: `md:border md:border-transparent md:hover:border-[var(--border-subtle)]` (reveals on hover)

**Structure:**
1. **Top (clickable link):** Thumbnail (16x16/20x20) + Title (Space Grotesk, `line-clamp-2`) + NEW badge + Venue/Date line + optional presale info
2. **Bottom (actions row):** Category label + status badge + Spotify icon + FriendAvatarStack + community pill | EventCardActions

**Press feedback:** `whileTap={{ scale: 0.98 }}` via Framer Motion spring.

**No image fallback:** Category SVG icon in `--lark-text-muted` on `--bg-surface` background.

### FeaturedEventCard (`src/components/FeaturedEventCard.tsx`)

Hero variant used for the first event in each day section.

**Image:** Full-width `aspect-[2/1]` with gradient fade (`from-[var(--bg-elevated)] to-transparent`) at bottom edge.

**Surface:** `bg-[var(--bg-elevated)]`, full `border border-[var(--border-subtle)]`, hover: `border-[var(--border-visible)]`.

**Content below image:** Category + NEW badge + title (`text-lg`) + venue/date + presale + social/actions row.

### FilterStrip (`src/components/discovery/FilterStrip.tsx`)

Three-row filter interface.

**Row 1:** SearchInput

**Row 2:** Quick chips (ToggleChip) + Filters overflow button
- Quick chips: "This Weekend", "Friends", "My Plans"
- Filters button: `--bg-elevated` bg, `--border-subtle` border (inactive) or `--bg-surface` bg, `--accent` border (active with count)

**Row 3 (conditional):** Active filter tags as removable `TagChip` components + "Clear all" link

### SearchInput (`src/components/discovery/SearchInput.tsx`)

Full-width search with Space Grotesk placeholder.

```
h-12
bg-[var(--bg-surface)]
border border-[var(--border-subtle)]
rounded-[var(--card-radius)]
placeholder: "What kind of night are you planning?"
font-family: var(--font-display)
```

**Icons:** Search icon (left, lights up to `--accent` when unsearched value exists), clear `x` (right, `--lark-text-muted`).

**Submit:** Enter key or click search icon.

### EventListWithPagination (`src/components/EventListWithPagination.tsx`)

Date-grouped event list with staggered reveal animation.

**Date headers:** `text-xs font-semibold uppercase tracking-wider` in Space Grotesk, `--lark-text-secondary`, sticky top with `--bg-primary` background.

**Section spacing:** `gap: var(--space-3xl)` (48px) between date sections, `gap: var(--space-md)` (12px) between cards.

**Staggered entrance:** First 5 cards per section get `animate-reveal` with `60ms` stagger delay.

**Empty state:** Centered "L" monogram in `--bg-surface` circle + "Nothing here yet." message.

**Load More:** Secondary-style button: `--bg-elevated` bg, `--lark-text-primary` text, `--border-subtle` border.

### FriendAvatarStack (`src/components/ui/FriendAvatarStack.tsx`)

Overlapping avatar circles.

**Avatar style:** `--bg-surface` background, `--lark-text-secondary` initials, `border-2 border-[var(--bg-elevated)]` for ring separation. No shadows, no gradients.

**Sizes:** `sm` (24px, text-[10px]) and `md` (28px, text-xs).

**Overflow:** `+N` pill in `--bg-surface` with `--lark-text-secondary` text.

**Overlap:** `-0.375rem` negative margin for stacking effect.

### PeopleList (`src/components/ui/PeopleList.tsx`)

Grouped list of people with avatars.

**Group headers:** `text-sm font-semibold`, optional color dot, `--lark-text-secondary` default.

**Person rows:** Avatar + name (`text-sm`, `--lark-text-primary`) + optional email (`text-xs`, `--lark-text-muted`).

**Link rows:** `hover:bg-[var(--bg-hover)] rounded-lg` transition.

### Avatar System (`src/lib/avatar.ts`)

Flat monochrome. No gradients, no per-user colors.

```typescript
getAvatarStyle(): { background: 'var(--bg-surface)', color: 'var(--lark-text-secondary)' }
getInitials(name, email): up to 2 uppercase chars
getDisplayName(name, email): name or email username fallback
```

---

## 7. Motion & Transitions

### Animation classes (from globals.css)

| Class | Keyframe | Duration | Easing | Usage |
|-------|----------|----------|--------|-------|
| `.animate-reveal` | `reveal` (translateY 8px + fade) | `--duration-normal` | `--ease-snap` | Card stagger entrance |
| `.animate-fade-in` | `fade-in` (opacity 0 to 1) | `--duration-fast` | `--ease-snap` | Simple element appearance |
| `.animate-slide-up` | `slide-up` (translateY 20px + fade) | `--duration-normal` | `--ease-out-expo` | Legacy toast entrance |
| `.animate-slide-down` | `slide-down` (translateY 0 to 8px + fade) | `--duration-normal` | `--ease-snap` | Toast/notification exit |
| `lark-pulse` | Opacity 1 to 0.5 | -- | -- | Dark skeleton loading |

### Framer Motion patterns

| Component | Animation | Config |
|-----------|-----------|--------|
| EventCard / FeaturedEventCard | `whileTap: { scale: 0.98 }` | `spring, stiffness: 400, damping: 30` |
| Toast | `initial: { opacity: 0, y: 16, scale: 0.96 }` | `spring, stiffness: 400, damping: 30` |
| Dialog | CSS transition, `translate-y-4 scale-95` to `translate-y-0 scale-100` | `duration-200` |

### Transition rules by element

| Element | Property | Duration | Notes |
|---------|----------|----------|-------|
| Buttons | `transition-colors` | fast | Color only, never `transition-all` |
| Chips | `transition-colors` + `transition-transform` | fast | Color + active:scale-95 |
| Cards (desktop) | `transition-colors` | fast | Border reveal from transparent |
| Links/text | `transition-colors` | fast | Text color shift |
| Dialog backdrop | `transition-colors` | 200ms | `bg-black/0` to `bg-black/60` |
| Dialog content | `transition-all` | 200ms | Translate + scale + opacity |
| Avatar (hover) | `transition-transform` | fast | `hover:scale-110` |
| Loading spinner | `animate-spin` | continuous | Linear, standard spin |

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Page Layouts

### Home Page (`/`)

```
Header (sticky, scroll-linked border)
  max-w-6xl mx-auto px-[--screen-padding]
    FilterStrip
      SearchInput (h-12, full width)
      Quick chips row (This Weekend | Friends | My Plans | Filters)
      Active filter tags row (conditional)
    EventListWithPagination
      Date section (gap: --space-3xl between sections)
        Date header (sticky, --bg-primary bg)
        FeaturedEventCard (first event if has image)
        EventCard (remaining events, gap: --space-md)
      Load More button
```

### Event Detail Page (`/events/[id]`)

Three-zone architecture (from Inc 5+6 spec):

**Zone 1 -- Identity:**
- Integrated hero with overlay navigation
- Event title, date, venue, badges

**Zone 2 -- Actions + Social:**
- Status toggles (Going/Interested/Need Tickets/Have Tickets)
- Inline EventPlanPanel (replaces separate /squads/ route)
- Sticky EventActionBar at bottom

**Zone 3 -- Explore + About:**
- Buy section (Ticketmaster link)
- Explore section (Spotify/artist info)
- About section (description, venue details)

**Max width:** `max-w-5xl`

### Plan Page (`/squads/[id]`)

Now primarily rendered inline via EventPlanPanel on the event page. Standalone page still exists as a fallback for direct links and notifications.

---

## 9. Copy & Terminology

### Plan vs Squad

| Context | Term | Example |
|---------|------|---------|
| Database, API routes, file names, types | Squad | `squadId`, `/api/squads`, `SquadMember` |
| All user-facing UI | Plan | "Start Plan", "View Plan", "Join Plan" |

### Casing rules

| Context | Convention | Examples |
|---------|-----------|----------|
| Button CTAs | Title Case | Start Plan, View Plan, Get Started, Load More Events |
| Headers/labels | Sentence case | "Your plans", "What's your status?" |
| Body copy | Natural sentences | "Alex invited you to their plan for Mt Joy on Dec 4." |
| Badge labels | UPPERCASE | NEW, PRESALE, SOLD OUT, CONCERT |

### Voice

- Direct, not marketing-speak
- "Nights start here." not "Discover amazing events near you!"
- No decorative emojis in UI (SVG icons instead)
- Short, scannable labels over verbose descriptions
- The app name is "Lark" (capital L)

### displayTitle

Always use `displayTitle` from the data layer (`src/db/`). Never compute or format event titles in components. This is a firm architectural boundary.

---

## 10. Anti-Patterns

Things the Lark design system explicitly does NOT do:

### No shadows

Zero `box-shadow`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl` anywhere. Depth is communicated through surface color layering (primary < elevated < surface) and subtle borders.

### No colored badges

All category badges are `text-[var(--lark-text-secondary)]`. No `bg-purple-100 text-purple-800` concert badges, no `bg-yellow-100 text-yellow-800` comedy badges. Event imagery is the only color source.

### No green CTAs

Green (`#16A34A`) is not in the palette. The old green brand color was removed. Going/confirmed states use `--accent` (near-white), not green.

### No warm gold

The `#B45309` warm engagement color and its associated tokens (`--action-engage`, `--action-engage-hover`, `--action-engage-light`) were removed entirely.

### No decorative emojis

Use SVG icons for all UI elements. No emoji in buttons, badges, headers, or navigation. The only acceptable emoji are in user-generated content.

### No light-mode surfaces

No `#FAFAFA` page backgrounds, no `#FFFFFF` card backgrounds, no `#F5F5F5` inset surfaces. The entire UI is dark.

### No `transition-all` on buttons

Buttons use `transition-colors` scoped to color properties only. `transition-all` animates padding, margin, and other layout properties, causing jank.

### No colored status pills

User attendance statuses:
- Going = `--accent` filled (near-white, not green)
- Interested = outlined (transparent, not yellow)
- Need Tickets = `--status-need-ticket` (the one red)
- Have Tickets = `--accent` filled (near-white, not purple)

### No staggered list item animations

Cards appear with a subtle `animate-reveal` on first load (first 5 items per section with 60ms stagger), but subsequent loads and interactions are instant. No parallax, no bounce, no pulsing CTAs.

### No per-user avatar colors

All avatars are `--bg-surface` + `--lark-text-secondary` initials. No gradients, no per-user hue assignment. Monochrome.

### No `signal` or `engage` button variants

The old three-tier CTA hierarchy (structural/engagement/signal) was replaced by four variants: `primary`, `secondary`, `ghost`, `danger`. That's the complete set.

---

## Key Files

| File | What it defines |
|------|----------------|
| `src/app/globals.css` | All design tokens, utility classes, keyframes |
| `src/components/ui/Button.tsx` | Button variants and sizes |
| `src/components/ui/Chip.tsx` | Chip, ToggleChip, TagChip |
| `src/components/ui/Badge.tsx` | Badge, CountBadge, StatusBadge (event), CategoryBadge |
| `src/components/ui/StatusBadge.tsx` | User attendance StatusBadge, FriendCountBadge |
| `src/components/ui/IconButton.tsx` | Icon-only button variants |
| `src/components/ui/Input.tsx` | Form input with label/error |
| `src/components/ui/dialog.tsx` | Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter |
| `src/components/ui/Toast.tsx` | Toast notification |
| `src/components/ui/FriendAvatarStack.tsx` | Overlapping avatar circles |
| `src/components/ui/PeopleList.tsx` | Grouped people list |
| `src/components/Header.tsx` | App header with wordmark |
| `src/components/HeaderScrollEffect.tsx` | Scroll-linked header border |
| `src/components/EventCard.tsx` | Standard event list card |
| `src/components/FeaturedEventCard.tsx` | Hero event card variant |
| `src/components/StartPlanButton.tsx` | New Plan button (3 variants) |
| `src/components/discovery/FilterStrip.tsx` | Filter UI container |
| `src/components/discovery/SearchInput.tsx` | Search input |
| `src/components/EventListWithPagination.tsx` | Date-grouped event list |
| `src/lib/constants/categoryColors.ts` | Category color map (all monochrome) |
| `src/lib/constants/statusColors.ts` | User status + event status config |
| `src/lib/constants/externalBrands.ts` | Third-party brand colors |
| `src/lib/avatar.ts` | Avatar style + initials utilities |
| `src/hooks/useHaptic.ts` | Haptic feedback hook |

---

*Last updated: February 22, 2026*
