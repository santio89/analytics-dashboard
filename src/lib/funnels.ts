import { MOCK_FUNNELS } from "@/lib/mock/catalog";

export type PublishedFunnel = {
  id: string;
  title: string;
};

export const FALLBACK_PUBLISHED_FUNNELS: readonly PublishedFunnel[] = MOCK_FUNNELS;

export function funnelLabel(title: string): string {
  return title.trim();
}

export function publishedFunnelIds(
  catalog: readonly PublishedFunnel[],
): string[] {
  return catalog.map((funnel) => funnel.id);
}
