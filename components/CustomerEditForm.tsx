"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCustomer } from "@/lib/actions/customers";
import { Section } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type C = {
  id: string;
  name: string;
  primaryContactName: string | null;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
};

export function CustomerEditForm({ customer }: { customer: C }) {
  const router = useRouter();
  const [name, setName] = useState(customer.name);
  const [contact, setContact] = useState(customer.primaryContactName ?? "");
  const [phone, setPhone] = useState(customer.phoneNumber ?? "");
  const [email, setEmail] = useState(customer.email ?? "");
  const [address, setAddress] = useState(customer.address ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <Section title="Edit customer">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" className="sm:col-span-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Primary contact">
          <Input value={contact} onChange={(e) => setContact(e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Billing / mailing address" className="sm:col-span-2">
          <Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
      </div>
      <Button
        className="mt-4"
        disabled={saving || !name.trim()}
        onClick={async () => {
          setSaving(true);
          try {
            await updateCustomer(customer.id, {
              name: name.trim(),
              primaryContactName: contact.trim() || null,
              phoneNumber: phone.trim() || null,
              email: email.trim() || null,
              address: address.trim() || null,
            });
            router.refresh();
          } finally {
            setSaving(false);
          }
        }}
      >
        {saving ? "Saving…" : "Save customer"}
      </Button>
    </Section>
  );
}
