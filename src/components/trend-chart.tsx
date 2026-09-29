"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Select } from "@/components/select";
import { readChartStyle, writeChartStyle, type ChartStyle } from "@/lib/chart-style-preference";
import { CollapsibleSection } from "@/components/collapsible-section";
import { CONVERSION_SHAPE, updatingSectionLabel } from "@/lib/section-labels";
import { LineChartSkeletonInner } from "@/components/loading-skeleton";
import { SectionUnavailable } from "@/components/section-unavailable";
import { funnelShapeRateValue } from "@/lib/funnel-shape";
import { bucketWeekly, formatDayLabel, seriesGrain } from "@/lib/dates";
import { cn, formatCompact, formatNumber, formatRate, computeDelta, formatDelta, deltaTone } from "@/lib/cn";
import type { DailyPoint, StageTotal } from "@/lib/overview";

type ChartMode = "count" | "rate";

const STYLES: { id: ChartStyle; label: string }[] = [
  { id: "line", label: "Line" },
  { id: "area", label: "Area" },
  { id: "bar", label: "Bars" },
  { id: "funnel", label: "Funnel" },
];

type TrendChartProps = {
  current: DailyPoint[];
  previous: DailyPoint[];
  stages: StageTotal[];
  previousStages: StageTotal[];
  visitors: number;
  previousVisitors: number;
  totalsCompareOn: boolean;
  seriesCompareOn: boolean;
  currentLabel?: string;
  previousLabel?: string;
  metric: string;
  seriesUnavailableMessage?: string;
  shapeUnavailableMessage?: string;
  previousSeriesWarning?: string;
  seriesLoading?: boolean;
  shapeLoading?: boolean;
};

function valueFor(point: DailyPoint, metric: string, mode: ChartMode) {
  const count =
    metric === "visitors" ? point.visitors : (point.stages[metric] ?? 0);
  if (mode === "rate" && metric !== "visitors") {
    return point.visitors > 0 ? (count / point.visitors) * 100 : 0;
  }
  return count;
}

function useChartColors() {
  const [colors, setColors] = useState({
    grid: "#f0f0f0",
    axis: "#a3a3a3",
    current: "#6d28d9",
    prior: "#a3a3a3",
    card: "#ffffff",
    cardHover: "#f4f4f4",
    foreground: "#0a0a0a",
    border: "#e5e5e5",
  });

  useEffect(() => {
    function read() {
      const styles = getComputedStyle(document.documentElement);
      setColors({
        grid: styles.getPropertyValue("--chart-grid").trim() || "#f0f0f0",
        axis: styles.getPropertyValue("--chart-axis").trim() || "#a3a3a3",
        current: styles.getPropertyValue("--chart-current").trim() || "#6d28d9",
        prior: styles.getPropertyValue("--chart-prior").trim() || "#a3a3a3",
        card: styles.getPropertyValue("--card").trim() || "#ffffff",
        cardHover: styles.getPropertyValue("--card-hover").trim() || "#f4f4f4",
        foreground: styles.getPropertyValue("--foreground").trim() || "#0a0a0a",
        border: styles.getPropertyValue("--border").trim() || "#e5e5e5",
      });
    }
    read();
    window.addEventListener("themechange", read);
    return () => window.removeEventListener("themechange", read);
  }, []);

  return colors;
}

function formatTick(value: number, mode: ChartMode) {
  return mode === "rate" ? `${Number(value).toFixed(0)}` : formatCompact(Number(value));
}

function formatTooltip(value: number, mode: ChartMode) {
  return mode === "rate" ? formatRate(Number(value)) : formatNumber(Number(value));
}

type DailyRow = {
  label: string;
  currentDay: string;
  previousDay: string | null;
  current: number;
  previous: number | null;
};

function CompareDayTick({
  x,
  y,
  index = 0,
  payload,
  rows,
  compareOn,
  colors,
}: {
  x?: string | number;
  y?: string | number;
  index?: number;
  payload?: { value?: string };
  rows: DailyRow[];
  compareOn: boolean;
  colors: { axis: string; prior: string };
}) {
  const xPos = Number(x ?? 0);
  const yPos = Number(y ?? 0);
  const row = rows[index];
  const value = payload?.value ?? row?.label ?? "";
  if (!compareOn || !row?.previousDay) {
    return (
      <text x={xPos} y={yPos} dy={12} textAnchor="middle" fill={colors.axis} fontSize={11}>
        {value}
      </text>
    );
  }
  return (
    <g transform={`translate(${xPos},${yPos})`}>
      <text dy={10} textAnchor="middle" fill={colors.prior} fontSize={10}>
        {formatDayLabel(row.previousDay)}
      </text>
      <text dy={22} textAnchor="middle" fill={colors.axis} fontSize={10}>
        {row.label}
      </text>
    </g>
  );
}

function TrendSeriesTooltip({
  active,
  payload,
  compareOn,
  currentLabel,
  previousLabel,
  mode,
  colors,
}: {
  active?: boolean;
  payload?: readonly {
    dataKey?: unknown;
    value?: unknown;
    payload?: unknown;
  }[];
  compareOn: boolean;
  currentLabel: string;
  previousLabel: string;
  mode: ChartMode;
  colors: ReturnType<typeof useChartColors>;
}) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload as DailyRow | undefined;
  if (!row) return null;

  const priorEntry = payload.find((entry) => entry.dataKey === "previous");
  const currentEntry = payload.find((entry) => entry.dataKey === "current");
  const priorValue = Number(priorEntry?.value ?? row.previous ?? 0);
  const currentValue = Number(currentEntry?.value ?? row.current ?? 0);

  return (
    <div
      className="rounded-[10px] border border-border bg-card px-2.5 py-2 text-xs shadow-(--shadow)"
      style={{
        background: colors.card,
        borderColor: colors.border,
        color: colors.foreground,
      }}
    >
      {compareOn && row.previousDay ? (
        <>
          <p className="tabular-nums">
            <span className="text-muted">{formatDayLabel(row.previousDay)}</span>
            <span className="text-muted"> · </span>
            <span style={{ color: colors.prior }}>{previousLabel}</span>
            <span className="text-muted"> · </span>
            <span className="font-medium" style={{ color: colors.prior }}>
              {formatTooltip(priorValue, mode)}
            </span>
          </p>
          <p className="mt-1 tabular-nums">
            <span className="text-muted">{row.label}</span>
            <span className="text-muted"> · </span>
            <span style={{ color: colors.current }}>{currentLabel}</span>
            <span className="text-muted"> · </span>
            <span className="font-medium" style={{ color: colors.current }}>
              {formatTooltip(currentValue, mode)}
            </span>
          </p>
        </>
      ) : (
        <p className="tabular-nums">
          <span className="font-medium">{row.label}</span>
          <span className="text-muted"> · </span>
          <span className="font-medium" style={{ color: colors.current }}>
            {formatTooltip(currentValue, mode)}
          </span>
        </p>
      )}
    </div>
  );
}

export function TrendChart({
  current,
  previous,
  stages,
  previousStages,
  visitors,
  previousVisitors,
  totalsCompareOn,
  seriesCompareOn,
  currentLabel = "Current range",
  previousLabel = "Compare range",
  metric: initialMetric,
  seriesUnavailableMessage,
  shapeUnavailableMessage,
  previousSeriesWarning,
  seriesLoading = false,
  shapeLoading = false,
}: TrendChartProps) {
  const colors = useChartColors();
  const metricOptions = useMemo(
    () => [
      { id: "visitors", label: "Unique users" },
      ...stages.map((stage) => ({ id: stage.title, label: stage.title })),
    ],
    [stages],
  );
  const [metric, setMetric] = useState(
    metricOptions.some((item) => item.id === initialMetric)
      ? initialMetric
      : "visitors",
  );
  const [metricOptionsKey, setMetricOptionsKey] = useState(() =>
    metricOptions.map((item) => item.id).join("|"),
  );
  const nextMetricOptionsKey = metricOptions.map((item) => item.id).join("|");
  const [mode, setMode] = useState<ChartMode>(() => {
    if (typeof window === "undefined") return "count";
    const saved = window.localStorage.getItem("chart-mode");
    return saved === "count" || saved === "rate" ? saved : "count";
  });
  const [style, setStyle] = useState<ChartStyle>(readChartStyle);

  if (
    metricOptionsKey !== nextMetricOptionsKey &&
    !metricOptions.some((item) => item.id === metric)
  ) {
    setMetricOptionsKey(nextMetricOptionsKey);
    setMetric(
      metricOptions.some((item) => item.id === "Purchase")
        ? "Purchase"
        : "visitors",
    );
  }

  function changeStyle(next: ChartStyle) {
    setStyle(next);
    writeChartStyle(next);
  }

  function changeMode(next: ChartMode) {
    setMode(next);
    window.localStorage.setItem("chart-mode", next);
  }

  const grain = seriesGrain(
    seriesCompareOn ? Math.max(current.length, previous.length) : current.length,
  );
  const currentSeries = useMemo(
    () => (grain === "week" ? bucketWeekly(current) : current),
    [current, grain],
  );
  const previousSeries = useMemo(
    () => (grain === "week" ? bucketWeekly(previous) : previous),
    [previous, grain],
  );
  const compareLengthMismatch =
    seriesCompareOn && previousSeries.length !== currentSeries.length;

  const daily = useMemo<DailyRow[]>(
    () =>
      currentSeries.map((point, index) => {
        const prior = previousSeries[index];
        return {
          label: formatDayLabel(point.day),
          currentDay: point.day,
          previousDay: prior?.day ?? null,
          current: valueFor(point, metric, mode),
          previous: prior ? valueFor(prior, metric, mode) : null,
        };
      }),
    [currentSeries, previousSeries, metric, mode],
  );

  const funnel = useMemo(() => {
    const titles = Array.from(
      new Set([...stages, ...previousStages].map((stage) => stage.title)),
    );
    return [
      {
        label: "Unique users",
        current: visitors,
        previous: previousVisitors,
      },
      ...titles.map((title) => ({
        label: title,
        current: stages.find((stage) => stage.title === title)?.count ?? 0,
        previous:
          previousStages.find((stage) => stage.title === title)?.count ?? 0,
      })),
    ].map((row) => ({
      ...row,
      current:
        mode === "rate"
          ? funnelShapeRateValue(row.label, row.current, visitors)
          : row.current,
      previous:
        mode === "rate"
          ? funnelShapeRateValue(row.label, row.previous, previousVisitors)
          : row.previous,
    }));
  }, [stages, previousStages, visitors, previousVisitors, mode]);

  const hasCurrent = current.some((point) => point.visitors > 0);
  const metricLabel =
    metricOptions.find((item) => item.id === metric)?.label ?? metric;
  const subtitle =
    style === "funnel" ? undefined : `${metricLabel} over time`;
  const barTooltipCursor = { fill: colors.cardHover, radius: 4 };
  const lineTooltipCursor = {
    stroke: colors.border,
    strokeWidth: 1,
    strokeDasharray: "4 4",
  };
  const chartMargin = { top: 8, right: 8, left: 0, bottom: seriesCompareOn ? 8 : 0 };
  const xAxisHeight = seriesCompareOn ? 42 : 24;
  const barMaxSize = 28;

  const seriesCompareNote = seriesCompareOn
    ? `Each day is matched by position in the range: day 1 of ${currentLabel} vs day 1 of ${previousLabel}, day 2 vs day 2, and so on.`
    : null;
  const seriesCompareWarnings = [
    previousSeriesWarning
      ? `${previousSeriesWarning} Compare overlay hidden for the daily trend.`
      : null,
    compareLengthMismatch
      ? `Compare range has ${previousSeries.length} ${grain === "week" ? "weeks" : "days"} vs ${currentSeries.length} in this range; only the first ${Math.min(previousSeries.length, currentSeries.length)} are paired.`
      : null,
  ].filter(Boolean) as string[];

  const canShowActions = !shapeUnavailableMessage || !seriesUnavailableMessage;

  const seriesTooltip = (props: {
    active?: boolean;
    payload?: readonly {
      dataKey?: unknown;
      value?: unknown;
      payload?: unknown;
    }[];
  }) => (
    <TrendSeriesTooltip
      {...props}
      compareOn={seriesCompareOn}
      currentLabel={currentLabel}
      previousLabel={previousLabel}
      mode={mode}
      colors={colors}
    />
  );

  const xAxisTick = (props: {
    x?: string | number;
    y?: string | number;
    index?: number;
    payload?: { value?: string };
  }) => (
    <CompareDayTick
      {...props}
      rows={daily}
      compareOn={seriesCompareOn}
      colors={colors}
    />
  );

  const headerActions = (
    <>
      {style !== "funnel" && (
        <div className="w-full min-w-0 sm:w-44">
          <Select
            value={metric}
            placeholder="Metric"
            onChange={setMetric}
            options={metricOptions.map((item) => ({
              value: item.id,
              label: item.label,
            }))}
          />
        </div>
      )}
      <div className="flex rounded-lg border border-border p-0.5">
        {(["count", "rate"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={cn(
              "rounded-md px-2.5 py-1 text-xs",
              mode === item
                ? "bg-accent text-accent-fg"
                : "text-muted hover:text-foreground",
            )}
            onClick={() => changeMode(item)}
          >
            {item === "count" ? "Count" : "Rate"}
          </button>
        ))}
      </div>
      <div className="flex rounded-lg border border-border p-0.5">
        {STYLES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              "rounded-md px-2.5 py-1 text-xs",
              style === item.id
                ? "bg-accent text-accent-fg"
                : "text-muted hover:text-foreground",
            )}
            onClick={() => changeStyle(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );

  const timeSeriesBusy = seriesLoading && style !== "funnel";
  const funnelBusy = shapeLoading && style === "funnel";

  return (
    <CollapsibleSection
      id="trend-chart"
      title={CONVERSION_SHAPE}
      description={subtitle}
      actions={canShowActions ? headerActions : undefined}
      contentClassName="p-4"
      busy={timeSeriesBusy || funnelBusy}
      busyLabel={updatingSectionLabel(CONVERSION_SHAPE)}
    >
      {style === "funnel" ? (
        shapeUnavailableMessage && !funnelBusy ? (
          <SectionUnavailable message={shapeUnavailableMessage} />
        ) : (
          <>
            <FunnelShape
              data={funnel}
              mode={mode}
              compareOn={totalsCompareOn}
              currentLabel={currentLabel}
              previousLabel={previousLabel}
              colors={colors}
            />
          </>
        )
      ) : seriesUnavailableMessage && !timeSeriesBusy ? (
        <SectionUnavailable message={seriesUnavailableMessage} />
      ) : seriesLoading && !hasCurrent ? (
        <LineChartSkeletonInner />
      ) : !hasCurrent ? (
        <p className="py-16 text-center text-sm text-muted">
          No chart data for this range yet.
        </p>
      ) : (
        <>
          {seriesCompareNote ? (
            <p className="mb-3 text-[11px] leading-relaxed text-muted">{seriesCompareNote}</p>
          ) : null}
          {seriesCompareWarnings.map((warning) => (
            <p key={warning} className="mb-3 text-[11px] leading-relaxed text-warning">
              {warning}
            </p>
          ))}
          {seriesCompareOn ? (
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
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
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {style === "bar" ? (
                <BarChart
                  data={daily}
                  margin={chartMargin}
                  barGap={seriesCompareOn ? 2 : 0}
                  barCategoryGap={seriesCompareOn ? "18%" : "12%"}
                >
                  <CartesianGrid stroke={colors.grid} vertical={false} />
                  <XAxis
                    dataKey="label"
                    height={xAxisHeight}
                    tick={xAxisTick}
                    axisLine={{ stroke: colors.border }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: colors.axis, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={(value) => formatTick(Number(value), mode)}
                  />
                  <Tooltip cursor={barTooltipCursor} content={seriesTooltip} />
                  {seriesCompareOn ? (
                    <Bar
                      dataKey="previous"
                      name={previousLabel}
                      fill={colors.prior}
                      maxBarSize={barMaxSize}
                      radius={[4, 4, 0, 0]}
                    />
                  ) : null}
                  <Bar
                    dataKey="current"
                    name={currentLabel}
                    fill={colors.current}
                    maxBarSize={barMaxSize}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : style === "area" ? (
                <AreaChart data={daily} margin={chartMargin}>
                  <CartesianGrid stroke={colors.grid} vertical={false} />
                  <XAxis
                    dataKey="label"
                    height={xAxisHeight}
                    tick={xAxisTick}
                    axisLine={{ stroke: colors.border }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: colors.axis, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={(value) => formatTick(Number(value), mode)}
                  />
                  <Tooltip cursor={lineTooltipCursor} content={seriesTooltip} />
                  {seriesCompareOn ? (
                    <Area
                      type="monotone"
                      dataKey="previous"
                      name={previousLabel}
                      stroke={colors.prior}
                      fill={colors.prior}
                      fillOpacity={0.08}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                  ) : null}
                  <Area
                    type="monotone"
                    dataKey="current"
                    name={currentLabel}
                    stroke={colors.current}
                    fill={colors.current}
                    fillOpacity={0.18}
                    strokeWidth={2}
                  />
                </AreaChart>
              ) : (
                <LineChart data={daily} margin={chartMargin}>
                  <CartesianGrid stroke={colors.grid} vertical={false} />
                  <XAxis
                    dataKey="label"
                    height={xAxisHeight}
                    tick={xAxisTick}
                    axisLine={{ stroke: colors.border }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: colors.axis, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={(value) => formatTick(Number(value), mode)}
                  />
                  <Tooltip cursor={lineTooltipCursor} content={seriesTooltip} />
                  {seriesCompareOn ? (
                    <Line
                      type="monotone"
                      dataKey="previous"
                      name={previousLabel}
                      stroke={colors.prior}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  ) : null}
                  <Line
                    type="monotone"
                    dataKey="current"
                    name={currentLabel}
                    stroke={colors.current}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </>
      )}
    </CollapsibleSection>
  );
}

function funnelBarTransition(index: number, reducedMotion: boolean) {
  if (reducedMotion) return undefined;
  return {
    transitionProperty: "width",
    transitionDuration: "700ms",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDelay: `${index * 45}ms`,
  } as const;
}

function FunnelShape({
  data,
  mode,
  compareOn,
  currentLabel,
  previousLabel,
  colors,
}: {
  data: Array<{ label: string; current: number; previous: number }>;
  mode: ChartMode;
  compareOn: boolean;
  currentLabel: string;
  previousLabel: string;
  colors: { current: string; prior: string; border: string };
}) {
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const animationKey = useMemo(
    () =>
      [
        mode,
        compareOn,
        data.map((row) => `${row.label}:${row.current}:${row.previous}`).join("|"),
      ].join("\n"),
    [compareOn, data, mode],
  );

  return (
    <FunnelShapeBars
      key={animationKey}
      data={data}
      mode={mode}
      compareOn={compareOn}
      currentLabel={currentLabel}
      previousLabel={previousLabel}
      colors={colors}
      reducedMotion={reducedMotion}
    />
  );
}

function FunnelShapeBars({
  data,
  mode,
  compareOn,
  currentLabel,
  previousLabel,
  colors,
  reducedMotion,
}: {
  data: Array<{ label: string; current: number; previous: number }>;
  mode: ChartMode;
  compareOn: boolean;
  currentLabel: string;
  previousLabel: string;
  colors: { current: string; prior: string; border: string };
  reducedMotion: boolean;
}) {
  const [barsVisible, setBarsVisible] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setBarsVisible(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion]);

  const max = Math.max(
    ...data.map((row) => Math.max(row.current, compareOn ? row.previous : 0)),
    1,
  );

  function formatValue(value: number) {
    return mode === "rate" ? formatRate(value) : formatNumber(value);
  }

  function barWidth(value: number) {
    const animated = barsVisible || reducedMotion;
    const target = Math.max((value / max) * 100, value > 0 ? 1.5 : 0);
    return animated ? target : 0;
  }

  return (
    <div className="space-y-3 pt-1">
      {compareOn && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
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
      )}
      {data.map((row, index) => {
        const width = barWidth(row.current);
        const priorWidth = barWidth(row.previous);
        const delta = compareOn ? computeDelta(row.current, row.previous) : null;
        const barMotion = funnelBarTransition(index, reducedMotion);

        if (!compareOn) {
          return (
            <div key={row.label}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-xs font-medium">{row.label}</span>
                <span className="tabular text-xs text-muted">
                  {formatValue(row.current)}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${width}%`,
                    background: colors.current,
                    ...barMotion,
                  }}
                />
              </div>
            </div>
          );
        }

        return (
          <div key={row.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-xs font-medium">{row.label}</span>
              {compareOn ? (
                <span className={cn("tabular text-[11px] font-medium", deltaTone(delta))}>
                  {formatDelta(delta)} vs prior
                </span>
              ) : null}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-border/70">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${priorWidth}%`,
                        background: colors.prior,
                        ...barMotion,
                      }}
                    />
                  </div>
                </div>
                <span className="w-[5.5rem] shrink-0 text-right tabular text-xs text-muted">
                  {formatValue(row.previous)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="h-2.5 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${width}%`,
                        background: colors.current,
                        ...barMotion,
                      }}
                    />
                  </div>
                </div>
                <span className="w-[5.5rem] shrink-0 text-right tabular text-xs">
                  {formatValue(row.current)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
