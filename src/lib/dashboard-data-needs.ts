import type { ChartStyle } from "@/lib/chart-style-preference";
import type { DashboardParams } from "@/lib/dashboard-params";

/** Whether daily charts data is required for the current view (blocks status / Sum mode). */
export function needsDailyCharts(
  params: DashboardParams,
  chartStyle: ChartStyle = "funnel",
): boolean {
  if (params.userCount === "sum") return true;
  return chartStyle !== "funnel";
}
