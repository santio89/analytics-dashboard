import { formatRangeLabel } from "@/lib/dates";
import type { DashboardParams } from "@/lib/dashboard-params";
import { funnelLabel, type PublishedFunnel } from "@/lib/funnels";
import { timezoneLabelForRange } from "@/lib/timezone";

export function dashboardTitle(
  params: DashboardParams,
  catalog: readonly PublishedFunnel[],
): string {
  if (params.funnelId === "all") return "All funnels";
  const selected = catalog.find((funnel) => funnel.id === params.funnelId);
  return funnelLabel(selected?.title ?? "Funnel");
}

export function dashboardSubtitle(params: DashboardParams): string {
  const currentLabel = formatRangeLabel(params.from, params.to);
  const previousLabel = formatRangeLabel(params.compareFrom, params.compareTo);
  const timezone = timezoneLabelForRange(params.tz, params.to);
  return params.compareOn
    ? `${currentLabel} vs ${previousLabel} · ${timezone}`
    : `${currentLabel} · ${timezone}`;
}
