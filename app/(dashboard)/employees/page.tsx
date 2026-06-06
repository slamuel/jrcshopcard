import Link from "next/link";
import { listEmployees } from "@/lib/actions/employees";
import { PageHeader } from "@/components/ui/PageHeader";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function EmployeesPage() {
  const employees = await listEmployees();

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Your crew roster, used for job assignments."
        action={
          <Link href="/employees/new" className={buttonClasses("primary")}>
            Add employee
          </Link>
        }
      />
      {employees.length === 0 ? (
        <EmptyState
          title="No active employees"
          description="Add crew members to assign them to jobs."
        />
      ) : (
        <ul className="space-y-2">
          {employees.map((e) => (
            <li key={e.id}>
              <Link
                href={`/employees/${e.id}`}
                className="flex flex-wrap items-center gap-x-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-zinc-50"
              >
                <span className="font-medium text-zinc-900">{e.name}</span>
                {e.role && <span className="text-sm text-zinc-500">{e.role}</span>}
                {e.phoneNumber && (
                  <span className="text-xs text-zinc-400">{e.phoneNumber}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
