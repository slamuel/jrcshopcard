"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertEmployee } from "@/lib/actions/employees";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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
    <Card className="max-w-lg">
      <form
        className="space-y-4"
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
        <Field label="Name *">
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Role">
          <Input value={role} onChange={(e) => setRole(e.target.value)} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Active
        </label>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </form>
    </Card>
  );
}
