# Контекст для агента

Краткий минимум. **Реализованный функционал, SPA на GitHub Pages, постановки вне репо** — в [`agents-done.md`](agents-done.md).

## Репозиторий и стек

- **Репозиторий**: https://github.com/maha5053/bt-prototype.git  
- **Локально**: каталог `bt-prototype/` (этот репозиторий).
- **Стек**: React 19, Vite 8, TypeScript, React Router 7, Tailwind 4.
- **Base path (production / GitHub Pages)**: `base: '/bt-prototype/'` в `vite.config.ts`; роутер с `{ basename: import.meta.env.BASE_URL }` в `src/App.tsx`.

## Быстрая карта кода

- **Вход и роутинг**: `src/main.tsx` подключает `CurrentUserProvider`; `src/App.tsx` содержит все маршруты; `src/layouts/AppLayout.tsx` — общий хедер, сайдбар, мобильное меню, селектор пользователя; `src/config/navigation.ts` — верхнее меню и пункты сайдбара.
- **Страницы**: `src/pages/*Page*.tsx`. Склад: `Nomenklatura*`, `ReceiptsPages`, `KarantinPage`, `InventoryPages`, `WriteOffPages`, `Peremeshcheniya`, `BalancePage`. Заказы: `ProductionPages`, печать `ProductionReleasePrintPage`. Админка: `UsersAdminPage`, `ConstructorPages` (ver1), `ConstructorV2Pages` (Продукты/ver2).
- **Состояние и localStorage**: бизнес-состояние лежит в `src/context/*Context.tsx`; сиды/моки — в `src/mocks/*`; общие helpers — в `src/lib/*`. Основные ключи: `bio-production`, `bio-receipts`, `bio-nomenclature`, `bio-spec-templates`, `bio-quarantine`, `bio-inventory`, `bio-writeoffs`, `bio-transfers`, `bio-current-user`, `bio-group-permissions`, `bio-user-groups`.
- **Паттерн правок**: сначала найти URL в `src/App.tsx`, затем страницу в `src/pages`, рядом подключённый context/mock. Для пункта меню править `src/config/navigation.ts`; для сквозного layout/header — `src/layouts/AppLayout.tsx`; для seed продукта «Тромбогель» — см. ограничение ниже.

## Основные URL

Все пути ниже относительны к base `/bt-prototype/`: локально `http://localhost:5173/bt-prototype/...`, в проде `https://maha5053.github.io/bt-prototype/...`.

- `/sklad/nomenklatura` — номенклатура; `/sklad/nomenklatura/:nomenclatureId` — карточка + спецификация.
- `/sklad/postupleniya` — поступления; `/sklad/postupleniya/:receiptId` — документ поступления + входной контроль.
- `/sklad/balance`, `/sklad/karantin`, `/sklad/inventarizatsiya`, `/sklad/inventarizatsiya/:sessionId`, `/sklad/spisaniya`, `/sklad/spisaniya/:sessionId`, `/sklad/spisaniya/:sessionId/print`, `/sklad/peremeshcheniya`, `/sklad/peremeshcheniya/novoe`, `/sklad/peremeshcheniya/:transferId`.
- `/proizvodstvo` — журнал заказов; `/proizvodstvo/:orderId` — заказ; `/proizvodstvo/:orderId/print` — печатная форма.
- `/admin/polzovateli` — группы/пользователи/права; `/admin/konstruktor-ver2` — Продукты; `/admin/konstruktor-ver2/novyy`, `/admin/konstruktor-ver2/:templateId`, `/admin/konstruktor-ver2/:templateId/prosmotr`; `/admin/konstruktor` — старый список ver1.
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

## Последняя сессия (агент)

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
