"use client";

import Link from "next/link";
import type { Customer, Job as PrismaJob } from "@prisma/client";
import { priorityBand, priorityScore, startOfDay, type JobPriorityBand } from "@/lib/job-priority";
import { updateJobPriority } from "@/lib/actions/jobs";

type JobWithEmps = PrismaJob & { jobEmployees: { employeeId: string }[] };

function bandColor(b: JobPriorityBand): string {
  switch (b) {
    case "low":
      return "bg-green-500";
    case "medium":
      return "bg-yellow-400";
    case "high":
      return "bg-orange-500";
    case "critical":
      return "bg-red-500";
  }
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
    <Link href={`/jobs/${job.id}`} className="block">
      <div className="rounded-xl border border-zinc-200 bg-zinc-100/80 p-4 shadow-sm transition hover:bg-zinc-100">
        <div className="font-semibold leading-snug text-zinc-900">{job.title}</div>
        <div className="mt-1 text-sm text-zinc-500">
          Job #{job.jobNumber} · {customerName}
          {job.scheduledDate && (
            <>
              {" "}
              ·{" "}
              {job.scheduledDate.toLocaleDateString(undefined, {
                dateStyle: "short",
              })}
            </>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${bandColor(band)}`} />
            <button
              type="button"
              className="rounded p-1 text-blue-600 disabled:text-zinc-300"
              disabled={job.priorityOffset >= 3}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void updateJobPriority(job.id, 1).then(onPriorityChange);
              }}
            >
              ▲
            </button>
            <button
              type="button"
              className="rounded p-1 text-blue-600 disabled:text-zinc-300"
              disabled={job.priorityOffset <= -3}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void updateJobPriority(job.id, -1).then(onPriorityChange);
              }}
            >
              ▼
            </button>
          </div>
          <span className="rounded-md bg-white px-2 py-0.5 text-xs font-medium capitalize text-zinc-600 shadow-sm">
            {job.status}
          </span>
        </div>
      </div>
    </Link>
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
            <h2 className="text-lg font-semibold">Today&apos;s Jobs</h2>
            <p className="text-sm text-zinc-500">{todays.length} scheduled</p>
          </div>
          <TodaysRouteButton />
        </div>
        {todays.length === 0 ? (
          <p className="text-sm text-zinc-500">No jobs scheduled for today</p>
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
        <h2 className="mb-3 text-lg font-semibold">All Jobs</h2>
        {rest.length === 0 ? (
          <p className="text-sm text-zinc-500">No other jobs</p>
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
    <button
      type="button"
      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      onClick={async () => {
        const { getTodaysRouteUrl } = await import("@/lib/actions/jobs");
        const r = await getTodaysRouteUrl();
        if (r.url) window.open(r.url, "_blank");
        else alert(r.message || "Could not open maps");
      }}
    >
      Route in Google Maps
    </button>
  );
}
