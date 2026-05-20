# Phase 3: Product Process Settings - Context

**Gathered:** 2026-05-20
**Status:** In progress

<domain>
## Phase Boundary

Product-level process settings beyond material type schemas: optional storage stage after production, registration material balance defaults on product/order snapshot, and relaxed production action input validation.

In scope:
- Product editor toggles storage stage and required flags on default storage fields.
- Order snapshots include storage config and effective registration material balance rows.
- Runtime order inserts storage stage when snapshot enables it.
- Registration renders material balance from order snapshot (not hard-coded thrombogel rows only).
- Production action checkbox can be required while attached input value stays optional.

Out of scope:
- Independent QC panel (Phase 4).
- Privileged correction audit (Phase 5).
- Actual warehouse stock decrement (prototype stores intent only).

</domain>

<decisions>
## Implementation Decisions

- **D-01:** Storage is a product setting (`ProcessTemplate.storageStage`), snapshotted to `order.settingsSnapshot.storage`.
- **D-02:** Storage stage is inserted after `production` in runtime order stages when enabled.
- **D-03:** Registration material balance rows come from material type; product can override default quantities and write-off flag per row for new orders.
- **D-04:** Snapshot stores `registrationMaterialBalance` separately from live material type settings.
- **D-05:** Storage stage permissions map to production permissions in the prototype.
- **D-06:** Action input values are never required for step completion; only the action done checkbox can be required.

</decisions>

---
*Phase: 03-product-process-settings*
