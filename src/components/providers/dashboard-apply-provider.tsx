"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AUTO_LOAD_METRICS } from "@/lib/app-config";

type DashboardApplyContextValue = {
  metricsEnabled: boolean;
  enableMetrics: () => void;
};

const DashboardApplyContext = createContext<DashboardApplyContextValue | null>(
  null,
);

export function useDashboardApply(): DashboardApplyContextValue {
  const value = useContext(DashboardApplyContext);
  if (!value) {
    throw new Error("useDashboardApply must be used within DashboardApplyProvider");
  }
  return value;
}

type DashboardApplyProviderProps = {
  children: ReactNode;
  initialApplied: boolean;
};

export function DashboardApplyProvider({
  children,
  initialApplied,
}: DashboardApplyProviderProps) {
  const [metricsEnabled, setMetricsEnabled] = useState(
    AUTO_LOAD_METRICS || initialApplied,
  );
  const [lastInitialApplied, setLastInitialApplied] = useState(initialApplied);

  if (lastInitialApplied !== initialApplied) {
    setLastInitialApplied(initialApplied);
    if (initialApplied || AUTO_LOAD_METRICS) setMetricsEnabled(true);
  }

  const enableMetrics = useCallback(() => {
    setMetricsEnabled(true);
  }, []);

  const value = useMemo(
    () => ({ metricsEnabled, enableMetrics }),
    [enableMetrics, metricsEnabled],
  );

  return (
    <DashboardApplyContext.Provider value={value}>
      {children}
    </DashboardApplyContext.Provider>
  );
}
