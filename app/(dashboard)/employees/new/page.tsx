"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertEmployee } from "@/lib/actions/employees";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function NewEmployeePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div className="max-w-lg">
      <PageHeader title="New employee" backHref="/employees" backLabel="Employees" />
      <Card>
        <form
          className="space-y-4"
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
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
