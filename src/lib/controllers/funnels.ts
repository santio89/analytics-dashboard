import type { PublishedFunnel } from "@/lib/funnels";
import { getMockFunnels } from "@/lib/mock/catalog";

/**
 * Funnel catalog.
 *
 * Demo implementation returns mock data. Swap the body for a database or
 * backend lookup when wiring one in.
 */
export async function getFunnels(): Promise<PublishedFunnel[]> {
  return getMockFunnels();
}