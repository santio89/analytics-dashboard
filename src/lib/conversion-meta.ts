import { formatCompact } from "@/lib/cn";
import type { RangeTotalsWithMeta } from "@/lib/overview-live";

function formatFetchDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function buildDemoDataSourceStatus(
  current: RangeTotalsWithMeta,
  timings: {
    primaryMs: number | null;
    secondaryMs: number | null;
    primaryFetching?: boolean;
    secondaryFetching?: boolean;
  },
  displayVisitors?: number,
): string {
  if (current.error) return "Unavailable";

  const parts: string[] = ["Sample data"];

  if (timings.primaryFetching && timings.primaryMs == null) {
    parts.push("Loading…");
  } else if (timings.primaryMs != null) {
    parts.push(formatFetchDuration(timings.primaryMs));
  }

  if (timings.secondaryFetching && timings.secondaryMs == null) {
    parts.push("UTM …");
  } else if (timings.secondaryMs != null) {
    parts.push(`UTM ${formatFetchDuration(timings.secondaryMs)}`);
  }

  if (displayVisitors != null) {
    parts.push(`${formatCompact(displayVisitors)} users`);
  } else if (!current.missing) {
    parts.push(`${formatCompact(current.visitors)} users`);
  }

  return parts.join(" · ");
}

function formatClockTime(value: Date | number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(typeof value === "number" ? new Date(value) : value);
}

export function formatUpdatedAt(ms: number, timeZone: string): string {
  if (!ms) return "";
  return `Loaded ${formatClockTime(ms, timeZone)}`;
}
