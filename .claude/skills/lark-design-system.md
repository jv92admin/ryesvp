# Lark Design System

## Version 0.1 — February 2026

---

## Philosophy

Lark's visual identity starts where a night out starts: when the house lights go down. The UI is the dark room that lets the event art, the venue photos, and the social energy be the color. The app itself stays out of the way — confident, minimal, and sharp.

**We are:** High-contrast. Monochrome. Hand-textured. Raw but refined.

**We are not:** Warm-tone lifestyle branding. Neon tech gradients. Geometric minimalism. Bubbly social app aesthetic.

**The test:** Would this look right printed on a black flyer stapled to a telephone pole outside your favorite bar? If yes, ship it.

---

## Color Tokens

### Foundation — Dark Mode Primary

Lark is a dark-mode-first app. The dark canvas lets event imagery and venue art be the hero. The UI recedes; the content glows.

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#0A0A0A` | App background, base canvas |
| `--bg-elevated` | `#141414` | Cards, sheets, modals — one step above bg |
| `--bg-surface` | `#1E1E1E` | Input fields, chips, secondary cards |
| `--bg-hover` | `#2A2A2A` | Hover/press state for surfaces |
| `--border-subtle` | `#2A2A2A` | Default card/divider borders — barely there |
| `--border-visible` | `#3A3A3A` | Borders that need to be seen (active states, focus rings) |
| `--text-primary` | `#F5F5F5` | Headlines, event titles, primary content |
| `--text-secondary` | `#A0A0A0` | Venue names, dates, times, metadata |
| `--text-muted` | `#666666` | Placeholder text, disabled states, tertiary info |
| `--text-inverse` | `#0A0A0A` | Text on light/accent backgrounds |

### Accent — Single Color, Surgical Use

One accent color. Not a palette. One signal that means "this is interactive" or "this needs your attention." Everything else is monochrome.

| Token | Value | Usage |
|---|---|---|
| `--accent` | `#E8E8E8` | Primary interactive elements: buttons, active chips, selected states |
| `--accent-hover` | `#FFFFFF` | Hover state for accent elements |
| `--accent-muted` | `#3A3A3A` | Subtle accent (inactive toggle bg, secondary button border) |

**Why near-white as the accent?** In a dark UI, white IS the accent. A bright white button on a `#0A0A0A` background has more contrast and visual weight than any color. It also means the only real color in the app is the event imagery — posters, venue photos, artist art. Lark frames the color; it doesn't compete with it.

### Semantic Colors — Minimal and Functional

| Token | Value | Usage |
|---|---|---|
| `--status-going` | `#E8E8E8` | "Going" state — filled white chip/badge |
| `--status-interested` | `transparent` | "Interested" state — outlined chip, `--border-visible` stroke |
| `--status-need-ticket` | `#FF4444` | Only red in the app — "Need Ticket" alert state |
| `--status-have-ticket` | `#E8E8E8` | "Have Ticket" — same as accent (resolved state) |

**Category tags** (CONCERT, THEATER, SPORTS, etc.): All rendered in `--text-secondary` as uppercase micro-labels. No color-coding. The event image already tells you the category; the tag is metadata, not decoration.

### Light Mode (Optional — V2)

If light mode is ever needed, invert the foundation:

| Token | Light Value |
|---|---|
| `--bg-primary` | `#FAFAFA` |
| `--bg-elevated` | `#FFFFFF` |
| `--bg-surface` | `#F0F0F0` |
| `--text-primary` | `#0A0A0A` |
| `--text-secondary` | `#666666` |
| `--accent` | `#1A1A1A` |

---

## Typography

### Typeface Direction

**Primary — Headline/Display:** A typeface with character. Not a geometric sans-serif. Something with slight irregularity, warmth, or a hand-set quality. Options to evaluate:

- **GT America** — Confident, slightly condensed, great at large sizes. Used by Stripe, feels editorial.
- **Söhne** — Designed by Klim. What Anthropic uses. Neutral but with subtle warmth.
- **Space Grotesk** — Free (Google Fonts). Slightly quirky letterforms, tech-adjacent but not cold. Good budget pick.
- **Instrument Sans** — Free (Google Fonts). Clean with a subtle playfulness in the curves.

**Secondary — Body/Metadata:** System font stack for performance. The app is content-dense; body type should load instantly.

```
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

### Type Scale

All sizes in `px`. Line heights are ratios relative to font size.

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `--type-display` | 28px | 700 | 1.15 | Hero text, onboarding headlines |
| `--type-title` | 22px | 700 | 1.2 | Event titles on detail pages |
| `--type-heading` | 18px | 600 | 1.25 | Section headers ("YOUR PLANS", "TODAY") |
| `--type-body` | 16px | 400 | 1.45 | Event titles in cards, plan descriptions |
| `--type-caption` | 14px | 400 | 1.4 | Venue name, date/time, friend count |
| `--type-micro` | 11px | 600 | 1.3 | Category tags, chip labels, uppercase metadata |

### Type Rules

- **Event titles in cards:** `--type-body` weight 600. Truncate to 2 lines max with ellipsis.
- **Section headers:** `--type-micro` in `--text-secondary`, uppercase, letter-spacing `0.08em`. ("YOUR PLANS", "TODAY", "THIS WEEK")
- **Search placeholder:** `--type-body` in `--text-muted`, regular weight. "What kind of night are we having?"
- **Category tags:** `--type-micro`, uppercase, `--text-secondary`. No background, no colored pill. Just the word.
- **Metadata lines** (venue + time): `--type-caption` in `--text-secondary`. Format: `Venue Name · Day at Time`
- **Never underline links** inside the app. Use color/weight change on press.

---

## Spacing System

Base unit: **4px**. All spacing is a multiple.

| Token | Value | Common Usage |
|---|---|---|
| `--space-xs` | 4px | Inline icon-to-text gap |
| `--space-sm` | 8px | Between metadata items, chip gap |
| `--space-md` | 12px | Card inner padding (tight), between stacked lines |
| `--space-lg` | 16px | Card inner padding (standard), section label to content |
| `--space-xl` | 24px | Between cards, screen horizontal padding |
| `--space-2xl` | 32px | Between sections, modal padding |
| `--space-3xl` | 48px | Major section breaks |

### Layout Constants

| Token | Value | Usage |
|---|---|---|
| `--screen-padding` | 20px | Left/right padding on all screens |
| `--card-padding` | 16px | Internal padding for event cards |
| `--card-radius` | 12px | Border radius on all cards |
| `--chip-radius` | 20px | Border radius on chips/pills (fully rounded) |
| `--chip-height` | 36px | Consistent chip/button height for touch targets |
| `--avatar-sm` | 28px | Friend avatars in plan member lists |
| `--avatar-md` | 36px | User avatar in nav bar |
| `--thumb-size` | 72px | Event thumbnail in list cards |
| `--image-radius` | 8px | Border radius on event images/thumbnails |

---

## Elevation & Depth

No drop shadows. Depth is created through surface color stepping, not shadows. Each level up is slightly lighter.

| Level | Background | Border | Usage |
|---|---|---|---|
| 0 — Canvas | `--bg-primary` | none | App background |
| 1 — Card | `--bg-elevated` | `1px solid --border-subtle` | Event cards, plan cards |
| 2 — Sheet | `--bg-surface` | `1px solid --border-visible` | Bottom sheets, modals, popovers |
| 3 — Floating | `--bg-hover` | `1px solid --border-visible` | Tooltips, dropdowns |

**Why no shadows?** Shadows feel soft and dimensional — that's the warm-tone lifestyle aesthetic we're deliberately avoiding. Color stepping feels flat, graphic, and print-inspired. Like ink layers on a poster.

---

## Iconography

### Style

Line icons only. Thin stroke (1.5px). Rounded caps and joins. No filled icons except for active/selected states.

**Recommended set:** Lucide (open source, consistent 1.5px stroke, great coverage). Phosphor is an alternative.

### Icon Sizes

| Context | Size | Stroke |
|---|---|---|
| Navigation bar | 24px | 1.5px |
| In-card actions (checkmark, star) | 20px | 1.5px |
| Inline with text (location pin, clock) | 16px | 1.5px |

### Active vs. Inactive

- **Inactive:** Stroke icon in `--text-muted`
- **Active/Selected:** Filled icon in `--text-primary`
- **Example:** Star outline (not interested) → Star filled (interested)
- **Example:** Check circle outline (not going) → Check circle filled (going)

---

## Component Specifications

### Nav Bar

- **Height:** 56px
- **Background:** `--bg-primary` (no distinct bar — bleeds into content)
- **Wordmark:** "Lark" in display typeface, `--text-primary`, left-aligned
- **Right cluster:** Notification bell (icon) + Avatar circle (`--avatar-md`)
- **No background color differentiation** from content area — the nav floats on the same dark canvas
- **The old RSVP logo and brown bar are gone.** Just the word "Lark."

### "Start a Plan" Button

- **Style:** Outlined, not filled. `1px solid --border-visible`, text in `--text-primary`
- **Radius:** `--chip-radius` (20px, fully rounded)
- **Height:** `--chip-height` (36px)
- **Hover/Press:** Background fills to `--bg-hover`, border to `--text-primary`
- **This is intentionally understated.** The primary action should feel like a natural next step, not a screaming CTA.

### Search Bar

- **Background:** `--bg-surface`
- **Border:** `1px solid --border-subtle`
- **Radius:** `--card-radius` (12px)
- **Placeholder text:** "What kind of night are we having?" in `--text-muted`
- **Focus state:** Border transitions to `--border-visible`, subtle bg lighten to `--bg-hover`
- **Search icon:** 16px, `--text-muted`, left-aligned

### Filter Chips

- **Default:** `--bg-surface` background, `1px solid --border-subtle`, text in `--text-secondary`
- **Selected:** `--accent` background (`#E8E8E8`), text in `--text-inverse` (`#0A0A0A`)
- **Radius:** `--chip-radius` (fully rounded)
- **Height:** `--chip-height` (36px)
- **Gap between chips:** `--space-sm` (8px)
- **Horizontally scrollable** if they overflow screen width. No wrapping.

### Event Card — List View (Discovery Feed)

```
┌─────────────────────────────────────────┐
│  ┌──────┐                               │
│  │ IMG  │  Event Title (2 lines max)    │
│  │72x72 │  Venue · Today at 7:00 PM    │
│  │      │  CONCERT                      │
│  └──────┘                    ☑   ☆      │
└─────────────────────────────────────────┘
```

- **Background:** `--bg-elevated`
- **Border:** `1px solid --border-subtle`
- **Radius:** `--card-radius` (12px)
- **Padding:** `--card-padding` (16px)
- **Thumbnail:** `--thumb-size` (72px) square, `--image-radius` (8px)
- **Gap between thumb and text:** `--space-lg` (16px)
- **Title:** `--type-body` weight 600, `--text-primary`, max 2 lines, ellipsis overflow
- **Metadata:** `--type-caption`, `--text-secondary`. Format: `Venue · Day at Time`
- **Category tag:** `--type-micro`, `--text-secondary`, uppercase. No pill, no background.
- **Action icons** (check, star): Right-aligned, `--text-muted` default, `--text-primary` when active
- **Card-level tap target:** Entire card is tappable, navigates to event detail
- **Hover/press:** Border transitions to `--border-visible`
- **Spacing between cards:** `--space-md` (12px)

### Event Card — Detail Page (Full View)

- **Hero image:** Full-width, aspect ratio 16:9 or match source, top of page, no radius (bleeds to edges)
- **Below image:** Content area with `--screen-padding` horizontal padding
- **Title:** `--type-title`, `--text-primary`
- **Artist/organizer:** `--type-caption`, `--text-secondary`, tappable
- **Date/time:** `--type-caption`, `--text-secondary`
- **Venue:** `--type-caption`, `--text-secondary`, with location pin icon inline

### Plan Card (Horizontal Scroll — "YOUR PLANS")

```
┌─────────────────┐
│ Event Title...  │
│ Day at Time     │
│ 1 friend · Venue│
└─────────────────┘
```

- **Width:** 200px fixed (shows partial next card to invite scroll)
- **Background:** `--bg-elevated`
- **Border:** `1px solid --border-subtle`
- **Radius:** `--card-radius`
- **Padding:** `--card-padding`
- **Title:** `--type-caption` weight 600, `--text-primary`, max 2 lines
- **Details:** `--type-caption`, `--text-secondary`
- **Friend count:** `--type-caption`, `--text-secondary`

### Going / Interested Chips (Event Detail)

- **"Interested" (default):** Outlined. `1px solid --border-visible`, text `--text-secondary`
- **"Going" (active):** Filled. `--accent` background, text `--text-inverse`
- **Radius:** `--chip-radius`
- **Height:** `--chip-height`
- **These replace the green "Going" button.** No color. Monochrome.

### Plan RSVP Section

- **"Going?" row:** Three chips — Yes, Maybe, No
  - Selected: `--accent` bg, `--text-inverse`
  - Unselected: `--bg-surface`, `1px solid --border-subtle`, `--text-secondary`
- **"Ticket?" row:** Two chips — Have/Getting, Need
  - "Need" when selected: `--status-need-ticket` (`#FF4444`) bg, white text. This is the ONLY red in the app. It means "help me."
  - "Have/Getting" when selected: `--accent` bg, `--text-inverse`
- **"Invite Friends" button:** Full-width, `--accent` bg, `--text-inverse`, `--chip-radius`

### Friend Avatars

- **Size:** `--avatar-sm` (28px) in plan member lists
- **Border:** `2px solid --bg-elevated` (creates separation when overlapping)
- **Overlap:** -8px margin for stacked avatar groups
- **Fallback:** First initial on `--bg-surface` background, `--text-secondary`
- **No colorful avatar rings.** Monochrome.

### Bottom Navigation (if used)

- **Height:** 56px + safe area
- **Background:** `--bg-primary` with top border `1px solid --border-subtle`
- **Icons:** 24px, `--text-muted` inactive, `--text-primary` active
- **Labels:** `--type-micro`, `--text-muted` inactive, `--text-primary` active
- **No background pills or highlights** on active tab — just the color shift

---

## Motion Language

### Principles

1. **Earn every animation.** If removing it makes no difference, cut it.
2. **Performance is non-negotiable.** Only animate `transform` and `opacity`. Never layout properties.
3. **The app should feel responsive, not animated.** Fast, direct feedback. Not theatrical.

### Transitions

| Context | Duration | Easing | Properties |
|---|---|---|---|
| Card press/hover | 120ms | `ease-out` | `background-color`, `border-color` |
| Chip selection | 150ms | `ease-out` | `background-color`, `color` |
| Sheet/modal open | 250ms | `cubic-bezier(0.16, 1, 0.3, 1)` | `transform` (translateY), `opacity` |
| Sheet/modal close | 200ms | `ease-in` | `transform` (translateY), `opacity` |
| Page transition | 200ms | `ease-out` | `opacity` |
| List item entrance | 300ms | `cubic-bezier(0.16, 1, 0.3, 1)` | `transform` (translateY 12px), `opacity` |

### Stagger

- **Feed cards on load:** 60ms stagger between cards, max 5 cards animated (rest appear instantly)
- **Filter chips:** 40ms stagger on initial appearance
- **Plan cards (horizontal):** No stagger — they scroll in as a group

### Scroll Behavior

- **Native scroll only.** No scroll hijacking, no parallax, no momentum manipulation.
- **Pull-to-refresh:** Standard platform behavior
- **Sticky header:** Nav bar sticks on scroll. No animation, no shrink, no hide-on-scroll-down. Just stays.

### Reduced Motion

- `prefers-reduced-motion: reduce` → All transitions set to 0ms. Elements appear in final state immediately. No stagger. No translateY.

---

## Logo / Wordmark

### Direction

The Lark wordmark should feel hand-set, not machine-perfect. Not a script font — a confident sans with subtle imperfections or a custom lettering treatment.

### Specifications (to brief a designer)

- **Wordmark:** "Lark" — four letters, lowercase or title case (test both)
- **Style:** Clean enough to read at 16px. Characterful enough to recognize at 200px. The "k" is the opportunity for a distinctive flourish — a tail, a slight upward kick, something that gives it a mark.
- **Monochrome:** Wordmark is always `--text-primary` on `--bg-primary`. No color. No gradient. No embossing.
- **App icon:** Black square, white wordmark or abstract mark. The mark could reference a bird stroke or a soundwave — single, swift, hand-drawn.
- **Clear space:** Minimum padding around wordmark = height of the "L" on all sides
- **Minimum size:** 14px height for legibility

### What to Kill

- The current RSVP badge/logo — gone entirely
- The brown bar — gone
- Any green accent associated with the old brand — gone

---

## Imagery Guidelines

### Event Art

Event imagery is the only real color in the app. The monochrome UI exists to frame it.

- **Never apply color filters, overlays, or tints** to event art. Show it as the artist/venue intended.
- **Image radius:** `--image-radius` (8px) in cards. Full-bleed (0px) on detail hero.
- **Fallback:** When no image is available, show `--bg-surface` with a centered Lark mark in `--border-subtle`. No stock photos. No generic placeholders.

### Friend Avatars

- User-uploaded photos are shown as-is, cropped to circle
- No filters, no borders (except the `--bg-elevated` separation ring for overlapping stacks)

---

## What Changes from Current App

This is a direct before/after for every element visible in the current screenshots:

| Element | Current | New |
|---|---|---|
| **Header bar** | Brown/warm background, RSVP logo | `--bg-primary` (dark), "Lark" wordmark only |
| **"Start a Plan" button** | Green filled pill | Outlined pill, `--border-visible`, `--text-primary` |
| **Search bar** | Light gray on white | `--bg-surface` on `--bg-primary`, subtle border |
| **Filter chips** | Light gray pills on white | `--bg-surface` pills, selected = `--accent` fill |
| **Plan cards** | White cards on white bg | `--bg-elevated` on `--bg-primary` |
| **Event list cards** | White cards, colored category tags | `--bg-elevated`, monochrome tags |
| **Category tags** | Colored text (red "SPORTS", maroon "THEATER") | All `--text-secondary`, uppercase, no color |
| **Action icons** | Green checkmark, gray star | `--text-muted` / `--text-primary`, no color |
| **"Going" chip** | Green filled | `--accent` (white) filled |
| **"Interested" chip** | Gray outlined | `--border-visible` outlined |
| **"Invite Friends" button** | Dark filled pill | `--accent` filled, `--text-inverse` |
| **"Yes" chip** | Green filled | `--accent` filled |
| **Overall feel** | Warm, earthy, daylight | Dark, high-contrast, nighttime |

---

## Implementation Notes

### CSS Custom Properties

All tokens should be defined as CSS custom properties on `:root` (or equivalent in your framework). Components reference tokens, never raw values.

```css
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

### Hardcoded Value Rule

Any hex code, RGB value, or pixel measurement that appears directly in a component file (not as a token reference) is a bug. No exceptions.

---

## Open Questions for V2

- **Light mode:** Do we need it? Start dark-only and see if users ask.
- **Notification badge color:** Currently undefined. Could be `--accent` (white dot) or `--status-need-ticket` (red dot) for urgency.
- **Map view:** If event discovery includes a map, what's the map style? Likely a dark/monochrome map tile set (Mapbox dark theme or similar).
- **Onboarding screens:** The "Let's go on a lark" hero screen from the brand proposal needs specific layout specs.
- **Haptics:** On iOS, should card presses trigger light haptic feedback? (Recommendation: yes, very subtle.)

---

*This document is the source of truth. If it's not in here, it shouldn't be in the code.*
