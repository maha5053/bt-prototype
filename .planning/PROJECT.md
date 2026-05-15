# BioTrack Prototype

## What This Is

BioTrack Prototype is a client-only React SPA for demonstrating warehouse, product administration, and production order workflows for biomedical/lab operations. The current focus is the customer-reviewed order flow: order creation, product settings, material-type-specific registration and incoming control, optional storage, material balance defaults, permissions, and independent quality control.

## Core Value

Users can create and manage a production order from a configured product while the order captures the right material-specific registration, control, storage, production, and QC data without hard-coded process assumptions.

## Requirements

### Validated

- ✓ User can view an order journal and open an order card — existing.
- ✓ User can administer product/process templates in the products constructor — existing.
- ✓ User can create production orders from product templates — existing.
- ✓ Order registration currently contains blood collection and incoming control fields — existing, but hard-coded.
- ✓ Production steps already support actions, fields, consumables, equipment, and material balance-style configuration — existing.
- ✓ Users, groups, and permissions are simulated in the admin area — existing.
- ✓ The prototype is a GitHub Pages SPA backed by localStorage and mock data — existing.

### Active

- [ ] Incoming sample ID uses `YYYYMMDD-001` formatting with a global sequential counter.
- [ ] Product creation/order creation is product-first: user selects only the product when creating an order.
- [ ] Each product has exactly one fixed-code material type, such as blood or skin.
- [ ] Material type settings are managed on a separate admin page, not mixed into product settings.
- [ ] Material type settings define registration collection fields and incoming control fields.
- [ ] Field settings support text, number, date, checkbox, and select, plus required/default/unit/help text.
- [ ] Blood material type keeps existing collection defaults: blood volume and container type.
- [ ] Skin material type receives researched defaults for biopsy/site/container/fixation-style fields.
- [ ] Incoming control fields move from hard-coded order creation UI into material type configuration.
- [ ] Product settings support an optional single storage stage after production.
- [ ] Storage stage settings define which fields are shown and what defaults they use.
- [ ] Registration material balance is configurable with consumables, default quantities, and a default-off write-off flag.
- [ ] Material balance consumables come from the same dictionary/source used by production step material balance.
- [ ] Product/order snapshots preserve settings so product changes affect only new orders.
- [ ] A new group/permission allows selected users to edit all data on all stages, including completed stages.
- [ ] Edits made after a stage is completed are logged with who changed what and when.
- [ ] Production action input fields are optional even when the action itself is required.
- [ ] Material balance defaults in registration and production are applied from product settings.
- [ ] Quality control is independent from the main registration/production/storage/release line.
- [ ] QC can be filled before or after release/completion, at any moment in the process.
- [ ] QC deviations do not change order status, but show a separate QC deviation badge.

### Out of Scope

- Real stock deduction for material balance write-off flags — prototype records intent only.
- Blocking completion when consumables are unavailable — no stock availability checks for this milestone.
- Multiple material types per product — product has exactly one material type.
- Making material type list user-editable — material type list is fixed in code for now.
- Updating existing orders when product/material settings change — only new orders receive new settings.
- Backend persistence, real authentication, and server-side authorization — current prototype remains localStorage/mock based.

## Context

The customer reviewed the existing order journal and product administration pages and provided concrete changes for the next iteration. The strongest theme is moving hard-coded registration/QC assumptions into configurable product and material-type settings while keeping order creation simple.

The current codebase map identifies production as the richest and most fragile area: `src/pages/ProductionPages.tsx`, `src/context/ProductionContext.tsx`, `src/mocks/productionData.ts`, `src/pages/ConstructorPages.tsx`, `src/pages/ConstructorV2Pages.tsx`, and `src/lib/productionSystemStages.ts` carry most of the order/template/runtime behavior.

External notes for skin material and storage defaults are captured in `.planning/research/MATERIAL_AND_STORAGE_NOTES.md`.

## Constraints

- **Stack**: React 19, Vite 8, TypeScript, React Router 7, Tailwind 4 — stay within current SPA stack.
- **Persistence**: localStorage and mock data only — do not introduce backend storage in this milestone.
- **Deployment**: GitHub Pages base path `/bt-prototype/` must keep working.
- **Compatibility**: Existing orders should remain stable; product setting changes affect new orders only.
- **Seed safety**: Do not manually edit `src/mocks/thrombogelNewSeed.json` unless explicitly instructed.
- **Git**: Commits and pushes happen only by explicit user command.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Product has exactly one material type | Customer explicitly said two material types per product are not allowed | — Pending implementation |
| Material type catalog is fixed in code | Customer wants a fixed list for now | — Pending implementation |
| Material type settings get their own admin page | Avoid mixing product settings and material-type schema settings | — Pending implementation |
| Product/order creation snapshots settings | Customer said setting changes affect only new orders | — Pending implementation |
| QC is independent from the main step line | Customer wants QC before or after release, unrelated to выдача | — Pending implementation |
| Completed stage edits require special permission and audit log | Customer wants privileged correction capability with traceability | — Pending implementation |
| Write-off flag records intent only | Prototype should not decrement stock yet | — Pending implementation |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-15 after GSD initialization from customer feedback*

