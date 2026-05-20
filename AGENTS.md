# Контекст для агента

Краткий минимум. **Реализованный функционал, SPA на GitHub Pages, постановки вне репо** — в [`agents-done.md`](agents-done.md).

## Репозиторий и стек

- **Репозиторий**: https://github.com/maha5053/bt-prototype.git  
- **Локально**: каталог `bt-prototype/` (этот репозиторий).
- **Стек**: React 19, Vite 8, TypeScript, React Router 7, Tailwind 4.
- **Base path (production / GitHub Pages)**: `base: '/bt-prototype/'` в `vite.config.ts`; роутер с `{ basename: import.meta.env.BASE_URL }` в `src/App.tsx`.

## Быстрая карта кода

- **Вход и роутинг**: `src/main.tsx` подключает `CurrentUserProvider`; `src/App.tsx` содержит все маршруты; `src/layouts/AppLayout.tsx` — общий хедер, сайдбар, мобильное меню, селектор пользователя; `src/config/navigation.ts` — верхнее меню и пункты сайдбара.
- **Страницы**: `src/pages/*Page*.tsx`. Склад: `Nomenklatura*`, `ReceiptsPages`, `KarantinPage`, `InventoryPages`, `WriteOffPages`, `Peremeshcheniya`, `BalancePage`. Заказы: `ProductionPages`, печать `ProductionReleasePrintPage`. Админка: `UsersAdminPage`, `ConstructorPages` (ver1), `ConstructorV2Pages` (Продукты/ver2), `MaterialTypesAdminPage`.
- **Состояние и localStorage**: бизнес-состояние лежит в `src/context/*Context.tsx`; сиды/моки — в `src/mocks/*`; общие helpers — в `src/lib/*`. Основные ключи: `bio-production`, `bio-receipts`, `bio-nomenclature`, `bio-spec-templates`, `bio-quarantine`, `bio-inventory`, `bio-writeoffs`, `bio-transfers`, `bio-current-user`, `bio-group-permissions`, `bio-user-groups`.
- **Паттерн правок**: сначала найти URL в `src/App.tsx`, затем страницу в `src/pages`, рядом подключённый context/mock. Для пункта меню править `src/config/navigation.ts`; для сквозного layout/header — `src/layouts/AppLayout.tsx`; для seed продукта «Тромбогель» — см. ограничение ниже.

## Основные URL

Все пути ниже относительны к base `/bt-prototype/`: локально `http://localhost:5173/bt-prototype/...`, в проде `https://maha5053.github.io/bt-prototype/...`.

- `/sklad/nomenklatura` — номенклатура; `/sklad/nomenklatura/:nomenclatureId` — карточка + спецификация.
- `/sklad/postupleniya` — поступления; `/sklad/postupleniya/:receiptId` — документ поступления + входной контроль.
- `/sklad/balance`, `/sklad/karantin`, `/sklad/inventarizatsiya`, `/sklad/inventarizatsiya/:sessionId`, `/sklad/spisaniya`, `/sklad/spisaniya/:sessionId`, `/sklad/spisaniya/:sessionId/print`, `/sklad/peremeshcheniya`, `/sklad/peremeshcheniya/novoe`, `/sklad/peremeshcheniya/:transferId`.
- `/proizvodstvo` — журнал заказов; `/proizvodstvo/:orderId` — заказ; `/proizvodstvo/:orderId/print` — печатная форма.
- `/admin/polzovateli` — группы/пользователи/права; `/admin/konstruktor-ver2` — Продукты; `/admin/konstruktor-ver2/novyy`, `/admin/konstruktor-ver2/:templateId`, `/admin/konstruktor-ver2/:templateId/prosmotr`; `/admin/tipy-materiala`, `/admin/tipy-materiala/:materialTypeCode` — типы материала; `/admin/konstruktor` — старый список ver1.
- `/spravochniki/raskhodniki-i-materialy`, `/spravochniki/oborudovaniya`, `/spravochniki/pomeshcheniya` — заглушки справочников через `SectionPage`.

## Локальный запуск

```bash
cd bt-prototype
npm install
npm run dev -- --host
```

Приложение: **http://localhost:5173/bt-prototype/**

## Деплой (GitHub Pages)

```bash
cd bt-prototype
npm run deploy
```

- Сборка: `predeploy` → `npm run build`, публикация: `gh-pages -d dist`.
- Сайт: **https://maha5053.github.io/bt-prototype/**
- Ветка публикации: **`gh-pages`**
- Для `git push` по HTTPS нужны учётные данные GitHub (при необходимости PAT с правом `repo`; не коммитить токены).

## Git (этот клон)

- Для репозитория: `user.name` = `maria`, `user.email` = `maria@spellsystems.com`.
- **Все git-команды запускать только из директории `bt-prototype/`** (это корень репозитория).
- **`git commit`, `git push` — только по явной команде.** Реализация фичи не означает автокоммит/автопуш.

## Команды и правила сессии

- `@end-session` — завершить рабочую сессию через repo skill `$end-session`: обновить `AGENTS.md`/`agents-done.md`, проверить сборку, сделать коммит, push и `npm run deploy`.
- GSD установлен локально для Codex в `.codex/get-shit-done/`, версия `1.42.2`; `.codex/` добавлен в `.gitignore` и не коммитится. Проверка: `gsd-sdk --version` из корня репозитория. После нового Codex-сеанса должны быть доступны команды/skills GSD вроде `$gsd-map-codebase`.

## Последняя сессия (агент)

- **Эта сессия (@end-session):** этап **Хранение** в заказе — ответственный как select пользователей (дефолт текущий), сгруппированная вёрстка полей (4 строки, узкое/среднее как в регистрации); убрано поле **Фактическая температура** (дублирует условие хранения, `DEPRECATED_STORAGE_FIELD_IDS`, нормализация снимков заказа); вкладка **Хранение** в продукте — только чекбокс «Включить хранение», без таблицы полей; исправлена вёрстка **Дата рождения / Возраст** в регистрации (`ORDER_FIELD_SM_WRAP` + `md:w-auto`). Следующий фокус — Phase 4 independent QC (`$gsd-plan-phase 4`). Коммиты `06a6007`, `ad82611` + сессионный; push, deploy в конце сессии.
- **Эта сессия (Phase 3 / product process settings):** реализована Phase 3: snapshot `storage` + `registrationMaterialBalance`, этап `storage` в заказе, runtime матбаланса из snapshot, seed матбаланса для крови (`productionData.ts`, `ProductionContext.tsx`, `ProductProcessSettingsPanel.tsx`, `ProductionPages.tsx`).
- **Эта сессия (Phase 2 / 02-02 defaults):** завершён план 02-02: дефолты `Кровь`/`Кожа` в `DEFAULT_MATERIAL_TYPE_SETTINGS` приведены к MAT-07/MAT-08 и research notes (кожа: биопсия/контейнер/фиксатор и т.д.); `normalizeMaterialFieldList` мержит сохранённые поля с дефолтами по `id` (новые поля подтягиваются без потери кастомных). Phase 2 закрыта (3/3 плана). Следующий фокус — Phase 3 (`src/mocks/productionData.ts`, `src/context/ProductionContext.tsx`).
- **Эта сессия (Phase 2 / material-driven registration):** закрыт основной объём Phase 2 по регистрации: редактор `Типы материала` переведён на автосохранение без кнопки, усилена нормализация/совместимость `materialTypes` в `ProductionContext`, регистрация в заказе читает поля `Забор`/`Входной контроль` из `order.settingsSnapshot.materialType` (вместо хардкода), заголовок секции забора стал **«Забор материала (Тип)»**, добавлена настраиваемая `okOption` для select-полей входного контроля с runtime-подсветкой зелёный/красный по настройке, колонка `Опция ОК` скрыта во вкладке `Забор` и оставлена только во `Входной контроль`, исправлен ввод новых опций в textarea списка (`src/pages/MaterialTypesAdminPage.tsx`, `src/context/ProductionContext.tsx`, `src/pages/ProductionPages.tsx`, `src/mocks/productionData.ts`).
- **Эта сессия (Phase 1 / типы материала):** Phase 1 завершена и влита в `main`: добавлены fixed-code типы материала, separate admin list/editor `/admin/tipy-materiala`, вкладки **Забор / Материальный баланс / Входной контроль**, выбор типа материала в «Продуктах», snapshot настроек в новые заказы и входящий ID `YYYYMMDD-001` со сквозным счётчиком. В матбалансе типа материала строки берутся из `ACTION_CONSUMABLE_CATALOG`, у каждой есть количество по умолчанию и информационный флаг списания при завершении регистрации; фактического списания нет (`src/pages/MaterialTypesAdminPage.tsx`, `src/mocks/productionData.ts`, `src/context/ProductionContext.tsx`).
- **Эта сессия (GSD planning):** создана и обновлена `.planning/`-структура GSD для customer feedback по заказам/продуктам: code map, `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, research notes по коже/хранению. Phase 1 **Product and Material Settings Foundation** завершена; следующий фокус — Phase 2 material-driven registration (`$gsd-discuss-phase 2` или `$gsd-plan-phase 2`). Коммитить/пушить только по явной команде; `.codex/` локальная и игнорируется.
- **Эта сессия (GSD):** установлен `gsd-build/get-shit-done` для Codex в локальную `.codex/` через `npx get-shit-done-cc@latest --codex --local --profile=core`; CLI `gsd-sdk v1.42.2` доступен из `/home/maria/.local/bin/gsd-sdk`. `.codex/` игнорируется git, коммит `d48ed63` добавил правило `.codex/` в `.gitignore`.
- **Эта сессия (конструктор ver2 + сессии):** в «Продукты» добавлена пустая вкладка **«Регистрация»** перед производством/КК; для таких этапов редактор показывает «Раздел пока пуст.» без автосоздания шагов. Добавлен repo skill `$end-session` и команда `@end-session` для обновления памяти, build, commit, push и deploy (`src/pages/ConstructorPages.tsx`, `src/pages/ConstructorV2Pages.tsx`, `.agents/skills/end-session/*`, `AGENTS.md`).
- **Эта сессия (поступления UI):** в модалке добавления позиции поле товара заменено на `Combobox`-автокомплит по названию/производителю/группе/артикулу; при выборе номенклатуры лот сбрасывается (`src/pages/ReceiptsPages.tsx`).
- **Эта сессия (поступления dev/mock):** на списке поступлений добавлена devtools-шестерёнка, очищает только `bio-receipts`; в мок `rcpt-001` добавлен входной контроль, все `spec-01`…`spec-15` = **«Да»** (`src/pages/ReceiptsPages.tsx`, `src/mocks/receiptsData.ts`).
- **Эта сессия (спецификация номенклатуры):** на `/sklad/nomenklatura/:id` скрыты ручные поля порядка/сортировки и типа результата; порядок сохраняется через drag’n’drop (нормализация `sortOrder`), комментарий вынесен под иконку рядом с ✎ (`src/pages/NomenklaturaDetailPage.tsx`).
- **Эта сессия (спецификация номенклатуры, UX):** кнопки внизу: «Добавить элемент» — зелёная, «Удалить все элементы» — красная (бывш. «Очистить») (`src/pages/NomenklaturaDetailPage.tsx`).
- **Эта сессия (спецификация номенклатуры, шаблоны):** в модалке «Загрузить из шаблона» добавлено удаление шаблона (иконка корзины) и фикс клика, чтобы удаление не закрывало список (`src/pages/NomenklaturaDetailPage.tsx`, `src/lib/specTemplatesStorage.ts`).
- **Эта сессия (входной контроль):** в модалке ВК у показателей добавлена иконка комментария; текст показывается в tooltip по hover (`src/pages/ReceiptsPages.tsx`).

Ранее накопленный функционал (ver1/ver2 конструктор, архив шаблонов, runtime ver2, валидация действий, моб. шапка и т.д.) — см. [`agents-done.md`](agents-done.md) и историю коммитов.

## Важные ограничения

- **Seed «Тромбогель NEW» не менять вручную:** `src/mocks/thrombogelNewSeed.json` — источник для `THROMBOGEL_NEW_TEMPLATE` и конструктора ver2.
