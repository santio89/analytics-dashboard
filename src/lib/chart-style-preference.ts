"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ChartStyle = "line" | "area" | "bar" | "funnel";

const STORAGE_KEY = "chart-style";
const CHANGE_EVENT = "chart-style-change";

function parseChartStyle(value: string | null): ChartStyle {
  if (value === "line" || value === "area" || value === "bar" || value === "funnel") {
    return value;
  }
  return "funnel";
}

export function readChartStyle(): ChartStyle {
  if (typeof window === "undefined") return "funnel";
  return parseChartStyle(window.localStorage.getItem(STORAGE_KEY));
}

export function writeChartStyle(style: ChartStyle): void {
  window.localStorage.setItem(STORAGE_KEY, style);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useChartStyle(): ChartStyle {
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener(CHANGE_EVENT, onStoreChange);
    window.addEventListener("storage", onStoreChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onStoreChange);
      window.removeEventListener("storage", onStoreChange);
    };
  }, []);

  return useSyncExternalStore(subscribe, readChartStyle, () => "funnel");
}
