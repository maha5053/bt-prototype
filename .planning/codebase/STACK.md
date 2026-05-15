# Technology Stack

**Analysis Date:** 2026-05-15

## Languages

**Primary:**
- TypeScript 5.9 - Application source in `src/**/*.ts` and `src/**/*.tsx`.
- TSX/React - Page, layout, provider, and UI component implementation.

**Secondary:**
- JavaScript - Tooling config in `eslint.config.js` and generated production bundle files in `assets/`.
- HTML - SPA shell in `index.html` and GitHub Pages fallback in `public/404.html`.

## Runtime

**Environment:**
- Browser SPA runtime; no backend service in this repository.
- Local Node.js is currently `v22.22.2`; `package.json` does not declare an `engines` field.

**Package Manager:**
- npm scripts are used in `package.json`.
- No `package-lock.json` is currently present in the repo snapshot reviewed for this map.

## Frameworks

**Core:**
- React `^19.2.4` - UI and state rendering.
- React DOM `^19.2.4` - Browser mounting in `src/main.tsx`.
- React Router DOM `^7.14.0` - Browser routing in `src/App.tsx`.
- Tailwind CSS `^4.2.2` with `@tailwindcss/vite` - Utility styling via `src/index.css` and class names.
- Headless UI `^2.2.10` - UI primitives, notably combobox-style controls.

**Build/Dev:**
- Vite `^8.0.1` - Dev server and production bundling via `vite.config.ts`.
- `@vitejs/plugin-react` `^6.0.1` - React transform for Vite.
- TypeScript compiler - `npm run build` runs `tsc -b && vite build`.
- ESLint 9 with `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`.

**Testing:**
- No test runner dependency is installed.
- No unit, integration, or E2E test files were found in the reviewed tree.

## Key Dependencies

**Critical:**
- `react` / `react-dom` - Entire UI runtime.
- `react-router-dom` - Route tree, nested layouts, and print routes.
- `@headlessui/react` - Accessible component primitives in interactive pages.

**Infrastructure:**
- `gh-pages` `^6.3.0` - Publishes `dist` to the `gh-pages` branch.
- `vite` / TypeScript / ESLint - Local development, build, and static checks.

## Configuration

**Vite:**
- `vite.config.ts` sets `base: '/bt-prototype/'`, required for GitHub Pages.
- Dev server enables `host: true`, WSL-friendly HMR host/port values, and polling watch.

**TypeScript:**
- `tsconfig.json` delegates to `tsconfig.app.json` and `tsconfig.node.json`.
- `tsconfig.tsbuildinfo` is present in the repo and appears to be a generated compiler cache.

**Lint:**
- `eslint.config.js` applies recommended JS, TypeScript, React Hooks, and Vite React Refresh rules to `**/*.{ts,tsx}`.

## Platform Requirements

**Development:**
- Run from repo root with `npm install` and `npm run dev -- --host`.
- App URL: `http://localhost:5173/bt-prototype/`.

**Production:**
- Static SPA deployed to GitHub Pages.
- Production URL: `https://maha5053.github.io/bt-prototype/`.
- Deployment command: `npm run deploy`, which builds and publishes `dist`.

---

*Stack analysis: 2026-05-15*
*Update after major dependency or deployment changes.*
