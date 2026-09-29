export type PageFunnelStep = {
  pageKey: string;
  title: string;
  pageIndex: number;
  contacts: number;
  pctOfTotal: number;
  dropFromPrevious: number | null;
};

export type PageFunnelResult = {
  steps: PageFunnelStep[];
  totalContacts: number;
  truncated: boolean;
  minDay: string | null;
  maxDay: string | null;
  missingDays: boolean;
  filtered: boolean;
  source: "sessions" | "page_views";
};

export type PageMeta = {
  pageKey: string;
  pageIndex: number;
  pageId: string;
  title: string;
};

export type PageViewRow = {
  funnel_id: string;
  contact_id: string;
  page_views?: Array<{
    timestamp: string;
    page_key?: string | null;
  }>;
};

/** Unique contacts who actually viewed each page. Does not fill-forward. */
export function uniqueContactCountsByPage(
  views: Array<{ contactId: string; pageKey: string }>,
): Map<string, number> {
  const byPage = new Map<string, Set<string>>();
  for (const view of views) {
    if (!view.contactId || !view.pageKey) continue;
    const contacts = byPage.get(view.pageKey) ?? new Set<string>();
    contacts.add(view.contactId);
    byPage.set(view.pageKey, contacts);
  }
  const counts = new Map<string, number>();
  for (const [pageKey, contacts] of byPage) {
    counts.set(pageKey, contacts.size);
  }
  return counts;
}

/** Page views whose timestamps fall in the inclusive time window. */
export function pageViewsInTimeWindow(
  rows: PageViewRow[],
  funnelId: string,
  windowStartMs: number,
  windowEndMs: number,
  allowedContactIds?: Set<string>,
): Array<{ contactId: string; pageKey: string }> {
  const views: Array<{ contactId: string; pageKey: string }> = [];
  for (const row of rows) {
    if (row.funnel_id !== funnelId) continue;
    if (!row.contact_id) continue;
    if (allowedContactIds && !allowedContactIds.has(row.contact_id)) continue;
    for (const view of row.page_views ?? []) {
      if (!view.page_key) continue;
      const timestamp = new Date(view.timestamp).getTime();
      if (!Number.isFinite(timestamp)) continue;
      if (timestamp < windowStartMs || timestamp > windowEndMs) continue;
      views.push({ contactId: row.contact_id, pageKey: view.page_key });
    }
  }
  return views;
}

export function buildPageFunnelSteps(
  pages: PageMeta[],
  counts: Map<string, number>,
): PageFunnelStep[] {
  const steps: PageFunnelStep[] = [];
  let previousContacts = 0;
  const firstKey = pages[0]?.pageKey;
  const totalContacts = firstKey ? (counts.get(firstKey) ?? 0) : 0;

  for (const page of pages) {
    const contacts = counts.get(page.pageKey) ?? 0;
    if (contacts === 0) continue;

    const dropFromPrevious =
      steps.length === 0
        ? null
        : previousContacts > 0
          ? ((previousContacts - contacts) / previousContacts) * 100
          : null;

    steps.push({
      pageKey: page.pageKey,
      title: page.pageKey,
      pageIndex: page.pageIndex,
      contacts,
      pctOfTotal: totalContacts > 0 ? (contacts / totalContacts) * 100 : 0,
      dropFromPrevious,
    });
    previousContacts = contacts;
  }

  return steps;
}
