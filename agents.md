# Контекст для агента

Краткий минимум. **Реализованный функционал, SPA на GitHub Pages, постановки вне репо** — в [`agents-done.md`](agents-done.md).

## Репозиторий и стек

- **Репозиторий**: https://github.com/maha5053/bt-prototype.git  
- **Локально**: каталог `bt-prototype/` (этот репозиторий).
- **Стек**: React 19, Vite 8, TypeScript, React Router 7, Tailwind 4.
- **Base path (production / GitHub Pages)**: `base: '/bt-prototype/'` в `vite.config.ts`; роутер с `{ basename: import.meta.env.BASE_URL }` в `src/App.tsx`.

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

## Последняя сессия (агент)

- **Выдача:** одобрение ТП (`approveReleaseTechProcess`), блокировка завершения release без одобрения; форма без дублей подписей (фильтр legacy-полей); сводки/печать — `productionReleaseAct`.
- **КК:** убраны «Отложено» / `deferred*` / `deferQualityControl`; `po-004` — КК в работе.
- **Шапка и мобилка (`AppLayout.tsx`):** на узкой ширине топ-табы скрыты, навигация — дерево в гамбургере (раздел → подпункты из `SIDEBAR_BY_SECTION`); логотип в шапке только с `md+`, в drawer остаётся; блок пользователя прижат вправо через `flex-1 md:hidden` спейсер (без `max-md:`); десктоп — прежний топ + сайдбар текущего раздела.
- **Прочее:** `saveDraft` по шагу, правки `usersMock` / админки.
