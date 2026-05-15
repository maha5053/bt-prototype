# Integrations

**Analysis Date:** 2026-05-15

## External Services

**GitHub Pages:**
- Purpose: Hosts the production SPA.
- Configuration: `vite.config.ts` uses `base: '/bt-prototype/'`.
- Deploy path: `npm run deploy` runs `gh-pages -d dist`.
- Fallback: `public/404.html` stores the requested URL in `localStorage` and redirects back to the app base.

**GitHub Repository:**
- Remote documented in `AGENTS.md`: `https://github.com/maha5053/bt-prototype.git`.
- Primary branch: `main`.
- Publication branch: `gh-pages`.

## Browser Storage

**localStorage is the app database for the prototype.**
- Production: `bio-production`, defined in `src/lib/productionStorageKey.ts`, read/written by `src/context/ProductionContext.tsx`.
- Receipts: `bio-receipts`, handled by `src/context/ReceiptsContext.tsx`.
- Nomenclature: `bio-nomenclature`, handled by `src/context/NomenclatureContext.tsx`.
- Specification templates: `bio-spec-templates`, handled by `src/lib/specTemplatesStorage.ts`.
- Quarantine: `bio-quarantine`, handled by `src/context/QuarantineContext.tsx`.
- Inventory: `bio-inventory`, handled by `src/context/InventoryContext.tsx`.
- Write-offs: `bio-writeoffs`, handled by `src/context/WriteOffContext.tsx`.
- Transfers: `bio-transfers` and transfer sequence storage, handled by `src/context/TransfersContext.tsx`.
- Current user and permissions: `bio-current-user`, `bio-group-permissions`, `bio-user-groups`, and legacy permissions helpers in `src/context/CurrentUserContext.tsx` and `src/mocks/usersMock.ts`.
- Prototype disclaimer: handled by `src/lib/prototypeDisclaimerStorage.ts`.
- SPA redirect: key `spa-redirect`, written by `public/404.html` and read by `src/main.tsx` / `src/components/SpaRedirect.tsx`.

## Static Assets

**PDF SOP files:**
- Public SOP files live under `public/mocks/sop/`.
- Some generated or copied assets also exist under top-level `assets/`, including PDF and built JS/CSS files.
- SOP references are used by production constructor/runtime code, especially `src/mocks/productionData.ts`, `src/pages/ProductionPages.tsx`, and `src/pages/ConstructorPages.tsx`.

**Icons and favicons:**
- `public/favicon.svg`, `public/favicon-local.svg`, `favicon.svg`, `icons.svg`, and `public/icons.svg`.

## Authentication and Users

**No external auth provider.**
- Users, groups, permissions, and current-user selection are mocked client-side.
- Main files: `src/context/CurrentUserContext.tsx`, `src/mocks/usersMock.ts`, and `src/pages/UsersAdminPage.tsx`.

## Network APIs

**No backend API calls were found.**
- Searches did not identify application-level `fetch()`/Axios integration in source files.
- The app operates entirely from bundled mocks and `localStorage`.

## Tooling Integrations

**GSD:**
- Local GSD installation exists in `.codex/get-shit-done/`.
- `gsd-sdk v1.42.2` is available at `/home/maria/.local/bin/gsd-sdk`.
- `.codex/` is ignored by git.

**Repo skill:**
- Local repo skill `$end-session` exists under `.agents/skills/end-session/`.
- It is intended for memory updates, build, commit, push, and deploy when the user invokes `@end-session`.

## Integration Risks

- Because all business state is in `localStorage`, users, browsers, and devices do not share state.
- Data migrations are ad hoc in context loaders and mocks; storage shape changes need backward compatibility.
- GitHub Pages requires the Vite base path and router basename to remain aligned.
- Print and direct-link routes depend on the SPA fallback behavior in `public/404.html`.

---

*Integrations analysis: 2026-05-15*
*Update after adding real APIs, auth, persistence, or deployment targets.*
