---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: phase-3-next
last_updated: "2026-05-20T12:00:00.000Z"
progress:
  total_phases: 5
  completed_phases: 2
  total_plans: 16
  completed_plans: 6
  percent: 38
---

# Project State

**Last Updated:** 2026-05-20

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-15)

**Core value:** Users can create and manage a production order from a configured product while the order captures the right material-specific registration, control, storage, production, and QC data without hard-coded process assumptions.
**Current focus:** Phase 3: Product Process Settings

## Current Milestone

**Name:** Customer feedback: configurable order creation and product settings
**Status:** Phase 2 complete; Phase 3 not started
**Roadmap:** `.planning/ROADMAP.md`
**Requirements:** `.planning/REQUIREMENTS.md`
**Codebase map:** `.planning/codebase/`

## Completed Phases

**Phase 1** — Product and Material Settings Foundation (2026-05-15). See `.planning/phases/01-product-and-material-settings-foundation/`.

**Phase 2** — Material-Driven Registration (2026-05-20). Context: `.planning/phases/02-material-driven-registration/02-CONTEXT.md`; summaries: `02-01-SUMMARY.md`, `02-02-SUMMARY.md`.

Next recommended GSD step:

```text
$gsd-plan-phase 3
```

## Decisions to Preserve

- Product has exactly one material type.
- Material type list is fixed in code for this milestone.
- Material type settings live on a separate admin page.
- Product changes affect only newly created orders.
- Registration material balance rows are configured on material type settings; product storage and production defaults remain later work.
- QC is independent from release/order completion.
- QC deviations show a badge but do not change order status.
- Privileged correction can edit completed stages and must be audited.
- Material balance write-off flag stores intent only; no stock decrement in prototype.

## Open Questions

- Confirm whether storage fields use the existing date control only, or need a datetime-like text input until a datetime field type is added (Phase 3).

## Recent Activity

- Phase 2 plan 02-02 complete: blood/skin defaults aligned with research; field merge by id in `ProductionContext`.
- Phase 2 plan summary added: `.planning/phases/02-material-driven-registration/02-01-SUMMARY.md`.
- Material type settings editor switched to autosave and save button removed; select-options editing UX fixed.
- Incoming control settings gained configurable `okOption` per select field.
- Registration runtime now renders collection and incoming-control fields from order material snapshot.
- Incoming control badge sentiment in registration now follows configured `okOption` with legacy fallback behavior.
- Material type editor reworked to list/editor structure matching Products; editor tabs are `Забор`, `Материальный баланс`, `Входной контроль`.
- Material balance settings are stored on material types as rows from `ACTION_CONSUMABLE_CATALOG` with default quantity and informational write-off-on-registration-complete flag.
- Phase 1 completed on branch `codex-phase-1-foundation-wip`: material type settings model, admin page `/admin/tipy-materiala`, product material type selector, global padded incoming sample IDs, and order settings snapshots.
- Phase 1 summaries created for plans 01-01, 01-02, and 01-03.
- `npm run build` passed after Phase 1; Vite warned that JS chunk is larger than 500 kB.
- Session close checkpoint: `npm run build` passed; Vite warned that JS chunk is larger than 500 kB.
- Phase 1 UI design contract approved in `.planning/phases/01-product-and-material-settings-foundation/01-UI-SPEC.md`.
- Phase 1 context captured in `.planning/phases/01-product-and-material-settings-foundation/01-CONTEXT.md`.
- GSD codebase map created in `.planning/codebase/`.
- GSD project initialization started from customer feedback.
- Lightweight external notes for skin material and storage defaults captured in `.planning/research/MATERIAL_AND_STORAGE_NOTES.md`.
