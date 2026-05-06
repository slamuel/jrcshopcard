import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerDetail } from "@/lib/actions/customers";
import { CustomerDetailClient } from "@/components/CustomerDetailClient";
import { CustomerEditForm } from "@/components/CustomerEditForm";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCustomerDetail(id);
  if (!data) notFound();

  const { customer, locations, jobs } = data;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/customers" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Customers
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{customer.name}</h1>
        {customer.primaryContactName && (
          <p className="text-zinc-600">{customer.primaryContactName}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {customer.phoneNumber && (
            <>
              <a href={`tel:${customer.phoneNumber}`} className="text-2xl text-blue-600" title="Call">
                📞
              </a>
              <a href={`sms:${customer.phoneNumber}`} className="text-2xl text-blue-600" title="Text">
                💬
              </a>
            </>
          )}
          {customer.email && (
            <a href={`mailto:${customer.email}`} className="text-2xl text-blue-600" title="Email">
              ✉️
            </a>
          )}
        </div>
      </div>

      <CustomerEditForm customer={customer} />

      <CustomerDetailClient
        customerId={customer.id}
        initialLocations={locations.map((l) => ({
          id: l.id,
          name: l.name,
          formattedAddress: l.formattedAddress,
        }))}
      />

      <section>
        <h2 className="text-sm font-semibold text-zinc-500">Jobs</h2>
        <ul className="mt-2 space-y-2">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link href={`/jobs/${j.id}`} className="text-blue-600 hover:underline">
                {j.title} (#{j.jobNumber})
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
