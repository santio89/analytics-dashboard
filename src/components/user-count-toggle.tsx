"use client";

import { useDashboardNavigation } from "@/components/navigation-provider";
import { buildDashboardQuery, type DashboardQuery } from "@/lib/dashboard-query";
import {
  USER_COUNT_MODES,
  userCountModeLabel,
  type UserCountMode,
} from "@/lib/user-count-mode";

type UserCountToggleProps = {
  query: DashboardQuery;
  mode: UserCountMode;
};

export function UserCountToggle({ query, mode }: UserCountToggleProps) {
  const { navigate } = useDashboardNavigation();

  return (
    <div
      className="flex rounded-lg border border-border p-0.5"
      role="group"
      aria-label="User count"
    >
      {USER_COUNT_MODES.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => {
            if (item === mode) return;
            navigate(buildDashboardQuery({ ...query, userCount: item }));
          }}
          className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
            mode === item
              ? "bg-accent text-accent-fg"
              : "text-muted hover:text-foreground"
          }`}
        >
          {userCountModeLabel(item)}
        </button>
      ))}
    </div>
  );
}
