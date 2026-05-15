# Requirements: BioTrack Prototype

**Defined:** 2026-05-15
**Core Value:** Users can create and manage a production order from a configured product while the order captures the right material-specific registration, control, storage, production, and QC data without hard-coded process assumptions.

## v1 Requirements

### Order Creation

- [ ] **ORD-01**: User can create an order by selecting only a product.
- [ ] **ORD-02**: A new order receives an incoming sample ID formatted as `YYYYMMDD-001`, with the numeric part padded to three digits.
- [ ] **ORD-03**: Incoming sample ID sequencing is global across orders, not reset by date.
- [ ] **ORD-04**: A created order snapshots product and material settings so later settings changes affect only new orders.

### Material Types

- [ ] **MAT-01**: Admin can open a separate material type settings page outside the product editor.
- [ ] **MAT-02**: Admin can configure fixed-code material types such as `Кровь` and `Кожа`; products can select exactly one material type.
- [ ] **MAT-03**: Admin can configure registration collection fields per material type.
- [ ] **MAT-04**: Admin can configure incoming control fields per material type.
- [ ] **MAT-05**: Configurable fields support text, number, date, checkbox, and select types.
- [ ] **MAT-06**: Each configurable field supports required flag, default value, unit, and help text.
- [ ] **MAT-07**: Blood material type defaults include current fields `Объём забранной крови (мл)` and `Тип контейнера`.
- [ ] **MAT-08**: Skin material type defaults include biopsy/site/container/fixation-oriented fields from `.planning/research/MATERIAL_AND_STORAGE_NOTES.md`.
- [ ] **MAT-09**: Incoming control requiredness follows the current order creation form behavior unless explicitly changed in material type settings.

### Product Settings

- [ ] **PROD-01**: Product settings include exactly one selected material type.
- [ ] **PROD-02**: Product settings can enable or disable one storage stage after production.
- [ ] **PROD-03**: If storage is enabled, product settings define storage input fields and defaults.
- [ ] **PROD-04**: Product settings define registration material balance rows with consumable, default quantity, and write-off-on-completion flag.
- [ ] **PROD-05**: Registration material balance write-off flag defaults to off.
- [ ] **PROD-06**: Product settings expose default material balance quantities for registration and production steps.
- [ ] **PROD-07**: Material balance consumables are chosen from the same consumable dictionary/source used by production step configuration.

### Order Runtime

- [ ] **RUN-01**: Registration section renders collection fields from the order's material type snapshot.
- [ ] **RUN-02**: Registration section renders incoming control fields from the order's material type snapshot.
- [ ] **RUN-03**: Registration section renders registration material balance from the order/product snapshot.
- [ ] **RUN-04**: If storage is enabled for the order's product snapshot, storage appears after production with configured fields.
- [ ] **RUN-05**: If storage is disabled, the order flow omits storage.
- [ ] **RUN-06**: Completing registration or production records material balance values but does not decrement stock in the prototype.
- [ ] **RUN-07**: Order completion is not blocked by missing consumable stock.

### Production Actions

- [ ] **ACT-01**: Input fields attached to actions inside production steps are optional.
- [ ] **ACT-02**: A required production action can be completed even when its attached input value is empty.

### Quality Control

- [ ] **QC-01**: Quality control appears as a separate tab or panel in the order card, independent from the main stage line.
- [ ] **QC-02**: User can fill QC before release, after release, or after order completion.
- [ ] **QC-03**: User can complete release/order even when QC is not filled.
- [ ] **QC-04**: QC deviations do not change the order status.
- [ ] **QC-05**: Order UI shows a separate QC deviation badge when QC contains deviations.

### Permissions and Audit

- [ ] **PERM-01**: Admin can assign users to a new group for privileged order correction.
- [ ] **PERM-02**: Users in that group can edit all data on all order stages, including completed stages.
- [ ] **PERM-03**: Edits made after a stage is completed are logged with user, timestamp, field/action, old value, and new value.
- [ ] **PERM-04**: Normal users keep existing read/edit behavior and cannot silently change completed stages.

## v2 Requirements

### Persistence and Inventory

- **INV-01**: Material balance write-off flags decrement real stock after backend or durable inventory persistence exists.
- **INV-02**: Consumable shortages can warn or block completion once real inventory enforcement is in scope.

### Material Types

- **MAT2-01**: Admin can create new material types dynamically instead of using a fixed-code list.
- **MAT2-02**: A product can support multiple material types if customer workflow changes.

### Audit

- **AUD-01**: Audit log can be exported or filtered across all orders.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real stock deduction | Customer explicitly said write-off flag does nothing yet in prototype |
| Stock shortage checks | Customer explicitly said do nothing when consumables are unavailable |
| Editing existing orders after product config changes | Customer said changes affect only new orders |
| Dynamic material type creation | Customer said material type list is fixed in code |
| Multiple material types per product | Customer said product can have only one material type |
| Backend authorization | Current app is a localStorage prototype with mock permissions |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ORD-01 | Phase 2 | Pending |
| ORD-02 | Phase 1 | Pending |
| ORD-03 | Phase 1 | Pending |
| ORD-04 | Phase 1 | Pending |
| MAT-01 | Phase 1 | Pending |
| MAT-02 | Phase 1 | Pending |
| MAT-03 | Phase 2 | Pending |
| MAT-04 | Phase 2 | Pending |
| MAT-05 | Phase 1 | Pending |
| MAT-06 | Phase 1 | Pending |
| MAT-07 | Phase 2 | Pending |
| MAT-08 | Phase 2 | Pending |
| MAT-09 | Phase 2 | Pending |
| PROD-01 | Phase 1 | Pending |
| PROD-02 | Phase 3 | Pending |
| PROD-03 | Phase 3 | Pending |
| PROD-04 | Phase 3 | Pending |
| PROD-05 | Phase 3 | Pending |
| PROD-06 | Phase 3 | Pending |
| PROD-07 | Phase 3 | Pending |
| RUN-01 | Phase 2 | Pending |
| RUN-02 | Phase 2 | Pending |
| RUN-03 | Phase 3 | Pending |
| RUN-04 | Phase 3 | Pending |
| RUN-05 | Phase 3 | Pending |
| RUN-06 | Phase 3 | Pending |
| RUN-07 | Phase 3 | Pending |
| ACT-01 | Phase 3 | Pending |
| ACT-02 | Phase 3 | Pending |
| QC-01 | Phase 4 | Pending |
| QC-02 | Phase 4 | Pending |
| QC-03 | Phase 4 | Pending |
| QC-04 | Phase 4 | Pending |
| QC-05 | Phase 4 | Pending |
| PERM-01 | Phase 5 | Pending |
| PERM-02 | Phase 5 | Pending |
| PERM-03 | Phase 5 | Pending |
| PERM-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0

---
*Requirements defined: 2026-05-15*
*Last updated: 2026-05-15 after customer feedback scoping*

