"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { upsertEmployee } from "@/lib/actions/employees";

export default function NewEmployeePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div className="max-w-md space-y-4">
      <Link href="/employees" className="text-sm text-zinc-500">
        ← Employees
      </Link>
      <h1 className="text-2xl font-bold">New employee</h1>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setPending(true);
          try {
            const id = await upsertEmployee({
              name: name.trim(),
              phoneNumber: phone.trim() || null,
              email: email.trim() || null,
              role: role.trim() || null,
            });
            router.push(`/employees/${id}`);
          } finally {
            setPending(false);
          }
        }}
      >
        <input
          required
          placeholder="Name *"
          className="w-full rounded border px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Phone"
          className="w-full rounded border px-3 py-2"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full rounded border px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Role"
          className="w-full rounded border px-3 py-2"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Create
        </button>
      </form>
    </div>
  );
}
