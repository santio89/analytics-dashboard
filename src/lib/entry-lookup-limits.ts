import {
  DEFAULT_SCAN_DEPTH,
  EMAIL_LOOKUP_PAGE_SIZE,
  emailLookupEntriesForDepth,
  emailLookupPagesForDepth,
  parseScanDepth,
  type ScanDepth,
} from "@/lib/scan-depth";

export {
  EMAIL_LOOKUP_PAGE_SIZE,
  emailLookupEntriesForDepth,
  emailLookupPagesForDepth,
  parseScanDepth,
};
export type { ScanDepth };

export const EMAIL_LOOKUP_MAX_RESULTS = 10;
export const EMAIL_LOOKUP_DEFAULT_LOOKBACK_DAYS = 365;
export const EMAIL_LOOKUP_DEFAULT_SCAN_DEPTH: ScanDepth = DEFAULT_SCAN_DEPTH;
