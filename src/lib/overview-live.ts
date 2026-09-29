import type { RangeTotals } from "@/lib/overview";

type ConversionFetchMeta = {
  dataSource: "mock";
  fetchMs: number;
  error?: string;
};

export type RangeTotalsWithMeta = RangeTotals & ConversionFetchMeta;
