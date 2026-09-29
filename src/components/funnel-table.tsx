import {
  computeDelta,
  deltaTone,
  formatDelta,
  formatNumber,
  formatRate,
  formatSigned,
} from "@/lib/cn";
import { CollapsibleSection } from "@/components/collapsible-section";
import { SectionUnavailable } from "@/components/section-unavailable";
import type { StageTotal } from "@/lib/overview";
import { stageSortIndex } from "@/lib/stages";
import { FUNNEL, updatingSectionLabel } from "@/lib/section-labels";
import {
  DEFAULT_USER_COUNT_MODE,
  type UserCountMode,
} from "@/lib/user-count-mode";

type FunnelTableProps = {
  visitors: number;
  stages: StageTotal[];
  compareOn: boolean;
  previousVisitors?: number;
  previousStages?: StageTotal[];
  currentLabel: string;
  previousLabel?: string;
  unavailableMessage?: string;
  busy?: boolean;
  userCount?: UserCountMode;
};

type Row = {
  title: string;
  current: number;
  previous: number;
  currentRate: number;
  previousRate: number;
};

function countFor(stages: StageTotal[], title: string): number {
  return stages.find((stage) => stage.title === title)?.count ?? 0;
}

function buildRows(
  visitors: number,
  stages: StageTotal[],
  previousVisitors: number,
  previousStages: StageTotal[],
): Row[] {
  const titles = [
    "Unique users",
    ...Array.from(new Set([...stages, ...previousStages].map((s) => s.title))).sort(
      (a, b) => stageSortIndex(a) - stageSortIndex(b) || a.localeCompare(b),
    ),
  ];

  return titles.map((title) => {
    const current = title === "Unique users" ? visitors : countFor(stages, title);
    const previous =
      title === "Unique users"
        ? previousVisitors
        : countFor(previousStages, title);

    return {
      title,
      current,
      previous,
      currentRate:
        title === "Unique users" ? 100 : visitors > 0 ? (current / visitors) * 100 : 0,
      previousRate:
        title === "Unique users"
          ? 100
          : previousVisitors > 0
            ? (previous / previousVisitors) * 100
            : 0,
    };
  });
}

export function FunnelTable({
  visitors,
  stages,
  compareOn,
  previousVisitors = 0,
  previousStages = [],
  currentLabel,
  previousLabel,
  unavailableMessage,
  busy = false,
  userCount = DEFAULT_USER_COUNT_MODE,
}: FunnelTableProps) {
  const rows = buildRows(visitors, stages, previousVisitors, previousStages);

  return (
    <CollapsibleSection
      id="funnel-table"
      title={FUNNEL}
      contentClassName="overflow-x-auto"
      busy={busy}
      busyLabel={updatingSectionLabel(FUNNEL)}
    >
      {unavailableMessage ? (
        <SectionUnavailable message={unavailableMessage} />
      ) : (
      <>
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
            <th className="sticky left-0 bg-card px-4 py-3 font-medium">Stage</th>
            <th className="px-4 py-3 font-medium text-right">{currentLabel}</th>
            {compareOn ? (
              <>
                <th className="px-4 py-3 font-medium text-right">{previousLabel}</th>
                <th className="px-4 py-3 font-medium text-right">Users Δ</th>
                <th className="px-4 py-3 font-medium text-right">{currentLabel}</th>
                <th className="px-4 py-3 font-medium text-right">{previousLabel}</th>
                <th className="px-4 py-3 font-medium text-right">Rate Δ</th>
              </>
            ) : (
              <th className="px-4 py-3 font-medium text-right">% of users</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const countDelta = computeDelta(row.current, row.previous);
            const rateDelta = computeDelta(row.currentRate, row.previousRate);
            const isUsersRow = row.title === "Unique users";

            return (
              <tr
                key={row.title}
                className="group border-b border-border/70 last:border-0 hover:bg-card-hover"
              >
                <td className="sticky left-0 bg-card px-4 py-3 font-medium group-hover:bg-card-hover">
                  {row.title}
                </td>
                <td className="tabular px-4 py-3 text-right">
                  {formatNumber(row.current)}
                </td>
                {compareOn ? (
                  <>
                    <td className="tabular px-4 py-3 text-right text-muted">
                      {formatNumber(row.previous)}
                    </td>
                    <td className={`tabular px-4 py-3 text-right ${deltaTone(countDelta)}`}>
                      {formatSigned(row.current - row.previous)}{" "}
                      <span className="text-xs">({formatDelta(countDelta)})</span>
                    </td>
                    <td className="tabular px-4 py-3 text-right text-muted">
                      {formatRate(row.currentRate)}
                    </td>
                    <td className="tabular px-4 py-3 text-right text-muted">
                      {formatRate(row.previousRate)}
                    </td>
                    <td className={`tabular px-4 py-3 text-right ${deltaTone(rateDelta)}`}>
                      {isUsersRow ? "—" : formatDelta(rateDelta)}
                    </td>
                  </>
                ) : (
                  <td className="tabular px-4 py-3 text-right text-muted">
                    {formatRate(row.currentRate)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {compareOn && (
        <p className="border-t border-border px-4 py-3 text-xs text-muted">
          Δ = change vs comparison period.
        </p>
      )}
      {userCount === "unique" ? (
        <p className="border-t border-border px-4 py-3 text-xs text-muted">
          Unique counts each person once in the selected range.
        </p>
      ) : null}
      </>
      )}
    </CollapsibleSection>
  );
}
