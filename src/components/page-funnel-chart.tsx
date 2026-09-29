"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CollapsibleSection } from "@/components/collapsible-section";
import { HoverPopover } from "@/components/hover-popover";
import { useDashboardNavigation } from "@/components/navigation-provider";
import { buildDashboardQuery, type DashboardQuery } from "@/lib/dashboard-query";
import { PAGE_FUNNEL, updatingSectionLabel } from "@/lib/section-labels";
import { TruncatedText } from "@/components/truncated-text";
import {
  cn,
  computeDelta,
  deltaTone,
  formatCompact,
  formatDelta,
  formatNumber,
  formatRate,
  formatSigned,
  formatPts,
} from "@/lib/cn";
import type { PageFunnelResult } from "@/lib/page-funnel";
import {
  DEFAULT_SCAN_DEPTH,
  SCAN_DEPTH_HELP,
  SCAN_DEPTH_VALUES,
  scanDepthShortLabel,
  type ScanDepth,
} from "@/lib/scan-depth";

type PageFunnelChartProps = {
  data: PageFunnelResult;
  previous?: PageFunnelResult | null;
  compareOn?: boolean;
  currentLabel?: string;
  previousLabel?: string;
  funnelTitle: string;
  busy?: boolean;
  scanDepth?: ScanDepth;
  query?: DashboardQuery;
  showScanDepth?: boolean;
};

type ChartRow = {
  key: string;
  shortTitle: string;
  contacts: number;
  previousContacts: number;
  pctOfTotal: number;
  previousPctOfTotal: number;
  dropFromPrevious: number | null;
  value: number;
  previousValue: number;
};

function truncateLabel(label: string, max = 28): string {
  if (label.length <= max) return label;
  return `${label.slice(0, max - 1)}…`;
}

function useChartColors() {
  const [colors, setColors] = useState({
    card: "#ffffff",
    cardHover: "#f5f5f5",
    foreground: "#0a0a0a",
    muted: "#737373",
    border: "#e5e5e5",
    grid: "#f0f0f0",
    axis: "#a3a3a3",
    current: "#6d28d9",
    prior: "#a3a3a3",
  });

  useEffect(() => {
    function read() {
      const styles = getComputedStyle(document.documentElement);
      setColors({
        card: styles.getPropertyValue("--card").trim() || "#ffffff",
        cardHover: styles.getPropertyValue("--card-hover").trim() || "#f5f5f5",
        foreground: styles.getPropertyValue("--foreground").trim() || "#0a0a0a",
        muted: styles.getPropertyValue("--muted").trim() || "#737373",
        border: styles.getPropertyValue("--border").trim() || "#e5e5e5",
        grid: styles.getPropertyValue("--chart-grid").trim() || "#f0f0f0",
        axis: styles.getPropertyValue("--chart-axis").trim() || "#a3a3a3",
        current: styles.getPropertyValue("--chart-current").trim() || "#6d28d9",
        prior: styles.getPropertyValue("--chart-prior").trim() || "#a3a3a3",
      });
    }
    read();
    window.addEventListener("themechange", read);
    return () => window.removeEventListener("themechange", read);
  }, []);

  return colors;
}

function PageFunnelTooltip({
  active,
  payload,
  mode,
  compareOn,
  currentLabel,
  previousLabel,
  colors,
}: {
  active?: boolean;
  payload?: readonly {
    payload?: unknown;
    value?: unknown;
    name?: unknown;
  }[];
  mode: "count" | "rate";
  compareOn?: boolean;
  currentLabel: string;
  previousLabel: string;
  colors: ReturnType<typeof useChartColors>;
}) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload as ChartRow | undefined;
  if (!row) return null;

  const formatValue = (value: number) =>
    mode === "rate" ? formatRate(value) : formatNumber(value);
  const metricLabel = mode === "rate" ? "% of first page" : "Contacts";

  return (
    <div
      className="rounded-[10px] border border-border bg-card px-2.5 py-2 text-xs shadow-(--shadow)"
      style={{
        background: colors.card,
        borderColor: colors.border,
        color: colors.foreground,
      }}
    >
      <p className="font-semibold leading-snug">{row.key}</p>
      {compareOn ? (
        <>
          <p className="mt-1.5 tabular-nums">
            <span style={{ color: colors.prior }}>{previousLabel}</span>
            <span style={{ color: colors.muted }}> · </span>
            <span style={{ color: colors.muted }}>{metricLabel}</span>
            <span style={{ color: colors.muted }}> · </span>
            <span className="font-medium" style={{ color: colors.prior }}>
              {formatValue(row.previousValue)}
            </span>
          </p>
          <p className="mt-1 tabular-nums">
            <span style={{ color: colors.current }}>{currentLabel}</span>
            <span style={{ color: colors.muted }}> · </span>
            <span style={{ color: colors.muted }}>{metricLabel}</span>
            <span style={{ color: colors.muted }}> · </span>
            <span className="font-medium" style={{ color: colors.current }}>
              {formatValue(row.value)}
            </span>
          </p>
        </>
      ) : (
        <p className="mt-1.5 tabular-nums">
          <span style={{ color: colors.muted }}>{metricLabel}</span>
          <span style={{ color: colors.muted }}> · </span>
          <span className="font-medium" style={{ color: colors.current }}>
            {formatValue(row.value)}
          </span>
        </p>
      )}
    </div>
  );
}

export function PageFunnelChart({
  data,
  previous = null,
  compareOn = false,
  currentLabel = "Current range",
  previousLabel = "Prior range",
  funnelTitle,
  busy = false,
  scanDepth = DEFAULT_SCAN_DEPTH,
  query,
  showScanDepth = false,
}: PageFunnelChartProps) {
  const { navigate } = useDashboardNavigation();
  const [mode, setMode] = useState<"count" | "rate">("count");
  const colors = useChartColors();

  const rows = useMemo<ChartRow[]>(() => {
    const currentByKey = new Map(data.steps.map((step) => [step.pageKey, step]));
    const priorByKey = new Map(
      (previous?.steps ?? []).map((step) => [step.pageKey, step]),
    );
    const orderedKeys = [
      ...data.steps.map((step) => step.pageKey),
      ...(previous?.steps ?? [])
        .map((step) => step.pageKey)
        .filter((key) => !currentByKey.has(key)),
    ];

    return orderedKeys.map((pageKey) => {
      const step = currentByKey.get(pageKey);
      const prior = priorByKey.get(pageKey);
      const contacts = step?.contacts ?? 0;
      const previousContacts = prior?.contacts ?? 0;
      const pctOfTotal = step?.pctOfTotal ?? 0;
      const previousPctOfTotal = prior?.pctOfTotal ?? 0;

      return {
        key: pageKey,
        shortTitle: truncateLabel(pageKey),
        contacts,
        previousContacts,
        pctOfTotal,
        previousPctOfTotal,
        dropFromPrevious: step?.dropFromPrevious ?? null,
        value: mode === "count" ? contacts : pctOfTotal,
        previousValue: mode === "count" ? previousContacts : previousPctOfTotal,
      };
    });
  }, [data.steps, mode, previous?.steps]);

  const chartHeight = Math.max(420, rows.length * (compareOn ? 36 : 30) + 48);
  const hasData = rows.some((row) => row.contacts > 0 || row.previousContacts > 0);
  const warningFooter =
    data.filtered || data.missingDays ? (
      <p className="border-t border-border px-4 py-3 text-xs text-muted">
        {[
          data.filtered ? "UTM filters apply." : "",
          data.missingDays ? "Some days are missing." : "",
        ]
          .filter(Boolean)
          .join(" ")}
      </p>
    ) : null;
  const tickLabels = useMemo(
    () => new Map(rows.map((row) => [row.key, row.shortTitle])),
    [rows],
  );

  const headerActions = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {showScanDepth && query ? (
        <HoverPopover content={SCAN_DEPTH_HELP}>
          <div
            className="inline-flex shrink-0 rounded-lg border border-border p-0.5"
            role="group"
            aria-label="Scan depth"
          >
            {SCAN_DEPTH_VALUES.map((depth) => (
              <button
                key={String(depth)}
                type="button"
                disabled={busy}
                onClick={() => {
                  if (depth === scanDepth) return;
                  navigate(buildDashboardQuery({ ...query, scanDepth: depth }));
                }}
                className={cn(
                  "rounded-md px-2 py-1 text-xs transition-colors",
                  scanDepth === depth
                    ? "bg-accent text-accent-fg"
                    : "text-muted hover:text-foreground",
                )}
              >
                {scanDepthShortLabel(depth)}
              </button>
            ))}
          </div>
        </HoverPopover>
      ) : null}
      <div className="flex rounded-lg border border-border p-0.5">
        {(["count", "rate"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs",
              mode === item
                ? "bg-accent text-accent-fg"
                : "text-muted hover:text-foreground",
            )}
          >
            {item === "count" ? "ABS" : "%"}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <CollapsibleSection
      id="page-funnel-chart"
      title={PAGE_FUNNEL}
      actions={headerActions}
      busy={busy}
      busyLabel={updatingSectionLabel(PAGE_FUNNEL)}
    >
      {!hasData ? (
        <>
          <div className="px-4 py-8 text-sm text-muted">
            No page data for {funnelTitle} in this range yet.
          </div>
          {warningFooter}
        </>
      ) : (
        <>
          {compareOn ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 pt-3 text-[11px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ background: colors.prior }}
                  aria-hidden
                />
                {previousLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ background: colors.current }}
                  aria-hidden
                />
                {currentLabel}
              </span>
            </div>
          ) : null}

          <div className="max-h-[640px] overflow-y-auto px-2 py-4 pr-3">
            <div style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={rows}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                  barGap={compareOn ? 2 : 0}
                  barCategoryGap={compareOn ? "18%" : "12%"}
                >
                  <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: colors.axis, fontSize: 11 }}
                    axisLine={{ stroke: colors.border }}
                    tickLine={false}
                    tickFormatter={(value) =>
                      mode === "count"
                        ? formatCompact(Number(value))
                        : `${Number(value).toFixed(0)}%`
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="key"
                    width={188}
                    tick={{ fill: colors.axis, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    tickFormatter={(value) =>
                      tickLabels.get(String(value)) ?? String(value)
                    }
                  />
                  <Tooltip
                    cursor={{ fill: colors.cardHover, radius: 4 }}
                    content={(props) => (
                      <PageFunnelTooltip
                        {...props}
                        mode={mode}
                        compareOn={compareOn}
                        currentLabel={currentLabel}
                        previousLabel={previousLabel}
                        colors={colors}
                      />
                    )}
                  />
                  {compareOn ? (
                    <Bar
                      dataKey="previousValue"
                      name={previousLabel}
                      maxBarSize={14}
                      radius={[0, 4, 4, 0]}
                      fill={colors.prior}
                    />
                  ) : null}
                  <Bar
                    dataKey="value"
                    name={currentLabel}
                    maxBarSize={14}
                    radius={[0, 4, 4, 0]}
                    fill={colors.current}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-x-auto border-t border-border">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-muted/10 text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Page</th>
                  {mode === "count" ? (
                    <>
                      <th className="px-4 py-2 font-medium">Contacts</th>
                      {compareOn ? (
                        <th className="px-4 py-2 font-medium">{previousLabel}</th>
                      ) : null}
                      {compareOn ? (
                        <th className="px-4 py-2 font-medium">Contacts Δ</th>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-2 font-medium">% of first page</th>
                      {compareOn ? (
                        <th className="px-4 py-2 font-medium">{previousLabel}</th>
                      ) : null}
                      {compareOn ? (
                        <th className="px-4 py-2 font-medium">% Δ</th>
                      ) : null}
                    </>
                  )}
                  {mode === "count" ? (
                    <th className="px-4 py-2 font-medium">% of first page</th>
                  ) : null}
                  <th className="px-4 py-2 font-medium">Drop from previous</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const countDelta = computeDelta(row.contacts, row.previousContacts);
                  const rateDelta = computeDelta(row.pctOfTotal, row.previousPctOfTotal);

                  return (
                    <tr key={row.key} className="border-t border-border/70">
                      <td className="max-w-[220px] px-4 py-2 font-medium">
                        <TruncatedText text={row.key} />
                      </td>
                      {mode === "count" ? (
                        <>
                          <td className="px-4 py-2 tabular-nums">{formatNumber(row.contacts)}</td>
                          {compareOn ? (
                            <td className="px-4 py-2 tabular-nums text-muted">
                              {formatNumber(row.previousContacts)}
                            </td>
                          ) : null}
                          {compareOn ? (
                            <td className={cn("px-4 py-2 tabular-nums", deltaTone(countDelta))}>
                              {formatSigned(row.contacts - row.previousContacts)}{" "}
                              <span className="text-[11px]">({formatDelta(countDelta)})</span>
                            </td>
                          ) : null}
                          <td className="px-4 py-2 tabular-nums">{formatRate(row.pctOfTotal)}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2 tabular-nums">{formatRate(row.pctOfTotal)}</td>
                          {compareOn ? (
                            <td className="px-4 py-2 tabular-nums text-muted">
                              {formatRate(row.previousPctOfTotal)}
                            </td>
                          ) : null}
                          {compareOn ? (
                            <td className={cn("px-4 py-2 tabular-nums", deltaTone(rateDelta))}>
                              {formatPts(row.pctOfTotal - row.previousPctOfTotal)}{" "}
                              <span className="text-[11px]">({formatDelta(rateDelta)})</span>
                            </td>
                          ) : null}
                        </>
                      )}
                      <td className="px-4 py-2 tabular-nums">
                        {row.dropFromPrevious == null
                          ? "—"
                          : formatRate(row.dropFromPrevious)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {warningFooter}
        </>
      )}
    </CollapsibleSection>
  );
}
