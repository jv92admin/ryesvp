# Feature Spec Writing

You are speccing out a new feature or planning a significant change.

## When to Write a Spec

Write a spec for:
- New features with UI + data model changes
- Architectural decisions with multiple valid approaches
- Work that spans 2+ days or touches 5+ files

Don't write a spec for:
- Bug fixes, typos, single-file changes
- Work with clear, narrow scope already described in the task

## Where Specs Live

- **Active specs:** `notes/specs/` — while feature is being built or recently shipped
- **Archived specs:** `notes/archive/` — when superseded by a newer spec or no longer relevant
- Specs stay in `specs/` even after shipping. They're rationale, not task lists.

## Spec Template

```markdown
# Feature Name

> **Purpose:** One sentence describing what this enables.

> **Philosophy:** Design principle guiding decisions (e.g., "Audit first, then build").

> **Cross-reference:** Which block/phase this relates to in `ROADMAP.md`.

---

## Terminology Note

- **Code:** What names are used in database/API/types
- **UI:** What names are shown to users

---

## Current State

What exists today that this feature builds on. Include counts, capabilities, gaps.

---

## Phase 1 — [Name]

**Goal:** What this phase achieves.

**Key decisions:**
- Decision 1 and rationale
- Decision 2 and rationale

**What to build:**
- [ ] Task 1
- [ ] Task 2

**Deferred:** What's intentionally left out and why.

---

## Phase 2 — [Name] (if applicable)

...

---

## Future: [Deferred Ideas]

**Deferred because:** Why this isn't being built now.

**When ready:** What triggers revisiting this.

---

## Documents to Produce

| Phase | Document | Status |
|-------|----------|--------|
| 1 | `notes/specs/feature-name.md` | This doc |
| 1 | `notes/architecture/data-model.md` updates | If schema changes |

---

*Created: [date]*
*Status: [Phase X in progress]*
*Cross-reference: ROADMAP.md (Block X)*
```

## Conventions

- Include a **Terminology Note** section if code names differ from UI names
- Include a **Cross-reference** to `ROADMAP.md` blocks
- Use `[ ]` checkboxes for implementation tasks
- Document **key decisions** with rationale ("Why X, not Y")
- Document what's **deferred** and why — this prevents re-litigating later
- End with a **Documents to Produce** table linking related docs

## Relationship to ROADMAP.md

- Specs contain implementation details. ROADMAP.md contains priority and status.
- When adding a new feature, add a row to the priority table in `notes/ROADMAP.md`.
- Reference the spec from ROADMAP: `**See:** notes/specs/feature-name.md`
- When a feature ships, update ROADMAP status but keep the spec in `notes/specs/`.

## Examples

Good specs to reference:
- `notes/specs/event-discovery-spec.md` — Multi-phase feature with performer model, search, filters
- `notes/archive/friend-links-spec.md` — Completed feature with clear phases and deferred items

## Key Files

| File | Purpose |
|------|---------|
| `notes/ROADMAP.md` | Priority table and backlog |
| `notes/specs/` | Active feature specs |
| `notes/archive/` | Completed/superseded specs |
| `notes/vision/product-vision.md` | Product philosophy for alignment |
