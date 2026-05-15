# Roadmap: BioTrack Prototype

## Overview

This milestone turns the existing order/product prototype into a configurable order workflow: material type settings become first-class, products snapshot material and process settings into new orders, registration and incoming control stop being hard-coded, optional storage and material balance defaults are supported, QC becomes independent, and privileged correction is audited.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions if discovered mid-milestone

- [ ] **Phase 1: Product and Material Settings Foundation** - Add stable data model, admin navigation, sample ID sequencing, and snapshot rules.
- [ ] **Phase 2: Material-Driven Registration** - Move collection and incoming control fields into material type settings and order creation.
- [ ] **Phase 3: Product Process Settings** - Add storage and registration material balance settings, defaults, and optional action inputs.
- [ ] **Phase 4: Independent Quality Control** - Split QC from the main order stage line and allow QC at any time.
- [ ] **Phase 5: Privileged Corrections and Audit** - Add correction group/permission and post-completion edit logging.

## Phase Details

### Phase 1: Product and Material Settings Foundation
**Goal**: Establish the data structures and admin surface needed for configurable material/product order creation.
**Depends on**: Nothing (first phase)
**Requirements**: ORD-02, ORD-03, ORD-04, MAT-01, MAT-02, MAT-05, MAT-06, PROD-01
**Success Criteria** (what must be TRUE):
  1. New order IDs display as `YYYYMMDD-001` with a global padded sequence.
  2. Material types are fixed-code entities and have a separate admin page.
  3. Product settings select exactly one material type.
  4. New orders snapshot relevant product/material settings.
**Plans**: 3 plans

Plans:
- [ ] 01-01: Add material type and configurable field data model.
- [ ] 01-02: Add material type admin route/navigation and product material-type selection.
- [ ] 01-03: Update incoming sample ID sequencing and order snapshot creation.

### Phase 2: Material-Driven Registration
**Goal**: Render registration collection and incoming control from material type settings instead of hard-coded order fields.
**Depends on**: Phase 1
**Requirements**: ORD-01, MAT-03, MAT-04, MAT-07, MAT-08, MAT-09, RUN-01, RUN-02
**Success Criteria** (what must be TRUE):
  1. User creates an order by selecting only a product.
  2. Blood orders show current collection fields from material type defaults.
  3. Skin orders show researched biopsy/site/container/fixation-style defaults.
  4. Incoming control is configurable by material type and appears in registration.
**Plans**: 3 plans

Plans:
- [ ] 02-01: Implement material type field editor for collection and incoming control.
- [ ] 02-02: Seed blood and skin material type defaults.
- [ ] 02-03: Replace hard-coded registration/incoming-control rendering with snapshot-driven fields.

### Phase 3: Product Process Settings
**Goal**: Add product-controlled storage and registration material balance while preserving production defaults and optional action inputs.
**Depends on**: Phase 2
**Requirements**: PROD-02, PROD-03, PROD-04, PROD-05, PROD-06, PROD-07, RUN-03, RUN-04, RUN-05, RUN-06, RUN-07, ACT-01, ACT-02
**Success Criteria** (what must be TRUE):
  1. Product can enable one storage stage after production and define its fields/defaults.
  2. Product can configure registration material balance rows using existing consumable source.
  3. Material balance rows store default quantities and default-off write-off intent without stock deduction.
  4. Production action input values are optional even when the action is required.
**Plans**: 4 plans

Plans:
- [ ] 03-01: Add storage stage settings to product editor and order snapshots.
- [ ] 03-02: Add registration material balance settings and runtime display.
- [ ] 03-03: Apply product defaults for registration and production material balance.
- [ ] 03-04: Make production action input values optional in validation/completion.

### Phase 4: Independent Quality Control
**Goal**: Make QC a standalone order panel that can be completed before or after release without changing order status.
**Depends on**: Phase 3
**Requirements**: QC-01, QC-02, QC-03, QC-04, QC-05
**Success Criteria** (what must be TRUE):
  1. QC is visible as its own tab or panel outside the main stage timeline.
  2. Release and order completion are allowed even when QC is empty.
  3. QC remains editable after release/completion.
  4. QC deviations show a badge but do not mutate order status.
**Plans**: 3 plans

Plans:
- [ ] 04-01: Refactor order UI to separate QC from the main stage line.
- [ ] 04-02: Relax release/completion dependencies on QC.
- [ ] 04-03: Add QC deviation badge and post-release QC editing behavior.

### Phase 5: Privileged Corrections and Audit
**Goal**: Allow selected users to correct any order stage data, including completed stages, while logging those edits.
**Depends on**: Phase 4
**Requirements**: PERM-01, PERM-02, PERM-03, PERM-04
**Success Criteria** (what must be TRUE):
  1. Admin can assign multiple users to the privileged correction group.
  2. Privileged users can edit completed stage/order data.
  3. Normal users cannot silently edit completed stages.
  4. Post-completion edits record user, timestamp, field/action, old value, and new value.
**Plans**: 3 plans

Plans:
- [ ] 05-01: Add correction group/permission to users admin.
- [ ] 05-02: Apply permission checks to completed-stage editing.
- [ ] 05-03: Add post-completion edit audit log storage and UI.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Product and Material Settings Foundation | 0/3 | Not started | - |
| 2. Material-Driven Registration | 0/3 | Not started | - |
| 3. Product Process Settings | 0/4 | Not started | - |
| 4. Independent Quality Control | 0/3 | Not started | - |
| 5. Privileged Corrections and Audit | 0/3 | Not started | - |

