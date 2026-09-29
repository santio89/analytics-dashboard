export function funnelShapeRateValue(
  label: string,
  count: number,
  visitors: number,
): number {
  if (label === "Unique users") return 100;
  return visitors > 0 ? (count / visitors) * 100 : 0;
}
