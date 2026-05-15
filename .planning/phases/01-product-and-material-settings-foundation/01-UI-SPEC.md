---
phase: 01
slug: product-and-material-settings-foundation
status: approved
shadcn_initialized: false
preset: none
created: 2026-05-15
---

# Phase 01 — UI Design Contract

> Visual and interaction contract for Phase 1: Product and Material Settings Foundation.

---

## Scope

Phase 1 UI covers:

- New admin page for global material type settings.
- Admin navigation entry for material type settings.
- Product editor field for selecting exactly one material type.
- Visual treatment for order snapshot/ID foundation only where Phase 1 touches visible UI.

Phase 1 UI does not cover:

- Full material-driven registration rendering in the order card.
- Storage stage runtime UI.
- Registration material balance runtime UI.
- Independent QC panel.
- Privileged correction/audit UI.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | Headless UI is already available; use native controls unless existing page patterns need Headless UI |
| Icon library | none installed; reuse current inline SVG icon pattern for this phase |
| Font | System sans-serif via Tailwind/browser default |

No shadcn or new visual kit is introduced in Phase 1.

---

## Page Contract

### Admin Navigation

- Add sidebar item under `Администрирование`.
- Label: `Типы материала`.
- Recommended route: `/admin/tipy-materiala`.
- Keep item visually consistent with existing `Пользователи` and `Продукты` links.

### Material Types Page

Page title: `Типы материала`

Supporting copy:
`Настройка полей регистрации и входного контроля для фиксированных типов материала.`

Primary layout:

- Full-width page content with `p-6 md:p-8`, matching `UsersAdminPage` and `ConstructorV2ListPage`.
- Header row with title/description on the left.
- No oversized hero, no marketing copy, no decorative background.
- Use one main table/list for material types and an editor area below or beside it depending on available width.

Material type list:

| Column | Copy / Content |
|--------|----------------|
| Тип материала | `Кровь`, `Кожа` |
| Поля забора | Count of configured collection fields |
| Входной контроль | Count of configured incoming-control fields |
| Действия | Edit/view action |

Editor sections:

1. `Общее`
   - Read-only material type code.
   - Editable display label only if the data model allows it; otherwise label is fixed.
2. `Забор`
   - Field table for registration collection fields.
3. `Входной контроль`
   - Field table for incoming control fields.

Field table columns:

| Column | Control |
|--------|---------|
| Название поля | text input |
| Тип | select: `Текст`, `Число`, `Дата`, `Чекбокс`, `Список` |
| Обязательное | checkbox |
| Значение по умолчанию | input matching selected type where practical; text fallback is acceptable |
| Ед. изм. | short text input |
| Подсказка | text input or compact textarea |
| Действия | icon button for delete |

For `Список`, show options as a compact textarea or comma/newline-separated field with helper copy:
`Каждый вариант с новой строки.`

### Product Editor

Add material type selection near product-level identity settings, before stage tabs.

Label: `Тип материала`

Helper text:
`Используется для полей регистрации и входного контроля в новых заказах. Уже созданные заказы не изменяются.`

Control:

- Single select.
- Options: fixed material type labels.
- No multi-select.
- Required.

If product already has linked orders or is otherwise locked by existing product rules, material type control follows the same locked/read-only behavior as other product settings.

---

## Interaction States

### Empty States

Material type list should normally never be empty because types are fixed in code.

If empty due to corrupted storage:

- Heading: `Типы материала не найдены`
- Body: `Очистите локальные настройки или восстановите стандартные типы материала.`
- CTA if implemented: `Восстановить типы`

Field section with no fields:

- Heading: `Поля не настроены`
- Body: `Добавьте поле, чтобы оно появилось в новых заказах для этого типа материала.`
- CTA: `Добавить поле`

### Validation

Inline errors should appear under the affected control in red text.

Validation copy:

| Situation | Copy |
|-----------|------|
| Empty field name | `Укажите название поля.` |
| Empty select options | `Добавьте хотя бы один вариант списка.` |
| Duplicate field name in section | `Поле с таким названием уже есть в этом разделе.` |
| Missing product material type | `Выберите тип материала для продукта.` |

Do not block editing unrelated rows because another row has an error; block save/apply for invalid section data.

### Snapshot Warning

When editing material type settings, show a compact neutral note near the editor actions:

`Изменения применяются только к новым заказам. Уже созданные заказы сохраняют свои поля.`

This should be informational, not a modal.

### Destructive Confirmation

Deleting a custom field:

`Удалить поле «{fieldName}»? Оно исчезнет только из настроек для новых заказов.`

Deleting fixed material types is not allowed in Phase 1.

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, checkbox/input micro gaps |
| sm | 8px | Table cell inner gaps, compact row controls |
| md | 16px | Form groups, page section spacing |
| lg | 24px | Page header to content, table/editor gaps |
| xl | 32px | Major page blocks |
| 2xl | 48px | Rare; only between unrelated full page sections |
| 3xl | 64px | Not used in Phase 1 admin UI |

Exceptions: existing `p-6 md:p-8` page padding is retained for consistency.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 400 | 1.5 |
| Label | 12px | 500 | 1.4 |
| Table header | 12px | 500 | 1.4 |
| Section heading | 14px | 600 | 1.4 |
| Page heading | 20-24px | 600 | 1.25 |
| Helper text | 12-14px | 400 | 1.45 |

Do not use hero/display typography in admin pages.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `slate-100`, `white` | Page background and surfaces |
| Secondary (30%) | `slate-50`, `slate-200`, `slate-600` | Tables, borders, muted text |
| Accent (10%) | `blue-600` | Primary save/create action, selected tab/control |
| Success | `emerald-50`, `emerald-700` | Non-primary success/status if needed |
| Warning | `amber-50`, `amber-800` | Snapshot/storage-style notices |
| Destructive | `red-600`, `red-700`, `red-50` | Delete actions and validation errors |

Accent reserved for:

- Primary action buttons.
- Selected tab/list item state.
- Focus ring.
- Current selected material type when represented as a chip/badge.

Do not make the whole page blue/slate-only. Use amber for snapshot notices and red for destructive/invalid states so status meaning is visible.

---

## Components and Controls

### Buttons

- Primary: `rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700`.
- Secondary: `rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50`.
- Destructive: red text/border or red menu item, matching existing constructor patterns.
- Icon buttons: square/compact `p-2`, with `aria-label` and `title`.

### Inputs

- Use current input style: `rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800`.
- Focus: blue border/ring consistent with existing admin pages.
- Disabled/read-only: `bg-slate-50 text-slate-500`, no hidden controls.

### Tables

- Tables use `rounded-lg border border-slate-200 bg-white shadow-sm`.
- Header: `bg-slate-50 text-left text-slate-600`.
- Rows: `border-t border-slate-100`, hover `bg-slate-50/80` if row is clickable.
- Avoid nested cards inside table cells.

### Badges

- Fixed type/code badge: `rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700`.
- Selected/active badge may use `blue-50 text-blue-900 ring-blue-600/20`.

---

## Responsive Behavior

- Desktop: material type list and editor can use a two-column layout if it remains readable.
- Tablet/mobile: stack list and editor vertically.
- Tables must retain horizontal scroll with `overflow-x-auto` and a stable min width.
- Form controls wrap naturally; labels must not overlap values.
- Buttons should remain visible without squeezing text; move secondary actions to the next line if needed.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Admin nav item | `Типы материала` |
| Material types page title | `Типы материала` |
| Material types page description | `Настройка полей регистрации и входного контроля для фиксированных типов материала.` |
| Primary CTA | `Сохранить настройки` |
| Add collection field CTA | `Добавить поле забора` |
| Add incoming control field CTA | `Добавить показатель ВК` |
| Empty state heading | `Поля не настроены` |
| Empty state body | `Добавьте поле, чтобы оно появилось в новых заказах для этого типа материала.` |
| Snapshot note | `Изменения применяются только к новым заказам. Уже созданные заказы сохраняют свои поля.` |
| Error state | `Проверьте обязательные поля и варианты списков.` |
| Destructive confirmation | `Удалить поле «{fieldName}»? Оно исчезнет только из настроек для новых заказов.` |

Use `ВК` only where the existing UI already uses the abbreviation or table space is tight. Prefer `Входной контроль` in headings.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party registry | none | not allowed in Phase 1 |

No external block registry is used.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-05-15

