"use client";

import { DashboardBody } from "@/components/dashboard-body";
import { EntryLookup } from "@/components/entry-lookup";
import { DashboardApplyProvider } from "@/components/providers/dashboard-apply-provider";
import { SiteHeader } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";
import type { DashboardParams } from "@/lib/dashboard-params";
import { dashboardSubtitle, dashboardTitle } from "@/lib/dashboard-chrome";
import { SHOW_ENTRY_LOOKUP } from "@/lib/feature-flags";
import { usePublishedFunnels } from "@/lib/use-published-funnels";
import { useMemo } from "react";

type HomeDashboardProps = {
  params: DashboardParams;
  initialApplied: boolean;
};

export function HomeDashboard({ params, initialApplied }: HomeDashboardProps) {
  const { funnels, catalogLoading } = usePublishedFunnels();
  const title = useMemo(
    () => dashboardTitle(params, funnels),
    [funnels, params],
  );
  const subtitle = useMemo(() => dashboardSubtitle(params), [params]);

  return (
    <DashboardApplyProvider initialApplied={initialApplied}>
      <SiteHeader
        entryLookup={
          SHOW_ENTRY_LOOKUP ? (
            <EntryLookup publishedFunnels={funnels} />
          ) : null
        }
        themeToggle={<ThemeToggle />}
      />

      <main className="mx-auto min-w-0 max-w-6xl space-y-5 px-4 py-7 sm:px-6">
        <div>
          <h1 className="text-[1.65rem] font-semibold tracking-tight break-words">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
          <p className="mt-3 rounded-xl border border-accent/15 bg-accent-soft/40 px-3 py-2 text-xs leading-relaxed text-muted">
            Demo dashboard with sample data. Try entry lookup with{" "}
            <span className="font-medium text-foreground">entry_demo_001</span> or{" "}
            <span className="font-medium text-foreground">jane.doe@example.com</span>.
          </p>
        </div>

        <DashboardBody
          params={params}
          publishedFunnels={funnels}
          catalogLoading={catalogLoading}
        />
      </main>
    </DashboardApplyProvider>
  );
}
