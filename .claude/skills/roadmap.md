# Roadmap & Planning

You are updating priorities, managing the backlog, or planning new work.

## Key References

- `notes/ROADMAP.md` — Priority table, blocks A-D, backlog tables
- `notes/vision/product-vision.md` — Product philosophy and strategy
- `notes/specs/` — Active feature specs
- `notes/archive/` — Completed specs for historical context
- `/lark-design-system` skill — Lark design system (source of truth for all visual decisions)
- `.claude/agents/PIPELINE.md` — Design agent pipeline overview

## Block Structure

| Block | Focus | Status |
|-------|-------|--------|
| A | Event Discovery Foundation | Complete |
| B | UX Quick Wins | In progress |
| C | User Testing Pause | Upcoming |
| D | Data Enrichment & Personalization | Future |

## UX Revamp (Active)

Branch: `revamp/ux-architecture` · Spec: `notes/specs/ux-revamp-spec.md`

| Inc | Name | Status | Notes |
|-----|------|--------|-------|
| 0 | Design Foundation | Complete | |
| 1 | Modal & People System | Complete | |
| 2 | Filter Cleanup | Complete | |
| 3 | **Lark Visual Identity** | **Next** | Monochrome redesign. Dark-mode foundation, full token migration, design system enforcement. See `/lark-design-system` for specs and `/ui-system` for migration map. |
| 4 | Social-First Home | Queued | Kill tabs, PlansStrip, inline social. **Needs re-spec** — all component designs change under monochrome system. |
| 5 | Event Page Zones | Queued | Zone layout, Buy above fold. **Needs re-spec** — CTA hierarchy simplified (no more warm gold tier). |
| 6 | Plan-on-Event-Page | Queued | Inline plan panel. Design spec needed from design-director agent. |
| 7 | Groups Surfacing | Queued | Group labels, filters, activity. |

### Increment 3 — Lark Visual Identity (Detailed)

This is a full visual rebrand, not a color tweak. The agent pipeline (`.claude/agents/PIPELINE.md`) governs quality.

**What ships:**
- All tokens migrated from old RyesVP system to Lark monochrome tokens (see migration map in `/ui-system`)
- Dark-mode canvas (`#0A0A0A`) replaces light backgrounds
- All UI chrome is monochrome — no colored category tags, no green Going buttons, no warm gold CTAs
- Event imagery becomes the only color in the app
- Shadows removed everywhere, replaced by surface color stepping
- Brand components migrated: `RyesVPLogo` → `LarkMark`, `RyesVPWordmark` → `LarkWordmark`
- Avatar system migrated from colorful gradients to monochrome
- Old token aliases (`--brand-primary`, `--brand-border`, etc.) removed from `globals.css`

**Definition of done:**
All grep targets in `/ui-system` (Migration Grep Targets section) return zero matches. QA reviewer agent produces a clean report.

**Agent workflow:**
1. design-director confirms all specs are complete in `/lark-design-system`
2. component-builder implements token migration + component updates
3. qa-reviewer runs full audit checklist
4. Developer reviews QA report and approves

### Impact on Increments 4–7

Increments 4–7 were specced against the old warm-tone light-mode design. After Inc 3 ships, each increment needs a design review pass from the design-director agent before implementation begins. The structural concepts (Social-First Home, Event Page Zones, Plan-on-Event-Page, Groups) are unchanged — but every component spec, CTA color, card treatment, and badge style will look different.

**Do not start building Inc 4+ until Inc 3's design system is enforced and the QA report is clean.** Building new features on top of the old visual system creates debt that's harder to migrate later.

## Planning Workflow

1. Check `notes/ROADMAP.md` for current priority block and active items
2. Check `notes/specs/` for any existing spec on the topic
3. Use `notes/vision/product-vision.md` for strategic alignment
4. **For any UI work:** Read `/lark-design-system` first. Check the agent pipeline if unsure about visual decisions.
5. Create specs in `notes/specs/` for multi-session work
6. Move completed specs to `notes/archive/` when they become historical reference only
