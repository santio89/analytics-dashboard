/** Conversions UTM breakdown table. */
export const SHOW_UTM_BREAKDOWN = true;

/** Unique/Sum toggle in key metrics. */
export const SHOW_USER_COUNT_TOGGLE = true;

/** Header entry lookup modal. */
export const SHOW_ENTRY_LOOKUP = true;

/** Toolbar timezone selector. */
export const SHOW_TIMEZONE_SELECTOR = true;

/** Page funnel chart when a single funnel is selected. */
export const SHOW_PAGE_FUNNEL = true;

export function showPageFunnelSection(funnelId: string): boolean {
  return SHOW_PAGE_FUNNEL && funnelId !== "all";
}
