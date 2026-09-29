"use client";

import { useQuery } from "@tanstack/react-query";
import { FALLBACK_PUBLISHED_FUNNELS, type PublishedFunnel } from "@/lib/funnels";

export const publishedFunnelsQueryKey = ["published-funnels"] as const;

async function fetchPublishedFunnels(): Promise<PublishedFunnel[]> {
  const res = await fetch("/api/funnels", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Funnel catalog unavailable");
  }
  const payload = (await res.json()) as { funnels?: PublishedFunnel[] };
  return payload.funnels?.length ? payload.funnels : [...FALLBACK_PUBLISHED_FUNNELS];
}

export function usePublishedFunnels() {
  const query = useQuery({
    queryKey: publishedFunnelsQueryKey,
    queryFn: fetchPublishedFunnels,
    staleTime: 5 * 60 * 1000,
    placeholderData: () => [...FALLBACK_PUBLISHED_FUNNELS],
  });

  return {
    funnels: [...(query.data ?? FALLBACK_PUBLISHED_FUNNELS)],
    catalogLoading: query.isFetching && !query.isFetched,
  };
}
