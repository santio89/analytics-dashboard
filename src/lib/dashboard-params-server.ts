import "server-only";

import {
  parseDashboardParams,
  type DashboardParams,
} from "@/lib/dashboard-params";
import { getMockFunnels } from "@/lib/mock/catalog";

export async function resolveDashboardParams(
  params: Record<string, string | string[] | undefined>,
): Promise<DashboardParams> {
  const catalog = getMockFunnels();
  return parseDashboardParams(params, catalog);
}
