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
