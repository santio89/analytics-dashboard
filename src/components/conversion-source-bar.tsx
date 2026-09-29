"use client";

import { RefreshCw } from "lucide-react";
import {
  buildDemoDataSourceStatus,
  formatUpdatedAt,
} from "@/lib/conversion-meta";
import type { DashboardLoadTimings } from "@/lib/use-dashboard-load-timings";
import type { RangeTotalsWithMeta } from "@/lib/overview-live";
import { Spinner } from "@/components/spinner";
import { cn } from "@/lib/cn";
import { DASHBOARD_AWAITING_APPLY_MESSAGE } from "@/lib/dashboard-apply";
import { DATA_SOURCE, loadingSectionLabel } from "@/lib/section-labels";

export type ConversionSourceFootnote = {
  message: string;
  tone?: "muted" | "warning";
};

type ConversionSourceBarProps = {
  current?: RangeTotalsWithMeta | null;
  displayVisitors?: number;
  statusLoading?: boolean;
  previousLabel?: string | null;
  loadTimings: DashboardLoadTimings;
  isFetching?: boolean;
  isRefetching?: boolean;
  updatedAt?: number;
  tz?: string;
  onRefresh?: () => void;
  footnotes?: ConversionSourceFootnote[];
  awaitingApply?: boolean;
};

export function ConversionSourceBar({
  current,
  displayVisitors,
  statusLoading = false,
  previousLabel,
  loadTimings,
  isFetching = false,
  isRefetching = false,
  updatedAt,
  tz,
  onRefresh,
  footnotes = [],
  awaitingApply = false,
}: ConversionSourceBarProps) {
  const showStatusLoading = statusLoading || (!current && !awaitingApply);
  const status = awaitingApply
    ? DASHBOARD_AWAITING_APPLY_MESSAGE
    : current && !showStatusLoading
      ? buildDemoDataSourceStatus(current, loadTimings, displayVisitors)
      : null;
  const loaded = updatedAt && tz ? formatUpdatedAt(updatedAt, tz) : null;
  const busy = isFetching || isRefetching;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-(--shadow)">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium">{DATA_SOURCE}</p>
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
              Demo
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted">Sample data for preview</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
            {showStatusLoading ? (
              <>
                <span className="inline-flex items-center gap-1">
                  <Spinner className="h-3 w-3" />
                  {loadingSectionLabel(DATA_SOURCE)}
                </span>
                <span
                  className="inline-block h-3 w-44 max-w-full animate-pulse rounded bg-border"
                  aria-hidden
                />
              </>
            ) : busy && current?.error ? (
              <span className="inline-flex items-center gap-1">
                <Spinner className="h-3 w-3" />
                Updating…
              </span>
            ) : (
              <>
                {busy && (
                  <span className="inline-flex items-center gap-1">
                    <Spinner className="h-3 w-3" />
                    Updating
                  </span>
                )}
                <span>{status}</span>
                {loaded ? (
                  <span suppressHydrationWarning>{loaded}</span>
                ) : null}
                {previousLabel ? (
                  <span>Compare: {previousLabel}</span>
                ) : null}
              </>
            )}
          </p>
        </div>
        {onRefresh && (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              className="btn btn-outline px-2.5 py-1 text-xs"
              onClick={onRefresh}
              aria-busy={busy}
              aria-label="Refresh all dashboard metrics"
            >
              {busy ? (
                <Spinner className="h-3.5 w-3.5" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Refresh
            </button>
          </div>
        )}
      </div>
      {footnotes.length > 0 && (
        <div className="space-y-1.5 border-t border-border px-4 py-2.5">
          {footnotes.map((note) => (
            <p
              key={note.message}
              className={cn(
                "text-xs",
                note.tone === "warning" ? "text-warning" : "text-muted",
              )}
            >
              {note.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
