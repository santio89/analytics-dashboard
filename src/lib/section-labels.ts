/** Collapsible / card titles — keep loading labels in sync with these. */
export const DATA_SOURCE = "Data source";
export const KEY_METRICS = "Key metrics";
export const FUNNEL = "Funnel";
export const CONVERSION_SHAPE = "Conversion shape";
export const PAGE_FUNNEL = "Page funnel";
export const UTM_BREAKDOWN = "Conversions UTM breakdown";

export function loadingSectionLabel(title: string): string {
  return `Loading ${title}…`;
}

export function updatingSectionLabel(title: string): string {
  return `Updating ${title}…`;
}
