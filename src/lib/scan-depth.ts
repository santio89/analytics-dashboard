export const SCAN_DEPTH_COUNTS = [1000, 2000, 4000, 8000] as const;
export type ScanDepthCount = (typeof SCAN_DEPTH_COUNTS)[number];
export type ScanDepth = ScanDepthCount | "all";

export const DEFAULT_SCAN_DEPTH: ScanDepth = 2000;

/** Demo list page size for scan-depth UI labels. */
export const REST_MAX_PAGE_SIZE = 1000;

/** UTM breakdown scan depth page size. */
export const LIVE_REST_PAGE_SIZE = REST_MAX_PAGE_SIZE;
/** Safety cap when scan depth is All. */
export const LIVE_REST_ALL_MAX_PAGES = 200;

export const EMAIL_LOOKUP_PAGE_SIZE = REST_MAX_PAGE_SIZE;
export const EMAIL_LOOKUP_ALL_MAX_PAGES = 200;

/** Page funnel scan depth page size. */
export const PAGE_VIEWS_PAGE_SIZE = REST_MAX_PAGE_SIZE;
export const PAGE_VIEWS_ALL_MAX_PAGES = 200;
/** Per-day page cap when scan depth is All. Typical week day finishes in 2–4 pages. */
export const PAGE_VIEWS_ALL_PAGES_PER_DAY = 8;

/** Hover copy for scan-depth pills. */
export const SCAN_DEPTH_HELP = "Sample entries scanned";

export const SCAN_DEPTH_VALUES: readonly ScanDepth[] = [
  ...SCAN_DEPTH_COUNTS,
  "all",
];

export function parseScanDepth(value: string | undefined): ScanDepth {
  return parseScanDepthOrNull(value) ?? DEFAULT_SCAN_DEPTH;
}

export function parseScanDepthOrNull(value: string | undefined): ScanDepth | null {
  if (!value) return null;
  if (value === "all") return "all";
  const parsed = Number(value);
  if (SCAN_DEPTH_COUNTS.includes(parsed as ScanDepthCount)) {
    return parsed as ScanDepthCount;
  }
  return null;
}

export function serializeScanDepth(depth: ScanDepth): string {
  return depth === "all" ? "all" : String(depth);
}

export function pagesForScanDepth(
  depth: ScanDepth,
  pageSize: number,
  allMaxPages: number,
): number {
  if (depth === "all") return allMaxPages;
  return Math.max(1, Math.ceil(depth / pageSize));
}

export function entriesForScanDepth(
  depth: ScanDepth,
  pageSize: number,
  allMaxPages: number,
): number {
  return pagesForScanDepth(depth, pageSize, allMaxPages) * pageSize;
}

export function liveRestPagesForDepth(depth: ScanDepth = DEFAULT_SCAN_DEPTH): number {
  return pagesForScanDepth(depth, LIVE_REST_PAGE_SIZE, LIVE_REST_ALL_MAX_PAGES);
}

export function liveRestEntriesForDepth(
  depth: ScanDepth = DEFAULT_SCAN_DEPTH,
): number {
  return entriesForScanDepth(depth, LIVE_REST_PAGE_SIZE, LIVE_REST_ALL_MAX_PAGES);
}

export function emailLookupPagesForDepth(
  depth: ScanDepth = DEFAULT_SCAN_DEPTH,
): number {
  return pagesForScanDepth(
    depth,
    EMAIL_LOOKUP_PAGE_SIZE,
    EMAIL_LOOKUP_ALL_MAX_PAGES,
  );
}

export function emailLookupEntriesForDepth(
  depth: ScanDepth = DEFAULT_SCAN_DEPTH,
): number {
  return entriesForScanDepth(
    depth,
    EMAIL_LOOKUP_PAGE_SIZE,
    EMAIL_LOOKUP_ALL_MAX_PAGES,
  );
}

export function pageViewsPagesForDepth(
  depth: ScanDepth = DEFAULT_SCAN_DEPTH,
): number {
  return pagesForScanDepth(
    depth,
    PAGE_VIEWS_PAGE_SIZE,
    PAGE_VIEWS_ALL_MAX_PAGES,
  );
}

export function pageViewsPagesPerDay(
  depth: ScanDepth,
  dayCount: number,
): number {
  const days = Math.max(1, dayCount);
  if (depth === "all") return PAGE_VIEWS_ALL_PAGES_PER_DAY;
  return Math.max(1, Math.ceil(pageViewsPagesForDepth(depth) / days));
}

export function scanDepthShortLabel(depth: ScanDepth): string {
  if (depth === "all") return "All";
  if (depth >= 1000) return `${depth / 1000}k`;
  return String(depth);
}

export function scanDepthSelectOptions(
  pageSize: number,
  allMaxPages: number,
): Array<{ value: string; label: string }> {
  return SCAN_DEPTH_VALUES.map((depth) => ({
    value: serializeScanDepth(depth),
    label:
      depth === "all"
        ? `All (up to ${(allMaxPages * pageSize).toLocaleString()} entries)`
        : `${depth.toLocaleString()} entries`,
  }));
}
