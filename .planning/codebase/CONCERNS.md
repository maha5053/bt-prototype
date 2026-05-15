# Codebase Concerns

**Analysis Date:** 2026-05-15

## Tech Debt

**Very large page modules:**
- Issue: Several pages are thousands of lines long.
- Files: `src/pages/ProductionPages.tsx` (~4837 lines), `src/pages/ConstructorPages.tsx` (~2938), `src/pages/ReceiptsPages.tsx` (~1556), `src/pages/InventoryPages.tsx` (~1492), `src/pages/WriteOffPages.tsx` (~1484).
- Impact: Higher merge risk, harder review, harder focused testing, and more accidental coupling.
- Fix approach: Extract domain helpers, pure components, and reducers incrementally after behavior is pinned down.

**No automated tests:**
- Issue: `package.json` has no test runner and no test files were found.
- Impact: Production runtime, constructor changes, localStorage migrations, and route/base-path behavior can regress silently.
- Fix approach: Start with Vitest tests for helpers/context logic, then add Playwright smoke tests for core flows.

**Client-only localStorage persistence:**
- Issue: All business state is stored in browser `localStorage`.
- Impact: No multi-user consistency, no server audit trail, limited capacity, and browser-specific state.
- Why: Appropriate for a prototype, but must be treated as non-production storage.
- Fix approach: Introduce backend persistence only when product requirements demand shared data.

**Generated files appear committed:**
- Issue: Top-level `assets/index-D3cUk7Lf.js`, `assets/index--O1S8XbE.css`, and `tsconfig.tsbuildinfo` look generated.
- Impact: Search noise, large diffs, possible stale build artifacts in source control.
- Fix approach: Confirm whether these are intentionally used; otherwise ignore/remove generated artifacts in a dedicated cleanup.

## Known Bugs

**No confirmed active runtime bug from this mapping pass.**
- This workflow was a static map, not a full browser QA pass.
- Existing feature history and manual QA notes live in `agents-done.md`.

## Security Considerations

**Client-side permissions only:**
- Risk: User/group permissions are mock UI state, not real authorization.
- Files: `src/mocks/usersMock.ts`, `src/context/CurrentUserContext.tsx`, `src/pages/UsersAdminPage.tsx`.
- Current mitigation: Prototype context; no backend operations are protected by these permissions.
- Recommendation: Treat permissions as UX simulation only until a backend exists.

**PDF data URLs in localStorage:**
- Risk: Production templates and rejection attachments can store PDF/data URL payloads in `localStorage`.
- Files: `src/mocks/productionData.ts`, `src/pages/ProductionPages.tsx`, constructor pages.
- Impact: Browser storage limits and possible sensitive data persistence on the local machine.
- Recommendation: Keep attachments small in prototype; avoid real sensitive documents.

**No secret management layer:**
- Risk: If future API keys are added to client code, they will be exposed in the bundle.
- Current state: No backend/API integration was found.
- Recommendation: Use a server or deployment secret mechanism for future credentials.

## Performance Bottlenecks

**Large production bundle risk:**
- Vite previously warned about JS chunks over 500 kB according to `agents-done.md`.
- Cause: Large page modules and all workflows bundled into one SPA.
- Improvement path: Consider route-level lazy loading with React Router when performance becomes a priority.

**localStorage serialization:**
- Problem: Entire module state is serialized on many updates.
- Files: `src/context/ProductionContext.tsx` and other contexts.
- Impact: Fine for prototype data sizes; can become slow with many orders/templates or large attachments.
- Improvement path: Normalize state or move to backend/indexed storage if data volume grows.

## Fragile Areas

**Production template/runtime reconciliation:**
- Files: `src/mocks/productionData.ts`, `src/context/ProductionContext.tsx`, `src/lib/productionSystemStages.ts`, `src/pages/ProductionPages.tsx`.
- Why fragile: Many template shapes, runtime states, and backward-compat rules meet here.
- Safe modification: Read storage merge/reconcile logic before changing template fields or stages; run build and manual runtime checks.

**Constructor ver1/ver2 overlap:**
- Files: `src/pages/ConstructorPages.tsx`, `src/pages/ConstructorV2Pages.tsx`.
- Why fragile: Shared concepts appear across two constructor generations.
- Safe modification: Confirm whether a change belongs to old constructor, ver2 products, or both.

**Nomenclature specification to incoming control:**
- Files: `src/context/NomenclatureContext.tsx`, `src/pages/NomenklaturaDetailPage.tsx`, `src/pages/ReceiptsPages.tsx`, `src/lib/specTemplatesStorage.ts`.
- Why fragile: Specification row shape and result type normalization feed receipt incoming-control UI.
- Safe modification: Preserve empty specification arrays and sort-order behavior documented in `AGENTS.md`.

**GitHub Pages base path and print routes:**
- Files: `vite.config.ts`, `src/App.tsx`, `public/404.html`, `src/main.tsx`, `src/components/SpaRedirect.tsx`.
- Why fragile: Deep-link support depends on several small pieces staying aligned.
- Safe modification: Test direct nested URLs and print URLs locally and after deploy.

## Missing Critical Features

**Automated regression suite:**
- Problem: No tests cover core workflows.
- Blocks: Safer refactors of production runtime, constructors, and localStorage migrations.
- Complexity: Medium; domain helpers can be tested first without full browser automation.

**Central data/schema migration layer:**
- Problem: Storage compatibility is distributed across contexts.
- Blocks: Confident schema evolution as prototype data grows.
- Complexity: Medium; can be introduced per storage key.

## Dependencies at Risk

**Framework versions are very current:**
- React 19, React Router 7, Vite 8, Tailwind 4 are modern and may have ecosystem churn.
- Impact: Upgrades can expose breaking changes in router, build, or CSS behavior.
- Mitigation: Keep dependency updates deliberate and verify build/UI flows after updates.

---

*Concerns audit: 2026-05-15*
*Update as issues are fixed or new concerns appear.*
