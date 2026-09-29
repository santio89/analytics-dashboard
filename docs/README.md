# Analytics Dashboard — Docs

Read this folder before changing code. The app is a **mock-only demo dashboard** — no external APIs, database, cron jobs, or environment variables.

| Doc | What it covers |
| --- | --- |
| [agent-playbook.md](./agent-playbook.md) | How to work in this repo |
| [architecture.md](./architecture.md) | Stack, request flow, file map |
| [dashboard.md](./dashboard.md) | URL state, toolbar, UI, React Query keys |
| [data.md](./data.md) | Mock data shapes and generators |

## Mental model

```
Browser  →  URL search params (shareable dashboard state)
         →  DashboardBody (React Query)
         →  /api/dashboard/* and /api/entries/* (mock handlers)
         →  src/lib/controllers/ (data access layer)
         →  src/lib/mock/ (mock data service and fixtures)

API routes go through controllers, which currently return mock data. To
wire in a real backend or database, replace the controller bodies — the
routes and UI are already separated from the data source.
Session auth uses a simple cookie (Log in / Log out); no password.
```

## Do this first

1. Read this file, then [agent-playbook.md](./agent-playbook.md).
2. If touching Next.js APIs, read `node_modules/next/dist/docs/` — this is Next 16.
3. If changing metrics or mock data, read [data.md](./data.md) and edit `src/lib/mock/`.
4. If changing filters or layout, read [dashboard.md](./dashboard.md) and verify in the browser.

## What not to do

- Do not invent a global store (Redux/Zustand). State is URL + React Query + local draft.
- Do not reintroduce external API keys, databases, cron jobs, or environment variables without an explicit request.
- Do not commit, push, or change git config unless the user asks.