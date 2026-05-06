import type { DateInterval } from "./reporting-date-range";

export type JobsOverviewSummary = {
  totalJobs: number;
  openJobs: number;
  completedJobs: number;
  scheduledToday: number;
  scheduledThisWeek: number;
};

export type JobsByStatusRow = { id: string; status: string; count: number };
export type JobsByCustomerRow = { id: string; customerName: string; jobCount: number };
export type JobsByEmployeeRow = { id: string; employeeName: string; activeJobCount: number };
export type MaterialsUsageRow = { id: string; materialName: string; totalQuantity: number; unit: string | null };

import type { Job } from "@prisma/client";

function inScheduledRange(job: Job, range: DateInterval | null): boolean {
  if (!range) return true;
  if (!job.scheduledDate) return false;
  const t = job.scheduledDate.getTime();
  return t >= range.start.getTime() && t < range.end.getTime();
}

function isCompletedJob(job: Job, now: Date): boolean {
  if (job.status === "completed") return true;
  if (job.completedDate && job.completedDate <= now) return true;
  return false;
}

export function jobsOverview(
  jobs: Job[],
  range: DateInterval | null,
  now: Date
): JobsOverviewSummary {
  const filtered = jobs.filter((j) => inScheduledRange(j, range));
  let openJobs = 0;
  let completedJobs = 0;
  let scheduledToday = 0;
  let scheduledThisWeek = 0;

  const calToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(calToday);
  endOfToday.setDate(endOfToday.getDate() + 1);
  const endOfWeek = new Date(calToday);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  for (const job of filtered) {
    if (isCompletedJob(job, now)) completedJobs++;
    else openJobs++;

    if (job.scheduledDate) {
      const d = job.scheduledDate;
      if (d >= calToday && d < endOfToday) scheduledToday++;
      if (d >= calToday && d < endOfWeek) scheduledThisWeek++;
    }
  }

  return {
    totalJobs: filtered.length,
    openJobs,
    completedJobs,
    scheduledToday,
    scheduledThisWeek,
  };
}

export function jobsByStatus(jobs: Job[], range: DateInterval | null): JobsByStatusRow[] {
  const filtered = jobs.filter((j) => inScheduledRange(j, range));
  const counts: Record<string, number> = {};
  for (const j of filtered) {
    counts[j.status] = (counts[j.status] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([status, count]) => ({
      id: status,
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export function jobsByCustomer(
  jobs: Job[],
  customers: { id: string; name: string }[],
  range: DateInterval | null
): JobsByCustomerRow[] {
  const filtered = jobs.filter((j) => inScheduledRange(j, range));
  const map = new Map<string, number>();
  for (const j of filtered) {
    map.set(j.customerId, (map.get(j.customerId) ?? 0) + 1);
  }
  const rows: JobsByCustomerRow[] = [];
  for (const [id, jobCount] of map) {
    const c = customers.find((x) => x.id === id);
    if (c) rows.push({ id, customerName: c.name, jobCount });
  }
  return rows.sort((a, b) => b.jobCount - a.jobCount);
}

function isActiveJob(job: Job, now: Date): boolean {
  if (job.status === "completed") return false;
  if (job.completedDate && job.completedDate <= now) return false;
  return true;
}

export function jobsByEmployee(
  jobs: (Job & { jobEmployees: { employeeId: string }[] })[],
  employees: { id: string; name: string }[],
  range: DateInterval | null,
  now: Date
): JobsByEmployeeRow[] {
  const filtered = jobs.filter((j) => inScheduledRange(j, range));
  const active = filtered.filter((j) => isActiveJob(j, now));
  const map = new Map<string, number>();
  for (const job of active) {
    for (const id of job.jobEmployees.map((x) => x.employeeId)) {
      map.set(id, (map.get(id) ?? 0) + 1);
    }
  }
  const out: JobsByEmployeeRow[] = [];
  for (const [id, activeJobCount] of map) {
    const e = employees.find((x) => x.id === id);
    if (e) out.push({ id, employeeName: e.name, activeJobCount });
  }
  return out.sort((a, b) => b.activeJobCount - a.activeJobCount);
}

export function materialsUsage(
  jobs: (Job & {
    materials: { materialId: string; quantity: number; unitOverride: string | null }[];
  })[],
  materials: { id: string; name: string; unit: string | null }[],
  range: DateInterval | null
): MaterialsUsageRow[] {
  const filtered = jobs.filter((j) => inScheduledRange(j, range));
  const acc = new Map<string, { quantity: number; unit: string | null }>();

  for (const job of filtered) {
    for (const jm of job.materials) {
      const m = materials.find((x) => x.id === jm.materialId);
      const unit = jm.unitOverride ?? m?.unit ?? null;
      const prev = acc.get(jm.materialId) ?? { quantity: 0, unit };
      acc.set(jm.materialId, {
        quantity: prev.quantity + jm.quantity,
        unit: unit ?? prev.unit,
      });
    }
  }

  const rows: MaterialsUsageRow[] = [];
  for (const [id, u] of acc) {
    const m = materials.find((x) => x.id === id);
    if (m) rows.push({ id, materialName: m.name, totalQuantity: u.quantity, unit: u.unit });
  }
  return rows.sort((a, b) => b.totalQuantity - a.totalQuantity);
}
