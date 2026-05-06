import type { Job, Customer, Location, Material, JobMaterial, JobEmployeeHours } from "@prisma/client";

/** Mirrors Domain/Reports/JobReport (summary for PDF/export). */
export type JobReport = {
  id: string;
  jobNumber: string;
  title: string;
  status: string;
  customerName: string;
  customerContactName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  locationAddress: string;
  createdAt: Date;
  scheduledDate: Date | null;
  completedDate: Date | null;
  description: string;
  internalNotes: string;
  materials: { id: string; name: string; quantity: number; unit: string | null }[];
  employeeHours: { id: string; employeeName: string; hours: number }[];
};

export function buildJobReport(
  job: Job,
  customer: Customer | null,
  location: Location | null,
  materials: JobMaterial[],
  materialCatalog: Map<string, Material>,
  hours: JobEmployeeHours[]
): JobReport {
  return {
    id: job.id,
    jobNumber: job.jobNumber,
    title: job.title,
    status: job.status.charAt(0).toUpperCase() + job.status.slice(1),
    customerName: customer?.name ?? "",
    customerContactName: customer?.primaryContactName ?? null,
    customerPhone: customer?.phoneNumber ?? null,
    customerEmail: customer?.email ?? null,
    locationAddress: location?.formattedAddress ?? "",
    createdAt: job.createdAt,
    scheduledDate: job.scheduledDate,
    completedDate: job.completedDate,
    description: job.description,
    internalNotes: job.internalNotes,
    materials: materials.map((jm) => {
      const m = materialCatalog.get(jm.materialId);
      return {
        id: jm.id,
        name: m?.name ?? "Unknown Material",
        quantity: jm.quantity,
        unit: jm.unitOverride ?? m?.unit ?? null,
      };
    }),
    employeeHours: hours.map((h) => ({
      id: h.id,
      employeeName: h.employeeName,
      hours: h.hours,
    })),
  };
}
