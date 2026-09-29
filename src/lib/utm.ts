export type UtmDimension = "source" | "medium" | "campaign" | "term" | "content";

export type UtmFilters = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  other?: string;
};

export type UtmRow = {
  label: string;
  visitors: number;
  quizStarted: number;
  leadCapture: number;
  checkoutStarted: number;
  purchase: number;
};

export type UtmBreakdown = {
  rows: UtmRow[];
  sampleSize: number;
  truncated: boolean;
  minDay: string | null;
  maxDay: string | null;
};

export type DistinctUtmValues = {
  sources: string[];
  mediums: string[];
  campaigns: string[];
  terms: string[];
  contents: string[];
  others: string[];
};

export type UtmDashboardPayload = {
  current: UtmBreakdown;
  previous: UtmBreakdown | null;
  options: DistinctUtmValues;
};
