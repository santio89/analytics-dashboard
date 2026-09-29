import { HomeDashboard } from "@/components/home-dashboard";
import { hasExplicitDashboardApply } from "@/lib/dashboard-apply";
import { parseDashboardParams } from "@/lib/dashboard-params";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  const raw = await searchParams;
  const params = parseDashboardParams(raw);
  const initialApplied = hasExplicitDashboardApply(raw);

  return (
    <div className="min-h-full">
      <HomeDashboard params={params} initialApplied={initialApplied} />
    </div>
  );
}
