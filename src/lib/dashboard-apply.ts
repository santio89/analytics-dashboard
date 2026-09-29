/** True when the URL includes toolbar Apply fields (shared links, post-Apply reload). */
export function hasExplicitDashboardApply(
  params: Record<string, string | string[] | undefined>,
): boolean {
  return (
    params.funnel !== undefined ||
    params.from !== undefined ||
    params.to !== undefined ||
    params.compare !== undefined
  );
}

export const DASHBOARD_AWAITING_APPLY_MESSAGE =
  "Select a funnel and date range, then Apply.";
