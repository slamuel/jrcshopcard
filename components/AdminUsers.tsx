"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createOrgUser,
  updateUserRole,
  resetUserPassword,
} from "@/lib/actions/admin";
import { Section } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type OrgUser = { id: string; name: string | null; email: string; role: string };

const ROLES = ["owner", "admin", "member"] as const;

function UserRow({ user, isSelf }: { user: OrgUser; isSelf: boolean }) {
  const router = useRouter();
  const [role, setRole] = useState(user.role);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  return (
    <li className="rounded-lg border border-zinc-200 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-medium text-zinc-900">
            {user.name || user.email}
            {isSelf && <span className="ml-2 text-xs font-normal text-zinc-400">(you)</span>}
          </div>
          <div className="truncate text-sm text-zinc-500">{user.email}</div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            className="w-32"
            value={role}
            disabled={isSelf || busy}
            onChange={async (e) => {
              const next = e.target.value;
              setRole(next);
              setBusy(true);
              setErr(null);
              setMsg(null);
              try {
                await updateUserRole(user.id, next);
                setMsg("Role updated");
                router.refresh();
              } catch (ex) {
                setRole(user.role);
                setErr(ex instanceof Error ? ex.message : "Failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <Field label="Set new password" className="flex-1">
          <Input
            type="text"
            placeholder="Min 8 characters"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="off"
          />
        </Field>
        <Button
          variant="secondary"
          size="sm"
          disabled={busy || pw.length < 8}
          onClick={async () => {
            setBusy(true);
            setErr(null);
            setMsg(null);
            try {
              await resetUserPassword(user.id, pw);
              setPw("");
              setMsg("Password reset");
            } catch (ex) {
              setErr(ex instanceof Error ? ex.message : "Failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          Reset password
        </Button>
      </div>
      {msg && <p className="mt-1 text-sm text-emerald-700">{msg}</p>}
      {err && <p className="mt-1 text-sm text-red-600">{err}</p>}
    </li>
  );
}

export function AdminUsers({
  users,
  currentUserId,
}: {
  users: OrgUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("member");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  return (
    <Section title="Users" description="Add team members and manage roles and passwords.">
      <ul className="space-y-3">
        {users.map((u) => (
          <UserRow key={u.id} user={u} isSelf={u.id === currentUserId} />
        ))}
      </ul>

      <div className="mt-6 border-t border-zinc-200 pt-4">
        <h3 className="text-sm font-semibold text-zinc-700">Add user</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Input placeholder="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Temp password * (min 8)" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" />
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button
            disabled={busy || !email.trim() || password.length < 8}
            onClick={async () => {
              setBusy(true);
              setErr(null);
              setMsg(null);
              try {
                await createOrgUser({ email, name, password, role });
                setEmail("");
                setName("");
                setPassword("");
                setRole("member");
                setMsg("User created");
                router.refresh();
              } catch (ex) {
                setErr(ex instanceof Error ? ex.message : "Could not create user");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Creating…" : "Add user"}
          </Button>
          {msg && <span className="text-sm text-emerald-700">{msg}</span>}
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Share the temporary password with the user directly; they can change it later.
        </p>
      </div>
    </Section>
  );
}
