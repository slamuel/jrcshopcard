"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RoofVisualizationPanel({
  jobId,
  existingPhotos,
  geminiConfigured,
  onGenerated,
}: {
  jobId: string;
  existingPhotos: { id: string; fileName: string }[];
  geminiConfigured: boolean;
  onGenerated?: (photo: {
    id: string;
    url: string | null;
    fileName: string;
    notes: string | null;
    isAiRoofPreview?: boolean;
    aiRoofPrompt?: string | null;
  }) => void;
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(
    "Replace the roof with architectural asphalt shingles, charcoal gray, dimensional profile. Keep everything else the same."
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [usePhotoId, setUsePhotoId] = useState("");

  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-violet-900">Roof preview (Gemini)</h2>
      <p className="mt-1 text-xs text-violet-800/90">
        Upload a house photo and describe the new roof. This uses Google Gemini image generation — the
        same workflow you may have prototyped outside the App Store build; there is no Gemini code in
        the current Xcode target.
      </p>
      {!geminiConfigured && (
        <p className="mt-2 rounded bg-amber-100 px-2 py-1 text-xs text-amber-900">
          Set <code className="rounded bg-white px-1">GEMINI_API_KEY</code> in the server environment
          (and optionally <code className="rounded bg-white px-1">GEMINI_IMAGE_MODEL</code>) to enable.
        </p>
      )}
      <div className="mt-3 space-y-2">
        <label className="block text-xs font-medium text-zinc-700">
          Reference image
          <input
            type="file"
            accept="image/*"
            disabled={!geminiConfigured || busy}
            className="mt-1 block w-full text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {existingPhotos.length > 0 && (
          <label className="block text-xs text-zinc-600">
            Or use an existing job photo
            <select
              className="mt-1 block w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm"
              value={usePhotoId}
              onChange={(e) => {
                setUsePhotoId(e.target.value);
                if (e.target.value) setFile(null);
              }}
              disabled={!geminiConfigured || busy}
            >
              <option value="">— none (use upload above)</option>
              {existingPhotos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fileName}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block text-xs text-zinc-700">
          Roof style instructions
          <textarea
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-2 text-base sm:text-sm"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={!geminiConfigured || busy}
          />
        </label>
        <button
          type="button"
          disabled={
            !geminiConfigured || busy || (!file && !usePhotoId)
          }
          className="min-h-11 w-full touch-manipulation rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-medium text-white active:bg-violet-800 disabled:opacity-40 sm:w-auto sm:py-2"
          onClick={async () => {
            setErr(null);
            setBusy(true);
            try {
              const fd = new FormData();
              fd.set("prompt", prompt);
              if (file) fd.set("image", file);
              if (usePhotoId) fd.set("sourcePhotoId", usePhotoId);
              const res = await fetch(`/api/jobs/${jobId}/roof-visualization`, {
                method: "POST",
                body: fd,
              });
              const data = (await res.json()) as {
                error?: string;
                photo?: {
                  id: string;
                  url: string | null;
                  fileName: string;
                  notes: string | null;
                  isAiRoofPreview?: boolean;
                  aiRoofPrompt?: string | null;
                };
              };
              if (!res.ok) {
                setErr(data.error ?? "Request failed");
                return;
              }
              if (data.photo) onGenerated?.(data.photo);
              setFile(null);
              setUsePhotoId("");
              router.refresh();
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Generating…" : "Generate roof preview"}
        </button>
        {err && <p className="text-sm text-red-600">{err}</p>}
      </div>
    </section>
  );
}
