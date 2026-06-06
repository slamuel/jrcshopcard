"use client";

import { useState } from "react";
import { Section } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Textarea, Select } from "@/components/ui/Input";
import { downscaleToFile } from "@/lib/downscale-image";

const DEFAULT_PROMPT =
  "Replace the roof with architectural asphalt shingles, charcoal gray, dimensional profile. Keep everything else the same.";

type JobOption = { id: string; jobNumber: string; title: string };

export function RoofPreviewModule({
  geminiConfigured,
  jobs,
}: {
  geminiConfigured: boolean;
  jobs: JobOption[];
}) {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<{ dataUrl: string; ext: string } | null>(null);
  const [modelNote, setModelNote] = useState<string | null>(null);
  const [attachJobId, setAttachJobId] = useState("");

  const disabled = !geminiConfigured || busy;

  async function generate() {
    if (!file) return;
    setErr(null);
    setNotice(null);
    setResult(null);
    setModelNote(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("prompt", prompt);
      fd.set("image", await downscaleToFile(file));
      const res = await fetch("/api/roof-preview", { method: "POST", body: fd });
      const data = (await res.json()) as {
        error?: string;
        imageBase64?: string;
        mimeType?: string;
      };
      if (!res.ok || !data.imageBase64) {
        // 502 = Gemini responded but returned no image (e.g. a text-only model).
        // Surface that in the Result panel rather than as a hard error.
        if (res.status === 502 && data.error) {
          setModelNote(data.error);
        } else {
          setErr(data.error ?? "Request failed");
        }
        return;
      }
      const mime = data.mimeType || "image/png";
      setResult({
        dataUrl: `data:${mime};base64,${data.imageBase64}`,
        ext: mime.includes("png") ? "png" : "jpg",
      });
    } catch {
      setErr("Network error generating preview");
    } finally {
      setBusy(false);
    }
  }

  async function saveToJob() {
    if (!file || !attachJobId) return;
    setErr(null);
    setNotice(null);
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("prompt", prompt);
      fd.set("image", await downscaleToFile(file));
      const res = await fetch(`/api/jobs/${attachJobId}/roof-visualization`, {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "Could not save to job");
        return;
      }
      const job = jobs.find((j) => j.id === attachJobId);
      setNotice(`Saved to job #${job?.jobNumber ?? attachJobId} as a photo.`);
    } catch {
      setErr("Network error saving to job");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Section
        title="Source & instructions"
        description="Upload a house photo and describe the new roof. Powered by Google Gemini image generation."
      >
        {!geminiConfigured && (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Set <code className="rounded bg-white px-1">GEMINI_API_KEY</code> in the
            server environment (and optionally{" "}
            <code className="rounded bg-white px-1">GEMINI_IMAGE_MODEL</code>) to
            enable generation.
          </p>
        )}

        <div className="space-y-4">
          <Field label="Reference image">
            <input
              type="file"
              accept="image/*"
              disabled={disabled}
              className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800 disabled:opacity-50"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Field>

          <Field label="Roof style instructions">
            <Textarea
              rows={4}
              value={prompt}
              disabled={disabled}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </Field>

          <Button onClick={generate} disabled={disabled || !file}>
            {busy ? "Generating…" : "Generate preview"}
          </Button>

          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
      </Section>

      <Section title="Result">
        {result ? (
          <div className="space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.dataUrl}
              alt="Generated roof preview"
              className="w-full rounded-lg border border-zinc-200"
            />
            <div className="flex flex-wrap items-center gap-3">
              <a href={result.dataUrl} download={`roof-preview.${result.ext}`}>
                <Button variant="secondary">Download</Button>
              </a>
            </div>

            {jobs.length > 0 && (
              <div className="space-y-2 border-t border-zinc-200 pt-4">
                <Field
                  label="Attach to a job (optional)"
                  hint="Re-runs generation and saves the result as a photo on the selected job."
                >
                  <Select
                    value={attachJobId}
                    disabled={saving}
                    onChange={(e) => setAttachJobId(e.target.value)}
                  >
                    <option value="">— none —</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        #{j.jobNumber} — {j.title}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button
                  variant="secondary"
                  onClick={saveToJob}
                  disabled={saving || !attachJobId}
                >
                  {saving ? "Saving…" : "Save to job"}
                </Button>
                {notice && <p className="text-sm text-emerald-700">{notice}</p>}
              </div>
            )}
          </div>
        ) : modelNote ? (
          <div className="space-y-2">
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
              The model returned a description, not an image. Make sure the
              configured model supports image output (e.g.{" "}
              <code className="rounded bg-white px-1">gemini-2.5-flash-image</code>) in
              Admin → Gemini.
            </p>
            <p className="whitespace-pre-wrap text-sm text-zinc-600">{modelNote}</p>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            Your generated roof preview will appear here.
          </p>
        )}
      </Section>
    </div>
  );
}
