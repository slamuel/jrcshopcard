"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertEmployee } from "@/lib/actions/employees";

type E = {
  id: string;
  name: string;
  phoneNumber: string | null;
  email: string | null;
  role: string | null;
  isActive: boolean;
};

export function EmployeeEditForm({ employee }: { employee: E }) {
  const router = useRouter();
  const [name, setName] = useState(employee.name);
  const [phone, setPhone] = useState(employee.phoneNumber ?? "");
  const [email, setEmail] = useState(employee.email ?? "");
  const [role, setRole] = useState(employee.role ?? "");
  const [active, setActive] = useState(employee.isActive);
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="max-w-md space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
      onSubmit={async (ev) => {
        ev.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        try {
          await upsertEmployee({
            id: employee.id,
            name: name.trim(),
            phoneNumber: phone.trim() || null,
            email: email.trim() || null,
            role: role.trim() || null,
            isActive: active,
          });
          router.refresh();
        } finally {
          setSaving(false);
        }
      }}
    >
      <label className="block text-sm">
        <span className="text-xs text-zinc-600">Name *</span>
        <input
          required
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="text-xs text-zinc-600">Phone</span>
        <input
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="text-xs text-zinc-600">Email</span>
        <input
          type="email"
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="text-xs text-zinc-600">Role</span>
        <input
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        Save
      </button>
    </form>
  );
}
