# Architecture

**Analysis Date:** 2026-05-15

## Pattern Overview

**Overall:** Client-only React SPA prototype with mock data and localStorage persistence.

**Key Characteristics:**
- No backend layer in the repository.
- Business modules are page-centered and backed by React Context providers.
- Initial data comes from `src/mocks/*`; mutable state persists in browser `localStorage`.
- Routing is centralized in `src/App.tsx`; global chrome is centralized in `src/layouts/AppLayout.tsx`.
- Production and constructor modules contain the richest domain/runtime logic.

## Layers

**App Entry and Routing:**
- Purpose: Mount React and define URL surface.
- Contains: `src/main.tsx`, `src/App.tsx`.
- Depends on: React, React Router, `CurrentUserProvider`, page components.
- Used by: Browser runtime from `index.html`.

**Layout and Navigation:**
- Purpose: Shared shell, header, sidebar, mobile menu, user selector, and section navigation.
- Contains: `src/layouts/AppLayout.tsx`, `src/layouts/appLayoutHeaderStyles.ts`, `src/config/navigation.ts`.
- Depends on: React Router path state and current-user context.
- Used by: All normal app routes under the root layout.

**Page Modules:**
- Purpose: User-facing workflows for warehouse, production, admin, constructors, and print views.
- Contains: `src/pages/*Page*.tsx` and domain files such as `src/pages/ReceiptsPages.tsx`, `src/pages/ProductionPages.tsx`, `src/pages/ConstructorV2Pages.tsx`.
- Depends on: Context providers, mocks, helpers, React Router.
- Used by: Route elements in `src/App.tsx`.

**State Providers:**
- Purpose: Encapsulate mutable module state and persistence.
- Contains: `src/context/*Context.tsx`.
- Depends on: `src/mocks/*`, `localStorage`, and helper libraries.
- Used by: Page modules and sometimes devtools components.

**Mock and Domain Model Layer:**
- Purpose: Provide type definitions, seed data, and domain constructors.
- Contains: `src/mocks/productionData.ts`, `src/mocks/balancesData.ts`, `src/mocks/thrombogelNewSeed.json`, and other module mocks.
- Depends on: Mostly TypeScript data structures; production seed imports JSON.
- Used by: Contexts, constructors, runtime pages, and balances.

**Shared Helpers:**
- Purpose: Isolate small cross-module rules and storage helpers.
- Contains: `src/lib/productionReleaseAct.ts`, `src/lib/productionSystemStages.ts`, `src/lib/specTemplatesStorage.ts`, `src/lib/prototypeDisclaimerStorage.ts`, `src/lib/productionStorageKey.ts`.
- Used by: Production runtime, constructor pages, nomenclature specification flows, and global disclaimer.

## Data Flow

**Normal Page Flow:**
1. Browser loads `index.html` and Vite bundle.
2. `src/main.tsx` reads any `spa-redirect` key and mounts `<CurrentUserProvider><App /></CurrentUserProvider>`.
3. `src/App.tsx` creates a browser router with `basename: import.meta.env.BASE_URL`.
4. The route renders `AppLayout` and the selected page.
5. The page reads/writes state through its module context.
6. The context persists updates to `localStorage`.

**GitHub Pages Deep Link Flow:**
1. User opens a nested URL directly.
2. GitHub Pages serves `public/404.html`.
3. `public/404.html` writes the original URL to `localStorage` as `spa-redirect`.
4. The browser redirects to `/bt-prototype/`.
5. React reads the stored URL and navigates client-side.

**Production Order Flow:**
1. `src/context/ProductionContext.tsx` loads `bio-production` or seeds from `src/mocks/productionData.ts`.
2. Templates are reconciled with baseline/system stages via helpers in `src/lib/productionSystemStages.ts`.
3. Runtime pages in `src/pages/ProductionPages.tsx` update fields, actions, consumables, equipment, stage statuses, rejection, release, and print links.
4. State is serialized back into `bio-production`.

**Nomenclature / Receipt Control Flow:**
1. Nomenclature entries seed from `src/mocks/balancesData.ts` and persist in `bio-nomenclature`.
2. Specification rows are managed in `src/pages/NomenklaturaDetailPage.tsx`.
3. Receipts in `src/pages/ReceiptsPages.tsx` pull specification data for incoming control and persist answers in `bio-receipts`.

## Key Abstractions

**Context Provider per Module:**
- Purpose: Keep each workflow's persistence and mutation API close to its data.
- Examples: `ProductionContext`, `ReceiptsContext`, `InventoryContext`, `WriteOffContext`, `TransfersContext`.
- Pattern: React Context + `useState` initializer + manual `localStorage` load/save.

**Process Template / Runtime Execution:**
- Purpose: Model product templates, stages, steps, fields, actions, consumables, equipment, and production orders.
- Examples: `ProcessTemplate`, `StageTemplate`, `StepTemplate`, `ProductionOrder`, `StageExecution`, `StepExecution` in `src/mocks/productionData.ts`.
- Pattern: Template-to-runtime transformation with reconciliation for system stages.

**Constructor Pages:**
- Purpose: Edit reusable product/process templates.
- Examples: `src/pages/ConstructorPages.tsx` for older constructor and shared editor patterns; `src/pages/ConstructorV2Pages.tsx` for product/ver2 flows.
- Pattern: Large page modules with embedded UI state and domain-specific helpers.

**Print Routes:**
- Purpose: Render document-style pages outside the main layout.
- Examples: `src/pages/WriteOffPrintPage.tsx`, `src/pages/ProductionReleasePrintPage.tsx`.
- Pattern: Top-level routes in `src/App.tsx` outside the `AppLayout` route subtree.

## Entry Points

**Browser App:**
- Location: `src/main.tsx`.
- Trigger: Vite bundle from `index.html`.
- Responsibilities: Read redirect key, import CSS, mount React, wrap app with current-user provider.

**Router:**
- Location: `src/App.tsx`.
- Trigger: React render.
- Responsibilities: Define routes and `basename`, attach pages to paths.

**Deployment:**
- Location: `package.json` scripts and `vite.config.ts`.
- Trigger: `npm run deploy`.
- Responsibilities: Build static files and publish to GitHub Pages.

## Error Handling

**Strategy:** Mostly local, defensive, and UI-driven.

**Patterns:**
- `localStorage` JSON parsing is wrapped in `try/catch` and ignored on failure in context loaders.
- Pages show inline missing-document states when route params do not match data.
- Browser confirmations are used before destructive localStorage reset actions.
- No global error boundary was identified.

## Cross-Cutting Concerns

**Validation:**
- Implemented in page handlers and context mutation functions.
- Production runtime has domain checks around required fields, QC deviations, release approval, and stage completion.

**Permissions:**
- Client-side mock permissions live in `src/mocks/usersMock.ts`, `src/context/CurrentUserContext.tsx`, and `src/pages/UsersAdminPage.tsx`.

**Persistence:**
- `localStorage` is shared across modules but each module owns its own key.

**Styling:**
- Tailwind utility classes dominate component styling.
- Shared header layout styles live in `src/layouts/appLayoutHeaderStyles.ts`.

---

*Architecture analysis: 2026-05-15*
*Update when backend, persistence, routing, or module boundaries change.*
