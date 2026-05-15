# Phase 1: Product and Material Settings Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15
**Phase:** 1-Product and Material Settings Foundation
**Areas discussed:** Material type model, admin placement, product/order snapshot, incoming sample ID

---

## Material Type Model

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed-code material types | Material type list is defined in code for now | ✓ |
| Admin-created material types | Admin can create arbitrary new material types | |
| Multiple material types per product | Product can support more than one material type | |

**User's choice:** Fixed-code list, one material type per product.
**Notes:** User explicitly said product can have only one material type and the material type list is fixed in code.

---

## Admin Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Separate material type settings page | Global material schemas are administered outside product editor | ✓ |
| Inline in product settings | Product editor also manages material type field schemas | |

**User's choice:** Separate page.
**Notes:** User explicitly asked for a separate page so product settings and material type settings are not mixed.

---

## Product and Order Snapshot

| Option | Description | Selected |
|--------|-------------|----------|
| Snapshot settings into new order | Product changes affect only future orders | ✓ |
| Live-link order to product settings | Existing orders update when product settings change | |

**User's choice:** Snapshot settings into new orders.
**Notes:** User explicitly said changes in product settings should influence only new orders.

---

## Incoming Sample ID

| Option | Description | Selected |
|--------|-------------|----------|
| `YYYYMMDD-001`, global sequence | Date prefix plus padded global counter | ✓ |
| Daily reset | Counter resets each date | |
| Yearly reset | Counter resets each year | |

**User's choice:** `YYYYMMDD-001`, global/skvoznoi sequence.
**Notes:** User explicitly said the counter is global, not reset by date.

---

## the agent's Discretion

- Exact route path and filename for material type settings.
- Exact localStorage key and TypeScript type names, if consistent with current codebase patterns.
- Whether to put material type settings inside `bio-production` or a separate storage key, as long as order snapshots are stable.

## Deferred Ideas

- Phase 2: material-driven registration and incoming control rendering.
- Phase 3: storage stage settings and registration material balance.
- Phase 4: independent QC panel.
- Phase 5: privileged correction group and audit log.

