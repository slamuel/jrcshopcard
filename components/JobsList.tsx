"use client";

import Link from "next/link";
import type { Customer, Job as PrismaJob } from "@prisma/client";
import { priorityBand, priorityScore, startOfDay, type JobPriorityBand } from "@/lib/job-priority";
import { updateJobPriority } from "@/lib/actions/jobs";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

type JobWithEmps = PrismaJob & { jobEmployees: { employeeId: string }[] };

function bandColor(b: JobPriorityBand): string {
  switch (b) {
    case "low":
      return "bg-emerald-500";
    case "medium":
      return "bg-yellow-400";
    case "high":
      return "bg-orange-500";
    case "critical":
      return "bg-red-500";
  }
}

function bandLabel(b: JobPriorityBand): string {
  return b.charAt(0).toUpperCase() + b.slice(1);
}

function JobCard({
  job,
  customerName,
  onPriorityChange,
}: {
  job: JobWithEmps;
  customerName: string;
  onPriorityChange: () => void;
}) {
  const now = new Date();
  const score = priorityScore({
    scheduledDate: job.scheduledDate,
    completedDate: job.completedDate,
    priorityOffset: job.priorityOffset,
    now,
  });
  const band = priorityBand(score);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:bg-zinc-50">
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${bandColor(band)}`}
        title={`${bandLabel(band)} priority`}
      />
      <Link href={`/jobs/${job.id}`} className="min-w-0 flex-1">
        <div className="truncate font-semibold leading-snug text-zinc-900">
          {job.title}
        </div>
        <div className="mt-0.5 truncate text-sm text-zinc-500">
          #{job.jobNumber} · {customerName}
          {job.scheduledDate &&
            ` · ${job.scheduledDate.toLocaleDateString(undefined, { dateStyle: "short" })}`}
        </div>
      </Link>
      <StatusBadge status={job.status} />
      <div className="flex flex-col">
        <button
          type="button"
          aria-label="Increase priority"
          className="rounded p-0.5 text-zinc-400 hover:text-zinc-900 disabled:text-zinc-200"
          disabled={job.priorityOffset >= 3}
          onClick={() => void updateJobPriority(job.id, 1).then(onPriorityChange)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
            <path d="m6 15 6-6 6 6" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Decrease priority"
          className="rounded p-0.5 text-zinc-400 hover:text-zinc-900 disabled:text-zinc-200"
          disabled={job.priorityOffset <= -3}
          onClick={() => void updateJobPriority(job.id, -1).then(onPriorityChange)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function JobsListClient({
  initialJobs,
  customers,
}: {
  initialJobs: JobWithEmps[];
  customers: Customer[];
}) {
  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? "Unknown";

  const now = new Date();
  const today = startOfDay(now);
  const endToday = new Date(today);
  endToday.setDate(endToday.getDate() + 1);

  const todays = initialJobs.filter((job) => {
    if (!job.scheduledDate) return false;
    const sd = job.scheduledDate;
    if (sd < today || sd >= endToday) return false;
    if (job.completedDate && job.completedDate <= now) return false;
    if (job.status === "completed" || job.status === "cancelled") return false;
    return true;
  });

  const rest = initialJobs.filter((j) => {
    if (!j.scheduledDate) return true;
    return !(j.scheduledDate >= today && j.scheduledDate < endToday);
  });

  const refresh = () => window.location.reload();

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Today&apos;s jobs</h2>
            <p className="text-sm text-zinc-500">{todays.length} scheduled</p>
          </div>
          <TodaysRouteButton />
        </div>
        {todays.length === 0 ? (
          <EmptyState title="Nothing scheduled for today" />
        ) : (
          <ul className="space-y-3">
            {todays.map((job) => (
              <li key={job.id}>
                <JobCard job={job} customerName={customerName(job.customerId)} onPriorityChange={refresh} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-zinc-900">All jobs</h2>
        {rest.length === 0 ? (
          <EmptyState title="No other jobs" />
        ) : (
          <ul className="space-y-3">
            {rest.map((job) => (
              <li key={job.id}>
                <JobCard job={job} customerName={customerName(job.customerId)} onPriorityChange={refresh} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TodaysRouteButton() {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        const { getTodaysRouteUrl } = await import("@/lib/actions/jobs");
        const r = await getTodaysRouteUrl();
        if (r.url) window.open(r.url, "_blank");
        else alert(r.message || "Could not open maps");
      }}
    >
      Route in Google Maps
    </Button>
  );
}
