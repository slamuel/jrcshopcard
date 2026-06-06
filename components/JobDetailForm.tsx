"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { JobStatus } from "@prisma/client";
import {
  updateJobFields,
  saveJobMaterials,
  saveJobEmployeeRoster,
} from "@/lib/actions/jobs";
import { deleteJobPhoto, updatePhotoCaption } from "@/lib/actions/photos";
import { createCatalogMaterial } from "@/lib/actions/materials";
import { Section } from "@/components/ui/Card";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Field, Input, Textarea, Select } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";

type Payload = {
  job: {
    id: string;
    jobNumber: string;
    title: string;
    status: JobStatus;
    description: string;
    internalNotes: string;
    scheduledDate: string | null;
    completedDate: string | null;
    customerId: string;
    locationId: string;
  };
  customer: {
    name: string;
    phoneNumber: string | null;
    email: string | null;
  } | null;
  location: { formattedAddress: string; name: string } | null;
  materials: { id: string; name: string; unit: string | null }[];
  employees: { id: string; name: string }[];
  photos: {
    id: string;
    url: string | null;
    fileName: string;
    notes: string | null;
    isAiRoofPreview?: boolean;
    aiRoofPrompt?: string | null;
  }[];
  jobMaterials: {
    id: string;
    materialId: string;
    quantity: number;
    unitOverride: string | null;
    note: string | null;
  }[];
  jobEmployees: { employeeId: string }[];
  employeeHours: { id: string; employeeId: string | null; employeeName: string; hours: number }[];
};

const STATUSES: JobStatus[] = [
  "draft",
  "submitted",
  "approved",
  "scheduled",
  "inProgress",
  "onHold",
  "completed",
  "invoiced",
  "cancelled",
];

export function JobDetailForm({ payload }: { payload: Payload }) {
  const router = useRouter();
  const [title, setTitle] = useState(payload.job.title);
  const [description, setDescription] = useState(payload.job.description);
  const [internalNotes, setInternalNotes] = useState(payload.job.internalNotes);
  const [status, setStatus] = useState<JobStatus>(payload.job.status);
  const [scheduledDate, setScheduledDate] = useState(
    payload.job.scheduledDate ? isoToLocal(payload.job.scheduledDate) : ""
  );
  const [completedDate, setCompletedDate] = useState(
    payload.job.completedDate ? isoToLocalDate(payload.job.completedDate) : ""
  );
  const [hoursRows, setHoursRows] = useState(payload.employeeHours);
  const [matQty, setMatQty] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const jm of payload.jobMaterials) {
      m[jm.materialId] = String(jm.quantity);
    }
    return m;
  });
  const [matUnit, setMatUnit] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const jm of payload.jobMaterials) {
      if (jm.unitOverride) m[jm.materialId] = jm.unitOverride;
    }
    return m;
  });
  const [matNote, setMatNote] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const jm of payload.jobMaterials) {
      if (jm.note) m[jm.materialId] = jm.note;
    }
    return m;
  });
  const [newMatName, setNewMatName] = useState("");
  const [newMatSku, setNewMatSku] = useState("");
  const [newMatUnit, setNewMatUnit] = useState("");
  const [addingMat, setAddingMat] = useState(false);

  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(
    payload.jobEmployees.map((x) => x.employeeId)
  );
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState(payload.photos);

  const tel = payload.customer?.phoneNumber;
  const mail = payload.customer?.email;

  async function saveCore() {
    setSaving(true);
    try {
      await updateJobFields(payload.job.id, {
        title,
        description,
        internalNotes,
        status,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        completedDate: completedDate ? new Date(completedDate + "T12:00:00") : null,
        employeeHours: hoursRows.map((h) => ({
          id: h.id,
          employeeId: h.employeeId,
          employeeName: h.employeeName,
          hours: h.hours,
        })),
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveMaterials() {
    const lines = payload.materials
      .map((m) => {
        const q = parseFloat(matQty[m.id] ?? "0");
        if (!q || q <= 0) return null;
        return {
          materialId: m.id,
          quantity: q,
          unitOverride: matUnit[m.id]?.trim() || null,
          note: matNote[m.id]?.trim() || null,
        };
      })
      .filter(Boolean) as {
      materialId: string;
      quantity: number;
      unitOverride: string | null;
      note: string | null;
    }[];
    setSaving(true);
    try {
      await saveJobMaterials(payload.job.id, lines);
    } finally {
      setSaving(false);
    }
  }

  async function saveEmployees() {
    setSaving(true);
    try {
      await saveJobEmployeeRoster(payload.job.id, selectedEmployees);
    } finally {
      setSaving(false);
    }
  }

  async function createNewCatalogMaterial() {
    if (!newMatName.trim()) return;
    setAddingMat(true);
    try {
      await createCatalogMaterial({
        name: newMatName.trim(),
        sku: newMatSku.trim() || undefined,
        unit: newMatUnit.trim() || undefined,
      });
      setNewMatName("");
      setNewMatSku("");
      setNewMatUnit("");
      router.refresh();
    } finally {
      setAddingMat(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/jobs"
            className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800"
          >
            <span aria-hidden>←</span> Jobs
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
            <StatusBadge status={status} />
          </div>
          <p className="mt-1 text-sm text-zinc-500">Job #{payload.job.jobNumber}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/jobs/${payload.job.id}/pdf`} className={buttonClasses("secondary")}>
            PDF only
          </a>
          <a href={`/api/jobs/${payload.job.id}/export-bundle`} className={buttonClasses("primary")}>
            PDF + photos (ZIP)
          </a>
        </div>
      </div>

      {payload.customer && (
        <Section title="Customer">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-medium text-zinc-900">{payload.customer.name}</p>
            <div className="flex gap-2">
              {tel && (
                <a href={`tel:${tel.replace(/\s/g, "")}`} className={buttonClasses("secondary", "sm")}>
                  Call
                </a>
              )}
              {tel && (
                <a href={`sms:${tel.replace(/\s/g, "")}`} className={buttonClasses("secondary", "sm")}>
                  Text
                </a>
              )}
              {mail && (
                <a href={`mailto:${mail}`} className={buttonClasses("secondary", "sm")}>
                  Email
                </a>
              )}
            </div>
          </div>
        </Section>
      )}

      <Section title="Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as JobStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Scheduled">
            <Input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </Field>
          <Field label="Completed date">
            <Input
              type="date"
              value={completedDate}
              onChange={(e) => setCompletedDate(e.target.value)}
            />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="Internal notes" className="sm:col-span-2">
            <Textarea rows={3} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
          </Field>
        </div>
        <Button className="mt-4" disabled={saving} onClick={saveCore}>
          {saving ? "Saving…" : "Save details"}
        </Button>
      </Section>

      {payload.location && (
        <Section title="Location">
          <p className="font-medium text-zinc-900">{payload.location.name}</p>
          <p className="text-sm text-zinc-500">{payload.location.formattedAddress}</p>
        </Section>
      )}

      <Link
        href="/roof-preview"
        className="flex items-center justify-between rounded-xl border border-violet-200 bg-violet-50/60 p-4 text-sm text-violet-900 transition-colors hover:bg-violet-100/60"
      >
        <span>
          <span className="font-semibold">Roof preview</span> — generate an AI roof
          visualization and attach it to this job
        </span>
        <span aria-hidden>→</span>
      </Link>

      <Section
        title="Materials"
        description="Quantity, optional unit override, and note per line."
      >
        <ul className="space-y-3">
          {payload.materials.map((m) => (
            <li key={m.id} className="rounded-lg border border-zinc-200 p-3">
              <div className="flex items-baseline justify-between">
                <span className="font-medium text-zinc-900">{m.name}</span>
                <span className="text-xs text-zinc-400">Default: {m.unit ?? "—"}</span>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <Field label="Qty">
                  <Input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={matQty[m.id] ?? ""}
                    onChange={(e) => setMatQty((prev) => ({ ...prev, [m.id]: e.target.value }))}
                  />
                </Field>
                <Field label="Unit override">
                  <Input
                    placeholder="e.g. bundles"
                    value={matUnit[m.id] ?? ""}
                    onChange={(e) => setMatUnit((prev) => ({ ...prev, [m.id]: e.target.value }))}
                  />
                </Field>
                <Field label="Note">
                  <Input
                    value={matNote[m.id] ?? ""}
                    onChange={(e) => setMatNote((prev) => ({ ...prev, [m.id]: e.target.value }))}
                  />
                </Field>
              </div>
            </li>
          ))}
        </ul>
        <Button className="mt-3" variant="secondary" size="sm" onClick={saveMaterials} disabled={saving}>
          Save materials
        </Button>

        <div className="mt-6 border-t border-zinc-200 pt-4">
          <h3 className="text-sm font-semibold text-zinc-700">New catalog item</h3>
          <p className="mt-0.5 text-xs text-zinc-500">Add a material to the organization catalog.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Input placeholder="Name *" value={newMatName} onChange={(e) => setNewMatName(e.target.value)} />
            <Input placeholder="SKU" value={newMatSku} onChange={(e) => setNewMatSku(e.target.value)} />
            <Input placeholder="Default unit" value={newMatUnit} onChange={(e) => setNewMatUnit(e.target.value)} />
          </div>
          <Button
            className="mt-3"
            size="sm"
            disabled={addingMat || !newMatName.trim()}
            onClick={() => void createNewCatalogMaterial()}
          >
            Create material
          </Button>
        </div>
      </Section>

      <Section title="Employees on job">
        <ul className="space-y-1">
          {payload.employees.map((e) => (
            <li key={e.id}>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300"
                  checked={selectedEmployees.includes(e.id)}
                  onChange={(ev) => {
                    if (ev.target.checked) {
                      setSelectedEmployees([...selectedEmployees, e.id]);
                    } else {
                      setSelectedEmployees(selectedEmployees.filter((x) => x !== e.id));
                    }
                  }}
                />
                {e.name}
              </label>
            </li>
          ))}
        </ul>
        <Button className="mt-3" variant="secondary" size="sm" onClick={saveEmployees} disabled={saving}>
          Save roster
        </Button>

        <h3 className="mt-6 text-sm font-semibold text-zinc-700">Hours logged</h3>
        <ul className="mt-3 space-y-3">
          {hoursRows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 p-3">
              <Field label="Name" className="min-w-[10rem] flex-1">
                <Input
                  value={row.employeeName}
                  onChange={(e) =>
                    setHoursRows((prev) =>
                      prev.map((r) => (r.id === row.id ? { ...r, employeeName: e.target.value } : r))
                    )
                  }
                />
              </Field>
              <Field label="From roster">
                <Select
                  value={row.employeeId ?? ""}
                  onChange={(e) => {
                    const emId = e.target.value || null;
                    const em = payload.employees.find((x) => x.id === emId);
                    setHoursRows((prev) =>
                      prev.map((r) =>
                        r.id === row.id
                          ? { ...r, employeeId: emId, employeeName: em?.name ?? r.employeeName }
                          : r
                      )
                    );
                  }}
                >
                  <option value="">—</option>
                  {payload.employees.map((em) => (
                    <option key={em.id} value={em.id}>
                      {em.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Hours" className="w-24">
                <Input
                  type="number"
                  step="0.25"
                  value={row.hours}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setHoursRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, hours: v } : r)));
                  }}
                />
              </Field>
              <button
                type="button"
                className="pb-2 text-xs font-medium text-red-600 hover:text-red-700"
                onClick={() => setHoursRows((prev) => prev.filter((r) => r.id !== row.id))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-3 text-sm font-medium text-zinc-600 hover:text-zinc-900"
          onClick={() =>
            setHoursRows((prev) => [
              ...prev,
              { id: `new-${crypto.randomUUID()}`, employeeId: null, employeeName: "", hours: 0 },
            ])
          }
        >
          + Add hours line
        </button>
      </Section>

      <Section
        title="Photos"
        description="Upload reference shots. Saved Gemini roof previews appear here with an AI badge."
      >
        <input
          type="file"
          accept="image/*"
          className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const fd = new FormData();
            fd.set("file", f);
            fd.set("jobId", payload.job.id);
            const res = await fetch("/api/jobs/photos/upload", { method: "POST", body: fd });
            if (res.ok) {
              const data = (await res.json()) as { photo: (typeof photos)[0] };
              setPhotos((p) => [data.photo, ...p]);
              router.refresh();
            }
            e.target.value = "";
          }}
        />
        {photos.length > 0 && (
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {photos.map((p) => (
              <li key={p.id} className="rounded-lg border border-zinc-200 p-2">
                {p.isAiRoofPreview && (
                  <p className="mb-1 rounded bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-900">
                    Roof preview (Gemini)
                    {p.aiRoofPrompt && (
                      <span className="ml-1 font-normal text-violet-700">
                        — {p.aiRoofPrompt.slice(0, 80)}
                        {(p.aiRoofPrompt?.length ?? 0) > 80 ? "…" : ""}
                      </span>
                    )}
                  </p>
                )}
                <div className="relative aspect-video overflow-hidden rounded bg-zinc-100">
                  {p.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.url} alt="" className="h-full w-full object-contain" />
                  )}
                  <button
                    type="button"
                    aria-label="Delete photo"
                    className="absolute right-1 top-1 rounded bg-black/50 px-1.5 text-sm text-white hover:bg-black/70"
                    onClick={async () => {
                      await deleteJobPhoto(p.id);
                      setPhotos((prev) => prev.filter((x) => x.id !== p.id));
                    }}
                  >
                    ×
                  </button>
                </div>
                <Input
                  className="mt-2"
                  placeholder="Caption / note"
                  defaultValue={p.notes ?? ""}
                  onBlur={async (e) => {
                    await updatePhotoCaption(p.id, e.target.value);
                    setPhotos((prev) =>
                      prev.map((x) => (x.id === p.id ? { ...x, notes: e.target.value || null } : x))
                    );
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function statusLabel(s: JobStatus): string {
  const map: Record<JobStatus, string> = {
    draft: "Draft",
    submitted: "Submitted",
    approved: "Approved",
    scheduled: "Scheduled",
    inProgress: "In progress",
    onHold: "On hold",
    completed: "Completed",
    invoiced: "Invoiced",
    cancelled: "Cancelled",
  };
  return map[s];
}

function isoToLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isoToLocalDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
