import { resolveMockEntryLookup } from "@/lib/mock/service";

export type EntryLookupOptions = {
  entryOnly?: boolean;
  includeUserData?: boolean;
  includeEvents?: boolean;
  fromDay?: string;
  toDay?: string;
};

/**
 * Entry lookup.
 *
 * Demo implementation returns mock entries; swap the body for a database or
 * backend lookup when wiring one in.
 */
export async function getEntryLookup(
  query: string,
  options: EntryLookupOptions,
) {
  return resolveMockEntryLookup(query, options);
}