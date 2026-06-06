import { listJobsData } from "@/lib/actions/jobs";
import { RoofPreviewModule } from "@/components/RoofPreviewModule";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireOrgId } from "@/lib/session";
import { getGeminiConfig } from "@/lib/settings";

export default async function RoofPreviewPage() {
  const orgId = await requireOrgId();
  const { apiKey } = await getGeminiConfig(orgId);
  const data = await listJobsData();
  const jobs = data.jobs.map((j) => ({
    id: j.id,
    jobNumber: j.jobNumber,
    title: j.title,
  }));

  return (
    <div>
      <PageHeader
        title="Roof Preview"
        description="Generate an AI roof visualization from a photo. Download it, or optionally attach it to a job."
      />
      <RoofPreviewModule geminiConfigured={Boolean(apiKey)} jobs={jobs} />
    </div>
  );
}
