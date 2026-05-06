import Link from "next/link";
import { listCustomers } from "@/lib/actions/customers";

export default async function CustomersPage() {
  const customers = await listCustomers();

  return (
    <div>
      <h1 className="text-xl font-bold sm:text-2xl">Customers</h1>
      <ul className="mt-4 space-y-2">
        {customers.map((c) => (
          <li key={c.id}>
            <Link
              href={`/customers/${c.id}`}
              className="block min-h-[3.25rem] rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm active:bg-zinc-100 sm:hover:bg-zinc-50"
            >
              <span className="font-medium">{c.name}</span>
              {c.phoneNumber && <span className="ml-2 text-sm text-zinc-500">{c.phoneNumber}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
