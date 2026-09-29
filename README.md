# Analytics Dashboard

A demo conversion analytics dashboard with realistic sample data. Use it to preview funnel reporting UX: key metrics, conversion shapes, page funnel, UTM breakdown, and entry lookup.

```bash
npm install
npm run dev
```

Architecture:

- API routes in `src/app/api/*` call controllers in `src/lib/controllers/`
- Controllers currently return mock data from `src/lib/mock/`
- Toggle feature sections in `src/lib/feature-flags.ts`

Agent docs: [docs/README.md](docs/README.md).