# Прототип: что сделано и справка

Дополнение к [`agents.md`](agents.md). Здесь — реализованные области, печать, SPA на Pages, постановки вне репозитория, отладка.

---

## GitHub Pages + SPA (Browser Router)

Прямые URL вида `/bt-prototype/sklad/...` на GitHub Pages не отдаются как файлы — нужен fallback.

1. **`public/404.html`** → в `dist/404.html`: при 404 пишет полный URL в `localStorage` (`spa-redirect`), затем `location.replace` на `/bt-prototype/`.
2. **`src/components/SpaRedirect.tsx`**: читает `spa-redirect`, снимает префикс `import.meta.env.BASE_URL` с `pathname`, `navigate(path, { replace: true })`.
3. **`index.html`**: без inline-скрипта восстановления `/?/...` (конфликтовал со старым механизмом).

В `404.html` нельзя дублировать второй HTML-документ с тем же механизмом.

**История коммитов (ориентир):** `42ba16a`, `d4207a2`, `8f4d8bc`, `ef05949` (стабилизация). Актуальность: `git log --oneline -10`.

**Если белая страница / мигание URL:** `dist/404.html`, `SpaRedirect`, дубликаты редиректов, содержимое `spa-redirect`. Кэш: Ctrl+F5; после `Published` подождать 1–3 мин.

---

## Безопасность

- Не хранить PAT в коде. `credential.helper store` → токен в `~/.git-credentials` открытым текстом — осознанный компромисс.

---

## Плашка «прототип»

- [`src/components/PrototypeDisclaimer.tsx`](src/components/PrototypeDisclaimer.tsx) — снизу `fixed`, `print:hidden`.
- [`src/lib/prototypeDisclaimerStorage.ts`](src/lib/prototypeDisclaimerStorage.ts), событие `bio-prototype-disclaimer-dismiss`; отступ контента — [`usePrototypeDisclaimerBottomPad`](src/hooks/usePrototypeDisclaimerBottomPad.ts) в [`AppLayout`](src/layouts/AppLayout.tsx) и [`WriteOffPrintPage`](src/pages/WriteOffPrintPage.tsx).

## Мобильная вёрстка shell

- [`src/layouts/AppLayout.tsx`](src/layouts/AppLayout.tsx): бургер / сайдбар `< md`, `sticky` шапка, `min-h-0` + `100dvh`, блокировка `body` при drawer.
- Логотип: [`BioTrackLogo.tsx`](src/components/BioTrackLogo.tsx).

---

## Инвентаризация

- Список: `/sklad/inventarizatsiya` → [`InventoryPages.tsx`](src/pages/InventoryPages.tsx); таблица, пагинация 15, без поиска/фильтров в журнале.
- Сессия: `/sklad/inventarizatsiya/:sessionId`; `localStorage` **`bio-inventory`**, [`InventoryContext`](src/context/InventoryContext.tsx).
- Детали UX (модалки, combobox, уникальность строки и т.д.) — в коде и постановках.

---

## Печать списаний

- Из сессии списаний: `window.open(\`${import.meta.env.BASE_URL}sklad/spisaniya/${id}/print\`)`.
- Роут вне layout: `sklad/spisaniya/:sessionId/print` → [`WriteOffPrintPage`](src/pages/WriteOffPrintPage.tsx), `WriteOffProvider`, `bio-writeoffs`.

## Печать акта выдачи (производство)

- Роут: `proizvodstvo/:orderId/print` → [`ProductionReleasePrintPage.tsx`](src/pages/ProductionReleasePrintPage.tsx), `ProductionProvider`, `print-container`, авто `window.print()`.
- Данные: [`src/lib/productionReleaseAct.ts`](src/lib/productionReleaseAct.ts) — сводка выдачи, `isReleaseStageCompleted`, поля пациента из регистрации.
- Меню **⋯** в шапке заказа: «Печать акта выдачи» и «Забраковать» всегда в списке; печать активна после этапа `release`; забраковать — только `in_progress`; `cursor-pointer` на пунктах.

---

## Модуль «Производство» (сводка реализации)

План модуля: `.cursor/plans/production_process_module_e6aef1f7.plan.md` (в воркспейсе Cursor). Файл `tasks/production-ux-plan.md` в воркспейсе удалён; UX-бэклог по производству закрыт в прототипе.

**Суть:** шаблоны процессов → заказы; этапы `registration` / `production` / `quality_control` / `release`; мок «Тромбогель». Роли в шаблоне есть, в UI отключены.

**Код:**

- Данные: [`productionData.ts`](src/mocks/productionData.ts), [`ProductionContext`](src/context/ProductionContext.tsx) — `bio-production`.
- Роуты: `/proizvodstvo`, `/proizvodstvo/:orderId`, печать выдачи; админка [`/admin/konstruktor`](src/config/navigation.ts).
- Журнал: таблица, пагинация 15, фильтры в модалке создания, поиск по ФИО/ИБ и номеру заказа, сортировка колонок, dev-tools сброса `bio-production`.
- Карточка заказа: `StageStepper` (кольцо выбора по состоянию этапа, ховер на кружке и цвет названия), формы шагов, чеклист производства, КК таблицей, выдача с ref-полями и модалкой подтверждения, после завершения этапа — скролл `main` вверх.
- Шаг: опционально `sopRef` / `sopFileName` у `StepTemplate`, ссылка на моковый PDF; ref-поля — `FieldInput` + `tone="crossStageRef"`.
- Конструктор: каркас страниц в `/admin/konstruktor`.

**Дальше по плану модуля (если продолжать):** отложенные результаты КК (defer), правка регистрации без смены текущего этапа, версионирование в UI.

---

## Постановки вне репозитория `bt-prototype/`

В корне воркспейса (путь вида `…/biotrack prototype/`):

- `inventory.html` — оригинал инвентаризации.
- `inventory.v2.html` — актуальная постановка инвентаризации (синхрон с прототипом).

---

## Журнал сессий (кратко)

**2026-04-18 (end-task):** печать акта выдачи и `productionReleaseAct.ts`, меню ⋯ с постоянными пунктами и disabled-состояниями, ref-инпуты без двойной обводки, кольцо степпера «Ожидается» — slate; правки `agents.md`.

**Ранее (ориентир по UX производства):** степпер без фона активной колонки, сводка выдачи в lib, сортировка/журнал, подтверждение выдачи, пиллы ref-этапов, прогресс этапов, фазы брака = названия этапов шаблона, и т.д. — см. git history и файлы выше.
