import { cn } from "./cn";

type JobStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "scheduled"
  | "inProgress"
  | "onHold"
  | "completed"
  | "invoiced"
  | "cancelled";

const STATUS_META: Record<JobStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-zinc-100 text-zinc-600" },
  submitted: { label: "Submitted", className: "bg-blue-100 text-blue-700" },
  approved: { label: "Approved", className: "bg-indigo-100 text-indigo-700" },
  scheduled: { label: "Scheduled", className: "bg-violet-100 text-violet-700" },
  inProgress: { label: "In progress", className: "bg-amber-100 text-amber-700" },
  onHold: { label: "On hold", className: "bg-orange-100 text-orange-700" },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-700" },
  invoiced: { label: "Invoiced", className: "bg-teal-100 text-teal-700" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const meta =
    STATUS_META[status as JobStatus] ?? {
      label: status,
      className: "bg-zinc-100 text-zinc-600",
    };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.className,
        className
      )}
    >
      {meta.label}
    </span>
  );
}
