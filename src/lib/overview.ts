export type TotalsSource = "snapshot" | "daily_sum" | "mock";

export type StageTotal = {
  title: string;
  count: number;
};

export type RangeTotals = {
  visitors: number;
  stages: StageTotal[];
  source: TotalsSource;
  snapshotCoverage: number;
  daysCovered: number;
  daysInRange: number;
  missing: boolean;
};

export type DailyPoint = {
  day: string;
  visitors: number;
  stages: Record<string, number>;
};
