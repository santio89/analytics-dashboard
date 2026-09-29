import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfWeek,
  subDays,
} from "date-fns";
import { DATA_TIMEZONE, todayIsoInTimezone } from "@/lib/timezone";

export function parseDay(day: string): Date {
  return parseISO(`${day}T12:00:00`);
}

export function todayIso(timeZone: string = DATA_TIMEZONE): string {
  return todayIsoInTimezone(timeZone);
}

export function formatRangeLabel(from: string, to: string): string {
  const start = parseDay(from);
  const end = parseDay(to);
  if (from === to) return format(start, "MMM d, yyyy");
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  }
  return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
}

export function formatDayLabel(day: string): string {
  return format(parseDay(day), "MMM d");
}

export function equalPriorPeriod(from: string, to: string): {
  compareFrom: string;
  compareTo: string;
} {
  const start = parseDay(from);
  const end = parseDay(to);
  const length = differenceInCalendarDays(end, start) + 1;
  const compareTo = format(subDays(start, 1), "yyyy-MM-dd");
  const compareFrom = format(subDays(start, length), "yyyy-MM-dd");
  return { compareFrom, compareTo };
}

export const ALL_TIME_START = "2025-01-01";

export type DatePreset = {
  id: string;
  label: string;
  days: number;
};

export const DATE_PRESETS: DatePreset[] = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "14d", label: "14 days", days: 14 },
  { id: "30d", label: "30 days", days: 30 },
];

export function presetRange(
  days: number,
  endDay = todayIso(),
  timeZone?: string,
): {
  from: string;
  to: string;
} {
  const end = endDay || todayIso(timeZone);
  const endDate = parseDay(end);
  return {
    from: format(subDays(endDate, days - 1), "yyyy-MM-dd"),
    to: end,
  };
}

export function resolvePresetRange(
  preset: DatePreset,
  endDay = todayIso(),
  timeZone?: string,
): { from: string; to: string } {
  return presetRange(preset.days, endDay, timeZone);
}

export function matchingPreset(from: string, to: string): string | null {
  for (const preset of DATE_PRESETS) {
    const range = resolvePresetRange(preset, to);
    if (range.from === from && range.to === to) return preset.id;
  }
  return null;
}

export function seriesGrain(pointCount: number): "day" | "week" {
  return pointCount > 42 ? "week" : "day";
}

export function weekStartIso(day: string): string {
  return format(startOfWeek(parseDay(day), { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export type BucketPoint = {
  day: string;
  visitors: number;
  stages: Record<string, number>;
};

export function bucketWeekly<T extends BucketPoint>(points: T[]): T[] {
  const buckets = new Map<string, BucketPoint>();
  for (const point of points) {
    const key = weekStartIso(point.day);
    const current = buckets.get(key) ?? { day: key, visitors: 0, stages: {} };
    current.visitors += point.visitors;
    for (const [title, count] of Object.entries(point.stages)) {
      current.stages[title] = (current.stages[title] ?? 0) + count;
    }
    buckets.set(key, current);
  }
  return [...buckets.values()].sort((a, b) => a.day.localeCompare(b.day)) as T[];
}
