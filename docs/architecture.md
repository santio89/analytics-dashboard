# Architecture

## Stack

- **Next.js 16** (App Router, `src/proxy.ts` auth gate)
- **React 19** + **TanStack Query**
- **Recharts** for line / area / bar charts; custom funnel bars in `trend-chart.tsx`
- **Tailwind CSS 4**

No database, no cron jobs, no external HTTP calls at runtime.

## Request flow

```
/login  →  POST /api/auth/login  →  session cookie
/       →  proxy checks cookie
       →  HomeDashboard
       →  React Query → /api/dashboard/* (mock)
       →  src/lib/controllers/
       →  src/lib/mock/service.ts
```

## Key files

| Area | Path |
| --- | --- |
| Controllers (data access) | `src/lib/controllers/` — swap bodies to wire in a DB |
| Mock data | `src/lib/mock/` |
| Dashboard state | `src/lib/dashboard-params.ts` |
| Main layout | `src/components/home-dashboard.tsx`, `dashboard-body.tsx` |
| Auth | `src/lib/gate.ts`, `src/proxy.ts` |
| Feature toggles | `src/lib/feature-flags.ts` |
| Branding | `src/lib/app-config.ts` |

## API routes (all mock)

| Route | Controller | Returns |
| --- | --- | --- |
| `GET /api/funnels` | `getFunnels()` | Funnel catalog |
| `GET /api/dashboard/conversions` | `getConversions()` | Range totals |
| `GET /api/dashboard/charts` | `getCharts()` | Daily series |
| `GET /api/dashboard/charts?scope=page-funnel` | `getPageFunnel()` | Page funnel |
| `GET /api/dashboard/utm` | `getUtmDashboard()` | UTM breakdown |
| `GET /api/dashboard/utm?scope=options` | `getUtmOptions()` | UTM filter options |
| `GET /api/entries/:id` | `getEntryLookup()` | Entry lookup |

Controllers in `src/lib/controllers/` define the payload types each endpoint returns; their current implementations delegate to `src/lib/mock/service.ts`. To connect a real backend later, replace the controller bodies with database or HTTP-backed lookups that return the same shapes — the routes, React Query keys, and UI stay unchanged.

The only env-adjacent config is `NODE_ENV` (Next.js built-in) used by the session cookie; no app environment variables exist.