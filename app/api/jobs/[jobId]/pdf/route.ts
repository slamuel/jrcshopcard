import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildJobReport } from "@/lib/job-report";
import { renderJobReportPdf } from "@/lib/render-job-pdf";

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

  const [customer, location, mats] = await Promise.all([
    prisma.customer.findFirst({ where: { id: job.customerId, organizationId: orgId } }),
    prisma.location.findFirst({ where: { id: job.locationId, organizationId: orgId } }),
    prisma.material.findMany({ where: { organizationId: orgId } }),
  ]);

  const catalog = new Map(mats.map((m) => [m.id, m]));
  const report = buildJobReport(job, customer, location, job.materials, catalog, job.employeeHours);

  const bytes = await renderJobReportPdf(report);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="job-${report.jobNumber}.pdf"`,
    },
  });
}
