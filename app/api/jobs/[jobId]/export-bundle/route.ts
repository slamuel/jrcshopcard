import { NextResponse } from "next/server";
import JSZip from "jszip";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildJobReport } from "@/lib/job-report";
import { renderJobReportPdf } from "@/lib/render-job-pdf";
import { getPhotoImageBytes } from "@/lib/job-export-photo-bytes";
import { safeZipEntryName } from "@/lib/job-export-zip-filename";

export const maxDuration = 120;

export async function GET(
  _: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  const session = await auth();
  const orgId = session?.user?.organizationId;
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await context.params;

  const job = await prisma.job.findFirst({
    where: { id: jobId, organizationId: orgId },
    include: { materials: true, employeeHours: true },
  });
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [customer, location, mats, photos] = await Promise.all([
    prisma.customer.findFirst({ where: { id: job.customerId, organizationId: orgId } }),
    prisma.location.findFirst({ where: { id: job.locationId, organizationId: orgId } }),
    prisma.material.findMany({ where: { organizationId: orgId } }),
    prisma.photo.findMany({
      where: { jobId, organizationId: orgId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const catalog = new Map(mats.map((m) => [m.id, m]));
  const report = buildJobReport(job, customer, location, job.materials, catalog, job.employeeHours);

  const pdfBytes = await renderJobReportPdf(report);
  const zip = new JSZip();
  zip.file(`job-${safeZipEntryName(report.jobNumber, "job")}.pdf`, pdfBytes);

  const folder = zip.folder("photos");
  let n = 0;
  for (const photo of photos) {
    const bytes = await getPhotoImageBytes(photo);
    if (!bytes) continue;
    n += 1;
    const name = safeZipEntryName(
      `${String(n).padStart(2, "0")}_${photo.fileName}`,
      `photo-${n}.jpg`
    );
    folder?.file(name, bytes);
  }

  const out = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const zipName = `job-${safeZipEntryName(report.jobNumber, "job")}-bundle.zip`;

  return new NextResponse(new Uint8Array(out), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}"`,
    },
  });
}
