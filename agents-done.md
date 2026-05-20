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

**Дальше по плану модуля (если продолжать):** правка регистрации без смены текущего этапа, версионирование в UI.

---

## Постановки вне репозитория `bt-prototype/`

В корне воркспейса (путь вида `…/biotrack prototype/`):

- `inventory.html` — оригинал инвентаризации.
- `inventory.v2.html` — актуальная постановка инвентаризации (синхрон с прототипом).

---

## Журнал сессий (кратко)

### 2026-05-20 — @end-session: матбаланс на продукте, хранение в заказе, права «Хранение»

- Матбаланс регистрации: убрана вкладка у типа материала; настройка строк на вкладке **Регистрация** продукта (`registrationMaterialBalance`, каталог расходников, UI как в производстве).
- Хранение в заказе: «Место хранения» — select из `ALL_STORAGE_PLACES_META`; убраны поля `storageDeviation` / `storageDeviationNotes` (остаётся стандартный блок «Отклонения»); «Дата начала хранения» предзаполняется текущей датой.
- Продукты ver2: вкладка **Хранение** без шагов; подписи «Расходники и материалы», «Включить хранение»; селект типа материала на отдельной строке.
- `/admin/polzovateli`: колонка и группа права **Хранение** (`storage`), этап `storage` в заказе проверяется отдельно от производства.
- Файлы: `RegistrationMaterialBalanceEditor.tsx`, `ProductProcessSettingsPanel.tsx`, `productionData.ts`, `storagePlacesMeta.ts`, `ProductionPages.tsx`, `MaterialTypesAdminPage.tsx`, `ConstructorPages.tsx`, `ConstructorV2Pages.tsx`, `usersMock.ts`, `ProductionContext.tsx`.
- Проверка: `npm run build` (предупреждение Vite chunk > 500 kB); commit, push, `npm run deploy`.

### 2026-05-20 — @end-session: Phase 3 + вкладки продукта + devtools типов материала

- Phase 3 complete: product storage toggle, registration material balance on product/order, optional `storage` stage in orders, balance runtime from snapshot.
- «Продукты» UX: тип материала и матбаланс — вкладка **Регистрация**; этап хранения — вкладка **Хранение** (между Производство и КК).
- `/admin/tipy-materiala`: `MaterialTypesDevTools` (шестерёнка), убрана кнопка «Восстановить типы».
- GSD: `.planning/phases/03-*`, ROADMAP/REQUIREMENTS/STATE → Phase 4 next.
- Проверка: `npm run build`; commit, push, `npm run deploy`.

### 2026-05-20 — Phase 3: хранение, матбаланс регистрации, snapshot

- В редакторе продукта: чекбокс этапа хранения, таблица обязательности полей хранения, матбаланс регистрации с количествами и флагом списания.
- Тип этапа `storage`, вставка после производства в новых заказах при `storage.enabled`.
- Регистрация: секция матбаланса из `registrationMaterialBalance` snapshot; дефолты количеств при завершении шага.
- Кровь: засеяны строки матбаланса (шприцы, гемакон и т.д.).
- Файлы: `productionData.ts`, `ProductionContext.tsx`, `ProductProcessSettingsPanel.tsx`, `ConstructorPages.tsx`, `ProductionPages.tsx`, `usersMock.ts`, `.planning/phases/03-*`.
- Проверка: `npm run build` проходит.

### 2026-05-20 — Phase 2 plan 02-02: дефолты крови и кожи

- Обновлены `DEFAULT_MATERIAL_TYPE_SETTINGS`: кровь — подпись `Объём забранной крови (мл)`; кожа — поля по research (место биопсии, тип биопсии с `срез`/`другое`, контейнер/среда с формалином/Мишелем и т.д., время фиксатора, клиническое показание).
- `normalizeMaterialFieldList` в `ProductionContext` мержит сохранённые схемы с дефолтами по `id` (миграция localStorage без потери кастомных полей).
- Phase 2 закрыта в roadmap (02-01/02-02/02-03); MAT-07, MAT-08, ORD-01 отмечены выполненными.
- Файлы: `src/mocks/productionData.ts`, `src/context/ProductionContext.tsx`, `.planning/phases/02-material-driven-registration/02-02-*`, `.planning/{ROADMAP,REQUIREMENTS,STATE}.md`.
- Проверка: `npm run build` проходит.

### 2026-05-20 — Phase 2 регистрация из snapshot + настраиваемый OK во входном контроле

- Закрыт основной runtime-фокус Phase 2: на странице заказа регистрация выводит поля `Забор` и `Входной контроль` из `order.settingsSnapshot.materialType` вместо жёсткой привязки к blood-полям.
- В `Типы материала` включено автосохранение (кнопка сохранения убрана), стабилизирована нормализация полей/опций, исправлено добавление новых строк в textarea списка опций.
- Добавлена настройка `Опция ОК` только для вкладки `Входной контроль` (для `select`), сохранение в `materialType` snapshot и runtime-подсветка зелёный/красный по этой опции; для старых snapshot оставлен fallback.
- UI регистрации: заголовок блока забора переименован в **«Забор материала (Тип материала)»**.
- Обновлены GSD-артефакты Phase 2: `02-01-SUMMARY.md`, прогресс в `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`.
- Файлы: `src/pages/MaterialTypesAdminPage.tsx`, `src/context/ProductionContext.tsx`, `src/pages/ProductionPages.tsx`, `src/mocks/productionData.ts`, `.planning/phases/02-material-driven-registration/*`, `.planning/{ROADMAP,REQUIREMENTS,STATE}.md`, `AGENTS.md`.
- Проверка: `npm run build` проходит; остаётся предупреждение Vite о JS chunk > 500 kB.
- Хвост закрыт в сессии 02-02 (дефолты крови/кожи и merge по id).

### 2026-05-16 — Phase 1 типы материала и матбаланс регистрации

- Завершена и опубликована основа Phase 1: список типов материала `/admin/tipy-materiala`, отдельная страница редактирования `/admin/tipy-materiala/:materialTypeCode`, вкладки **Забор / Материальный баланс / Входной контроль**.
- В `MaterialTypeSettings` добавлены `materialBalanceItems`: расходник/материал из `ACTION_CONSUMABLE_CATALOG`, количество по умолчанию, флаг `writeOffOnRegistrationComplete`. Флаг информационный, фактического складского списания нет.
- Новые заказы snapshot-ят настройки типа материала, включая строки матбаланса; runtime-отображение матбаланса в регистрации остаётся следующим шагом.
- Файлы: `src/pages/MaterialTypesAdminPage.tsx`, `src/mocks/productionData.ts`, `src/context/ProductionContext.tsx`, `src/App.tsx`, `.planning/*`, `AGENTS.md`.
- Проверка: `npm run build` проходит; остаётся предупреждение Vite о JS chunk > 500 kB.

### Архив правок из `agents.md`

- **Поступления:** добавлен раздел `/sklad/postupleniya` с кнопкой «Создать поступление» и страницей черновика `/sklad/postupleniya/:receiptId`; строки добавляются через модалку, документ хранится в localStorage (`bio-receipts`) (`src/App.tsx`, `src/pages/ReceiptsPages.tsx`, `src/context/ReceiptsContext.tsx`, `src/mocks/receiptsData.ts`).
- **Номенклатура (список):** добавлено меню действий ⋮ у каждой строки и модалка редактирования с вкладками «Общее/Спецификация» (вкладка «Спецификация» — заглушка) с сохранением в localStorage (`bio-nomenclature`) (`src/pages/NomenklaturaPage.tsx`, `src/context/NomenclatureContext.tsx`).
- **Номенклатура (карточка):** добавлена вкладка «Спецификация» на `/sklad/nomenklatura/:id` с таблицей элементов спецификации, добавлением/удалением и сохранением, плюс кнопка **OK** на строке (переводит строку в read-only отображение текста) (`src/pages/NomenklaturaDetailPage.tsx`, `src/context/NomenclatureContext.tsx`).
- **Номенклатура → спецификация:** автосохранение спецификации по **OK** строки; убрана отдельная кнопка «Сохранить», «Добавить элемент» внизу таблицы; тип результата теперь `Да/нет`; добавлено drag&drop упорядочивание строк (пересчёт `sortOrder`); спецификация по умолчанию проставляется всем позициям; добавлены **шаблоны спецификации** (сохранить по имени + загрузить из шаблона, хранение в `bio-spec-templates`) с выбором «добавить в конец / заменить», выбор шаблона через автокомплит; добавлена «Очистить» у кнопки «Добавить элемент» (верхняя удалена). Файлы: `src/pages/NomenklaturaDetailPage.tsx`, `src/context/NomenclatureContext.tsx`, `src/lib/specTemplatesStorage.ts`.
- **Карантин:** по действию **«Разрешить»** теперь открывается модалка «Разрешить к использованию» с обязательным выбором места хранения и необязательным комментарием; после OK запись помечается «разрешён» и показывается toast «Партия разрешена к использованию» (`src/pages/KarantinPage.tsx`, `src/context/QuarantineContext.tsx`, `src/mocks/quarantineData.ts`). Убрана вспомогательная подпись под селектом места. Постановка обновлена в `tasks/karantin.html`.
- **Список ver2:** убрана колонка «Этапов» (`ConstructorV2Pages.tsx`).
- **Админка → Продукты (бывш. Конструктор ver2):** добавлен просмотр шаблона в новой вкладке `/admin/konstruktor-ver2/:templateId/prosmotr` (read-only), в просмотре скрыты все кнопки/иконки добавления/редактирования/удаления; лейбл в сайдбаре/заголовках переименован в **«Продукты»** (`ConstructorPages.tsx`, `ConstructorV2Pages.tsx`, `App.tsx`, `config/navigation.ts`).
- **Заказы ver2 → КК:** этап контроля качества берётся из шаблона (`resolveQualityControlStageForV2Runtime` в `productionSystemStages.ts`); при создании заказа шаблон читается через `loadFromStorage` + `mergeProductionTemplatesWithBaseline` (`ProductionContext.tsx`).
- **Seed «Тромбогель NEW»:** `tpl-thrombogel-new` в `src/mocks/thrombogelNewSeed.json`, подключение в `productionData.ts`; `resolveJsonModule` в `tsconfig.app.json`.
- **Merge baseline + storage:** имя шаблона из storage сохраняется для всех baseline, кроме **`tpl-thrombogel`** (каноническое имя из кода). Производство: **`mergeStepActions`** — лишние `actions` с шагов без действий в seed отбрасываются; **`reconcileRuntimeV2Templates`** подтягивает production в `tpl-runtime-v2-*` от исходного шаблона; вызов после `updateTemplate`. Тип **`StepActionTemplate`**: `required?`, `input?`.
- **Dev / WSL:** в `vite.config.ts` — `server.hmr` и `watch.usePolling`. В **`ConstructorV2Pages.tsx`** стабильные константы пропсов (меньше лишних эффектов в редакторе).
- **Журнал производства:** **`ProductionJournalDevTools`** — по подтверждению очищаются только **`orders`** в `bio-production`. **Карантин:** devtools (шестерёнка) снова очищает **`bio-quarantine`** (`KarantinPage.tsx`).
- **Навигация админки:** скрыт пункт сайдбара **«Конструктор ver1»** (`src/config/navigation.ts`). В списке ver1 кнопка **«Создать шаблон»** ведёт на создание шаблона ver2 (`/admin/konstruktor-ver2/novyy`), маршрут `/admin/konstruktor/novyy` редиректит на список ver1 (`App.tsx`, `ConstructorPages.tsx`).
- **Конструктор ver2 — сохранение правок:** в `mergeProductionTemplatesWithBaseline` исправлено слияние шагов производства: больше не затираются изменения **расходников / оборудования**, сохраняются **переименования шагов**, и **удалённые шаги** не «возвращаются» из baseline (`src/mocks/productionData.ts`).
- **PDF-вложения шага:** на странице заказа ссылка/название файла берётся из `step.attachmentPdf` (data URL + имя файла из конструктора); если PDF не прикреплён — в шапке шага ссылка не показывается (`src/pages/ProductionPages.tsx`).
- **Seed «Тромбогель NEW»:** из `src/mocks/thrombogelNewSeed.json` удалены `sopRef`/`sopFileName` у шагов и секции.
- **Права доступа (группы):** страница `admin/polzovateli` переделана на **группы пользователей** (5) и уровни **нет/чтение/запись**, ниже — назначение групп пользователям (multi-group). Доступ пользователя — максимум по группам. В заказе этапы скрываются/становятся read-only по правам, «Одобрение» — только при `write` (`src/mocks/usersMock.ts`, `src/context/CurrentUserContext.tsx`, `src/pages/UsersAdminPage.tsx`, `src/pages/ProductionPages.tsx`, `src/layouts/AppLayout.tsx`).
- **Селектор пользователя:** в подписи показываются только группы с правом **«запись»**.
- **Админка → Продукты:** перенесены действия строки в меню **⋮**, добавлен столбец **ID**, а «Связанных заказов» корректно считает и runtime ver2 (`tpl-runtime-v2-*`) заказы (`src/pages/ConstructorV2Pages.tsx`).
- **Регистрация → входной КК:** при завершении этапа регистрации и наличии негативных показателей предлагается перевести заказ в брак; при согласии открывается модалка брака, при отказе — процесс продолжается (`src/pages/ProductionPages.tsx`).
- **Заказы / тромбогель / журнал:** группы полей стали сворачиваемыми; заголовок заказа — **«Заказ №… (шаблон)»**; регистрация, забор крови, материальный баланс, входной КК, отклонения и примечания переработаны визуально; добавлен read-only **ID входящего образца** `YYYYMMDD-N`; условная обязательность «Примечания» при **«Отклонения = Да»**; number-инпуты можно очищать; в шапке этапа выводится **«Этап X из N»**; моки заказов восстанавливаются при пустом `orders`; журнал заказов получил меню **⋮**, дату создания и сортировку по свежим; убран префикс **`po-`** с legacy-нормализацией; новый заказ получает следующий номер **NNN**; фильтр «Продукт» дедупится по названию (`src/pages/ProductionPages.tsx`, `src/context/ProductionContext.tsx`, `src/mocks/productionData.ts`, `src/mocks/thrombogelNewSeed.json`, `src/pages/ProductionReleasePrintPage.tsx`).
- **Спецификация номенклатуры:** в «Тип результата» оставлен только вариант **«Да/нет»**; старые значения из `bio-nomenclature` и `bio-spec-templates` приводятся к «Да/нет» (`src/context/NomenclatureContext.tsx`, `src/pages/NomenklaturaDetailPage.tsx`, `src/lib/specTemplatesStorage.ts`).
- **Поступления → входной контроль:** у каждой строки документа колонка **ВК**; модалка подтягивает спецификацию из номенклатуры; варианты **Не определено / Да / Нет**; ответы в `ReceiptLine.incomingControl` → `bio-receipts`; для завершённого документа поля только чтение (`src/mocks/receiptsData.ts`, `src/pages/ReceiptsPages.tsx`).
- **Поступления — доработка ВК:** в модалке **Сохранить** (зелёная) / **Отмена**, изменения в черновике до сохранения; необязательные **Примечания** (`incomingControlNotes`); в таблице иконка ВК: зелёная **ок**, если все показатели заполнены и нет **«Нет»**; красная подсветка и бейдж **«нет»**, если хотя бы один показатель **«Нет»** (`src/pages/ReceiptsPages.tsx`, `src/mocks/receiptsData.ts`).
- **Завершение поступления / номенклатура:** в модалке **«Завершить поступление»** предупреждение, если есть незаполненный ВК или ответ **«Нет»**; завершить всё равно можно (`src/pages/ReceiptsPages.tsx`). **Спецификация:** пустой массив в storage больше не подменяется дефолтом при merge; удаление строки вызывает `persistSpecDraft`; блок **Шаблоны** слева в одной строке с заголовком, приглушённые кнопки; **Добавить/Очистить** в общей нижней панели и при пустой таблице (`NomenclatureContext.tsx`, `NomenklaturaDetailPage.tsx`).
- **Конструктор ver2 / сессионный skill:** в «Продукты» порядок этапов теперь **Регистрация → Производство → Контроль качества**; вкладка **«Регистрация»** намеренно пустая и показывает «Раздел пока пуст.», без групп и шагов. В общий редактор добавлен `emptyStagesByStageType` для таких вкладок. Добавлен локальный repo skill `$end-session` с метаданными, а в `AGENTS.md` описана команда `@end-session`. Коммит `d7c4c8f` запушен в `main`, `npm run deploy` опубликован на GitHub Pages; `npm run build` прошёл, с предупреждением Vite о JS chunk > 500 kB (`src/pages/ConstructorPages.tsx`, `src/pages/ConstructorV2Pages.tsx`, `.agents/skills/end-session/SKILL.md`, `.agents/skills/end-session/agents/openai.yaml`, `AGENTS.md`).
- **GSD planning / customer feedback по заказам:** локально установлен GSD (`.codex/` игнорируется), создана `.planning/`-память: code map, `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, `research/MATERIAL_AND_STORAGE_NOTES.md`. Scope customer feedback: `YYYYMMDD-001` со сквозным счётчиком, типы материала, отдельная страница настроек типа материала, snapshot настроек в новые заказы, хранение, матбаланс, независимый КК, privileged correction/audit. Phase 1 **Product and Material Settings Foundation** имеет `01-CONTEXT.md`, `01-DISCUSSION-LOG.md`, `01-UI-SPEC.md`; следующий шаг `$gsd-plan-phase 1`.

**2026-04-18 (end-task):** печать акта выдачи и `productionReleaseAct.ts`, меню ⋯ с постоянными пунктами и disabled-состояниями, ref-инпуты без двойной обводки, кольцо степпера «Ожидается» — slate; правки `agents.md`.

**Ранее (ориентир по UX производства):** степпер без фона активной колонки, сводка выдачи в lib, сортировка/журнал, подтверждение выдачи, пиллы ref-этапов, прогресс этапов, фазы брака = названия этапов шаблона, и т.д. — см. git history и файлы выше.
