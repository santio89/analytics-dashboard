"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import {
  chartsQueryKey,
  conversionsQueryKey,
  pageFunnelQueryKey,
  utmQueryKey,
  type DashboardParams,
} from "@/lib/dashboard-params";
import { SHOW_UTM_BREAKDOWN } from "@/lib/feature-flags";

export function useDashboardIsRefreshing(
  params: DashboardParams,
  options: {
    chartsEnabled: boolean;
    showPageFunnel: boolean;
  },
): boolean {
  const conversionsFetching =
    useIsFetching({ queryKey: conversionsQueryKey(params) }) > 0;
  const chartsFetching = useIsFetching({ queryKey: chartsQueryKey(params) }) > 0;
  const utmFetching = useIsFetching({ queryKey: utmQueryKey(params) }) > 0;
  const pageFunnelFetching =
    useIsFetching({ queryKey: pageFunnelQueryKey(params) }) > 0;

  return (
    conversionsFetching ||
    (options.chartsEnabled && chartsFetching) ||
    (SHOW_UTM_BREAKDOWN && utmFetching) ||
    (options.showPageFunnel && pageFunnelFetching)
  );
}

export function useDashboardUpdatedAt(
  params: DashboardParams,
  options: { showPageFunnel: boolean },
): number {
  const client = useQueryClient();
  const snapshotRef = useRef(0);

  const subscribe = useCallback(
    (onStoreChange: () => void) =>
      client.getQueryCache().subscribe(() => {
        queueMicrotask(onStoreChange);
      }),
    [client],
  );

  const getSnapshot = useCallback((): number => {
    const next = Math.max(
      client.getQueryState(conversionsQueryKey(params))?.dataUpdatedAt ?? 0,
      client.getQueryState(chartsQueryKey(params))?.dataUpdatedAt ?? 0,
      SHOW_UTM_BREAKDOWN
        ? (client.getQueryState(utmQueryKey(params))?.dataUpdatedAt ?? 0)
        : 0,
      options.showPageFunnel
        ? (client.getQueryState(pageFunnelQueryKey(params))?.dataUpdatedAt ?? 0)
        : 0,
    );
    if (snapshotRef.current === next) {
      return snapshotRef.current;
    }
    snapshotRef.current = next;
    return next;
  }, [client, options.showPageFunnel, params]);

  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}
