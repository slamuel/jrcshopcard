import { notFound } from "next/navigation";
import { getEmployee } from "@/lib/actions/employees";
import { EmployeeEditForm } from "@/components/EmployeeEditForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const e = await getEmployee(id);
  if (!e) notFound();

  return (
    <div>
      <PageHeader title={e.name} backHref="/employees" backLabel="Employees" />
      <EmployeeEditForm employee={JSON.parse(JSON.stringify(e))} />
    </div>
  );
}
