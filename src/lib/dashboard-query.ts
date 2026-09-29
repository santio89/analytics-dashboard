import { DEFAULT_REPORTING_TIMEZONE } from "@/lib/timezone";
import {
  SHOW_TIMEZONE_SELECTOR,
  SHOW_USER_COUNT_TOGGLE,
} from "@/lib/feature-flags";
import {
  DEFAULT_SCAN_DEPTH,
  serializeScanDepth,
  type ScanDepth,
} from "@/lib/scan-depth";
import {
  DEFAULT_USER_COUNT_MODE,
  type UserCountMode,
} from "@/lib/user-count-mode";

export type DashboardQuery = {
  funnelId: string;
  from: string;
  to: string;
  compareOn: boolean;
  compareFrom: string;
  compareTo: string;
  metric?: string;
  utmDim?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  utmOther?: string;
  scanDepth?: ScanDepth;
  tz?: string;
  userCount?: UserCountMode;
};

export function buildDashboardQuery(values: DashboardQuery): string {
  const params = new URLSearchParams();
  params.set("funnel", values.funnelId);
  params.set("from", values.from);
  params.set("to", values.to);
  if (values.compareOn) {
    params.set("compare", "1");
    params.set("compareFrom", values.compareFrom);
    params.set("compareTo", values.compareTo);
  }
  if (values.metric && values.metric !== "Purchase") {
    params.set("metric", values.metric);
  }
  if (values.utmDim && values.utmDim !== "source") {
    params.set("utmDim", values.utmDim);
  }
  if (values.utmSource) params.set("utmSource", values.utmSource);
  if (values.utmMedium) params.set("utmMedium", values.utmMedium);
  if (values.utmCampaign) params.set("utmCampaign", values.utmCampaign);
  if (values.utmTerm) params.set("utmTerm", values.utmTerm);
  if (values.utmContent) params.set("utmContent", values.utmContent);
  if (values.utmOther) params.set("utmOther", values.utmOther);
  if (values.scanDepth && values.scanDepth !== DEFAULT_SCAN_DEPTH) {
    params.set("scanDepth", serializeScanDepth(values.scanDepth));
  }
  if (
    SHOW_TIMEZONE_SELECTOR &&
    values.tz &&
    values.tz !== DEFAULT_REPORTING_TIMEZONE
  ) {
    params.set("tz", values.tz);
  }
  if (
    SHOW_USER_COUNT_TOGGLE &&
    values.userCount &&
    values.userCount !== DEFAULT_USER_COUNT_MODE
  ) {
    params.set("users", values.userCount);
  }
  return `/?${params.toString()}`;
}
