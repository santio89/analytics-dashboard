import { DEFAULT_TIMEZONE } from "@/lib/app-config";

/** Default reporting timezone for mock dashboard data. */
export const DATA_TIMEZONE = DEFAULT_TIMEZONE;

/** Default reporting timezone when URL omits `tz`. */
export const DEFAULT_REPORTING_TIMEZONE = "UTC";

/** Project default region for timezone picker. */
export const PROJECT_REPORTING_TIMEZONE = DATA_TIMEZONE;

export const REPORTING_TIMEZONES = [
  { id: "UTC", label: "UTC" },
  { id: PROJECT_REPORTING_TIMEZONE, label: "EST/EDT" },
  { id: "America/Chicago", label: "CST/CDT" },
  { id: "America/Denver", label: "MST/MDT" },
  { id: "America/Los_Angeles", label: "PST/PDT" },
] as const;

export type ReportingTimezone = (typeof REPORTING_TIMEZONES)[number]["id"];

const ALLOWED = new Set<string>(REPORTING_TIMEZONES.map((item) => item.id));

export function parseTimezone(value: string | undefined): string {
  const trimmed = value?.trim();
  if (trimmed && ALLOWED.has(trimmed)) return trimmed;
  return DEFAULT_REPORTING_TIMEZONE;
}

export function timezoneLabel(timeZone: string): string {
  return (
    REPORTING_TIMEZONES.find((item) => item.id === timeZone)?.label ??
    timeZone.replace(/_/g, " ")
  );
}

/** Short label for a range end day (EST vs EDT, etc.). */
export function timezoneLabelForRange(timeZone: string, endDay: string): string {
  if (timeZone === "UTC") return "UTC";
  const offset = timezoneOffsetMinutes(endDay, timeZone);
  if (timeZone === PROJECT_REPORTING_TIMEZONE) {
    return offset === -300 ? "EST" : offset === -240 ? "EDT" : timezoneLabel(timeZone);
  }
  return timezoneLabel(timeZone);
}

export type OverviewTimeWindow = {
  startTime: string;
  endTime: string;
  timezoneOffsetMinutes: number;
};

export function overviewRangeTimeWindow(
  startDay: string,
  endDay: string,
  timeZone: string,
): OverviewTimeWindow {
  const bounds = rangeBounds(startDay, endDay, timeZone);
  return {
    ...bounds,
    timezoneOffsetMinutes: timezoneOffsetMinutes(startDay, timeZone),
  };
}

function offsetMinutesAt(timeZone: string, instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(instant);
  const name = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = name.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? 0);
  return sign * (hours * 60 + minutes);
}

export function timezoneOffsetMinutes(isoDay: string, timeZone: string): number {
  return offsetMinutesAt(timeZone, new Date(`${isoDay}T12:00:00Z`));
}

export function dayBounds(
  isoDay: string,
  timeZone: string,
): { startTime: string; endTime: string } {
  const offset = timezoneOffsetMinutes(isoDay, timeZone);
  const [y, m, d] = isoDay.split("-").map(Number);
  const startMs = Date.UTC(y, m - 1, d, 0, 0, 0, 0) - offset * 60_000;
  const endMs = Date.UTC(y, m - 1, d + 1, 0, 0, 0, 0) - offset * 60_000 - 1;
  return {
    startTime: new Date(startMs).toISOString(),
    endTime: new Date(endMs).toISOString(),
  };
}

export function rangeBounds(
  startDay: string,
  endDay: string,
  timeZone: string,
): { startTime: string; endTime: string } {
  return {
    startTime: dayBounds(startDay, timeZone).startTime,
    endTime: dayBounds(endDay, timeZone).endTime,
  };
}

export function eachIsoDay(startDay: string, endDay: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${startDay}T00:00:00Z`);
  const last = new Date(`${endDay}T00:00:00Z`);
  while (cursor <= last) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export function dayFromIso(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function todayIsoInTimezone(timeZone: string): string {
  return dayFromIso(new Date().toISOString(), timeZone);
}
