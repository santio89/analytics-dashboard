import type { CSSProperties } from "react";
import { Spinner } from "@/components/spinner";
import { cn } from "@/lib/cn";
import {
  CONVERSION_SHAPE,
  FUNNEL,
  KEY_METRICS,
  loadingSectionLabel,
  PAGE_FUNNEL,
  UTM_BREAKDOWN,
} from "@/lib/section-labels";

function Bone({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("skeleton-shimmer rounded", className)}
      style={style}
      aria-hidden
    />
  );
}

function SkeletonStatus({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-xs text-muted">
      <Spinner className="h-3.5 w-3.5 text-accent" label={label} />
      {label}
    </div>
  );
}

function PillGroupSkeleton({
  widths,
  activeIndex = 0,
}: {
  widths: number[];
  activeIndex?: number;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {widths.map((width, index) => (
        <Bone
          key={index}
          className={cn(
            "h-7 rounded-md",
            index === activeIndex ? "opacity-100" : "opacity-55",
          )}
          style={{ width }}
        />
      ))}
    </div>
  );
}

function CollapsibleHeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <Bone className="h-3.5 w-3.5 shrink-0 rounded-sm" />
        <Bone className="h-4 w-36 max-w-[40vw]" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Bone className="h-8 w-[4.75rem] rounded-lg" />
        <Bone className="h-8 w-[7.25rem] rounded-lg" />
      </div>
    </div>
  );
}

function FunnelShapeSkeletonInner({ rows = 8 }: { rows?: number }) {
  const widths = [100, 92, 84, 74, 63, 52, 41, 32, 24, 18];
  const labelWidths = [96, 112, 88, 104, 92, 108, 84, 100, 96, 88];

  return (
    <div className="space-y-3 pt-1">
      {Array.from({ length: rows }).map((_, index) => {
        const barWidth = widths[index] ?? 24;
        const labelWidth = labelWidths[index] ?? 88;
        return (
          <div key={index}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <Bone className="h-3" style={{ width: labelWidth }} />
              <Bone className="h-3 w-10" />
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-border/25">
              <Bone
                className="h-full rounded-full"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LineChartSkeletonInner({
  className,
  bars = 14,
}: {
  className?: string;
  bars?: number;
}) {
  const heights = [42, 58, 36, 68, 52, 74, 44, 61, 48, 70, 39, 55, 63, 47, 59, 41];

  return (
    <div className={cn("flex h-[280px] flex-col", className)}>
      <div className="flex min-h-0 flex-1 gap-3 px-1 pt-2">
        <div className="flex w-10 shrink-0 flex-col justify-between py-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <Bone key={index} className="h-2 w-7" />
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-0 flex flex-col justify-between py-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Bone key={index} className="h-px w-full opacity-50" />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-6 top-4 flex items-end gap-1">
            {Array.from({ length: bars }).map((_, index) => (
              <Bone
                key={index}
                className="min-w-0 flex-1 rounded-t-md"
                style={{ height: `${heights[index % heights.length]}%` }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-between border-t border-border/60 px-12 pt-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <Bone key={index} className="h-2 w-8" />
        ))}
      </div>
    </div>
  );
}

export function ConversionStripSkeleton({
  label = loadingSectionLabel(KEY_METRICS),
}: {
  label?: string;
}) {
  const barWidths = [88, 72, 64, 56, 48, 40];

  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-(--shadow)"
      aria-busy="true"
    >
      <SkeletonStatus label={label} />
      <CollapsibleHeaderSkeleton />
      <div className="flex min-w-max overflow-hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className={`min-w-[158px] px-4 py-4 ${
              index === 0 ? "" : "border-l border-border"
            }`}
          >
            <Bone className="h-3 w-20" />
            <Bone className="mt-3 h-7 w-16" />
            <Bone className="mt-2 h-3 w-24" />
            <Bone
              className="mt-3 h-1 rounded-full"
              style={{ width: `${barWidths[index] ?? 40}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FunnelTableSkeleton({
  label = loadingSectionLabel(FUNNEL),
}: {
  label?: string;
}) {
  const columns = ["Stage", "Range", "Range", "Δ", "Range", "Range", "Δ"];

  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-(--shadow)"
      aria-busy="true"
    >
      <SkeletonStatus label={label} />
      <CollapsibleHeaderSkeleton />
      <div className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((column, index) => (
                <th key={`${column}-${index}`} className="px-4 py-3">
                  <Bone className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 9 }).map((_, index) => (
              <tr key={index} className="border-b border-border/70 last:border-0">
                <td className="px-4 py-3">
                  <Bone className="h-3 w-28" />
                </td>
                {columns.slice(1).map((column, columnIndex) => (
                  <td key={`${column}-${columnIndex}`} className="px-4 py-3 text-right">
                    <Bone className="inline-block h-3 w-12" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PageFunnelSkeleton({
  label = loadingSectionLabel(PAGE_FUNNEL),
}: {
  label?: string;
}) {
  const rows = [100, 91, 82, 74, 65, 56, 48, 40, 34, 28];
  const labelWidths = [96, 112, 88, 104, 92, 108, 84, 100, 96, 88];

  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-(--shadow)"
      aria-busy="true"
    >
      <SkeletonStatus label={label} />
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Bone className="h-3.5 w-3.5 shrink-0 rounded-sm" />
              <Bone className="h-4 w-24" />
            </div>
            <Bone className="h-3 max-w-md w-4/5" />
          </div>
          <Bone className="h-8 w-[4.75rem] shrink-0 rounded-lg" />
        </div>
      </div>
      <div className="px-4 py-4">
        <div className="space-y-2.5">
          {rows.map((width, index) => (
            <div key={width} className="flex items-center gap-3">
              <Bone className="h-3 shrink-0" style={{ width: labelWidths[index] }} />
              <div className="h-5 min-w-0 flex-1 overflow-hidden rounded-r-md bg-border/25">
                <Bone
                  className="h-full rounded-r-md"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border px-4 py-2.5">
        <div className="flex flex-wrap gap-4 sm:gap-8">
          <Bone className="h-3 w-10" />
          <Bone className="h-3 w-16" />
          <Bone className="h-3 w-24" />
          <Bone className="h-3 w-28" />
        </div>
      </div>
    </div>
  );
}

function ChartSkeleton({
  height = 320,
  label = loadingSectionLabel(CONVERSION_SHAPE),
}: {
  height?: number;
  label?: string;
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-(--shadow)"
      style={{ minHeight: height }}
      aria-busy="true"
    >
      <SkeletonStatus label={label} />
      <CollapsibleHeaderSkeleton />
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <Bone className="h-9 w-44 rounded-lg" />
        <PillGroupSkeleton widths={[52, 40]} activeIndex={0} />
        <PillGroupSkeleton widths={[40, 40, 36, 52]} activeIndex={0} />
      </div>
      <div className="p-4">
        <FunnelShapeSkeletonInner />
      </div>
    </div>
  );
}

export function UtmSkeleton({
  label = loadingSectionLabel(UTM_BREAKDOWN),
}: {
  label?: string;
}) {
  const columns = ["Source", "Sessions", "Quiz", "Lead", "Checkout", "Purchase"];

  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-(--shadow)"
      aria-busy="true"
    >
      <SkeletonStatus label={label} />
      <CollapsibleHeaderSkeleton />
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <PillGroupSkeleton widths={[52, 56, 68, 40, 56]} activeIndex={0} />
        <PillGroupSkeleton widths={[52, 40]} activeIndex={0} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((column) => (
                <th key={column} className="px-4 py-3">
                  <Bone className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, index) => (
              <tr key={index} className="border-b border-border/70 last:border-0">
                <td className="px-4 py-3">
                  <Bone className="h-3 w-32" />
                </td>
                {Array.from({ length: 5 }).map((__, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 text-right">
                    <Bone className="inline-block h-3 w-10" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-border px-4 py-3 text-center text-xs text-muted">
        Sample UTM breakdown from the demo dataset.
      </p>
    </div>
  );
}

export function SelectFieldSkeleton({ label = "Funnel" }: { label?: string }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1.5 text-xs font-medium text-muted">{label}</div>
      <Bone className="h-10 w-full rounded-lg" />
    </div>
  );
}

export function ChartsSectionSkeleton({
  showPageFunnel = false,
}: {
  showPageFunnel?: boolean;
}) {
  return (
    <section className="space-y-5" aria-busy="true" aria-label="Loading charts">
      <ChartSkeleton label={loadingSectionLabel(CONVERSION_SHAPE)} />
      {showPageFunnel ? (
        <PageFunnelSkeleton label={loadingSectionLabel(PAGE_FUNNEL)} />
      ) : null}
    </section>
  );
}
