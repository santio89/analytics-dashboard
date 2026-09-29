# Mock data

All dashboard metrics are generated in `src/lib/mock/service.ts` from fixtures in `src/lib/mock/fixtures.ts`. API routes access them through the controllers in `src/lib/controllers/` — the controllers are the swap point if a real backend is ever wired in.

## Funnel catalog

`src/lib/mock/catalog.ts` — eight sample funnels (Wellness Intake, Hormone Therapy, etc.).

## Conversion totals

`getMockConversions()` builds `RangeTotalsWithMeta` from daily visitor simulation:

- Canonical stages: Landing Page Viewed → Purchase (see `src/lib/stages.ts`)
- Scales by selected funnel(s) and date range length
- Comparison period uses ~86% scale

## Daily charts

`getMockCharts()` returns `currentDaily` / `previousDaily` arrays of `{ day, visitors, stages }`.

## UTM breakdown

`getMockUtmDashboard()` returns rows for source / medium / campaign dimensions with realistic channel mix.

## Page funnel

`getMockPageFunnel()` returns step drop-off for single-funnel view (landing → thank_you).

## Entry lookup

`MOCK_ENTRIES` in `fixtures.ts`:

| Query | Result |
| --- | --- |
| `entry_demo_001` | Jane Doe, wellness funnel, full event trail |
| `jane.doe@example.com` | Same entry |
| `alex.morgan@demo.io` | Hormone therapy funnel |
| `entry_demo_002` | Alex Morgan detail |

## Latency

`MOCK_FETCH_DELAY_MS` in `app-config.ts` simulates network delay (~280ms).