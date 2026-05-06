"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  jobsOverview,
  jobsByStatus,
  jobsByCustomer,
  jobsByEmployee,
  materialsUsage,
} from "@/lib/reporting";
import { dateRangeSelection } from "@/lib/reporting-date-range";

async function org() {
  const session = await auth();
  const id = session?.user?.organizationId;
  if (!id) throw new Error("Unauthorized");
  return id;
}

export async function loadReportingBundle(
  rangeMode: "thisWeek" | "thisMonth" | "allTime"
) {
  const oid = await org();
  const now = new Date();
  const interval = dateRangeSelection(rangeMode, now);

  const [jobs, customers, employees, materials] = await Promise.all([
    prisma.job.findMany({
      where: { organizationId: oid },
      include: {
        jobEmployees: true,
        materials: true,
      },
    }),
    prisma.customer.findMany({ where: { organizationId: oid } }),
    prisma.employee.findMany({ where: { organizationId: oid } }),
    prisma.material.findMany({ where: { organizationId: oid } }),
  ]);

  const overview = jobsOverview(jobs, interval, now);
  const byStatus = jobsByStatus(jobs, interval);
  const byCustomer = jobsByCustomer(jobs, customers, interval);
  const byEmployee = jobsByEmployee(
    jobs as Parameters<typeof jobsByEmployee>[0],
    employees,
    interval,
    now
  );
  const matUse = materialsUsage(
    jobs as Parameters<typeof materialsUsage>[0],
    materials,
    interval
  );

  return {
    overview,
    byStatus,
    byCustomer,
    byEmployee,
    matUse,
    interval,
  };
}
