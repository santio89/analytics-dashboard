"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ConversionSourceBar,
  type ConversionSourceFootnote,
} from "@/components/conversion-source-bar";
import { ConversionStrip } from "@/components/conversion-strip";
import { FunnelTable } from "@/components/funnel-table";
import { UserCountToggle } from "@/components/user-count-toggle";
import { useDashboardApply } from "@/components/providers/dashboard-apply-provider";
import { SectionError } from "@/components/section-error";
import {
  ConversionStripSkeleton,
  FunnelTableSkeleton,
} from "@/components/loading-skeleton";
import {
  chartsQueryKey,
  conversionsQueryKey,
  dashboardParamsToSearch,
  toDashboardQuery,
  type DashboardParams,
} from "@/lib/dashboard-params";
import { fetchDashboardJson } from "@/lib/dashboard-fetch";
import { sumDailyStages, sumDailyVisitors } from "@/lib/daily-totals";
import { formatRangeLabel } from "@/lib/dates";
import { useDashboardLoadTimings } from "@/lib/use-dashboard-load-timings";
import type { DailyPoint, StageTotal } from "@/lib/overview";
import type { RangeTotalsWithMeta } from "@/lib/overview-live";
import { CANONICAL_STAGE_ORDER } from "@/lib/stages";
import { DASHBOARD_AWAITING_APPLY_MESSAGE } from "@/lib/dashboard-apply";
import { loadingSectionLabel, KEY_METRICS } from "@/lib/section-labels";
import { SHOW_USER_COUNT_TOGGLE } from "@/lib/feature-flags";

type ConversionsResponse = {
  current: RangeTotalsWithMeta;
  previous: RangeTotalsWithMeta | null;
};

type ChartsResponse = {
  currentDaily: DailyPoint[];
  previousDaily: DailyPoint[];
};

function buildConversionFootnotes(
  current: RangeTotalsWithMeta,
  previous: RangeTotalsWithMeta | null,
  params: DashboardParams,
  currentLabel: string,
  previousLabel: string,
): ConversionSourceFootnote[] {
  const notes: ConversionSourceFootnote[] = [];

  if (current.error) {
    notes.push({ message: current.error, tone: "warning" });
  } else if (current.missing) {
    notes.push({
      message: `No conversion totals for ${currentLabel} in the demo dataset.`,
      tone: "warning",
    });
  }

  if (params.compareOn && previous?.missing) {
    notes.push({
      message: `No data for the comparison period (${previousLabel}).`,
      tone: "warning",
    });
  }

  return notes;
}

function userCountActions(params: DashboardParams) {
  if (!SHOW_USER_COUNT_TOGGLE) return undefined;
  return (
    <UserCountToggle query={toDashboardQuery(params)} mode={params.userCount} />
  );
}

type ConversionsSectionProps = {
  params: DashboardParams;
  showPageFunnel: boolean;
  dailyChartsEnabled: boolean;
  onRefreshAll?: () => void;
  isRefreshing?: boolean;
  updatedAt?: number;
};

export function ConversionsSection({
  params,
  showPageFunnel,
  dailyChartsEnabled,
  onRefreshAll,
  isRefreshing = false,
  updatedAt = 0,
}: ConversionsSectionProps) {
  const search = dashboardParamsToSearch(params);
  const { metricsEnabled } = useDashboardApply();
  const loadTimings = useDashboardLoadTimings(
    params,
    showPageFunnel,
    dailyChartsEnabled,
  );
  const currentLabel = formatRangeLabel(params.from, params.to);
  const previousLabel = formatRangeLabel(params.compareFrom, params.compareTo);
  const useSum = params.userCount === "sum";

  const { data, error, isFetching, refetch } = useQuery({
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
      fetchDashboardJson<ChartsResponse>(
        `/api/dashboard/charts?${search}`,
        signal,
      ),
    enabled: metricsEnabled,
    placeholderData: keepPreviousData,
  });

  const current = data?.current;
  const previous = data?.previous ?? null;
  const charts = chartsQuery.data;
  const sumReady = Boolean(charts);
  const sumWaiting = useSum && !sumReady && !chartsQuery.error;
  const statusLoading = metricsEnabled && (!current && !error || sumWaiting);

  const footnotes = current
    ? buildConversionFootnotes(
        current,
        previous,
        params,
        currentLabel,
        previousLabel,
      )
    : [];

  const refresh = onRefreshAll ?? (() => void refetch());

  const displayVisitors =
    current && !current.error && !current.missing
      ? useSum
        ? sumReady
          ? sumDailyVisitors(charts!.currentDaily)
          : undefined
        : current.visitors
      : undefined;

  return (
    <section className="space-y-5">
      <ConversionSourceBar
        current={current}
        displayVisitors={displayVisitors}
        statusLoading={statusLoading}
        previousLabel={params.compareOn && previous ? previousLabel : null}
        loadTimings={loadTimings}
        isFetching={isFetching}
        isRefetching={isRefreshing}
        updatedAt={updatedAt}
        tz={params.tz}
        footnotes={footnotes}
        onRefresh={metricsEnabled ? refresh : undefined}
        awaitingApply={!metricsEnabled}
      />

      {error && !current ? (
        <SectionError
          message={
            error instanceof Error ? error.message : "Conversion fetch failed"
          }
          onRetry={refresh}
        />
      ) : !metricsEnabled ? (
        <div className="space-y-5">
          {renderAwaitingApplyMetrics({ params, currentLabel, previousLabel })}
        </div>
      ) : !current || sumWaiting ? (
        <div aria-busy="true" aria-label={loadingSectionLabel(KEY_METRICS)}>
          <ConversionStripSkeleton />
          <div className="mt-5">
            <FunnelTableSkeleton />
          </div>
        </div>
      ) : useSum && chartsQuery.error ? (
        <SectionError
          message={
            chartsQuery.error instanceof Error
              ? chartsQuery.error.message
              : "Daily series fetch failed"
          }
          onRetry={refresh}
        />
      ) : (
        <div className="space-y-5">
          {renderMetrics({
            current,
            previous,
            params,
            currentLabel,
            previousLabel,
            compareOn: params.compareOn,
            busy: isFetching || (useSum && chartsQuery.isFetching),
            currentDaily: charts?.currentDaily ?? [],
            previousDaily: charts?.previousDaily ?? [],
          })}
        </div>
      )}
    </section>
  );
}

function renderAwaitingApplyMetrics({
  params,
  currentLabel,
  previousLabel,
}: {
  params: DashboardParams;
  currentLabel: string;
  previousLabel: string;
}) {
  const userCountToggle = userCountActions(params);

  return (
    <>
      <ConversionStrip
        visitors={0}
        stages={[]}
        busy={false}
        actions={userCountToggle}
        unavailableMessage={DASHBOARD_AWAITING_APPLY_MESSAGE}
      />

      <FunnelTable
        visitors={0}
        stages={[]}
        compareOn={false}
        currentLabel={currentLabel}
        previousLabel={previousLabel}
        busy={false}
        userCount={params.userCount}
        unavailableMessage={DASHBOARD_AWAITING_APPLY_MESSAGE}
      />
    </>
  );
}

function renderMetrics({
  current,
  previous,
  params,
  currentLabel,
  previousLabel,
  compareOn,
  busy,
  currentDaily,
  previousDaily,
}: {
  current: RangeTotalsWithMeta;
  previous: RangeTotalsWithMeta | null;
  params: DashboardParams;
  currentLabel: string;
  previousLabel: string;
  compareOn: boolean;
  busy: boolean;
  currentDaily: DailyPoint[];
  previousDaily: DailyPoint[];
}) {
  const canonicalTitles = new Set<string>(CANONICAL_STAGE_ORDER);
  const filterStages = (stages: StageTotal[]) =>
    params.funnelId === "all"
      ? stages.filter((stage) => canonicalTitles.has(stage.title))
      : stages;

  const useSum = params.userCount === "sum";
  const visitors = useSum ? sumDailyVisitors(currentDaily) : current.visitors;
  const stages = filterStages(
    useSum ? sumDailyStages(currentDaily) : current.stages,
  );
  const previousVisitors = useSum
    ? sumDailyVisitors(previousDaily)
    : (previous?.visitors ?? 0);
  const previousStages = filterStages(
    useSum ? sumDailyStages(previousDaily) : (previous?.stages ?? []),
  );
  const compareReady = useSum
    ? Boolean(compareOn && previousDaily.length > 0)
    : Boolean(compareOn && previous && !previous.missing && !previous.error);
  const showMetrics = !current.missing && !current.error;
  const userCountToggle = userCountActions(params);

  if (showMetrics) {
    return (
      <>
        <ConversionStrip
          visitors={visitors}
          stages={stages}
          compareOn={compareReady}
          previousVisitors={previousVisitors}
          previousStages={previousStages}
          busy={busy}
          actions={userCountToggle}
        />

        <FunnelTable
          visitors={visitors}
          stages={stages}
          compareOn={compareReady}
          previousVisitors={previousVisitors}
          previousStages={previousStages}
          currentLabel={currentLabel}
          previousLabel={previousLabel}
          busy={busy}
          userCount={params.userCount}
        />
      </>
    );
  }

  return (
    <>
      <ConversionStrip
        visitors={0}
        stages={[]}
        busy={busy}
        actions={userCountToggle}
        unavailableMessage={
          busy
            ? undefined
            : current.missing
              ? `No conversion totals for ${currentLabel} in the demo dataset.`
              : current.error
        }
      />

      <FunnelTable
        visitors={0}
        stages={[]}
        compareOn={false}
        currentLabel={currentLabel}
        busy={busy}
        userCount={params.userCount}
        unavailableMessage={
          busy
            ? undefined
            : current.missing
              ? `No conversion totals for ${currentLabel} in the demo dataset.`
              : current.error
        }
      />
    </>
  );
}
