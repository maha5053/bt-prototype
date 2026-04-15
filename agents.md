# Контекст для агента (продолжение в новом чате)

## Репозиторий и окружение

- **Репозиторий**: `https://github.com/maha5053/bt-prototype.git` (локально: `bt-prototype/`).
- **Стек**: React 19, Vite 8, TypeScript, React Router 7, Tailwind 4.
- **Base path (GitHub Pages)**: в `vite.config.ts` задано `base: '/bt-prototype/'`. Роутер создаётся с `{ basename: import.meta.env.BASE_URL }` в `src/App.tsx`.

## Локальный запуск

```bash
cd bt-prototype
npm install
npm run dev -- --host
```

Обычно приложение: `http://localhost:5173/bt-prototype/`.

## Деплой на GitHub Pages

- Скрипт: `npm run deploy` → `gh-pages -d dist` (после `predeploy` идёт повторный `npm run build`).
- Ветка публикации: **`gh-pages`**, сайт: `https://maha5053.github.io/bt-prototype/`.
- Для `git push` по HTTPS нужны учётные данные GitHub; при необходимости — PAT с правом **`repo`** (никогда не коммитить токен в репозиторий). Если токен когда‑либо попадал в скрин/чат — **отозвать и выпустить новый**.

## Git (локально в этом клоне)

- Настроены **только для репозитория**: `user.name` = `maria`, `user.email` = `maria@spellsystems.com`.

## GitHub Pages + SPA (важно)

Проблема: прямые URL вида `/bt-prototype/sklad/...` на GitHub Pages не отдаются как файлы — нужен fallback для Browser Router.

**Текущее решение (после отладки циклов редиректа):**

1. **`public/404.html`** (попадает в `dist/404.html`): при 404 сохраняет полный исходный URL в `localStorage` под ключом **`spa-redirect`**, затем делает `location.replace` на `/<repo>/` (т.е. `/bt-prototype/`), чтобы загрузился `index.html`.
2. **`src/components/SpaRedirect.tsx`**: при монтировании читает `spa-redirect`, **снимает префикс** `import.meta.env.BASE_URL` с `pathname`, затем `navigate(path, { replace: true })` — чтобы путь для роутера был вида `/sklad/...`, а не `/bt-prototype/sklad/...`.
3. **`index.html`**: **без** inline-скрипта восстановления `/?/...` — он конфликтовал со старым механизмом и давал бесконечные перезагрузки.

Старый фрагмент в `404.html`, который писал `spa-redirect` и редиректил на главную, **нельзя дублировать** вторым HTML-документом в том же файле — это ломало страницу.

## Печать списаний

- Кнопка «Печать» в `WriteOffSessionContent` (`src/pages/WriteOffPages.tsx`): `window.open(\`${import.meta.env.BASE_URL}sklad/spisaniya/${session.id}/print\`, ...)`.
- Роут печати в `src/App.tsx`: отдельный объект роутера `path: "sklad/spisaniya/:sessionId/print"` → `WriteOffPrintPage`.
- Страница печати обёрнута в свой `WriteOffProvider` — данные сессий берутся из того же `localStorage`, что и основное приложение (ключ **`bio-writeoffs`** в `src/context/WriteOffContext.tsx`).

## История коммитов по теме GitHub Pages (ориентир)

- `42ba16a` — первая попытка: `404.html` + скрипт в `index.html` (потом выяснилось, что смешение механизмов вредит).
- `d4207a2` — фикс склейки пути (лишний/недостающий `/` в URL).
- `8f4d8bc` — попытка `history.replaceState` в `index.html` (цикл сохранялся при конфликте с `404`).
- `ef05949` — **стабилизация**: один механизм в `404.html` + правка `SpaRedirect` + убран скрипт из `index.html`.

Проверить актуальное состояние: `git log --oneline -10`.

## Безопасность

- Не хранить PAT в коде. Для варианта «credential.helper store» токен лежит в `~/.git-credentials` открытым текстом — осознанный компромисс.

## Что ещё может понадобиться

- Если снова «белая страница» / мигание URL: смотреть **`dist/404.html`** и **`SpaRedirect`**, искать дубликаты редиректов и что именно пишется в `spa-redirect`.
- Кэш браузера и задержка обновления GitHub Pages: жёсткое обновление (Ctrl+F5), подождать 1–3 минуты после `Published`.
