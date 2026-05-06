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
import { RoofVisualizationPanel } from "@/components/RoofVisualizationPanel";

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

export function JobDetailForm({
  payload,
  geminiConfigured = false,
}: {
  payload: Payload;
  geminiConfigured?: boolean;
}) {
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
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold leading-tight sm:text-2xl">{title}</h1>
          <p className="mt-1 text-sm text-zinc-500">Job #{payload.job.jobNumber}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[12rem] sm:flex-row sm:flex-wrap sm:justify-end">
          <a
            href={`/api/jobs/${payload.job.id}/pdf`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-center text-sm font-medium shadow-sm hover:bg-zinc-50 active:bg-zinc-100"
          >
            PDF only
          </a>
          <a
            href={`/api/jobs/${payload.job.id}/export-bundle`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-900 bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white shadow-sm hover:bg-zinc-800 active:bg-zinc-950"
          >
            PDF + photos (ZIP)
          </a>
        </div>
      </div>

      {payload.customer && (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-500">Customer</h2>
          <p className="mt-1 font-medium">{payload.customer.name}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tel && (
              <a href={`tel:${tel.replace(/\s/g, "")}`} className="text-2xl text-blue-600" title="Call">
                📞
              </a>
            )}
            {tel && (
              <a href={`sms:${tel.replace(/\s/g, "")}`} className="text-2xl text-blue-600" title="Text">
                💬
              </a>
            )}
            {mail && (
              <a href={`mailto:${mail}`} className="text-2xl text-blue-600" title="Email">
                ✉️
              </a>
            )}
          </div>
        </section>
      )}

      <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-500">Details</h2>
        <label className="block text-xs text-zinc-600">Title</label>
        <input
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label className="block text-xs text-zinc-600">Status</label>
        <select
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as JobStatus)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label className="block text-xs text-zinc-600">Scheduled</label>
        <input
          type="datetime-local"
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
        />
        <label className="block text-xs text-zinc-600">Completed date</label>
        <input
          type="date"
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          value={completedDate}
          onChange={(e) => setCompletedDate(e.target.value)}
        />
        <label className="block text-xs text-zinc-600">Description</label>
        <textarea
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label className="block text-xs text-zinc-600">Internal notes</label>
        <textarea
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          rows={3}
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
        />
        <button
          type="button"
          disabled={saving}
          onClick={saveCore}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          Save details
        </button>
      </section>

      {payload.location && (
        <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <h2 className="text-sm font-semibold">Location</h2>
          <p className="mt-1">{payload.location.name}</p>
          <p className="text-sm text-zinc-600">{payload.location.formattedAddress}</p>
        </section>
      )}

      <RoofVisualizationPanel
        jobId={payload.job.id}
        geminiConfigured={geminiConfigured}
        existingPhotos={photos.map((p) => ({ id: p.id, fileName: p.fileName }))}
        onGenerated={(p) =>
          setPhotos((prev) => [
            {
              ...p,
              isAiRoofPreview: p.isAiRoofPreview ?? true,
              aiRoofPrompt: p.aiRoofPrompt ?? null,
            },
            ...prev,
          ])
        }
      />

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-500">Materials</h2>
        <p className="mb-2 text-xs text-zinc-500">
          Quantity, optional unit override, and note per line — matches iOS material picker.
        </p>
        <ul className="mt-2 space-y-3 text-sm">
          {payload.materials.map((m) => (
            <li key={m.id} className="rounded-lg border border-zinc-100 p-3">
              <div className="font-medium">{m.name}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="text-xs text-zinc-600">
                  Qty
                  <input
                    type="number"
                    step="any"
                    className="ml-1 w-24 rounded border border-zinc-300 px-2 py-1"
                    placeholder="0"
                    value={matQty[m.id] ?? ""}
                    onChange={(e) =>
                      setMatQty((prev) => ({ ...prev, [m.id]: e.target.value }))
                    }
                  />
                </label>
                <span className="text-zinc-400">Default: {m.unit ?? "—"}</span>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-zinc-600">
                  Unit override
                  <input
                    className="mt-0.5 w-full rounded border border-zinc-300 px-2 py-1"
                    placeholder="e.g. bundles"
                    value={matUnit[m.id] ?? ""}
                    onChange={(e) =>
                      setMatUnit((prev) => ({ ...prev, [m.id]: e.target.value }))
                    }
                  />
                </label>
                <label className="text-xs text-zinc-600">
                  Note
                  <input
                    className="mt-0.5 w-full rounded border border-zinc-300 px-2 py-1"
                    value={matNote[m.id] ?? ""}
                    onChange={(e) =>
                      setMatNote((prev) => ({ ...prev, [m.id]: e.target.value }))
                    }
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-3 rounded-lg bg-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-300"
          onClick={saveMaterials}
          disabled={saving}
        >
          Save materials
        </button>

        <div className="mt-6 border-t border-zinc-200 pt-4">
          <h3 className="text-sm font-semibold text-zinc-600">New catalog item</h3>
          <p className="text-xs text-zinc-500">Add a material to the org catalog (like iOS &quot;New Material&quot;).</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <input
              className="rounded border px-2 py-1 text-sm"
              placeholder="Name *"
              value={newMatName}
              onChange={(e) => setNewMatName(e.target.value)}
            />
            <input
              className="rounded border px-2 py-1 text-sm"
              placeholder="SKU"
              value={newMatSku}
              onChange={(e) => setNewMatSku(e.target.value)}
            />
            <input
              className="rounded border px-2 py-1 text-sm"
              placeholder="Default unit"
              value={newMatUnit}
              onChange={(e) => setNewMatUnit(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="mt-2 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
            disabled={addingMat || !newMatName.trim()}
            onClick={() => void createNewCatalogMaterial()}
          >
            Create material
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-500">Employees on job</h2>
        <ul className="mt-2 space-y-1">
          {payload.employees.map((e) => (
            <li key={e.id}>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
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
        <button
          type="button"
          className="mt-3 rounded-lg bg-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-300"
          onClick={saveEmployees}
          disabled={saving}
        >
          Save roster
        </button>

        <h3 className="mt-4 text-sm font-semibold text-zinc-500">Hours logged</h3>
        <ul className="mt-2 space-y-3">
          {hoursRows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-end gap-2 rounded border border-zinc-100 p-2 text-sm">
              <label className="min-w-[10rem]">
                <span className="text-xs text-zinc-500">Name</span>
                <input
                  className="mt-0.5 w-full rounded border px-2 py-1"
                  value={row.employeeName}
                  onChange={(e) =>
                    setHoursRows((prev) =>
                      prev.map((r) =>
                        r.id === row.id ? { ...r, employeeName: e.target.value } : r
                      )
                    )
                  }
                />
              </label>
              <label className="text-xs text-zinc-600">
                From roster
                <select
                  className="mt-0.5 block rounded border px-2 py-1"
                  value={row.employeeId ?? ""}
                  onChange={(e) => {
                    const emId = e.target.value || null;
                    const em = payload.employees.find((x) => x.id === emId);
                    setHoursRows((prev) =>
                      prev.map((r) =>
                        r.id === row.id
                          ? {
                              ...r,
                              employeeId: emId,
                              employeeName: em?.name ?? r.employeeName,
                            }
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
                </select>
              </label>
              <label>
                <span className="text-xs text-zinc-500">Hours</span>
                <input
                  type="number"
                  step="0.25"
                  className="mt-0.5 w-20 rounded border px-2 py-1"
                  value={row.hours}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setHoursRows((prev) =>
                      prev.map((r) => (r.id === row.id ? { ...r, hours: v } : r))
                    );
                  }}
                />
              </label>
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() =>
                  setHoursRows((prev) => prev.filter((r) => r.id !== row.id))
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-2 text-sm text-blue-600"
          onClick={() =>
            setHoursRows((prev) => [
              ...prev,
              {
                id: `new-${crypto.randomUUID()}`,
                employeeId: null,
                employeeName: "",
                hours: 0,
              },
            ])
          }
        >
          + Add hours line
        </button>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-500">Photos</h2>
        <p className="text-xs text-zinc-500">
          Upload reference shots. <strong>Gemini roof previews</strong> are saved here as images with an AI
          badge. (Requires <code className="text-[10px]">GEMINI_API_KEY</code> on the server.)
        </p>
        <input
          type="file"
          accept="image/*"
          className="mt-2 text-sm"
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
        <ul className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  className="absolute right-1 top-1 rounded bg-black/50 px-1 text-xs text-white"
                  onClick={async () => {
                    await deleteJobPhoto(p.id);
                    setPhotos((prev) => prev.filter((x) => x.id !== p.id));
                  }}
                >
                  ×
                </button>
              </div>
              <input
                className="mt-2 w-full rounded border px-2 py-1 text-xs"
                placeholder="Caption / note"
                defaultValue={p.notes ?? ""}
                onBlur={async (e) => {
                  await updatePhotoCaption(p.id, e.target.value);
                  setPhotos((prev) =>
                    prev.map((x) =>
                      x.id === p.id ? { ...x, notes: e.target.value || null } : x
                    )
                  );
                }}
              />
            </li>
          ))}
        </ul>
      </section>

      <Link href="/jobs" className="text-sm text-zinc-500 hover:text-zinc-800">
        ← Back to jobs
      </Link>
    </div>
  );
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
