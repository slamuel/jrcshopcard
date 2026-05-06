import type { JobStatus } from "@prisma/client";

export type JobPriorityBand = "low" | "medium" | "high" | "critical";

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function urgencyScore(
  scheduledDate: Date | null,
  completedDate: Date | null,
  now: Date = new Date()
): number {
  if (completedDate && completedDate <= now) return 0;
  if (!scheduledDate) return 0;

  const today = startOfDay(now).getTime();
  const scheduled = startOfDay(scheduledDate).getTime();
  const days = Math.round((scheduled - today) / (24 * 60 * 60 * 1000));

  if (days < 0) return 5;
  if (days === 0) return 4;
  if (days >= 1 && days <= 2) return 3;
  if (days >= 3 && days <= 6) return 2;
  if (days >= 7 && days <= 14) return 1;
  return 0;
}

export function staleScore(): number {
  return 0;
}

export function priorityScore(args: {
  scheduledDate: Date | null;
  completedDate: Date | null;
  priorityOffset: number;
  now?: Date;
}): number {
  const { scheduledDate, completedDate, priorityOffset, now = new Date() } = args;
  if (completedDate && completedDate <= now) return 0;
  return urgencyScore(scheduledDate, completedDate, now) + priorityOffset + staleScore();
}

export function priorityBand(score: number): JobPriorityBand {
  if (score < 1) return "low";
  if (score <= 3) return "medium";
  if (score <= 6) return "high";
  return "critical";
}

export function isJobCompletedOrCancelled(status: JobStatus, completedDate: Date | null, now = new Date()): boolean {
  if (status === "completed" || status === "cancelled") return true;
  if (completedDate && completedDate <= now) return true;
  return false;
}

export function sortJobs<T extends {
  id: string;
  createdAt: Date;
  scheduledDate: Date | null;
  completedDate: Date | null;
  priorityOffset: number;
}>(jobs: T[], now = new Date()): T[] {
  return [...jobs].sort((lhs, rhs) => {
    const pl = priorityScore({
      scheduledDate: lhs.scheduledDate,
      completedDate: lhs.completedDate,
      priorityOffset: lhs.priorityOffset,
      now,
    });
    const pr = priorityScore({
      scheduledDate: rhs.scheduledDate,
      completedDate: rhs.completedDate,
      priorityOffset: rhs.priorityOffset,
      now,
    });
    if (pl !== pr) return pr - pl;

    const lhsDate = lhs.scheduledDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rhsDate = rhs.scheduledDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (lhsDate !== rhsDate) return lhsDate - rhsDate;

    return lhs.createdAt.getTime() - rhs.createdAt.getTime();
  });
}
