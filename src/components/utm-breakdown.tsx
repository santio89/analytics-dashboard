"use client";

import { useState } from "react";
import { CollapsibleSection } from "@/components/collapsible-section";
import { UTM_BREAKDOWN, updatingSectionLabel } from "@/lib/section-labels";
import { TruncatedText } from "@/components/truncated-text";
import { UtmFilters } from "@/components/utm-filters";
import { useDashboardNavigation } from "@/components/navigation-provider";
import { formatNumber, formatRate } from "@/lib/cn";
import { buildDashboardQuery, type DashboardQuery } from "@/lib/dashboard-query";
import type { UtmBreakdown, UtmDimension } from "@/lib/utm";
import {
  DEFAULT_SCAN_DEPTH,
  liveRestEntriesForDepth,
  type ScanDepth,
} from "@/lib/scan-depth";

const DIMENSIONS: { id: UtmDimension; label: string }[] = [
  { id: "source", label: "Source" },
  { id: "medium", label: "Medium" },
  { id: "campaign", label: "Campaign" },
  { id: "term", label: "Term" },
  { id: "content", label: "Content" },
];

const DEFAULT_VISIBLE_ROWS = 25;

type UtmBreakdownCardProps = {
  current: UtmBreakdown;
  previous?: UtmBreakdown | null;
  compareOn?: boolean;
  compareWarning?: string;
  dimension: UtmDimension;
  query: DashboardQuery;
  busy?: boolean;
  utmOptions?: {
    sources: string[];
    mediums: string[];
    campaigns: string[];
    terms: string[];
    contents: string[];
    others: string[];
  };
};

export function UtmBreakdownCard({
  current,
  previous,
  compareOn = false,
  compareWarning,
  dimension,
  query,
  busy = false,
  utmOptions,
}: UtmBreakdownCardProps) {
  const { navigate } = useDashboardNavigation();
  const [mode, setMode] = useState<"count" | "rate">("count");
  const [expanded, setExpanded] = useState(false);
  const [lastDimension, setLastDimension] = useState(dimension);
  const scanDepth: ScanDepth = query.scanDepth ?? DEFAULT_SCAN_DEPTH;

  if (lastDimension !== dimension) {
    setLastDimension(dimension);
    setExpanded(false);
  }

  const headerActions = (
    <>
      <div className="flex max-w-full flex-wrap rounded-lg border border-border p-0.5">
        {DIMENSIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (item.id === dimension) return;
              navigate(buildDashboardQuery({ ...query, utmDim: item.id }));
            }}
            className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
              dimension === item.id
                ? "bg-accent text-accent-fg"
                : "text-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex rounded-lg border border-border p-0.5">
        {(["count", "rate"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
              mode === item
                ? "bg-accent text-accent-fg"
                : "text-muted hover:text-foreground"
            }`}
            onClick={() => setMode(item)}
          >
            {item === "count" ? "Count" : "Rate"}
          </button>
        ))}
      </div>
    </>
  );

  const filters = (
    <UtmFilters query={query} optionsReady={Boolean(utmOptions)} {...(utmOptions ?? {})} />
  );

  if (current.sampleSize === 0) {
    return (
      <CollapsibleSection
        id="utm-breakdown"
        title={UTM_BREAKDOWN}
        description="No traffic data for this range yet."
        actions={headerActions}
        busy={busy}
        busyLabel={updatingSectionLabel(UTM_BREAKDOWN)}
        contentClassName="text-xs text-muted"
      >
        {filters}
        <p className="px-4 py-3">Nothing to show for these filters.</p>
      </CollapsibleSection>
    );
  }

  const priorByLabel = new Map(
    (previous?.rows ?? []).map((row) => [row.label, row]),
  );

  const hiddenCount = Math.max(0, current.rows.length - DEFAULT_VISIBLE_ROWS);
  const visibleRows =
    expanded || hiddenCount === 0
      ? current.rows
      : current.rows.slice(0, DEFAULT_VISIBLE_ROWS);

  function renderRow(row: (typeof current.rows)[number]) {
    const prior = priorByLabel.get(row.label);
    const cell = (count: number) =>
      mode === "rate"
        ? formatRate(row.visitors > 0 ? (count / row.visitors) * 100 : 0)
        : formatNumber(count);
    const delta = compareOn && prior ? row.visitors - prior.visitors : null;

    return (
      <tr
        key={row.label}
        className="border-b border-border/70 last:border-0 hover:bg-card-hover"
      >
        <td className="max-w-[280px] px-4 py-3 font-medium">
          <TruncatedText text={row.label} />
        </td>
        <td className="tabular px-4 py-3 text-right">{formatNumber(row.visitors)}</td>
        <td className="tabular px-4 py-3 text-right text-muted">
          {cell(row.quizStarted)}
        </td>
        <td className="tabular px-4 py-3 text-right text-muted">
          {cell(row.leadCapture)}
        </td>
        <td className="tabular px-4 py-3 text-right text-muted">
          {cell(row.checkoutStarted)}
        </td>
        <td className="tabular px-4 py-3 text-right text-muted">
          {cell(row.purchase)}
        </td>
        {compareOn && (
          <td
            className={`tabular px-4 py-3 text-right ${
              delta == null || delta === 0
                ? "text-muted"
                : delta > 0
                  ? "text-up"
                  : "text-down"
            }`}
          >
            {delta == null
              ? "New"
              : `${delta > 0 ? "+" : ""}${formatNumber(delta)}`}
          </td>
        )}
      </tr>
    );
  }

  return (
    <CollapsibleSection
      id="utm-breakdown"
      title={UTM_BREAKDOWN}
      actions={headerActions}
      busy={busy}
      busyLabel={updatingSectionLabel(UTM_BREAKDOWN)}
      contentClassName="overflow-x-auto"
    >
      {filters}
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
            <th className="px-4 py-3 font-medium">
              {DIMENSIONS.find((item) => item.id === dimension)?.label}
            </th>
            <th className="px-4 py-3 font-medium text-right">Sessions</th>
            <th className="px-4 py-3 font-medium text-right">Quiz</th>
            <th className="px-4 py-3 font-medium text-right">Lead</th>
            <th className="px-4 py-3 font-medium text-right">Checkout</th>
            <th className="px-4 py-3 font-medium text-right">Purchase</th>
            {compareOn && (
              <th className="px-4 py-3 font-medium text-right">Sessions Δ</th>
            )}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => renderRow(row))}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted">
        <p>
          {formatNumber(current.sampleSize)} sessions
          {current.minDay && current.maxDay
            ? ` · ${current.minDay} – ${current.maxDay}`
            : ""}
          {` · scan depth ${
            scanDepth === "all"
              ? `All (up to ${formatNumber(liveRestEntriesForDepth("all"))})`
              : formatNumber(liveRestEntriesForDepth(scanDepth))
          }`}
          {current.truncated ? " · partial results" : ""}
          {hiddenCount > 0 && !expanded
            ? ` · Top ${DEFAULT_VISIBLE_ROWS} shown`
            : ""}
          {compareWarning ? ` · ${compareWarning}` : ""}
        </p>
        {hiddenCount > 0 && (
          <button
            type="button"
            className="text-xs text-accent hover:underline"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded
              ? "Show less"
              : `Show ${formatNumber(hiddenCount)} more`}
          </button>
        )}
      </div>
    </CollapsibleSection>
  );
}
