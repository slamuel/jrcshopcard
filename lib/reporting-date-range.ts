export type DateInterval = { start: Date; end: Date };

export function dateRangeSelection(
  mode: "thisWeek" | "thisMonth" | "allTime",
  now: Date = new Date()
): DateInterval | null {
  if (mode === "allTime") return null;

  if (mode === "thisMonth") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start: startOfMonth, end: endOfMonth };
  }

  // thisWeek — align with Swift calendar week
  const d = new Date(now);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(d.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  return { start: startOfWeek, end: endOfWeek };
}
