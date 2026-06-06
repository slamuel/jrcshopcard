import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerDetail } from "@/lib/actions/customers";
import { CustomerDetailClient } from "@/components/CustomerDetailClient";
import { CustomerEditForm } from "@/components/CustomerEditForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

function ContactButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      title={label}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
    >
      {children}
    </a>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-4 w-4",
  "aria-hidden": true,
};

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
      <PageHeader
        title={customer.name}
        description={customer.primaryContactName ?? undefined}
        backHref="/customers"
        backLabel="Customers"
        action={
          <div className="flex gap-2">
            {customer.phoneNumber && (
              <>
                <ContactButton href={`tel:${customer.phoneNumber}`} label="Call">
                  <svg {...iconProps}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" /></svg>
                </ContactButton>
                <ContactButton href={`sms:${customer.phoneNumber}`} label="Text">
                  <svg {...iconProps}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" /></svg>
                </ContactButton>
              </>
            )}
            {customer.email && (
              <ContactButton href={`mailto:${customer.email}`} label="Email">
                <svg {...iconProps}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>
              </ContactButton>
            )}
          </div>
        }
      />

      <CustomerEditForm customer={customer} />

      <CustomerDetailClient
        customerId={customer.id}
        initialLocations={locations.map((l) => ({
          id: l.id,
          name: l.name,
          formattedAddress: l.formattedAddress,
        }))}
      />

      <Section title="Jobs">
        {jobs.length === 0 ? (
          <EmptyState title="No jobs for this customer yet" />
        ) : (
          <ul className="space-y-1">
            {jobs.map((j) => (
              <li key={j.id}>
                <Link
                  href={`/jobs/${j.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-zinc-50"
                >
                  <span className="font-medium text-zinc-900">{j.title}</span>
                  <span className="text-sm text-zinc-500">#{j.jobNumber}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
