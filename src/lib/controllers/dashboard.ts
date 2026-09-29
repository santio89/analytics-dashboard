import type { DashboardParams } from "@/lib/dashboard-params";
import {
  getMockCharts,
  getMockConversions,
  getMockPageFunnel,
  getMockUtmDashboard,
  getMockUtmOptions,
} from "@/lib/mock/service";
import type { DailyPoint } from "@/lib/overview";
import type { RangeTotalsWithMeta } from "@/lib/overview-live";
import type { PageFunnelResult } from "@/lib/page-funnel";
import type { UtmDashboardPayload } from "@/lib/utm";

export type ConversionsPayload = {
  current: RangeTotalsWithMeta;
  previous: RangeTotalsWithMeta | null;
};

export type ChartsPayload = {
  currentDaily: DailyPoint[];
  previousDaily: DailyPoint[];
  ingested: { minDay: string | null; maxDay: string | null };
  fetchMs: number;
};

export type PageFunnelPayload = {
  pageFunnel: PageFunnelResult | null;
  previousPageFunnel: PageFunnelResult | null;
  fetchMs: number;
};

export type UtmDashboardPayloadWithMeta = UtmDashboardPayload & { fetchMs: number };

/**
 * Dashboard data controllers.
 *
 * Each function resolves the data for one dashboard endpoint. The demo
 * implementation returns mock data; swap the bodies for a database or backend
 * when wiring one in. Signatures and payload types are the contract to keep.
 */
export async function getConversions(
  params: DashboardParams,
  signal?: AbortSignal,
): Promise<ConversionsPayload> {
  return getMockConversions(params, signal);
}

export async function getCharts(
  params: DashboardParams,
  signal?: AbortSignal,
): Promise<ChartsPayload> {
  return getMockCharts(params, signal);
}

export async function getPageFunnel(
  params: DashboardParams,
  signal?: AbortSignal,
): Promise<PageFunnelPayload> {
  return getMockPageFunnel(params, signal);
}

export async function getUtmDashboard(
  params: DashboardParams,
  signal?: AbortSignal,
): Promise<UtmDashboardPayloadWithMeta> {
  return getMockUtmDashboard(params, signal);
}

export async function getUtmOptions(
  params: DashboardParams,
  signal?: AbortSignal,
): Promise<UtmDashboardPayloadWithMeta["options"]> {
  return getMockUtmOptions(params, signal);
}