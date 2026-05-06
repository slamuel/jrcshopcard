import { listCustomers } from "@/lib/actions/customers";
import { CreateJobWizard } from "@/components/CreateJobWizard";

export default async function NewJobPage() {
  const customers = await listCustomers();
  return (
    <CreateJobWizard
      initialCustomers={customers.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
