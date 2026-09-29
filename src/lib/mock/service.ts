import { eachIsoDay } from "@/lib/timezone";
import type { DashboardParams } from "@/lib/dashboard-params";
import type { DailyPoint, RangeTotals, StageTotal } from "@/lib/overview";
import type { RangeTotalsWithMeta } from "@/lib/overview-live";
import type { PageFunnelResult, PageFunnelStep } from "@/lib/page-funnel";
import { CANONICAL_STAGE_ORDER } from "@/lib/stages";
import type { UtmBreakdown, UtmDashboardPayload, UtmDimension, UtmFilters, UtmRow } from "@/lib/utm";
import { MOCK_FETCH_DELAY_MS } from "@/lib/app-config";
import {
  MOCK_ENTRIES,
  PAGE_FUNNEL_STEPS,
  STAGE_RATIOS,
  UTM_CAMPAIGN_ROWS,
  UTM_MEDIUM_ROWS,
  UTM_SOURCE_ROWS,
  type MockEntryRecord,
} from "@/lib/mock/fixtures";

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function scaleForFunnels(funnelIds: string[]): number {
  if (funnelIds.length > 3) return 1;
  const factor = funnelIds.reduce((acc, id) => acc + (hashString(id) % 900) / 1000, 0);
  return 0.55 + factor / Math.max(funnelIds.length, 1);
}

function dailyVisitors(day: string, funnelIds: string[], index: number): number {
  const base = 2800 * scaleForFunnels(funnelIds);
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  const weekendFactor = weekday === 0 || weekday === 6 ? 0.82 : 1;
  const wave = 1 + Math.sin(index / 2.8) * 0.12 + ((hashString(day) % 17) - 8) / 100;
  return Math.round(base * weekendFactor * wave);
}

function stagesFromVisitors(visitors: number): StageTotal[] {
  return CANONICAL_STAGE_ORDER.map((title) => {
    const ratio = STAGE_RATIOS[title] ?? 0;
    const count = Math.round((visitors * ratio) / 1000);
    return { title, count: Math.max(count, title === "Landing Page Viewed" ? visitors : 0) };
  }).filter((stage) => stage.count > 0 || stage.title === "Landing Page Viewed");
}

function stagesRecord(stages: StageTotal[]): Record<string, number> {
  return Object.fromEntries(stages.map((stage) => [stage.title, stage.count]));
}

function withMeta(totals: RangeTotals, fetchMs: number): RangeTotalsWithMeta {
  return { ...totals, dataSource: "mock", fetchMs };
}

function buildRangeTotals(
  funnelIds: string[],
  from: string,
  to: string,
  scale = 1,
): RangeTotals {
  const days = eachIsoDay(from, to);
  let visitors = 0;
  const stageMap = new Map<string, number>();

  days.forEach((day, index) => {
    const dayVisitors = Math.round(dailyVisitors(day, funnelIds, index) * scale);
    visitors += dayVisitors;
    for (const stage of stagesFromVisitors(dayVisitors)) {
      stageMap.set(stage.title, (stageMap.get(stage.title) ?? 0) + stage.count);
    }
  });

  const stages = [...stageMap.entries()]
    .map(([title, count]) => ({ title, count }))
    .sort(
      (left, right) =>
        CANONICAL_STAGE_ORDER.indexOf(left.title as (typeof CANONICAL_STAGE_ORDER)[number]) -
        CANONICAL_STAGE_ORDER.indexOf(right.title as (typeof CANONICAL_STAGE_ORDER)[number]),
    );

  return {
    visitors,
    stages,
    source: "mock",
    snapshotCoverage: 1,
    daysCovered: days.length,
    daysInRange: days.length,
    missing: false,
  };
}

function buildDailySeries(
  funnelIds: string[],
  from: string,
  to: string,
  scale = 1,
): DailyPoint[] {
  return eachIsoDay(from, to).map((day, index) => {
    const visitors = Math.round(dailyVisitors(day, funnelIds, index) * scale);
    return {
      day,
      visitors,
      stages: stagesRecord(stagesFromVisitors(visitors)),
    };
  });
}

function utmRowsForDimension(
  dimension: UtmDimension,
  visitors: number,
  filters: UtmFilters,
): UtmRow[] {
  const rows =
    dimension === "medium"
      ? UTM_MEDIUM_ROWS
      : dimension === "campaign"
        ? UTM_CAMPAIGN_ROWS
        : UTM_SOURCE_ROWS;

  const filtered = rows.filter((row) => {
    if (dimension === "source" && filters.source && row.label !== filters.source) {
      return false;
    }
    if (dimension === "medium" && filters.medium && row.label !== filters.medium) {
      return false;
    }
    if (dimension === "campaign" && filters.campaign && row.label !== filters.campaign) {
      return false;
    }
    return true;
  });

  return filtered.map((row) => {
    const rowVisitors = Math.round(visitors * row.share);
    const sourceRow = "quiz" in row ? row : UTM_SOURCE_ROWS[0];
    const quizRate = "quiz" in sourceRow ? sourceRow.quiz : 0.6;
    const leadRate = "lead" in sourceRow ? sourceRow.lead : 0.3;
    const checkoutRate = "checkout" in sourceRow ? sourceRow.checkout : 0.08;
    const purchaseRate = "purchase" in sourceRow ? sourceRow.purchase : 0.025;
    return {
      label: row.label,
      visitors: rowVisitors,
      quizStarted: Math.round(rowVisitors * quizRate),
      leadCapture: Math.round(rowVisitors * leadRate),
      checkoutStarted: Math.round(rowVisitors * checkoutRate),
      purchase: Math.max(1, Math.round(rowVisitors * purchaseRate)),
    };
  });
}

function buildUtmBreakdown(
  params: DashboardParams,
  from: string,
  to: string,
  scale = 1,
): UtmBreakdown {
  const totals = buildRangeTotals(params.funnelIds, from, to, scale);
  const rows = utmRowsForDimension(params.utmDim, totals.visitors, params.utmFilters);
  return {
    rows,
    sampleSize: rows.reduce((sum, row) => sum + row.visitors, 0),
    truncated: false,
    minDay: from,
    maxDay: to,
  };
}

function buildPageFunnel(
  from: string,
  to: string,
  filtered: boolean,
  scale = 1,
): PageFunnelResult {
  const totals = buildRangeTotals(["funnel_wellness"], from, to, scale);
  const landing = totals.stages.find((s) => s.title === "Landing Page Viewed")?.count ?? totals.visitors;
  const ratios = [1, 0.78, 0.62, 0.48, 0.36, 0.14, 0.11];
  let previousContacts = 0;
  const steps: PageFunnelStep[] = [];

  PAGE_FUNNEL_STEPS.forEach((page, index) => {
    const contacts = Math.max(1, Math.round(landing * ratios[index]! * scale));
    const dropFromPrevious =
      index === 0
        ? null
        : previousContacts > 0
          ? ((previousContacts - contacts) / previousContacts) * 100
          : null;
    steps.push({
      pageKey: page.pageKey,
      title: page.pageKey.replace(/_/g, " "),
      pageIndex: page.pageIndex,
      contacts,
      pctOfTotal: landing > 0 ? (contacts / landing) * 100 : 0,
      dropFromPrevious,
    });
    previousContacts = contacts;
  });

  return {
    steps,
    totalContacts: landing,
    truncated: false,
    minDay: from,
    maxDay: to,
    missingDays: false,
    filtered,
    source: "page_views",
  };
}

function paramsHasUtmFilters(params: DashboardParams): boolean {
  return Boolean(
    params.utmFilters.source ||
      params.utmFilters.medium ||
      params.utmFilters.campaign ||
      params.utmFilters.term ||
      params.utmFilters.content ||
      params.utmFilters.other,
  );
}

async function mockDelay(signal?: AbortSignal): Promise<number> {
  const started = Date.now();
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, MOCK_FETCH_DELAY_MS);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
  return Date.now() - started;
}

export async function getMockConversions(
  params: DashboardParams,
  signal?: AbortSignal,
): Promise<{ current: RangeTotalsWithMeta; previous: RangeTotalsWithMeta | null }> {
  const fetchMs = await mockDelay(signal);
  const current = withMeta(buildRangeTotals(params.funnelIds, params.from, params.to), fetchMs);
  const previous = params.compareOn
    ? withMeta(
        buildRangeTotals(params.funnelIds, params.compareFrom, params.compareTo, 0.86),
        Math.round(fetchMs * 0.92),
      )
    : null;
  return { current, previous };
}

export async function getMockCharts(
  params: DashboardParams,
  signal?: AbortSignal,
): Promise<{
  currentDaily: DailyPoint[];
  previousDaily: DailyPoint[];
  ingested: { minDay: string | null; maxDay: string | null };
  fetchMs: number;
}> {
  const fetchMs = await mockDelay(signal);
  return {
    currentDaily: buildDailySeries(params.funnelIds, params.from, params.to),
    previousDaily: params.compareOn
      ? buildDailySeries(params.funnelIds, params.compareFrom, params.compareTo, 0.86)
      : [],
    ingested: { minDay: params.from, maxDay: params.to },
    fetchMs,
  };
}

export async function getMockPageFunnel(
  params: DashboardParams,
  signal?: AbortSignal,
): Promise<{
  pageFunnel: PageFunnelResult | null;
  previousPageFunnel: PageFunnelResult | null;
  fetchMs: number;
}> {
  if (params.funnelId === "all") {
    return { pageFunnel: null, previousPageFunnel: null, fetchMs: 0 };
  }
  const fetchMs = await mockDelay(signal);
  const filtered = paramsHasUtmFilters(params);
  const pageFunnel = buildPageFunnel(params.from, params.to, filtered);
  const previousPageFunnel = params.compareOn
    ? buildPageFunnel(params.compareFrom, params.compareTo, filtered, 0.86)
    : null;
  return { pageFunnel, previousPageFunnel, fetchMs };
}

export async function getMockUtmDashboard(
  params: DashboardParams,
  signal?: AbortSignal,
): Promise<UtmDashboardPayload & { fetchMs: number }> {
  const fetchMs = await mockDelay(signal);
  const current = buildUtmBreakdown(params, params.from, params.to);
  const previous = params.compareOn
    ? buildUtmBreakdown(params, params.compareFrom, params.compareTo, 0.86)
    : null;
  return {
    current,
    previous,
    options: {
      sources: UTM_SOURCE_ROWS.map((row) => row.label),
      mediums: UTM_MEDIUM_ROWS.map((row) => row.label),
      campaigns: UTM_CAMPAIGN_ROWS.map((row) => row.label),
      terms: ["hormone therapy", "weight loss", "peptides"],
      contents: ["hero-a", "carousel-b"],
      others: [],
    },
    fetchMs,
  };
}

export async function getMockUtmOptions(
  params: DashboardParams,
  signal?: AbortSignal,
) {
  const payload = await getMockUtmDashboard(params, signal);
  return payload.options;
}

function entryMatchesEmail(entry: MockEntryRecord, email: string): boolean {
  return entry.email.toLowerCase() === email.toLowerCase();
}

export async function resolveMockEntryLookup(
  query: string,
  options: {
    entryOnly?: boolean;
    includeUserData?: boolean;
    includeEvents?: boolean;
    fromDay?: string;
    toDay?: string;
  },
) {
  await mockDelay();
  const trimmed = query.trim();
  const byId = MOCK_ENTRIES.find((entry) => entry.entry_id === trimmed);
  if (byId) {
    return formatEntryPayload(byId, options);
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    const matches = MOCK_ENTRIES.filter((entry) => entryMatchesEmail(entry, trimmed)).map(
      (entry) => ({
        entry_id: entry.entry_id,
        funnel_id: entry.funnel_id,
        contact_id: entry.contact_id,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        email: entry.email,
      }),
    );
    if (matches.length === 0) {
      throw new Error("No entries found for that email in the demo dataset.");
    }
    if (matches.length > 1 && !options.entryOnly) {
      return {
        multiple: true as const,
        matches,
        truncated: false,
        fromDay: options.fromDay,
        toDay: options.toDay,
        lookbackDays: 30,
        maxPages: 5,
        maxEntries: MOCK_ENTRIES.length,
      };
    }
    const entry = MOCK_ENTRIES.find((item) => item.entry_id === matches[0]!.entry_id)!;
    return formatEntryPayload(entry, options);
  }

  throw new Error("Entry not found in the demo dataset. Try entry_demo_001 or jane.doe@example.com.");
}

function formatEntryPayload(
  entry: MockEntryRecord,
  options: { includeUserData?: boolean; includeEvents?: boolean },
) {
  return {
    entry: {
      entry_id: entry.entry_id,
      group_id: entry.group_id,
      project_id: entry.project_id,
      funnel_id: entry.funnel_id,
      contact_id: entry.contact_id,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
      entry_data: entry.data,
    },
    data: options.includeUserData === false ? {} : entry.data,
    email: entry.email,
    events: options.includeEvents === false ? [] : entry.events,
    eventsError: null,
  };
}
