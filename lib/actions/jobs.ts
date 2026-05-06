"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateJobTitle, nextJobNumber } from "@/lib/jobs/title";
import { sortJobs, startOfDay } from "@/lib/job-priority";
import type { JobStatus } from "@prisma/client";
import {
  googleMapsDirectionsUrl,
  googleMapsDirectionsUrlFromAddresses,
} from "@/lib/google-route";

async function orgId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.organizationId;
  if (!id) throw new Error("Unauthorized");
  return id;
}

export async function listJobsData() {
  const oid = await orgId();
  const [jobs, customers, locations] = await Promise.all([
    prisma.job.findMany({
      where: { organizationId: oid },
      include: { jobEmployees: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({ where: { organizationId: oid } }),
    prisma.location.findMany({ where: { organizationId: oid } }),
  ]);
  const sorted = sortJobs(jobs);
  const customerMap = new Map(customers.map((c) => [c.id, c.name]));
  const locationMap = new Map(locations.map((l) => [l.id, l]));
  return { jobs: sorted, customers, locations, customerMap, locationMap };
}

export async function getJobDetail(jobId: string) {
  const oid = await orgId();
  const job = await prisma.job.findFirst({
    where: { id: jobId, organizationId: oid },
    include: {
      materials: true,
      employeeHours: true,
      jobEmployees: { include: { employee: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!job) return null;
  const [customer, location] = await Promise.all([
    prisma.customer.findFirst({ where: { id: job.customerId, organizationId: oid } }),
    prisma.location.findFirst({ where: { id: job.locationId, organizationId: oid } }),
  ]);
  const [materials, employees] = await Promise.all([
    prisma.material.findMany({ where: { organizationId: oid } }),
    prisma.employee.findMany({ where: { organizationId: oid } }),
  ]);
  const photos = await prisma.photo.findMany({
    where: { jobId, organizationId: oid },
    orderBy: { createdAt: "desc" },
  });
  return { job, customer, location, materials, employees, photos };
}

export async function updateJobPriority(jobId: string, delta: number) {
  const oid = await orgId();
  const job = await prisma.job.findFirst({ where: { id: jobId, organizationId: oid } });
  if (!job) throw new Error("Job not found");
  const next = Math.max(-3, Math.min(3, job.priorityOffset + delta));
  await prisma.job.update({
    where: { id: jobId },
    data: { priorityOffset: next, lastActivityAt: new Date() },
  });
  revalidatePath("/jobs");
}

export async function updateJobFields(
  jobId: string,
  data: {
    title?: string;
    description?: string;
    internalNotes?: string;
    status?: JobStatus;
    scheduledDate?: Date | null;
    completedDate?: Date | null;
    employeeHours?: {
      id: string;
      employeeId: string | null;
      employeeName: string;
      hours: number;
    }[];
  }
) {
  const oid = await orgId();
  const existing = await prisma.job.findFirst({ where: { id: jobId, organizationId: oid } });
  if (!existing) throw new Error("Not found");

  await prisma.job.update({
    where: { id: jobId },
    data: {
      title: data.title,
      description: data.description,
      internalNotes: data.internalNotes,
      status: data.status,
      scheduledDate: data.scheduledDate,
      completedDate: data.completedDate,
      lastActivityAt: new Date(),
    },
  });

  if (data.employeeHours) {
    await prisma.jobEmployeeHours.deleteMany({ where: { jobId } });
    await prisma.jobEmployeeHours.createMany({
      data: data.employeeHours.map((row) => ({
        id: row.id.startsWith("new-") ? crypto.randomUUID() : row.id,
        jobId,
        employeeId: row.employeeId,
        employeeName: row.employeeName,
        hours: row.hours,
      })),
    });
  }

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
}

export async function createLocation(
  customerId: string,
  loc: {
    name: string;
    formattedAddress: string;
    latitude?: number | null;
    longitude?: number | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    notes?: string | null;
  }
) {
  const oid = await orgId();
  const created = await prisma.location.create({
    data: {
      organizationId: oid,
      customerId,
      name: loc.name,
      formattedAddress: loc.formattedAddress,
      latitude: loc.latitude ?? undefined,
      longitude: loc.longitude ?? undefined,
      city: loc.city ?? undefined,
      state: loc.state ?? undefined,
      postalCode: loc.postalCode ?? undefined,
      notes: loc.notes ?? undefined,
    },
  });
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  return created;
}

export async function createCustomer(data: {
  name: string;
  primaryContactName?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
}) {
  const oid = await orgId();
  const c = await prisma.customer.create({
    data: {
      organizationId: oid,
      name: data.name,
      primaryContactName: data.primaryContactName,
      phoneNumber: data.phoneNumber,
      email: data.email,
      address: data.address,
    },
  });
  revalidatePath("/customers");
  return c;
}

export async function createJobFromWizard(input: {
  customerId: string;
  locationId: string;
  jobId: string;
  title?: string;
}) {
  const oid = await orgId();
  const year = new Date().getFullYear();
  const nums = await prisma.job.findMany({
    where: { organizationId: oid, jobNumber: { startsWith: `${year}-` } },
    select: { jobNumber: true },
  });
  const jobNumber = nextJobNumber(
    year,
    nums.map((n) => n.jobNumber)
  );

  const [customer, location] = await Promise.all([
    prisma.customer.findFirst({ where: { id: input.customerId, organizationId: oid } }),
    prisma.location.findFirst({ where: { id: input.locationId, organizationId: oid } }),
  ]);
  if (!customer || !location) throw new Error("Invalid customer or location");

  const title =
    input.title?.trim() ||
    generateJobTitle({
      jobId: input.jobId,
      customerName: customer.name,
      formattedAddress: location.formattedAddress,
    });

  await prisma.job.create({
    data: {
      id: input.jobId,
      organizationId: oid,
      jobNumber,
      title,
      customerId: input.customerId,
      locationId: input.locationId,
      status: "draft",
    },
  });
  revalidatePath("/jobs");
}

export async function saveJobMaterials(
  jobId: string,
  lines: {
    materialId: string;
    quantity: number;
    unitOverride?: string | null;
    note?: string | null;
  }[]
) {
  const oid = await orgId();
  const job = await prisma.job.findFirst({ where: { id: jobId, organizationId: oid } });
  if (!job) throw new Error("Not found");
  await prisma.jobMaterial.deleteMany({ where: { jobId } });
  await prisma.jobMaterial.createMany({
    data: lines.map((l) => ({
      jobId,
      materialId: l.materialId,
      quantity: l.quantity,
      unitOverride: l.unitOverride ?? undefined,
      note: l.note ?? undefined,
    })),
  });
  await prisma.job.update({
    where: { id: jobId },
    data: { lastActivityAt: new Date() },
  });
  revalidatePath(`/jobs/${jobId}`);
}

export async function saveJobEmployeeRoster(jobId: string, employeeIds: string[]) {
  const oid = await orgId();
  const job = await prisma.job.findFirst({ where: { id: jobId, organizationId: oid } });
  if (!job) throw new Error("Not found");
  await prisma.jobEmployee.deleteMany({ where: { jobId } });
  await prisma.jobEmployee.createMany({
    data: employeeIds.map((employeeId, i) => ({
      jobId,
      employeeId,
      sortOrder: i,
    })),
  });
  await prisma.job.update({
    where: { id: jobId },
    data: { lastActivityAt: new Date() },
  });
  revalidatePath(`/jobs/${jobId}`);
}

export async function getTodaysRouteUrl(): Promise<{ url: string | null; message: string }> {
  const oid = await orgId();
  const now = new Date();
  const todayStart = startOfDay(now);
  const endToday = new Date(todayStart);
  endToday.setDate(endToday.getDate() + 1);

  const jobs = await prisma.job.findMany({
    where: { organizationId: oid },
    include: { location: true },
  });

  const todays = jobs.filter((j) => {
    if (!j.scheduledDate) return false;
    const sd = j.scheduledDate;
    if (sd < todayStart || sd >= endToday) return false;
    if (j.completedDate && j.completedDate <= now) return false;
    if (j.status === "completed" || j.status === "cancelled") return false;
    return true;
  });

  const sorted = sortJobs(todays);

  if (sorted.length === 0) {
    return { url: null, message: "No jobs scheduled for today." };
  }

  const allCoords = sorted.every(
    (j) => j.location.latitude != null && j.location.longitude != null
  );
  if (allCoords) {
    const coords = sorted.map((j) => ({
      lat: j.location.latitude!,
      lng: j.location.longitude!,
    }));
    const url = googleMapsDirectionsUrl(coords);
    return { url, message: url ? "" : "Could not build route" };
  }

  const url = googleMapsDirectionsUrlFromAddresses(
    sorted.map((j) => j.location.formattedAddress)
  );
  return { url, message: "" };
}
