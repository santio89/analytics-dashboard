"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Toolbar } from "@/components/toolbar";
import { ConversionsSection } from "@/components/conversions-section";
import { ChartsSection } from "@/components/charts-section";
import { UtmSection } from "@/components/utm-section";
import { SectionBoundary } from "@/components/section-boundary";
import {
  chartsQueryKey,
  conversionsQueryKey,
  dashboardParamsToSearch,
  pageFunnelQueryKey,
  utmQueryKey,
  type DashboardParams,
} from "@/lib/dashboard-params";
import type { PublishedFunnel } from "@/lib/funnels";
import { needsDailyCharts } from "@/lib/dashboard-data-needs";
import { fetchDashboardJson } from "@/lib/dashboard-fetch";
import { SHOW_UTM_BREAKDOWN, showPageFunnelSection } from "@/lib/feature-flags";
import type { PageFunnelResult } from "@/lib/page-funnel";
import { useChartStyle } from "@/lib/chart-style-preference";
import {
  useDashboardIsRefreshing,
  useDashboardUpdatedAt,
} from "@/lib/use-dashboard-refresh-state";

type PageFunnelResponse = {
  pageFunnel: PageFunnelResult | null;
  previousPageFunnel?: PageFunnelResult | null;
};

type DashboardBodyProps = {
  params: DashboardParams;
  publishedFunnels: PublishedFunnel[];
  catalogLoading?: boolean;
};

export function DashboardBody({
  params,
  publishedFunnels,
  catalogLoading = false,
}: DashboardBodyProps) {
  const search = dashboardParamsToSearch(params);
  const queryClient = useQueryClient();
  const chartStyle = useChartStyle();
  const showPageFunnel = showPageFunnelSection(params.funnelId);
  const chartsBlockStatus = needsDailyCharts(params, chartStyle);
  const isRefreshing = useDashboardIsRefreshing(params, {
    chartsEnabled: chartsBlockStatus,
    showPageFunnel,
  });
  const updatedAt = useDashboardUpdatedAt(params, { showPageFunnel });

  const refreshAll = () => {
    const jobs: Array<Promise<unknown>> = [
      queryClient.refetchQueries({ queryKey: conversionsQueryKey(params) }),
      queryClient.refetchQueries({ queryKey: chartsQueryKey(params) }),
    ];
    if (SHOW_UTM_BREAKDOWN) {
      jobs.push(
        queryClient.fetchQuery({
          queryKey: utmQueryKey(params),
          queryFn: ({ signal }) =>
            fetchDashboardJson(`/api/dashboard/utm?${search}&fresh=1`, signal),
          staleTime: 0,
        }),
      );
    }
    if (showPageFunnel) {
      jobs.push(
        queryClient.fetchQuery({
          queryKey: pageFunnelQueryKey(params),
          queryFn: ({ signal }) =>
            fetchDashboardJson<PageFunnelResponse>(
              `/api/dashboard/charts?scope=page-funnel&${search}&fresh=1`,
              signal,
            ),
          staleTime: 0,
        }),
      );
    }
    void Promise.all(jobs);
  };

  return (
    <>
      <Toolbar
        publishedFunnels={publishedFunnels}
        catalogLoading={catalogLoading}
        funnelId={params.funnelId}
        from={params.from}
        to={params.to}
        compareOn={params.compareOn}
        compareFrom={params.compareFrom}
        compareTo={params.compareTo}
        tz={params.tz}
        metric={params.metric}
        utmDim={params.utmDim}
        utmSource={params.utmSource}
        utmMedium={params.utmMedium}
        utmCampaign={params.utmCampaign}
        utmTerm={params.utmTerm}
        utmContent={params.utmContent}
        utmOther={params.utmOther}
        scanDepth={params.scanDepth}
        userCount={params.userCount}
      />

      <SectionBoundary name="Conversion totals">
        <ConversionsSection
          params={params}
          showPageFunnel={showPageFunnel}
          dailyChartsEnabled={chartsBlockStatus}
          onRefreshAll={refreshAll}
          isRefreshing={isRefreshing}
          updatedAt={updatedAt}
        />
      </SectionBoundary>
      <SectionBoundary name="Charts">
        <ChartsSection params={params} publishedFunnels={publishedFunnels} />
      </SectionBoundary>
      {SHOW_UTM_BREAKDOWN ? (
        <SectionBoundary name="Conversions UTM breakdown">
          <UtmSection params={params} />
        </SectionBoundary>
      ) : null}
    </>
  );
}
