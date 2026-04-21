# Контекст для агента (bt-prototype/)

Краткий минимум по текущей рабочей копии. Исторический контекст (вне репо) — см. `../agents.md`.

## Последняя сессия (агент)

- **Конструктор ver2 (редактор)**: добавлены блоки **«Действия» / «Расходные материалы и материалы» / «Оборудование»** в этапе `production`; для действий — **обязательность** и опциональное **поле ввода** (label + type `text|number`), UI-правки (кнопка `+ Поле ввода`, удаление иконкой, подзаголовки), шаги — **аккордеон** по клику на заголовок.
  - Файлы: `src/pages/ConstructorPages.tsx`, `src/mocks/constructorV2Catalog.ts`
- **Производство → старт заказов**: модалка «Начать производство» разделена на **«Эталон» (Тромбогель)** и **«Новые» (шаблоны ver2)**; для новых — переход на `/proizvodstvo/:orderId-new?templateId=...` с автосозданием заказа и редиректом на обычный `/proizvodstvo/:orderId`. Runtime-шаблоны `tpl-runtime-v2-*` скрыты из списков конструкторов.
  - Файлы: `src/pages/ProductionPages.tsx`, `src/context/ProductionContext.tsx`, `src/pages/ConstructorV2Pages.tsx`, `src/pages/ConstructorPages.tsx`
- **Runtime-сборка заказа из ver2**: `registration` и `release` берутся как baseline (глубокие копии), `production` — из выбранного шаблона ver2, `quality_control` — минимальный (1 поле `pltWhole`, 150–450, `10^9/л`).
  - Файлы: `src/lib/productionSystemStages.ts`, `src/context/ProductionContext.tsx`
- **Валидация производства (для ver2 действий)**: на шаге производства отображаются **действия** с чекбоксами и полем ввода; **обязательные действия** (со `*`) блокируют завершение шага, защита продублирована в `completeStep`.
  - Файлы: `src/pages/ProductionPages.tsx`, `src/context/ProductionContext.tsx`

## Важные ограничения

- **Эталонный Тромбогель (`tpl-thrombogel`) не менять**: запрещены update/delete/archive на уровне контекста и UI.

