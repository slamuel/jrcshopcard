import Link from "next/link";
import { listJobsData } from "@/lib/actions/jobs";
import { JobsListClient } from "@/components/JobsList";
import { PageHeader } from "@/components/ui/PageHeader";
import { buttonClasses } from "@/components/ui/Button";

export default async function JobsPage() {
  const data = await listJobsData();

  return (
    <div>
      <PageHeader
        title="Jobs"
        description="Repair jobs across your organization, sorted by priority."
        action={
          <Link href="/jobs/new" className={buttonClasses("primary")}>
            New job
          </Link>
        }
      />
      <JobsListClient initialJobs={data.jobs} customers={data.customers} />
    </div>
  );
}
