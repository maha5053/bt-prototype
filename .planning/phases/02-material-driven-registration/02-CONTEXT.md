# Phase 2: Material-Driven Registration - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase shifts order registration from hard-coded material logic to configuration-driven behavior based on material type settings already introduced in Phase 1.

In scope:
- Runtime registration reads collection fields from the order's material snapshot.
- Runtime registration reads incoming-control fields from the order's material snapshot.
- Order creation path supports creating an order by selecting only a product.
- Blood and skin defaults are aligned with current business expectations and research notes.
- Material-specific requiredness for incoming control follows current behavior unless changed in material settings.

Out of scope for this phase:
- Registration material balance runtime block (Phase 3).
- Storage-stage product settings/runtime behavior (Phase 3).
- Independent QC panel/runtime decoupling (Phase 4).
- Privileged correction and audit behavior (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Runtime Rendering Strategy
- **D-01:** Existing orders remain snapshot-driven; runtime must render from order snapshot data, not live material-type settings.
- **D-02:** Registration keeps system-level/common fields (patient/order context) as-is; only material-specific collection and incoming-control sections become snapshot-driven.
- **D-03:** If snapshot data is partially missing on legacy orders, runtime uses safe fallback behavior without crashing.

### Order Creation
- **D-04:** User creates an order by selecting only a product (`ORD-01`); selected product already provides material type through product settings.
- **D-05:** New orders continue to snapshot material settings at creation time so later admin changes affect only future orders.

### Defaults and Requiredness
- **D-06:** Blood defaults include current operational fields: `Объём забранной крови (мл)` and `Тип контейнера` (`MAT-07`).
- **D-07:** Skin defaults include researched biopsy/site/container/fixation-oriented fields (`MAT-08`).
- **D-08:** Incoming-control requiredness should match current order form behavior unless explicitly changed in material type settings (`MAT-09`).

### the agent's Discretion
- Keep exact component split (single registration renderer vs section subcomponents) flexible as long as behavior stays snapshot-driven and readable.
- Choose fallback UX for missing/invalid snapshot fields (skip field vs neutral placeholder) while preserving backward compatibility.
- Choose whether to normalize snapshot field arrays at order-creation time, runtime-read time, or both.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/ROADMAP.md` — Phase sequence, goals, and plan list.
- `.planning/REQUIREMENTS.md` — Phase 2 requirement IDs: `ORD-01`, `MAT-03`, `MAT-04`, `MAT-07`, `MAT-08`, `MAT-09`, `RUN-01`, `RUN-02`.
- `.planning/STATE.md` — preserved decisions and Phase 2 open questions.

### Existing Phase 1 Outputs
- `.planning/phases/01-product-and-material-settings-foundation/01-CONTEXT.md`
- `.planning/phases/01-product-and-material-settings-foundation/01-02-SUMMARY.md`
- `.planning/phases/01-product-and-material-settings-foundation/01-03-SUMMARY.md`

### Code Areas
- `src/pages/ProductionPages.tsx` — registration runtime rendering and completion logic.
- `src/context/ProductionContext.tsx` — order creation and snapshot plumbing.
- `src/mocks/productionData.ts` — material type defaults and order seed structure.
- `src/pages/MaterialTypesAdminPage.tsx` — admin editor for collection/incoming fields.

### Repo Memory
- `AGENTS.md` — current working rules and constraints.
- `agents-done.md` — recent implementation history and behavior notes.

</canonical_refs>

<code_context>
## Existing Code Insights

### Current Assets from Phase 1
- Material type admin list/editor exists with `Забор`, `Материальный баланс`, `Входной контроль` tabs.
- Product template stores exactly one material type code.
- New order snapshots already include material settings payload.
- Default blood and skin field sets exist in `DEFAULT_MATERIAL_TYPE_SETTINGS`.

### Phase 2 Integration Points
- Registration rendering in `ProductionPages.tsx` still contains hard-coded material-specific sections that must be replaced with snapshot-driven sections.
- Order creation UX in production journal/order creation must be reduced to product-only selection.
- Incoming-control requiredness must be aligned between material settings and runtime validation.

</code_context>

<specifics>
## Specific Ideas

- Keep runtime field rendering generic by field type (`text`, `number`, `date`, `checkbox`, `select`) to avoid per-material branching.
- Render sections in a stable order: system fields first, then collection, then incoming control.
- Use deterministic field IDs and labels from snapshot so completed orders remain readable even after config changes.

</specifics>

<open_questions>
## Open Questions

- Confirm if any existing patient/system fields currently in registration should also become configurable in Phase 2, or remain system-owned.
- Confirm if incoming control defaults should be prefilled only on new orders, or also auto-applied when legacy orders miss values.

</open_questions>

<deferred>
## Deferred Ideas

- Registration material balance runtime rendering and value capture (Phase 3).
- Product storage stage settings and runtime stage insertion (Phase 3).
- QC panel decoupling and post-release behavior (Phase 4).
- Privileged correction permissions and audit logging (Phase 5).

</deferred>

---

*Phase: 2-Material-Driven Registration*
*Context gathered: 2026-05-20*
