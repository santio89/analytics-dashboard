"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  chartsQueryKey,
  conversionsQueryKey,
  pageFunnelQueryKey,
  utmQueryKey,
  type DashboardParams,
} from "@/lib/dashboard-params";
import type { DailyPoint } from "@/lib/overview";
import type { RangeTotalsWithMeta } from "@/lib/overview-live";
import { SHOW_UTM_BREAKDOWN } from "@/lib/feature-flags";

export type DashboardLoadTimings = {
  primaryMs: number | null;
  secondaryMs: number | null;
  primaryFetching: boolean;
  secondaryFetching: boolean;
};

type ConversionsResponse = {
  current: RangeTotalsWithMeta;
  previous: RangeTotalsWithMeta | null;
};

type ChartsResponse = {
  fetchMs?: number;
  currentDaily: DailyPoint[];
};

type FetchMsPayload = {
  fetchMs?: number;
};

function maxFetchMs(...values: Array<number | null | undefined>): number | null {
  const nums = values.filter((n): n is number => n != null && n >= 0);
  return nums.length ? Math.max(...nums) : null;
}

const EMPTY_TIMINGS: DashboardLoadTimings = {
  primaryMs: null,
  secondaryMs: null,
  primaryFetching: false,
  secondaryFetching: false,
};

function readLoadTimings(
  client: ReturnType<typeof useQueryClient>,
  params: DashboardParams,
  showPageFunnel: boolean,
  dailyChartsEnabled: boolean,
): DashboardLoadTimings {
  const conv = client.getQueryData<ConversionsResponse>(conversionsQueryKey(params));
  const charts = client.getQueryData<ChartsResponse>(chartsQueryKey(params));
  const utm = client.getQueryData<FetchMsPayload>(utmQueryKey(params));
  const pageFunnel = showPageFunnel
    ? client.getQueryData<FetchMsPayload>(pageFunnelQueryKey(params))
    : null;

  const primaryMs = maxFetchMs(
    conv?.current?.fetchMs,
    conv?.previous?.fetchMs,
    dailyChartsEnabled ? charts?.fetchMs : null,
  );
  const secondaryMs = maxFetchMs(
    SHOW_UTM_BREAKDOWN ? utm?.fetchMs : null,
    pageFunnel?.fetchMs,
  );

  const primaryFetching =
    client.isFetching({ queryKey: conversionsQueryKey(params) }) > 0 ||
    (dailyChartsEnabled &&
      client.isFetching({ queryKey: chartsQueryKey(params) }) > 0);
  const secondaryFetching =
    (SHOW_UTM_BREAKDOWN &&
      client.isFetching({ queryKey: utmQueryKey(params) }) > 0) ||
    (showPageFunnel &&
      client.isFetching({ queryKey: pageFunnelQueryKey(params) }) > 0);

  return { primaryMs, secondaryMs, primaryFetching, secondaryFetching };
}

function sameTimings(a: DashboardLoadTimings, b: DashboardLoadTimings): boolean {
  return (
    a.primaryMs === b.primaryMs &&
    a.secondaryMs === b.secondaryMs &&
    a.primaryFetching === b.primaryFetching &&
    a.secondaryFetching === b.secondaryFetching
  );
}

export function useDashboardLoadTimings(
  params: DashboardParams,
  showPageFunnel: boolean,
  dailyChartsEnabled = true,
): DashboardLoadTimings {
  const client = useQueryClient();
  const snapshotRef = useRef<DashboardLoadTimings>(EMPTY_TIMINGS);

  const subscribe = useCallback(
    (onStoreChange: () => void) =>
      client.getQueryCache().subscribe(() => {
        queueMicrotask(onStoreChange);
      }),
    [client],
  );

  const getSnapshot = useCallback((): DashboardLoadTimings => {
    const next = readLoadTimings(client, params, showPageFunnel, dailyChartsEnabled);
    if (sameTimings(snapshotRef.current, next)) {
      return snapshotRef.current;
    }
    snapshotRef.current = next;
    return next;
  }, [client, params, showPageFunnel, dailyChartsEnabled]);

  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_TIMINGS);
}
