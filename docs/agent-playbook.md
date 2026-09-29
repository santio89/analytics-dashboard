# Agent playbook

## What this is

An **Analytics Dashboard** demo. All numbers are generated from `src/lib/mock/` and reach the UI through the controllers in `src/lib/controllers/`. The UI mirrors a production funnel analytics product, but nothing is real.

## Common tasks

| Task | Where to look |
| --- | --- |
| Change mock funnel catalog | `src/lib/mock/catalog.ts` |
| Change conversion / chart numbers | `src/lib/mock/service.ts`, `src/lib/mock/fixtures.ts` |
| Toggle a section on/off | `src/lib/feature-flags.ts` |
| Change branding copy | `src/lib/app-config.ts`, `src/app/layout.tsx` |
| Wire in a real backend/DB | `src/lib/controllers/` (replace mock delegation with real lookups) |
| Entry lookup sample rows | `src/lib/mock/fixtures.ts` (`MOCK_ENTRIES`) |
| Auth gate | `src/proxy.ts`, `src/lib/gate.ts`, `/api/auth/*` |

## Pitfalls

- **Apply vs auto-load:** `AUTO_LOAD_METRICS` in `app-config.ts` loads metrics without toolbar Apply. Keep it `true` for the demo.
- **Compare mode:** Mock data scales the comparison range to ~86% of current values.
- **Page funnel:** Only shown when a single funnel is selected (`SHOW_PAGE_FUNNEL`).
- **Next 16 proxy:** Auth uses `src/proxy.ts` (not `middleware.ts`).
- **Controllers return mock data:** never call `src/lib/mock/` from a route directly; go through `src/lib/controllers/` so the data source can be swapped later.

## Verify changes

```bash
npm test
npm run lint
npm run build
npm run dev
```

Log in at `/login`, pick a funnel, toggle compare, switch chart shapes, open entry lookup (`entry_demo_001` or `jane.doe@example.com`).