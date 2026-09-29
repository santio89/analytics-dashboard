"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Select } from "@/components/select";
import { HoverPopover } from "@/components/hover-popover";
import { useDashboardNavigation } from "@/components/navigation-provider";
import { buildDashboardQuery, type DashboardQuery } from "@/lib/dashboard-query";
import { cn } from "@/lib/cn";
import {
  DEFAULT_SCAN_DEPTH,
  SCAN_DEPTH_HELP,
  SCAN_DEPTH_VALUES,
  scanDepthShortLabel,
  type ScanDepth,
} from "@/lib/scan-depth";

type UtmFiltersProps = {
  query: DashboardQuery;
  optionsReady?: boolean;
  /** Scan depth pills live in the page funnel header when the UTM section is hidden. */
  showScanDepth?: boolean;
  helpText?: string;
  sources?: string[];
  mediums?: string[];
  campaigns?: string[];
};

const FILTER_FIELDS = [
  {
    key: "utmSource" as const,
    label: "Source",
    placeholder: "All sources",
    emptyLabel: "All sources",
    optionsKey: "sources" as const,
  },
  {
    key: "utmMedium" as const,
    label: "Medium",
    placeholder: "All mediums",
    emptyLabel: "All mediums",
    optionsKey: "mediums" as const,
  },
  {
    key: "utmCampaign" as const,
    label: "Campaign",
    placeholder: "All campaigns",
    emptyLabel: "All campaigns",
    optionsKey: "campaigns" as const,
  },
];

export function UtmFilters({
  query,
  optionsReady = false,
  showScanDepth = true,
  helpText,
  sources = [],
  mediums = [],
  campaigns = [],
}: UtmFiltersProps) {
  const { navigate } = useDashboardNavigation();
  const scanDepth: ScanDepth = query.scanDepth ?? DEFAULT_SCAN_DEPTH;
  const hasUtmFilters = Boolean(
    query.utmSource ||
      query.utmMedium ||
      query.utmCampaign ||
      query.utmTerm ||
      query.utmContent ||
      query.utmOther,
  );
  const [open, setOpen] = useState(hasUtmFilters);
  const [lastHasFilters, setLastHasFilters] = useState(hasUtmFilters);
  const optionLists = { sources, mediums, campaigns };

  if (lastHasFilters !== hasUtmFilters && hasUtmFilters) {
    setLastHasFilters(hasUtmFilters);
    setOpen(true);
  }

  function applyFilter(patch: Partial<DashboardQuery>) {
    navigate(buildDashboardQuery({ ...query, ...patch }));
  }

  function clearUtmFilters() {
    applyFilter({
      utmSource: undefined,
      utmMedium: undefined,
      utmCampaign: undefined,
      utmTerm: undefined,
      utmContent: undefined,
      utmOther: undefined,
    });
  }

  const resolvedHelpText =
    helpText ??
    (showScanDepth
      ? "UTM filters apply here and to the page funnel on a single funnel. Overview totals are not filtered."
      : undefined);

  return (
    <div className="border-b border-border px-4 py-2.5">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-medium">
          Filters
          {hasUtmFilters && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent">
              Active
            </span>
          )}
          {!open && showScanDepth && scanDepth !== DEFAULT_SCAN_DEPTH && (
            <span className="text-[11px] font-normal text-muted">
              Scan {scanDepthShortLabel(scanDepth)}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="mt-2.5 space-y-2.5">
          {showScanDepth ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <HoverPopover content={SCAN_DEPTH_HELP}>
                <span className="text-[11px] font-medium text-muted">Scan depth</span>
              </HoverPopover>
              <HoverPopover content={SCAN_DEPTH_HELP}>
                <div
                  className="inline-flex shrink-0 rounded-lg border border-border p-0.5"
                  role="group"
                  aria-label="Scan depth"
                >
                  {SCAN_DEPTH_VALUES.map((depth) => (
                    <button
                      key={String(depth)}
                      type="button"
                      onClick={() => {
                        if (depth === scanDepth) return;
                        applyFilter({ scanDepth: depth });
                      }}
                      className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
                        scanDepth === depth
                          ? "bg-accent text-accent-fg"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {scanDepthShortLabel(depth)}
                    </button>
                  ))}
                </div>
              </HoverPopover>
            </div>
          ) : null}

          {!optionsReady ? (
            <p className="text-[11px] text-muted">Loading filter options…</p>
          ) : (
            <>
              {resolvedHelpText || hasUtmFilters ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {resolvedHelpText ? (
                    <p className="text-[11px] text-muted">{resolvedHelpText}</p>
                  ) : null}
                  {hasUtmFilters ? (
                    <button
                      type="button"
                      className="shrink-0 text-[11px] text-accent hover:underline"
                      onClick={clearUtmFilters}
                    >
                      Clear UTM
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {FILTER_FIELDS.map((field) => {
                  const values = optionLists[field.optionsKey].slice(0, 80);
                  return (
                    <Select
                      key={field.key}
                      label={field.label}
                      value={query[field.key] ?? ""}
                      placeholder={field.placeholder}
                      searchable={values.length > 12}
                      searchPlaceholder={`Search ${field.label.toLowerCase()}…`}
                      className="gap-1"
                      onChange={(next) =>
                        applyFilter({ [field.key]: next || undefined })
                      }
                      options={[
                        { value: "", label: field.emptyLabel },
                        ...values.map((value) => ({
                          value,
                          label: value,
                        })),
                      ]}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
