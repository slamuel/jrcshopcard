"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCustomer } from "@/lib/actions/customers";

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
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-500">Edit customer</h2>
      <div className="mt-3 grid gap-2 text-sm">
        <label className="block">
          <span className="text-xs text-zinc-600">Name</span>
          <input
            className="mt-0.5 w-full rounded border border-zinc-300 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs text-zinc-600">Primary contact</span>
          <input
            className="mt-0.5 w-full rounded border border-zinc-300 px-3 py-2"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs text-zinc-600">Phone</span>
          <input
            className="mt-0.5 w-full rounded border border-zinc-300 px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs text-zinc-600">Email</span>
          <input
            className="mt-0.5 w-full rounded border border-zinc-300 px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs text-zinc-600">Billing / mailing address</span>
          <textarea
            className="mt-0.5 w-full rounded border border-zinc-300 px-3 py-2"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={saving || !name.trim()}
          className="mt-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
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
          Save customer
        </button>
      </div>
    </section>
  );
}
