# Dashboard UI

## URL state

Shareable query params: funnel, date range, compare, UTM filters, metric, chart preferences. Parsed by `parseDashboardParams()` in `src/lib/dashboard-params.ts`.

## Toolbar

Draft filters in the toolbar; **Apply** writes to the URL. With `AUTO_LOAD_METRICS = true`, metrics load immediately using default range (last 14 days) even before Apply.

## Sections

1. **Data source** — demo badge, refresh, load timing
2. **Key metrics** — conversion strip + funnel table
3. **Conversion shape** — line / area / bars / funnel charts
4. **Page funnel** — single-funnel page drop-off (when enabled)
5. **Conversions UTM breakdown** — dimension tabs + filters

## Header

- Entry lookup (⌘K / Ctrl+K)
- Log out
- Theme toggle

## React Query keys

Defined in `dashboard-params.ts`: `conversionsQueryKey`, `chartsQueryKey`, `utmQueryKey`, `pageFunnelQueryKey`.

## Loading

Skeletons in `loading-skeleton.tsx`. Funnel bars animate on load in `FunnelShape` (`trend-chart.tsx`).
