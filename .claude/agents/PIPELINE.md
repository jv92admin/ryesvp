# Lark Design Agent Pipeline

## Overview

Four specialized agents maintain Lark's visual quality. Each has a distinct responsibility, clear tool access boundaries, and a defined position in the review chain.

```
design-director → motion-choreographer → component-builder → qa-reviewer
     │                    │                      │                  │
     │                    │                      │                  │
  "What it              "How it               "Build it"        "Did we
   looks like"           moves"                                  get it right?"
```

## The Pipeline

### 1. Design Director
**Owns:** Visual identity, design system, token definitions, component specs
**Writes to:** `.claude/skills/lark-design-system.md`, `.claude/skills/ux-comms.md`
**Core question:** "Does this look like Lark?"
**Key enforcement:** Monochrome rule, no shadows, surface elevation, event imagery untouched

### 2. Motion Choreographer
**Owns:** Animation, transitions, gestures, haptics, spring physics
**Writes to:** Animation utility files in `src/`
**Core question:** "Does this feel good under a thumb?"
**Key enforcement:** Spring configs, stagger timing, haptic mapping, 60fps budget, reduced motion

### 3. Component Builder
**Owns:** Implementation — screens, components, interactions
**Writes to:** All source code
**Core question:** "Does this implement the specs faithfully?"
**Key enforcement:** Token usage (never hardcode), component architecture, accessibility labels, copy accuracy

### 4. QA Reviewer
**Owns:** Quality verification, structured review reports
**Writes to:** Nothing (read-only)
**Core question:** "Did the builder follow the specs?"
**Key enforcement:** Monochrome audit, token compliance, motion accuracy, brand copy, touch targets

## Shared Source of Truth

All agents reference the same documents:

| Document | Owner | What it Contains |
|---|---|---|
| `/lark-design-system` skill | design-director | Color tokens, type scale, spacing, component specs, elevation model, imagery rules |
| `/ui-system` skill | component-builder | Token migration map, Tailwind conventions, easing curves, component inventory |
| `/ux-comms` skill | design-director | Product vocabulary, UI copy, section headers, CTA text, tone rules |
| `motion-choreographer.md` agent | motion-choreographer | Spring configs, duration/easing tables, stagger intervals, haptic map, gesture specs |

## The One Rule That Overrides Everything

**The UI is monochrome. Event imagery is the only color.**

If any agent's output introduces color into the UI chrome (that isn't event art or `--status-need-ticket` red), it is a violation regardless of which agent produced it. The QA reviewer elevates this to CRITICAL severity.

## When to Escalate

- **Component-builder can't implement a motion spec** → Flag to motion-choreographer for simplification
- **Motion-choreographer needs a new visual state** → Flag to design-director for token/spec
- **QA-reviewer finds a pattern not covered by specs** → Flag to design-director to extend the design system
- **Any agent encounters copy that doesn't exist in brand language** → Flag to design-director (copy is a design decision)

## Reference Apps

These are the apps the design-director studies for patterns (not for copying):

| App | What to Extract | What to Ignore |
|---|---|---|
| **Letterboxd** | Dark UI framing colorful content, social layer on media discovery | Rating system details, web-specific patterns |
| **Linear** | Chip/filter design, monochrome density, status systems | Enterprise workflow, project management UI |
| **Apple Music (dark)** | Image-forward dark layouts, detail page transitions, bottom sheets | Music player controls, now-playing patterns |
| **Spotify** | Card-based discovery, horizontal scroll patterns, dark feed | Audio-specific features, algorithmic UI |
| **DICE** | Ticketing + social in dark UI, event card patterns | Payment flows |

## Anti-References (What Lark Must Not Look Like)

| App/Pattern | Why We Avoid It |
|---|---|
| Eventbrite / Meetup | Corporate event listing aesthetic, white backgrounds, blue CTAs |
| Instagram / TikTok | Feed-based social, bright colors, engagement maximizing patterns |
| Airbnb / Calm / Headspace | Warm-tone lifestyle branding, rounded-everything, illustration-heavy |
| Any app with colored category tags | Lark's categories are monochrome metadata, not colorful wayfinding |
| Any app with drop shadows on cards | Lark uses surface color stepping for elevation |
