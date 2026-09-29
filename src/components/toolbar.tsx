"use client";

import { GitCompare } from "lucide-react";
import { useState } from "react";
import { DatePicker } from "@/components/date-picker";
import { SelectFieldSkeleton } from "@/components/loading-skeleton";
import { Select } from "@/components/select";
import { useDashboardNavigation } from "@/components/navigation-provider";
import { useDashboardApply } from "@/components/providers/dashboard-apply-provider";
import { buildDashboardQuery, type DashboardQuery } from "@/lib/dashboard-query";
import {
  DATE_PRESETS,
  equalPriorPeriod,
  matchingPreset,
  resolvePresetRange,
  todayIso,
} from "@/lib/dates";
import { funnelLabel, type PublishedFunnel } from "@/lib/funnels";
import { REPORTING_TIMEZONES } from "@/lib/timezone";
import { SHOW_TIMEZONE_SELECTOR } from "@/lib/feature-flags";

type ToolbarProps = {
  publishedFunnels: PublishedFunnel[];
  catalogLoading?: boolean;
  funnelId: string;
  from: string;
  to: string;
  compareOn: boolean;
  compareFrom: string;
  compareTo: string;
  tz: string;
  metric?: string;
  utmDim?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  utmOther?: string;
  scanDepth?: DashboardQuery["scanDepth"];
  userCount?: DashboardQuery["userCount"];
};

type Draft = {
  funnelId: string;
  from: string;
  to: string;
  compareOn: boolean;
  compareFrom: string;
  compareTo: string;
};

export function Toolbar({
  publishedFunnels,
  catalogLoading = false,
  funnelId,
  from,
  to,
  compareOn,
  compareFrom,
  compareTo,
  tz,
  metric,
  utmDim,
  utmSource,
  utmMedium,
  utmCampaign,
  utmTerm,
  utmContent,
  utmOther,
  scanDepth,
  userCount,
}: ToolbarProps) {
  const { navigate } = useDashboardNavigation();
  const { metricsEnabled, enableMetrics } = useDashboardApply();
  const extras = {
    metric,
    utmDim,
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    utmOther,
    scanDepth,
    tz,
    userCount,
  };
  const [draft, setDraft] = useState<Draft>({
    funnelId,
    from,
    to,
    compareOn,
    compareFrom,
    compareTo,
  });
  const [lastDraftKey, setLastDraftKey] = useState(
    `${funnelId}|${from}|${to}|${compareOn}|${compareFrom}|${compareTo}`,
  );
  const draftKey = `${funnelId}|${from}|${to}|${compareOn}|${compareFrom}|${compareTo}`;

  if (lastDraftKey !== draftKey) {
    setLastDraftKey(draftKey);
    setDraft({ funnelId, from, to, compareOn, compareFrom, compareTo });
  }

  const activePreset = matchingPreset(draft.from, draft.to);
  const today = todayIso(tz);
  const dirty =
    draft.funnelId !== funnelId ||
    draft.from !== from ||
    draft.to !== to ||
    draft.compareOn !== compareOn ||
    draft.compareFrom !== compareFrom ||
    draft.compareTo !== compareTo;
  const canApply = dirty || !metricsEnabled;

  const applied: DashboardQuery = {
    funnelId,
    from,
    to,
    compareOn,
    compareFrom,
    compareTo,
    ...extras,
  };

  function go(next: Draft) {
    const from = next.from <= next.to ? next.from : next.to;
    const to = next.from <= next.to ? next.to : next.from;
    const compareFrom =
      next.compareFrom <= next.compareTo ? next.compareFrom : next.compareTo;
    const compareTo =
      next.compareFrom <= next.compareTo ? next.compareTo : next.compareFrom;
    navigate(
      buildDashboardQuery({
        ...applied,
        ...next,
        from,
        to,
        compareFrom,
        compareTo,
      }),
    );
  }

  function navigateApplied(patch: Partial<DashboardQuery>) {
    navigate(buildDashboardQuery({ ...applied, ...patch }));
  }

  function apply(event: React.FormEvent) {
    event.preventDefault();
    enableMetrics();
    go(draft);
  }

  function toggleCompare() {
    if (draft.compareOn) {
      setDraft((current) => ({ ...current, compareOn: false }));
      return;
    }
    const prior = equalPriorPeriod(draft.from, draft.to);
    setDraft((current) => ({
      ...current,
      compareOn: true,
      compareFrom: prior.compareFrom,
      compareTo: prior.compareTo,
    }));
  }

  function applyPreset(presetId: string) {
    const preset = DATE_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    const range = resolvePresetRange(preset, today, tz);
    const prior = equalPriorPeriod(range.from, range.to);
    setDraft((current) => ({
      ...current,
      from: range.from,
      to: range.to,
      compareFrom: current.compareOn ? prior.compareFrom : current.compareFrom,
      compareTo: current.compareOn ? prior.compareTo : current.compareTo,
    }));
  }

  return (
    <form
      onSubmit={apply}
      className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-(--shadow)"
    >
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-end">
        {catalogLoading ? (
          <SelectFieldSkeleton label="Funnel" />
        ) : (
          <Select
            className="min-w-0 flex-1"
            label="Funnel"
            value={draft.funnelId}
            placeholder="All published funnels"
            searchable
            searchPlaceholder="Filter funnels…"
            onChange={(funnelId) =>
              setDraft((current) => ({ ...current, funnelId }))
            }
            options={[
              { value: "all", label: "All published funnels" },
              ...publishedFunnels.map((funnel) => ({
                value: funnel.id,
                label: funnelLabel(funnel.title),
              })),
            ]}
          />
        )}
        <div className="grid min-w-0 grid-cols-2 gap-3 lg:contents">
          <DatePicker
            label="Start"
            value={draft.from}
            max={today}
            paired
            onChange={(next) =>
              setDraft((current) => ({ ...current, from: next }))
            }
          />
          <DatePicker
            label="End"
            value={draft.to}
            max={today}
            align="end"
            paired
            onChange={(next) =>
              setDraft((current) => ({ ...current, to: next }))
            }
          />
        </div>
        {SHOW_TIMEZONE_SELECTOR ? (
          <Select
            className="min-w-0 w-full lg:w-44"
            label="Timezone"
            value={tz}
            onChange={(next) => navigateApplied({ tz: next })}
            options={REPORTING_TIMEZONES.map((item) => ({
              value: item.id,
              label: item.label,
            }))}
          />
        ) : null}
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <button
            type="button"
            onClick={toggleCompare}
            aria-pressed={draft.compareOn}
            className={draft.compareOn ? "btn btn-accent" : "btn btn-outline"}
          >
            <GitCompare className="h-4 w-4" />
            Compare
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!canApply}
          >
            Apply
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="chip"
            data-active={activePreset === preset.id}
            onClick={() => applyPreset(preset.id)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {draft.compareOn && (
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 lg:flex-row lg:items-end">
          <div className="grid min-w-0 grid-cols-2 gap-3 lg:contents">
            <DatePicker
              label="Compare start"
              value={draft.compareFrom}
              max={today}
              paired
              onChange={(next) =>
                setDraft((current) => ({ ...current, compareFrom: next }))
              }
            />
            <DatePicker
              label="Compare end"
              value={draft.compareTo}
              max={today}
              align="end"
              paired
              onChange={(next) =>
                setDraft((current) => ({ ...current, compareTo: next }))
              }
            />
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              const prior = equalPriorPeriod(draft.from, draft.to);
              setDraft((current) => ({
                ...current,
                compareFrom: prior.compareFrom,
                compareTo: prior.compareTo,
              }));
            }}
          >
            Previous period
          </button>
        </div>
      )}
    </form>
  );
}
