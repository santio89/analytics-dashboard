export const USER_COUNT_MODES = ["unique", "sum"] as const;
export type UserCountMode = (typeof USER_COUNT_MODES)[number];

export const DEFAULT_USER_COUNT_MODE: UserCountMode = "sum";

export function parseUserCountMode(
  value: string | undefined,
): UserCountMode {
  if (value === "sum") return "sum";
  if (value === "unique") return "unique";
  return DEFAULT_USER_COUNT_MODE;
}

export function userCountModeLabel(mode: UserCountMode): string {
  return mode === "sum" ? "Sum" : "Unique";
}
