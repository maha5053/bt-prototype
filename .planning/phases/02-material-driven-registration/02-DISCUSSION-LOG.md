# Phase 2: Material-Driven Registration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `02-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 2-Material-Driven Registration
**Areas discussed:** Runtime rendering boundary, order creation flow, defaults strategy

---

## Runtime Rendering Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Replace only material-specific registration sections | Keep system/patient fields as-is, make collection/incoming control snapshot-driven | ✓ |
| Replace full registration form | Move all registration fields into configurable schemas immediately | |

**Current choice:** Replace material-specific sections only.
**Notes:** Aligns with Phase 2 scope and reduces risk to stable system-level fields.

---

## Order Creation Input

| Option | Description | Selected |
|--------|-------------|----------|
| Product-only order creation | User picks product, material derives from product settings | ✓ |
| Product + explicit material re-selection | User manually chooses material on every new order | |

**Current choice:** Product-only creation.
**Notes:** Matches `ORD-01` and Phase 1 decision that product owns exactly one material type.

---

## Runtime Source of Truth

| Option | Description | Selected |
|--------|-------------|----------|
| Order snapshot drives runtime | Existing order keeps historical field definitions | ✓ |
| Live material settings drive runtime | Existing orders mutate when admin changes settings | |

**Current choice:** Order snapshot drives runtime.
**Notes:** Preserves non-breaking historical behavior across old and new orders.

---

## Defaults Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Seed defaults in material settings and snapshot into new orders | Defaults copied during order creation | ✓ |
| Compute defaults at runtime from current global settings | Defaults can drift for existing orders | |

**Current choice:** Defaults live in settings and are snapshotted at creation time.
**Notes:** Compatible with Phase 1 snapshot semantics.

---

## Open Choices to Confirm During Planning

- Whether missing snapshot fields on legacy orders should show a compatibility notice or silently fall back.
- Whether incoming-control requiredness validation should be strict per current settings, or tolerant for in-flight legacy orders.

