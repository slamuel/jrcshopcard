import Link from "next/link";
import { listJobsData } from "@/lib/actions/jobs";
import { JobsListClient } from "@/components/JobsList";

export default async function JobsPage() {
  const data = await listJobsData();

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Jobs</h1>
        <Link
          href="/jobs/new"
          className="inline-flex min-h-11 w-full touch-manipulation items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white active:bg-zinc-950 sm:w-auto sm:hover:bg-zinc-800"
        >
          New job
        </Link>
      </div>
      <JobsListClient initialJobs={data.jobs} customers={data.customers} />
    </div>
  );
}
