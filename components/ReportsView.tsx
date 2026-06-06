"use client";

import { useCallback, useEffect, useState } from "react";
import { loadReportingBundle } from "@/lib/actions/reporting";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Section } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/components/ui/cn";

type Mode = "thisWeek" | "thisMonth" | "allTime";

function StatRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-zinc-600">{label}</span>
      <span className="font-medium text-zinc-900">{value}</span>
    </li>
  );
}

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

  return (
    <div>
      <PageHeader title="Reports" description="Overview of jobs, customers, crew, and materials." />

      <div className="mb-6 inline-flex rounded-lg border border-zinc-200 bg-white p-1">
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
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              mode === key ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
            )}
            onClick={() => setMode(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Total jobs</h2>
              <p className="mt-2 text-3xl font-semibold text-zinc-900">{data.overview.totalJobs}</p>
              <p className="mt-1 text-sm text-zinc-500">
                Open {data.overview.openJobs} · Completed {data.overview.completedJobs}
              </p>
            </Card>
            <Card>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Scheduled today</h2>
              <p className="mt-2 text-3xl font-semibold text-zinc-900">{data.overview.scheduledToday}</p>
            </Card>
            <Card>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Scheduled this week</h2>
              <p className="mt-2 text-3xl font-semibold text-zinc-900">{data.overview.scheduledThisWeek}</p>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="By status">
              <ul className="divide-y divide-zinc-100">
                {data.byStatus.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-1.5">
                    <StatusBadge status={r.status} />
                    <span className="text-sm font-medium text-zinc-900">{r.count}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="By customer">
              <ul className="divide-y divide-zinc-100">
                {data.byCustomer.map((r) => (
                  <StatRow key={r.id} label={r.customerName} value={r.jobCount} />
                ))}
              </ul>
            </Section>

            <Section title="Active jobs by employee">
              <ul className="divide-y divide-zinc-100">
                {data.byEmployee.map((r) => (
                  <StatRow key={r.id} label={r.employeeName} value={r.activeJobCount} />
                ))}
              </ul>
            </Section>

            <Section title="Materials usage">
              <ul className="divide-y divide-zinc-100">
                {data.matUse.map((r) => (
                  <StatRow
                    key={r.id}
                    label={r.materialName}
                    value={`${r.totalQuantity}${r.unit ? ` ${r.unit}` : ""}`}
                  />
                ))}
              </ul>
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}
