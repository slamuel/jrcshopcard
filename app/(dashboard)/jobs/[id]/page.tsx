import { notFound } from "next/navigation";
import { getJobDetail } from "@/lib/actions/jobs";
import { JobDetailForm } from "@/components/JobDetailForm";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getJobDetail(id);
  if (!data) notFound();

  const payload = JSON.parse(
    JSON.stringify({
      job: {
        id: data.job.id,
        jobNumber: data.job.jobNumber,
        title: data.job.title,
        status: data.job.status,
        description: data.job.description,
        internalNotes: data.job.internalNotes,
        scheduledDate: data.job.scheduledDate,
        completedDate: data.job.completedDate,
        customerId: data.job.customerId,
        locationId: data.job.locationId,
      },
      customer: data.customer
        ? {
            name: data.customer.name,
            phoneNumber: data.customer.phoneNumber,
            email: data.customer.email,
          }
        : null,
      location: data.location
        ? { formattedAddress: data.location.formattedAddress, name: data.location.name }
        : null,
      materials: data.materials,
      employees: data.employees,
      photos: data.photos.map((p) => ({
        id: p.id,
        url: p.url,
        fileName: p.fileName,
        notes: p.notes,
        isAiRoofPreview: p.isAiRoofPreview,
        aiRoofPrompt: p.aiRoofPrompt,
      })),
      jobMaterials: data.job.materials,
      jobEmployees: data.job.jobEmployees.map((x) => ({ employeeId: x.employeeId })),
      employeeHours: data.job.employeeHours,
    })
  );

  return <JobDetailForm payload={payload} />;
}
