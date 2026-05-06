import { notFound } from "next/navigation";
import Link from "next/link";
import { getEmployee } from "@/lib/actions/employees";
import { EmployeeEditForm } from "@/components/EmployeeEditForm";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const e = await getEmployee(id);
  if (!e) notFound();

  return (
    <div className="space-y-6">
      <Link href="/employees" className="text-sm text-zinc-500 hover:text-zinc-800">
        ← Employees
      </Link>
      <h1 className="text-2xl font-bold">{e.name}</h1>
      <EmployeeEditForm employee={JSON.parse(JSON.stringify(e))} />
    </div>
  );
}
