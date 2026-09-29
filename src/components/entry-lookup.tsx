"use client";

import { TextInput } from "@/components/text-input";
import { Checkbox } from "@/components/checkbox";
import { DatePicker } from "@/components/date-picker";
import { Select } from "@/components/select";
import { Spinner } from "@/components/spinner";
import { ArrowLeft, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { funnelLabel, type PublishedFunnel } from "@/lib/funnels";
import {
  EMAIL_LOOKUP_DEFAULT_LOOKBACK_DAYS,
  EMAIL_LOOKUP_DEFAULT_SCAN_DEPTH,
  EMAIL_LOOKUP_MAX_RESULTS,
  EMAIL_LOOKUP_PAGE_SIZE,
  emailLookupEntriesForDepth,
  emailLookupPagesForDepth,
} from "@/lib/entry-lookup-limits";
import {
  EMAIL_LOOKUP_ALL_MAX_PAGES,
  scanDepthSelectOptions,
  serializeScanDepth,
  parseScanDepth,
  type ScanDepth,
} from "@/lib/scan-depth";
import { readJsonResponse } from "@/lib/read-json-response";
import { cn, formatNumber } from "@/lib/cn";
import { todayIso } from "@/lib/dates";

type LookupResult = {
  entry: {
    entry_id: string;
    funnel_id: string;
    contact_id: string;
    created_at: string;
    updated_at: string;
  };
  data: Record<string, unknown>;
  email: string | null;
  eventsError?: string | null;
  events: Array<{
    timestamp: string;
    event_type: string;
    page_key?: string | null;
    custom_event_name?: string | null;
  }>;
};

type LookupMatch = {
  entry_id: string;
  funnel_id: string;
  contact_id: string;
  created_at: string;
  updated_at: string;
  email: string;
};

type MultipleLookupResponse = {
  multiple: true;
  matches: LookupMatch[];
  truncated?: boolean;
  fromDay?: string;
  toDay?: string;
  lookbackDays?: number;
  maxPages?: number;
  maxEntries?: number;
};

type LookupIncludes = {
  userData: boolean;
  events: boolean;
};

const SENSITIVE = /password|token|secret|ssn/i;
const USER_DATA_INITIAL = 50;
const USER_DATA_PRIORITY = [
  "email",
  "phone",
  "first_name",
  "last_name",
  "name",
];

function funnelNameFor(
  funnelId: string,
  publishedFunnels: PublishedFunnel[],
): string {
  const funnel = publishedFunnels.find((item) => item.id === funnelId);
  return funnel ? funnelLabel(funnel.title) : funnelId;
}

function isEmailQuery(query: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query.trim());
}

function lookupQueryString(options?: {
  entryOnly?: boolean;
  includeUserData?: boolean;
  includeEvents?: boolean;
  fromDay?: string;
  toDay?: string;
  scanDepth?: ScanDepth;
}) {
  const params = new URLSearchParams();
  if (options?.entryOnly) params.set("entryOnly", "1");
  if (options?.includeUserData === false) params.set("userData", "0");
  if (options?.includeEvents === false) params.set("events", "0");
  if (options?.fromDay && options?.toDay) {
    params.set("from", options.fromDay);
    params.set("to", options.toDay);
  }
  if (options?.scanDepth) params.set("scanDepth", serializeScanDepth(options.scanDepth));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function emailSearchRangeLabel(meta: {
  fromDay?: string;
  toDay?: string;
  lookbackDays?: number;
} | null): string {
  if (meta?.fromDay && meta?.toDay) {
    return `${meta.fromDay} – ${meta.toDay}`;
  }
  return `the last ${meta?.lookbackDays ?? EMAIL_LOOKUP_DEFAULT_LOOKBACK_DAYS} days`;
}

const EMAIL_SCAN_DEPTH_OPTIONS = scanDepthSelectOptions(
  EMAIL_LOOKUP_PAGE_SIZE,
  EMAIL_LOOKUP_ALL_MAX_PAGES,
);

export function EntryLookup({
  publishedFunnels,
}: {
  publishedFunnels: PublishedFunnel[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [loadingEntryId, setLoadingEntryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [matches, setMatches] = useState<LookupMatch[]>([]);
  const [matchMeta, setMatchMeta] = useState<{
    truncated: boolean;
    fromDay?: string;
    toDay?: string;
    lookbackDays?: number;
    maxPages?: number;
    maxEntries?: number;
  } | null>(null);
  const [showAllUserData, setShowAllUserData] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [includeUserData, setIncludeUserData] = useState(true);
  const [includeEvents, setIncludeEvents] = useState(true);
  const [lookupFrom, setLookupFrom] = useState("");
  const [lookupTo, setLookupTo] = useState("");
  const [emailScanDepth, setEmailScanDepth] = useState<ScanDepth>(
    EMAIL_LOOKUP_DEFAULT_SCAN_DEPTH,
  );
  const [resultIncludes, setResultIncludes] = useState<LookupIncludes>({
    userData: true,
    events: true,
  });
  const resultRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [shortcut] = useState(() =>
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform)
      ? "⌘K"
      : "Ctrl+K",
  );

  const busy = searching || Boolean(loadingEntryId);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") {
        return;
      }
      event.preventDefault();
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  async function fetchLookup(
    searchQuery: string,
    options?: {
      entryOnly?: boolean;
      includeUserData?: boolean;
      includeEvents?: boolean;
      fromDay?: string;
      toDay?: string;
      scanDepth?: ScanDepth;
    },
  ) {
    const trimmed = searchQuery.trim();
    if (!trimmed) return null;

    const res = await fetch(
      `/api/entries/${encodeURIComponent(trimmed)}${lookupQueryString(options)}`,
    );
    const body = await readJsonResponse<
      (LookupResult | MultipleLookupResponse) & { error?: string }
    >(res);
    if (!res.ok) {
      throw new Error(body.error || "Lookup failed");
    }
    return body as LookupResult | MultipleLookupResponse;
  }

  async function runSearch(searchQuery: string) {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    if (isEmailQuery(trimmed)) {
      if (Boolean(lookupFrom) !== Boolean(lookupTo)) {
        setError("Email date range requires both start and end dates");
        return;
      }
      if (lookupFrom && lookupTo && lookupFrom > lookupTo) {
        setError("Start date must be on or before end date");
        return;
      }
    }
    setSearching(true);
    setError(null);
    setResult(null);
    setMatches([]);
    setMatchMeta(null);
    setShowAllUserData(false);
    const includes = {
      userData: includeUserData,
      events: includeEvents,
    };
    const dateRange =
      isEmailQuery(trimmed) && lookupFrom && lookupTo
        ? { fromDay: lookupFrom, toDay: lookupTo }
        : {};
    const scanOptions = isEmailQuery(trimmed)
      ? { scanDepth: emailScanDepth }
      : {};
    try {
      const body = await fetchLookup(trimmed, {
        ...includes,
        ...dateRange,
        ...scanOptions,
      });
      if (!body) return;
      if ("multiple" in body && body.multiple) {
        setMatches(body.matches);
        setMatchMeta({
          truncated: Boolean(body.truncated),
          fromDay: body.fromDay,
          toDay: body.toDay,
          lookbackDays: body.lookbackDays,
          maxPages: body.maxPages,
          maxEntries: body.maxEntries,
        });
        return;
      }
      setResultIncludes(includes);
      setResult(body as LookupResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setSearching(false);
    }
  }

  async function openEntry(entryId: string) {
    setLoadingEntryId(entryId);
    setError(null);
    setShowAllUserData(false);
    const includes = {
      userData: includeUserData,
      events: includeEvents,
    };
    try {
      const body = await fetchLookup(entryId, { entryOnly: true, ...includes });
      if (!body || ("multiple" in body && body.multiple)) {
        throw new Error("Unexpected lookup response");
      }
      setResultIncludes(includes);
      setResult(body as LookupResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLoadingEntryId(null);
    }
  }

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    await runSearch(query);
  }

  function backToMatches() {
    setResult(null);
    setError(null);
  }

  const funnelName = useMemo(() => {
    if (!result) return null;
    return funnelNameFor(result.entry.funnel_id, publishedFunnels);
  }, [result, publishedFunnels]);

  const dataRows = useMemo(() => {
    if (!result) return [];
    return Object.entries(result.data)
      .filter(([key]) => !SENSITIVE.test(key))
      .sort(([leftKey], [rightKey]) => {
        const left = leftKey.toLowerCase();
        const right = rightKey.toLowerCase();
        const leftIndex = USER_DATA_PRIORITY.indexOf(left);
        const rightIndex = USER_DATA_PRIORITY.indexOf(right);
        if (leftIndex !== -1 || rightIndex !== -1) {
          if (leftIndex === -1) return 1;
          if (rightIndex === -1) return -1;
          return leftIndex - rightIndex;
        }
        return left.localeCompare(right);
      });
  }, [result]);

  const visibleDataRows = showAllUserData
    ? dataRows
    : dataRows.slice(0, USER_DATA_INITIAL);
  const hiddenDataCount = Math.max(dataRows.length - USER_DATA_INITIAL, 0);

  return (
    <>
      <button
        type="button"
        className="btn btn-outline header-action-btn shrink-0"
        aria-label="Lookup"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="header-expandable hidden sm:inline">Lookup</span>
        <kbd className="header-expandable ml-0.5 hidden rounded border border-border px-1 py-px font-sans text-[10px] text-muted lg:inline">
          {shortcut}
        </kbd>
      </button>
      {open && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-100 flex items-start justify-center bg-black/40 p-4 pt-[8vh] backdrop-blur-xs"
              onClick={() => setOpen(false)}
            >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lookup-title"
            className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex min-w-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <h2 id="lookup-title" className="text-sm font-semibold">
                  Entry lookup
                </h2>
                <p className="text-xs text-muted">
                  Search by entry ID or email (demo dataset).
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setOpen(false)}
                aria-label="Close lookup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={lookup}
              className="flex flex-col gap-2 px-5 py-4 sm:flex-row"
            >
              <TextInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="entry_… or email@domain.com"
                className="min-w-0 flex-1"
                autoFocus
                disabled={busy}
              />
              <button
                type="submit"
                className="btn btn-primary shrink-0"
                disabled={busy}
              >
                {searching ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-3.5 w-3.5" />
                    Searching…
                  </span>
                ) : (
                  "Search"
                )}
              </button>
            </form>

            <div className="border-t border-border px-5 py-4">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground"
                onClick={() => setAdvancedOpen((current) => !current)}
                aria-expanded={advancedOpen}
              >
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    advancedOpen && "rotate-180",
                  )}
                />
                Advanced
              </button>
              {advancedOpen && (
                <div className="mt-2 space-y-4 rounded-xl border border-border bg-muted/5 p-4">
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted">
                      Email search date range
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <div className="w-46 shrink-0">
                        <DatePicker
                          label="Start"
                          value={lookupFrom}
                          max={lookupTo || todayIso()}
                          onChange={setLookupFrom}
                        />
                      </div>
                      <div className="w-46 shrink-0">
                        <DatePicker
                          label="End"
                          value={lookupTo}
                          min={lookupFrom || undefined}
                          max={todayIso()}
                          align="end"
                          onChange={setLookupTo}
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted">
                      Leave blank for the last {EMAIL_LOOKUP_DEFAULT_LOOKBACK_DAYS}{" "}
                      days. Try jane.doe@example.com or entry_demo_001. Shows up
                      to {EMAIL_LOOKUP_MAX_RESULTS} matches.
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted">
                      Email scan depth
                    </p>
                    <div className="max-w-xs">
                      <Select
                        value={serializeScanDepth(emailScanDepth)}
                        onChange={(value) => setEmailScanDepth(parseScanDepth(value))}
                        options={EMAIL_SCAN_DEPTH_OPTIONS}
                        disabled={busy}
                      />
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted">
                      Scans up to{" "}
                      {formatNumber(emailLookupEntriesForDepth(emailScanDepth))}{" "}
                      recent entries
                      {emailScanDepth === "all"
                        ? "."
                        : ` (${emailLookupPagesForDepth(emailScanDepth)} pages × ${formatNumber(EMAIL_LOOKUP_PAGE_SIZE)} per page).`}
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted">
                      Include in response
                    </p>
                    <div className="flex flex-wrap gap-x-5 gap-y-3">
                      <Checkbox
                        checked={includeUserData}
                        disabled={busy}
                        label="User data"
                        onChange={setIncludeUserData}
                      />
                      <Checkbox
                        checked={includeEvents}
                        disabled={busy}
                        label="Events"
                        onChange={setIncludeEvents}
                      />
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted">
                      Controls which sections load when you open an entry from
                      search results.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="border-t border-border px-5 py-4 text-sm text-down">{error}</p>
            )}

            {matches.length > 0 && !result && (
              <div className="border-t border-border px-5 py-4">
                <p className="text-xs text-muted">
                  {matches.length} result{matches.length === 1 ? "" : "s"} in{" "}
                  {emailSearchRangeLabel(matchMeta)}
                  {matchMeta?.truncated
                    ? ` (scanned ${formatNumber(matchMeta.maxEntries ?? emailLookupEntriesForDepth(emailScanDepth))} entries; more may exist)`
                    : ""}
                  . Tap one to open.
                </p>
                <ul className="mt-3 space-y-2">
                  {matches.map((match) => {
                    const loading = loadingEntryId === match.entry_id;
                    return (
                      <li key={match.entry_id}>
                        <button
                          type="button"
                          className={cn(
                            "w-full rounded-xl border px-3 py-3 text-left transition-colors",
                            loading
                              ? "border-accent bg-accent-soft/30"
                              : "border-border hover:bg-card-hover",
                          )}
                          onClick={() => void openEntry(match.entry_id)}
                          disabled={Boolean(loadingEntryId)}
                          aria-busy={loading}
                        >
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {match.email}
                              </p>
                              <p className="truncate text-xs text-muted">
                                {funnelNameFor(match.funnel_id, publishedFunnels)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted sm:justify-end">
                              {loading && (
                                <Spinner className="h-3.5 w-3.5 shrink-0 text-accent" />
                              )}
                              <div className="sm:text-right">
                                <p className="break-all">{match.entry_id}</p>
                                <p>{new Date(match.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {result && (
              <div
                ref={resultRef}
                className="max-h-[60vh] overflow-y-auto border-t border-border px-5 py-4"
              >
                {matches.length > 0 && (
                  <button
                    type="button"
                    className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground"
                    onClick={backToMatches}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to matches
                  </button>
                )}
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <Meta label="Entry" value={result.entry.entry_id} />
                  <Meta label="Email" value={result.email ?? "—"} />
                  <Meta label="Funnel" value={funnelName ?? "—"} />
                  <Meta label="Contact" value={result.entry.contact_id} />
                  <Meta
                    label="Created"
                    value={new Date(result.entry.created_at).toLocaleString()}
                  />
                </dl>
                {resultIncludes.userData && dataRows.length > 0 && (
                  <div key={result.entry.entry_id} className="mt-5">
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                      User data ({dataRows.length})
                    </h3>
                    <div className="rounded-xl border border-border">
                      {visibleDataRows.map(([key, value]) => (
                        <div
                          key={key}
                          className="grid grid-cols-1 gap-1 border-b border-border px-3 py-2 text-xs last:border-0 sm:grid-cols-[minmax(0,160px)_1fr] sm:gap-3"
                        >
                          <span className="truncate text-muted">{key}</span>
                          <span className="break-all">
                            {typeof value === "string"
                              ? value
                              : JSON.stringify(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {hiddenDataCount > 0 && (
                      <button
                        type="button"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
                        onClick={() => setShowAllUserData((current) => !current)}
                        aria-expanded={showAllUserData}
                      >
                        {showAllUserData ? (
                          <>
                            <ChevronUp className="h-3.5 w-3.5" />
                            Show fewer fields
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 w-3.5" />
                            Show {hiddenDataCount} more field
                            {hiddenDataCount === 1 ? "" : "s"}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
                {resultIncludes.userData && dataRows.length === 0 && (
                  <p className="mt-5 text-xs text-muted">
                    No user data fields on this entry.
                  </p>
                )}
                {resultIncludes.events && (
                  <div className="mt-5">
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                      Events ({result.events.length})
                    </h3>
                    {result.eventsError ? (
                      <p className="text-xs text-down">{result.eventsError}</p>
                    ) : result.events.length === 0 ? (
                      <p className="text-xs text-muted">No events on this entry.</p>
                    ) : (
                      <ul className="space-y-2">
                        {result.events.map((event, index) => (
                          <li
                            key={`${event.timestamp}-${index}`}
                            className="rounded-lg border border-border px-3 py-2 text-xs"
                          >
                            <div className="flex justify-between gap-3">
                              <span className="font-medium">
                                {event.custom_event_name || event.event_type}
                              </span>
                              <span className="text-muted">
                                {new Date(event.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {event.page_key && (
                              <p className="mt-1 text-muted">{event.page_key}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 break-all font-medium">{value}</dd>
    </div>
  );
}
