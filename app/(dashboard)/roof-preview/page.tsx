import { listJobsData } from "@/lib/actions/jobs";
import { RoofPreviewModule } from "@/components/RoofPreviewModule";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function RoofPreviewPage() {
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
      <RoofPreviewModule
        geminiConfigured={Boolean(process.env.GEMINI_API_KEY)}
        jobs={jobs}
      />
    </div>
  );
}
