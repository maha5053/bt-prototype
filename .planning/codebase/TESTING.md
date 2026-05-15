# Testing

**Analysis Date:** 2026-05-15

## Current Test Setup

**Automated tests:**
- No unit test framework is installed in `package.json`.
- No E2E framework is installed.
- No test files matching common `test` or `spec` naming were found in the reviewed source tree.

**Available checks:**
- `npm run build` - Runs `tsc -b && vite build`.
- `npm run lint` - Runs `eslint .`.
- `npm run preview` - Serves the production build locally.
- `npm run dev -- --host` - Starts Vite dev server.

## Type Checking

- TypeScript project references are configured through `tsconfig.json`.
- The build script performs type checking before Vite bundling.
- `tsconfig.tsbuildinfo` exists in the repo; this is generated state from TypeScript incremental/project builds.

## Linting

- ESLint flat config lives in `eslint.config.js`.
- Active rule sets:
  - `@eslint/js` recommended rules.
  - `typescript-eslint` recommended rules.
  - `eslint-plugin-react-hooks` recommended rules.
  - `eslint-plugin-react-refresh` Vite config.
- `dist` is globally ignored by ESLint.

## Manual Verification Patterns

**Routing and deployment base:**
- Verify local URL `http://localhost:5173/bt-prototype/`.
- Verify nested routes under `/bt-prototype/...`.
- Verify direct deep links after build/deploy rely on `public/404.html`.

**Warehouse workflows:**
- Receipts: create/open receipt, add line, fill incoming control, complete document.
- Nomenclature: edit item, edit specification rows, load/delete specification templates.
- Inventory/write-offs/transfers/quarantine: create or open sessions, mutate statuses, reset storage through devtools where available.

**Production workflows:**
- Create production order from template.
- Edit registration, production, QC, and release stages.
- Validate required fields, deviations, rejection flow, release approval, and print route.
- Constructor ver2: create/edit/preview product templates and confirm system stages remain correct.

## Test Coverage Gaps

**High risk: production runtime**
- Files: `src/pages/ProductionPages.tsx`, `src/context/ProductionContext.tsx`, `src/mocks/productionData.ts`.
- Risk: Large state machine with required fields, status transitions, deviations, release approvals, and storage migrations has no automated tests.

**High risk: constructor/template compatibility**
- Files: `src/pages/ConstructorPages.tsx`, `src/pages/ConstructorV2Pages.tsx`, `src/lib/productionSystemStages.ts`.
- Risk: Template edits can break runtime order creation or system stage reconciliation.

**Medium risk: localStorage migrations**
- Files: all `src/context/*Context.tsx` and `src/lib/*Storage*.ts`.
- Risk: Existing user data can fail to load after type/shape changes; failures are often silently ignored.

**Medium risk: GitHub Pages routing**
- Files: `vite.config.ts`, `src/App.tsx`, `public/404.html`, `src/main.tsx`, `src/components/SpaRedirect.tsx`.
- Risk: Base path, print links, and deep links can regress without tests.

**Medium risk: incoming control**
- Files: `src/pages/ReceiptsPages.tsx`, `src/context/ReceiptsContext.tsx`, `src/context/NomenclatureContext.tsx`.
- Risk: Specification changes can break receipt incoming-control behavior.

## Suggested Future Test Strategy

- Add Vitest + React Testing Library for domain helpers and context reducers/mutators.
- Add tests around `buildOrderFromTemplate`, template reconciliation, and production completion rules.
- Add storage migration tests for each context loader using mocked `localStorage`.
- Add Playwright smoke tests for critical routes under `/bt-prototype/`.
- Add a GitHub Pages deep-link test or scripted check for `public/404.html`.

## Verification Before Commit

- For narrow docs/config changes: `git diff` review may be enough.
- For TypeScript or UI changes: run `npm run build`.
- For broad page/runtime changes: run `npm run lint` plus manual browser verification.
- For deploy-ready sessions: follow `@end-session` workflow.

---

*Testing analysis: 2026-05-15*
*Update when test frameworks, CI, or verification practices change.*
