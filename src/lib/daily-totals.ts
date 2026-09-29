import type { DailyPoint, StageTotal } from "@/lib/overview";
import { stageSortIndex } from "@/lib/stages";

export function sumDailyVisitors(points: DailyPoint[]): number {
  return points.reduce((sum, point) => sum + point.visitors, 0);
}

export function sumDailyStages(points: DailyPoint[]): StageTotal[] {
  const totals = new Map<string, number>();
  for (const point of points) {
    for (const [title, count] of Object.entries(point.stages)) {
      totals.set(title, (totals.get(title) ?? 0) + count);
    }
  }
  return [...totals.entries()]
    .map(([title, count]) => ({ title, count }))
    .sort(
      (a, b) =>
        stageSortIndex(a.title) - stageSortIndex(b.title) || b.count - a.count,
    );
}
