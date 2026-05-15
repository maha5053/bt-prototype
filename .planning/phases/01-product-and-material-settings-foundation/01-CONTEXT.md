# Phase 1: Product and Material Settings Foundation - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase establishes the foundation for configurable product-driven order creation. It covers material type data structures, configurable field metadata, a separate admin surface for material types, product-level material type selection, incoming sample ID formatting/sequencing, and snapshot behavior for new orders.

In scope:
- Fixed-code material type model and defaults.
- Configurable field schema for text, number, date, checkbox, and select.
- Field metadata: required flag, default value, unit, help text.
- Separate admin page for material type settings.
- Product editor selects exactly one material type.
- New orders snapshot product/material settings.
- Incoming sample ID format `YYYYMMDD-001` with globally increasing sequence.

Out of scope for this phase:
- Rendering full material-driven registration and incoming control in the order card; that is Phase 2.
- Storage stage and registration material balance runtime behavior; that is Phase 3.
- Independent QC panel; that is Phase 4.
- Privileged correction and audit; that is Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Material Type Model
- **D-01:** Product has exactly one material type; multiple material types per product are not allowed.
- **D-02:** Material type list is fixed in code for this milestone. Initial material types are `Кровь` and `Кожа`.
- **D-03:** Material type settings are global per material type, not duplicated inside every product.
- **D-04:** Material type settings own field schemas for registration collection and incoming control.
- **D-05:** Field types must support `text`, `number`, `date`, `checkbox`, and `select`.
- **D-06:** Every configurable field supports required flag, default value, unit, and help text.

### Admin Placement
- **D-07:** Material type settings must live on a separate admin page, not inside product settings.
- **D-08:** Use a normal admin navigation entry for the new page. Recommended label: `Типы материала`; exact route and filename are implementation details for the planner.
- **D-09:** Product settings should show material type as a single-select field, likely near the top-level product identity/settings area.

### Product and Order Snapshot
- **D-10:** Product setting changes affect only newly created orders.
- **D-11:** Order creation must snapshot the effective product/material settings needed by runtime order rendering.
- **D-12:** Snapshot should include at least selected material type, collection field schema, incoming control field schema, storage config placeholder if present in product data model, and any registration/production defaults that later phases need.
- **D-13:** Existing orders should continue using their own stored snapshot even if the product or material type is changed later.

### Incoming Sample ID
- **D-14:** Incoming sample ID format is `YYYYMMDD-001`.
- **D-15:** The numeric part is padded to three digits.
- **D-16:** The counter is global/skvoznoi across orders and does not reset per day.
- **D-17:** The date prefix still uses the order creation date, so a later order can have a later date with the next global padded sequence.

### Initial Defaults
- **D-18:** Blood material type starts with existing collection fields from current order registration: `Объём забранной крови (мл)` and `Тип контейнера`.
- **D-19:** Skin material type starts with defaults based on research notes: anatomical site/biopsy site, biopsy type, fragment count/size, orientation, container/medium/fixative, fixation time, and clinical indication/history where useful.
- **D-20:** Incoming control defaults should be moved from the current hard-coded creation/order form into material type settings in Phase 2, but Phase 1 should make the data model ready.

### the agent's Discretion
- Choose exact TypeScript type names and storage keys, while keeping them readable and consistent with existing `src/context/*Context.tsx` and `src/mocks/*` patterns.
- Choose exact route path for material type settings under `/admin/...`, with preference for a Russian transliteration path consistent with existing routes.
- Decide whether the first implementation stores material type settings in `bio-production` or a separate localStorage key, as long as snapshot semantics are stable and future phases can consume it.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### GSD Planning
- `.planning/PROJECT.md` — Current project purpose, core value, constraints, and customer decisions.
- `.planning/REQUIREMENTS.md` — Phase 1 requirement IDs: `ORD-02`, `ORD-03`, `ORD-04`, `MAT-01`, `MAT-02`, `MAT-05`, `MAT-06`, `PROD-01`.
- `.planning/ROADMAP.md` — Phase boundaries and sequencing.
- `.planning/STATE.md` — Current project state and open questions.

### Codebase Map
- `.planning/codebase/ARCHITECTURE.md` — React/localStorage architecture, production order flow, and key abstractions.
- `.planning/codebase/STRUCTURE.md` — File ownership and likely edit locations.
- `.planning/codebase/CONVENTIONS.md` — Existing patterns for routes, context providers, mocks, and localStorage.
- `.planning/codebase/CONCERNS.md` — Fragile areas around production runtime, constructor overlap, and lack of tests.

### Domain Notes
- `.planning/research/MATERIAL_AND_STORAGE_NOTES.md` — Researched defaults for skin material fields and storage defaults for later phases.

### Repo Memory
- `AGENTS.md` — Hard project rules, GitHub Pages base path, git policy, protected seed warning.
- `agents-done.md` — Implemented features and historical behavior.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/mocks/productionData.ts`: Defines `ProcessTemplate`, `StageTemplate`, `StepTemplate`, field types, consumables, equipment, production orders, and template-to-order helpers. Phase 1 will likely extend this model or add adjacent material-type types.
- `src/context/ProductionContext.tsx`: Owns production templates, orders, field registry, order creation, storage loading/saving, and runtime mutations. Snapshot logic for new orders likely belongs here or in helpers it calls.
- `src/pages/ConstructorV2Pages.tsx`: Product/ver2 admin surface. Product-level material type selection likely belongs here.
- `src/pages/ConstructorPages.tsx`: Legacy/shared constructor editor patterns; inspect before adding product settings so old/new constructor behavior is not confused.
- `src/pages/UsersAdminPage.tsx` and `src/config/navigation.ts`: Good examples for adding admin navigation/page entries.

### Established Patterns
- Routes are centralized in `src/App.tsx`.
- Sidebar and top navigation are centralized in `src/config/navigation.ts`.
- Persistent prototype data uses localStorage with defensive `try/catch` loaders.
- Context providers expose module-specific mutation functions rather than a generic global store.
- Mock seed data and domain types are often colocated in `src/mocks/*Data.ts`.

### Integration Points
- Add new admin route in `src/App.tsx`.
- Add new admin sidebar item in `src/config/navigation.ts`.
- Add material type settings page under `src/pages`.
- Wire material type/product settings into production template/order creation in `src/context/ProductionContext.tsx` and production mocks/helpers.
- Preserve GitHub Pages routing with `basename: import.meta.env.BASE_URL`.

</code_context>

<specifics>
## Specific Ideas

- Material type admin page should be separate from product settings to keep global material schemas distinct from product configuration.
- Product editor should not ask about order creation details beyond selecting the material type in Phase 1.
- Snapshot behavior is essential: old orders are historical documents and should not drift when settings change.
- Treat write-off behavior, storage stage runtime, and independent QC as future phases even if data model placeholders make later work easier.

</specifics>

<deferred>
## Deferred Ideas

- Material-driven registration and incoming control rendering belongs to Phase 2.
- Storage stage fields and product storage toggle belong to Phase 3.
- Registration material balance settings and defaults belong to Phase 3.
- Independent QC tab/panel belongs to Phase 4.
- Privileged completed-stage editing and audit log belongs to Phase 5.

</deferred>

---

*Phase: 1-Product and Material Settings Foundation*
*Context gathered: 2026-05-15*

