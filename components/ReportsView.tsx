"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { loadReportingBundle } from "@/lib/actions/reporting";

type Mode = "thisWeek" | "thisMonth" | "allTime";

export function ReportsView() {
  const [mode, setMode] = useState<Mode>("allTime");
  const [data, setData] = useState<Awaited<ReturnType<typeof loadReportingBundle>> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await loadReportingBundle(mode);
      setData(d);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !data) {
    return <p className="text-zinc-500">Loading…</p>;
  }

  const o = data.overview;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold sm:text-2xl">Reports</h1>
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-1 sm:flex-row sm:gap-2">
        {(
          [
            ["thisWeek", "This week"],
            ["thisMonth", "This month"],
            ["allTime", "All time"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`min-h-11 flex-1 touch-manipulation rounded-md px-3 py-2.5 text-sm font-medium sm:py-2 ${
              mode === key ? "bg-zinc-900 text-white" : "text-zinc-600 active:bg-zinc-200 sm:hover:bg-zinc-100"
            }`}
            onClick={() => setMode(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-500">Jobs overview</h2>
          <p className="mt-2 text-2xl font-bold">{o.totalJobs}</p>
          <p className="text-sm text-zinc-600">
            Open: {o.openJobs} · Completed: {o.completedJobs}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Scheduled today: {o.scheduledToday} · this week: {o.scheduledThisWeek}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-500">By status</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {data.byStatus.map((r) => (
            <li key={r.id} className="flex justify-between">
              <span>{r.status}</span>
              <span className="font-medium">{r.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-500">By customer</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {data.byCustomer.map((r) => (
            <li key={r.id} className="flex justify-between">
              <span>{r.customerName}</span>
              <span className="font-medium">{r.jobCount}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-500">Active jobs by employee</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {data.byEmployee.map((r) => (
            <li key={r.id} className="flex justify-between">
              <span>{r.employeeName}</span>
              <span className="font-medium">{r.activeJobCount}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-500">Materials usage</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {data.matUse.map((r) => (
            <li key={r.id} className="flex justify-between">
              <span>{r.materialName}</span>
              <span className="font-medium">
                {r.totalQuantity}
                {r.unit ? ` ${r.unit}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-zinc-400">
        Filter uses scheduled date within range (matches iOS reporting).{" "}
        <Link href="/jobs" className="text-blue-600">
          Jobs
        </Link>
      </p>
    </div>
  );
}
