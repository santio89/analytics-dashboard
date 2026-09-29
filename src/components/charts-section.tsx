"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PageFunnelChart } from "@/components/page-funnel-chart";
import { useDashboardApply } from "@/components/providers/dashboard-apply-provider";
import { ChartsSectionSkeleton, PageFunnelSkeleton } from "@/components/loading-skeleton";
import { SectionError } from "@/components/section-error";
import { TrendChart } from "@/components/trend-chart";
import { funnelLabel, type PublishedFunnel } from "@/lib/funnels";
import {
  chartsQueryKey,
  conversionsQueryKey,
  dashboardParamsToSearch,
  pageFunnelQueryKey,
  toDashboardQuery,
  type DashboardParams,
} from "@/lib/dashboard-params";
import { fetchDashboardJson } from "@/lib/dashboard-fetch";
import { formatRangeLabel } from "@/lib/dates";
import type { DailyPoint, StageTotal } from "@/lib/overview";
import type { PageFunnelResult } from "@/lib/page-funnel";
import type { RangeTotalsWithMeta } from "@/lib/overview-live";
import { CANONICAL_STAGE_ORDER } from "@/lib/stages";
import { DASHBOARD_AWAITING_APPLY_MESSAGE } from "@/lib/dashboard-apply";
import { sumDailyStages, sumDailyVisitors } from "@/lib/daily-totals";
import { showPageFunnelSection } from "@/lib/feature-flags";

type ChartsResponse = {
  currentDaily: DailyPoint[];
  previousDaily: DailyPoint[];
};

type PageFunnelResponse = {
  pageFunnel: PageFunnelResult | null;
  previousPageFunnel?: PageFunnelResult | null;
};

type ConversionsResponse = {
  current: RangeTotalsWithMeta;
  previous: RangeTotalsWithMeta | null;
};

type ChartsSectionProps = {
  params: DashboardParams;
  publishedFunnels: PublishedFunnel[];
};

export function ChartsSection({ params, publishedFunnels }: ChartsSectionProps) {
  const search = dashboardParamsToSearch(params);
  const { metricsEnabled } = useDashboardApply();
  const selected = publishedFunnels.find((funnel) => funnel.id === params.funnelId);
  const showPageFunnel = showPageFunnelSection(params.funnelId);

  const conversionsQuery = useQuery({
    queryKey: conversionsQueryKey(params),
    queryFn: ({ signal }) =>
      fetchDashboardJson<ConversionsResponse>(
        `/api/dashboard/conversions?${search}`,
        signal,
      ),
    enabled: metricsEnabled,
    placeholderData: keepPreviousData,
  });

  const chartsQuery = useQuery({
    queryKey: chartsQueryKey(params),
    queryFn: ({ signal }) =>
      fetchDashboardJson<ChartsResponse>(`/api/dashboard/charts?${search}`, signal),
    enabled: metricsEnabled,
    placeholderData: keepPreviousData,
  });

  const pageFunnelQuery = useQuery({
    queryKey: pageFunnelQueryKey(params),
    queryFn: ({ signal }) =>
      fetchDashboardJson<PageFunnelResponse>(
        `/api/dashboard/charts?scope=page-funnel&${search}`,
        signal,
      ),
    enabled: showPageFunnel && metricsEnabled,
    placeholderData: keepPreviousData,
  });

  const current = conversionsQuery.data?.current;
  const previous = conversionsQuery.data?.previous ?? null;
  const charts = chartsQuery.data;
  const useSum = params.userCount === "sum";
  const conversionsOk = Boolean(current && !current.missing && !current.error);
  const sumReady = Boolean(charts);
  const sumWaiting = useSum && !sumReady && !chartsQuery.error;
  const chartsWaiting = metricsEnabled && !charts && !chartsQuery.error && !chartsQuery.isError;
  const shapeWaiting = !current || sumWaiting || chartsWaiting;
  const hasShapeData = useSum ? sumReady && conversionsOk : conversionsOk;
  const hasSeriesData = Boolean(charts?.currentDaily?.length);
  const shapeLoading =
    hasShapeData &&
    (conversionsQuery.isFetching || (useSum && chartsQuery.isFetching));
  const seriesLoading = hasSeriesData && chartsQuery.isFetching;

  if (!metricsEnabled) {
    return (
      <section className="space-y-5">
        <TrendChart
          current={[]}
          previous={[]}
          stages={[]}
          previousStages={[]}
          visitors={0}
          previousVisitors={0}
          totalsCompareOn={false}
          seriesCompareOn={false}
          metric={params.metric}
          shapeUnavailableMessage={DASHBOARD_AWAITING_APPLY_MESSAGE}
          seriesUnavailableMessage={DASHBOARD_AWAITING_APPLY_MESSAGE}
          seriesLoading={false}
          shapeLoading={false}
        />
      </section>
    );
  }

  if (conversionsQuery.error && !current) {
    return (
      <SectionError
        message={
          conversionsQuery.error instanceof Error
            ? conversionsQuery.error.message
            : "Conversion fetch failed"
        }
      />
    );
  }

  if (chartsQuery.error && !charts && !current) {
    return (
      <SectionError
        message={
          chartsQuery.error instanceof Error
            ? chartsQuery.error.message
            : "Chart fetch failed"
        }
      />
    );
  }

  if (shapeWaiting) {
    return <ChartsSectionSkeleton showPageFunnel={showPageFunnel} />;
  }

  const canonicalTitles = new Set<string>(CANONICAL_STAGE_ORDER);
  const filterStages = (stages: StageTotal[]) =>
    params.funnelId === "all"
      ? stages.filter((stage) => canonicalTitles.has(stage.title))
      : stages;

  const currentStages = filterStages(
    params.userCount === "sum" || !conversionsOk || !current
      ? sumDailyStages(charts?.currentDaily ?? [])
      : current.stages,
  );
  const previousStages = filterStages(
    params.userCount === "sum" || !conversionsOk
      ? sumDailyStages(charts?.previousDaily ?? [])
      : (previous?.stages ?? []),
  );
  const totalsCompareReady =
    params.userCount === "sum"
      ? Boolean(params.compareOn && (charts?.previousDaily?.length ?? 0) > 0)
      : Boolean(params.compareOn && previous && !previous.missing && !previous.error);
  const seriesCompareReady = Boolean(
    params.compareOn && (charts?.previousDaily?.length ?? 0) > 0,
  );
  const pageFunnelCompareReady = Boolean(
    params.compareOn &&
      pageFunnelQuery.data?.previousPageFunnel &&
      pageFunnelQuery.data.previousPageFunnel.steps.length > 0,
  );
  const previousLabel = formatRangeLabel(params.compareFrom, params.compareTo);
  const currentLabel = formatRangeLabel(params.from, params.to);
  const visitors =
    params.userCount === "sum" || !conversionsOk || !current
      ? sumDailyVisitors(charts?.currentDaily ?? [])
      : current.visitors;
  const previousVisitors =
    useSum || !conversionsOk
      ? sumDailyVisitors(charts?.previousDaily ?? [])
      : (previous?.visitors ?? 0);

  return (
    <section className="space-y-5">
      <TrendChart
        current={charts?.currentDaily ?? []}
        previous={charts?.previousDaily ?? []}
        stages={currentStages}
        previousStages={previousStages}
        visitors={visitors}
        previousVisitors={previousVisitors}
        totalsCompareOn={totalsCompareReady}
        seriesCompareOn={seriesCompareReady}
        currentLabel={currentLabel}
        previousLabel={previousLabel}
        metric={params.metric}
        seriesLoading={seriesLoading}
        shapeLoading={shapeLoading}
      />

      {showPageFunnel ? (
        pageFunnelQuery.error && !pageFunnelQuery.data ? (
          <SectionError
            message={
              pageFunnelQuery.error instanceof Error
                ? pageFunnelQuery.error.message
                : "Page funnel fetch failed"
            }
          />
        ) : !pageFunnelQuery.data ? (
          <PageFunnelSkeleton />
        ) : pageFunnelQuery.data.pageFunnel ? (
          <PageFunnelChart
            data={pageFunnelQuery.data.pageFunnel}
            previous={pageFunnelQuery.data.previousPageFunnel ?? null}
            compareOn={pageFunnelCompareReady}
            currentLabel={currentLabel}
            previousLabel={previousLabel}
            funnelTitle={funnelLabel(selected?.title ?? "Funnel")}
            busy={pageFunnelQuery.isFetching}
            scanDepth={params.scanDepth}
            query={toDashboardQuery(params)}
            showScanDepth
          />
        ) : null
      ) : null}
    </section>
  );
}
