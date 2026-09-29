import type { PublishedFunnel } from "@/lib/funnels";

export const MOCK_FUNNELS: readonly PublishedFunnel[] = [
  { id: "funnel_wellness", title: "Wellness Intake" },
  { id: "funnel_hormone", title: "Hormone Therapy" },
  { id: "funnel_weight", title: "Weight Management" },
  { id: "funnel_longevity", title: "Longevity Program" },
  { id: "funnel_peptides", title: "Peptide Protocol" },
  { id: "funnel_sleep", title: "Sleep Optimization" },
  { id: "funnel_skin", title: "Skin Health Quiz" },
  { id: "funnel_energy", title: "Energy & Vitality" },
];

export function getMockFunnels(): PublishedFunnel[] {
  return [...MOCK_FUNNELS];
}
