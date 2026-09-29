"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { SectionError } from "@/components/section-error";
import { useDashboardApply } from "@/components/providers/dashboard-apply-provider";
import { UtmBreakdownCard } from "@/components/utm-breakdown";
import { UtmSkeleton } from "@/components/loading-skeleton";
import {
  dashboardParamsToSearch,
  toDashboardQuery,
  utmQueryKey,
  type DashboardParams,
} from "@/lib/dashboard-params";
import { formatRangeLabel } from "@/lib/dates";
import { fetchDashboardJson } from "@/lib/dashboard-fetch";
import { DASHBOARD_AWAITING_APPLY_MESSAGE } from "@/lib/dashboard-apply";
import type { UtmDashboardPayload } from "@/lib/utm";

type UtmSectionProps = {
  params: DashboardParams;
};

export function UtmSection({ params }: UtmSectionProps) {
  const search = dashboardParamsToSearch(params);
  const dashboardQuery = toDashboardQuery(params);
  const { metricsEnabled } = useDashboardApply();

  const utmQuery = useQuery({
    queryKey: utmQueryKey(params),
    queryFn: ({ signal }) =>
      fetchDashboardJson<UtmDashboardPayload>(`/api/dashboard/utm?${search}`, signal),
    enabled: metricsEnabled,
    placeholderData: keepPreviousData,
  });

  const compareReady = Boolean(
    params.compareOn && (utmQuery.data?.previous?.sampleSize ?? 0) > 0,
  );
  const compareWarning =
    params.compareOn && utmQuery.data && !compareReady
      ? `No UTM data for the comparison period (${formatRangeLabel(params.compareFrom, params.compareTo)}).`
      : undefined;

  if (!metricsEnabled) {
    return (
      <p className="rounded-2xl border border-border bg-card px-4 py-6 text-sm text-muted shadow-(--shadow)">
        {DASHBOARD_AWAITING_APPLY_MESSAGE}
      </p>
    );
  }

  if (utmQuery.error && !utmQuery.data) {
    return (
      <SectionError
        message={
          utmQuery.error instanceof Error
            ? utmQuery.error.message
            : "UTM fetch failed"
        }
      />
    );
  }

  if (!utmQuery.data) return <UtmSkeleton />;

  return (
    <UtmBreakdownCard
      current={utmQuery.data.current}
      previous={utmQuery.data.previous}
      compareOn={compareReady}
      compareWarning={compareWarning}
      dimension={params.utmDim}
      query={dashboardQuery}
      utmOptions={utmQuery.data.options}
      busy={utmQuery.isFetching}
    />
  );
}
