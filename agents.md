# Контекст для агента (bt-prototype/)

Краткий минимум по текущей рабочей копии. Полный контекст и последняя сессия — см. **`../agents.md`** (корень workspace).

## Эта сессия (кратко)

- Ver2: без колонки «Этапов»; стабильные пропсы в `ConstructorV2Pages.tsx`.
- Ver2 заказы: КК из шаблона; `thrombogelNewSeed.json` + merge/QC/runtime fixes в `productionData.ts`, `ProductionContext.tsx`, `productionSystemStages.ts`.
- Журнал: `ProductionJournalDevTools` (только `orders`); карантин — devtools для `bio-quarantine`.
- `vite.config.ts` (HMR/WSL), `tsconfig.app.json` (`resolveJsonModule`).

## Важные ограничения

- **Эталонный Тромбогель (`tpl-thrombogel`) не менять**: запрещены update/delete/archive на уровне контекста и UI.
