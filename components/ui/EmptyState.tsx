import { cn } from "./cn";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-zinc-300 bg-white/50 px-6 py-12 text-center",
        className
      )}
    >
      <p className="text-sm font-medium text-zinc-700">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
