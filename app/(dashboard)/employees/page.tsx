import Link from "next/link";
import { listEmployees } from "@/lib/actions/employees";

export default async function EmployeesPage() {
  const employees = await listEmployees();

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Employees</h1>
        <Link
          href="/employees/new"
          className="inline-flex min-h-11 w-full touch-manipulation items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white active:bg-zinc-950 sm:w-auto sm:hover:bg-zinc-800"
        >
          Add employee
        </Link>
      </div>
      <p className="mb-4 text-sm text-zinc-500">
        Crew roster (same data as job assignments). Included for parity with iOS{" "}
        <code className="text-xs">EmployeesView</code>.
      </p>
      <ul className="space-y-2">
        {employees.map((e) => (
          <li key={e.id}>
            <Link
              href={`/employees/${e.id}`}
              className="block min-h-[3.25rem] rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm active:bg-zinc-100 sm:hover:bg-zinc-50"
            >
              <span className="font-medium">{e.name}</span>
              {e.role && <span className="ml-2 text-sm text-zinc-500">{e.role}</span>}
              {e.phoneNumber && <span className="ml-2 text-xs text-zinc-400">{e.phoneNumber}</span>}
            </Link>
          </li>
        ))}
      </ul>
      {employees.length === 0 && <p className="text-sm text-zinc-500">No active employees.</p>}
    </div>
  );
}
