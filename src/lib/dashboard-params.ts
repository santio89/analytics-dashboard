import { buildDashboardQuery } from "@/lib/dashboard-query";
import { equalPriorPeriod, presetRange, todayIso } from "@/lib/dates";
import {
  SHOW_TIMEZONE_SELECTOR,
  SHOW_USER_COUNT_TOGGLE,
} from "@/lib/feature-flags";
import type { UtmDimension } from "@/lib/utm";
import {
  FALLBACK_PUBLISHED_FUNNELS,
  publishedFunnelIds,
  type PublishedFunnel,
} from "@/lib/funnels";
import {
  parseScanDepth,
  type ScanDepth,
} from "@/lib/scan-depth";
import { DEFAULT_REPORTING_TIMEZONE, parseTimezone } from "@/lib/timezone";
import {
  DEFAULT_USER_COUNT_MODE,
  parseUserCountMode,
  type UserCountMode,
} from "@/lib/user-count-mode";

export type DashboardParams = {
  funnelId: string;
  funnelIds: string[];
  from: string;
  to: string;
  compareOn: boolean;
  compareFrom: string;
  compareTo: string;
  metric: string;
  tz: string;
  utmDim: UtmDimension;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  utmOther: string;
  scanDepth: ScanDepth;
  userCount: UserCountMode;
  utmFilters: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
    other?: string;
  };
};

function first(value: string | string[] | undefined, fallback: string) {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value || fallback;
}

function effectiveReportingTimezone(raw: string | string[] | undefined): string {
  if (!SHOW_TIMEZONE_SELECTOR) return DEFAULT_REPORTING_TIMEZONE;
  return parseTimezone(first(raw, ""));
}

function effectiveUserCountMode(raw: string | string[] | undefined): UserCountMode {
  if (!SHOW_USER_COUNT_TOGGLE) return DEFAULT_USER_COUNT_MODE;
  return parseUserCountMode(first(raw, ""));
}

export function parseDashboardParams(
  params: Record<string, string | string[] | undefined>,
  catalog: readonly PublishedFunnel[] = FALLBACK_PUBLISHED_FUNNELS,
): DashboardParams {
  const tz = effectiveReportingTimezone(params.tz);
  const defaults = presetRange(14, todayIso(tz), tz);
  const funnelId = first(params.funnel, "all");
  const from = first(params.from, defaults.from);
  const to = first(params.to, defaults.to);
  const compareOn = first(params.compare, "") === "1";
  const prior = equalPriorPeriod(from, to);
  const compareFrom = first(params.compareFrom, prior.compareFrom);
  const compareTo = first(params.compareTo, prior.compareTo);
  const utmDimRaw = first(params.utmDim, "source");
  const utmDim: UtmDimension = (
    ["source", "medium", "campaign", "term", "content"] as const
  ).includes(utmDimRaw as UtmDimension)
    ? (utmDimRaw as UtmDimension)
    : "source";

  const utmSource = first(params.utmSource, "");
  const utmMedium = first(params.utmMedium, "");
  const utmCampaign = first(params.utmCampaign, "");
  const utmTerm = first(params.utmTerm, "");
  const utmContent = first(params.utmContent, "");
  const utmOther = first(params.utmOther, "");

  return {
    funnelId,
    funnelIds: funnelId === "all" ? publishedFunnelIds(catalog) : [funnelId],
    from,
    to,
    compareOn,
    compareFrom,
    compareTo,
    metric: first(params.metric, "Purchase"),
    tz,
    utmDim,
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    utmOther,
    scanDepth: parseScanDepth(first(params.scanDepth, "")),
    userCount: effectiveUserCountMode(params.users),
    utmFilters: {
      source: utmSource || undefined,
      medium: utmMedium || undefined,
      campaign: utmCampaign || undefined,
      term: utmTerm || undefined,
      content: utmContent || undefined,
      other: utmOther || undefined,
    },
  };
}

export function conversionsQueryKey(params: DashboardParams) {
  return [
    "conversions",
    params.funnelId,
    params.from,
    params.to,
    params.compareOn,
    params.compareFrom,
    params.compareTo,
    params.tz,
  ] as const;
}

export function chartsQueryKey(params: DashboardParams) {
  return [
    "charts",
    params.funnelId,
    params.from,
    params.to,
    params.compareOn,
    params.compareFrom,
    params.compareTo,
    params.tz,
  ] as const;
}

export function pageFunnelQueryKey(params: DashboardParams) {
  return [
    "page-funnel",
    params.funnelId,
    params.from,
    params.to,
    params.compareOn,
    params.compareFrom,
    params.compareTo,
    params.tz,
    params.utmSource,
    params.utmMedium,
    params.utmCampaign,
    params.utmTerm,
    params.utmContent,
    params.utmOther,
    params.scanDepth,
  ] as const;
}

export function utmQueryKey(params: DashboardParams) {
  return [
    "utm",
    params.funnelId,
    params.from,
    params.to,
    params.compareOn,
    params.compareFrom,
    params.compareTo,
    params.tz,
    params.utmDim,
    params.utmSource,
    params.utmMedium,
    params.utmCampaign,
    params.utmTerm,
    params.utmContent,
    params.utmOther,
    params.scanDepth,
  ] as const;
}

export function utmOptionsQueryKey(
  params: Pick<
    DashboardParams,
    "funnelId" | "from" | "to" | "tz" | "scanDepth"
  >,
) {
  return [
    "utm-options",
    params.funnelId,
    params.from,
    params.to,
    params.tz,
    params.scanDepth,
  ] as const;
}

export function dashboardParamsToSearch(params: DashboardParams): string {
  const href = buildDashboardQuery({
    funnelId: params.funnelId,
    from: params.from,
    to: params.to,
    compareOn: params.compareOn,
    compareFrom: params.compareFrom,
    compareTo: params.compareTo,
    metric: params.metric,
    utmDim: params.utmDim,
    utmSource: params.utmSource,
    utmMedium: params.utmMedium,
    utmCampaign: params.utmCampaign,
    utmTerm: params.utmTerm,
    utmContent: params.utmContent,
    utmOther: params.utmOther,
    scanDepth: params.scanDepth,
    tz: params.tz,
    userCount: params.userCount,
  });
  return href.startsWith("/?") ? href.slice(2) : href;
}

export function toDashboardQuery(params: DashboardParams) {
  return {
    funnelId: params.funnelId,
    from: params.from,
    to: params.to,
    compareOn: params.compareOn,
    compareFrom: params.compareFrom,
    compareTo: params.compareTo,
    metric: params.metric,
    utmDim: params.utmDim,
    utmSource: params.utmSource,
    utmMedium: params.utmMedium,
    utmCampaign: params.utmCampaign,
    utmTerm: params.utmTerm,
    utmContent: params.utmContent,
    utmOther: params.utmOther,
    scanDepth: params.scanDepth,
    tz: params.tz,
    userCount: params.userCount,
  };
}
