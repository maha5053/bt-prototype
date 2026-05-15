# Conventions

**Analysis Date:** 2026-05-15

## Code Style

- TypeScript and TSX use double quotes in source files such as `src/App.tsx` and `src/context/ProductionContext.tsx`.
- Some files omit semicolons, for example `src/context/TransfersContext.tsx`; style is not fully uniform.
- React components are function components.
- Types are colocated with module logic in many files, especially `src/mocks/productionData.ts` and context files.
- Tailwind classes are written inline in JSX.
- Russian UI copy is embedded directly in page components and mocks.

## React Patterns

- Global app state uses React Context providers, one per domain.
- Context values are memoized with `useMemo`; mutators typically use `useCallback`.
- State initializes lazily from `localStorage`, then falls back to mock data.
- Route params are read in page modules with React Router hooks.
- Page modules often contain local helper functions, subcomponents, modal state, filtering, and validation in the same file.

## Persistence Patterns

- Each context defines its own `STORAGE_KEY` or imports a shared key.
- Load functions wrap `localStorage.getItem` and `JSON.parse` in `try/catch`.
- Save functions wrap `localStorage.setItem` in `try/catch`.
- Storage migrations/normalizations happen inside context loaders or mock merge helpers.
- Devtools reset controls remove specific keys and reload or update state.

## Routing Patterns

- Add or change URLs in `src/App.tsx`.
- Add or change menu entries in `src/config/navigation.ts`.
- Normal pages render inside `AppLayout`.
- Print routes are top-level routes outside `AppLayout`.
- Production and print links use `import.meta.env.BASE_URL` to preserve the `/bt-prototype/` base.

## Domain Patterns

**Warehouse modules:**
- Each workflow has a context plus one or more page files.
- Examples: receipts use `src/context/ReceiptsContext.tsx`, `src/pages/ReceiptsPages.tsx`, and `src/mocks/receiptsData.ts`.

**Production module:**
- Domain types and seed transformations live in `src/mocks/productionData.ts`.
- Runtime state and mutations live in `src/context/ProductionContext.tsx`.
- Runtime UI is concentrated in `src/pages/ProductionPages.tsx`.
- Constructor UI is split between `src/pages/ConstructorPages.tsx` and `src/pages/ConstructorV2Pages.tsx`.

**Nomenclature specifications:**
- `SpecResultType` is normalized in `src/context/NomenclatureContext.tsx`.
- Template storage is separated into `src/lib/specTemplatesStorage.ts`.

## Error Handling

- Storage failures are silently ignored.
- Missing route data usually renders a "not found" style page state.
- User-facing validation is implemented with inline error state and messages.
- Destructive prototype actions use `window.confirm`.
- No central error boundary or logging layer was found.

## Comments and Documentation

- Comments are mostly useful domain notes, often in Russian.
- AGENTS memory is authoritative for agent operating rules and important constraints.
- `agents-done.md` records implemented feature history and should be consulted before broad changes.

## Git and Session Rules

- `AGENTS.md` requires all git commands to run from repo root.
- `git commit` and `git push` require explicit user instruction.
- `@end-session` invokes the local repo skill for memory, build, commit, push, and deploy.

## Safe Modification Patterns

- For page changes, start with the route in `src/App.tsx`, then inspect the page and its context/mock.
- For menu changes, edit `src/config/navigation.ts`.
- For global shell/header changes, edit `src/layouts/AppLayout.tsx`.
- For production storage/schema changes, inspect `src/mocks/productionData.ts`, `src/context/ProductionContext.tsx`, and `src/lib/productionSystemStages.ts`.
- Do not manually edit `src/mocks/thrombogelNewSeed.json` unless explicitly instructed; `AGENTS.md` marks it as protected.

---

*Conventions analysis: 2026-05-15*
*Update when coding style, storage, or workflow rules change.*
