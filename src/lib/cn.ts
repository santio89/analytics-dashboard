import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    const n = value / 1_000_000;
    return `${n >= 100 ? n.toFixed(0) : n.toFixed(2)}M`;
  }
  if (abs >= 1000) {
    const n = value / 1000;
    return `${n >= 100 ? n.toFixed(0) : n.toFixed(2)}K`;
  }
  return formatNumber(value);
}

export function formatSigned(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value)}`;
}

export function formatPts(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)} pts`;
}

export function formatRate(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}%`;
}

export function formatDelta(value: number | null): string {
  if (value === null) return "New";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function computeDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function deltaTone(value: number | null): string {
  if (value === null || value === 0) return "text-muted";
  return value > 0 ? "text-up" : "text-down";
}
