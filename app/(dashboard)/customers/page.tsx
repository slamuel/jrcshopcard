import Link from "next/link";
import { listCustomers } from "@/lib/actions/customers";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function CustomersPage() {
  const customers = await listCustomers();

  return (
    <div>
      <PageHeader title="Customers" description="People and businesses you do work for." />
      {customers.length === 0 ? (
        <EmptyState title="No customers yet" description="Customers are created when you add a new job." />
      ) : (
        <ul className="space-y-2">
          {customers.map((c) => (
            <li key={c.id}>
              <Link
                href={`/customers/${c.id}`}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-zinc-50"
              >
                <span className="font-medium text-zinc-900">{c.name}</span>
                {c.phoneNumber && (
                  <span className="text-sm text-zinc-500">{c.phoneNumber}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
