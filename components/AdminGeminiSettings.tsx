"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateGeminiSettings } from "@/lib/actions/admin";
import { Section } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function AdminGeminiSettings({
  model,
  keyConfigured,
  source,
}: {
  model: string;
  keyConfigured: boolean;
  source: "db" | "env" | "none";
}) {
  const router = useRouter();
  const [modelValue, setModelValue] = useState(model);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const sourceLabel =
    source === "db"
      ? "Stored in app settings"
      : source === "env"
        ? "Using the Vercel environment variable"
        : "Not configured";

  return (
    <Section
      title="Gemini (roof preview)"
      description="Update the image model when Google retires one, and rotate the API key."
    >
      <div className="space-y-4">
        <Field label="Image model" hint="e.g. gemini-2.5-flash-image">
          <Input value={modelValue} onChange={(e) => setModelValue(e.target.value)} />
        </Field>
        <Field
          label="API key"
          hint={
            keyConfigured
              ? `${sourceLabel}. Leave blank to keep the current key.`
              : "No key set yet — paste one to enable generation."
          }
        >
          <Input
            type="password"
            placeholder={keyConfigured ? "•••••••• (unchanged)" : "Paste Gemini API key"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="off"
          />
        </Field>
        <div className="flex items-center gap-3">
          <Button
            disabled={saving || !modelValue.trim()}
            onClick={async () => {
              setSaving(true);
              setMsg(null);
              setErr(null);
              try {
                await updateGeminiSettings({ model: modelValue, apiKey });
                setApiKey("");
                setMsg("Saved.");
                router.refresh();
              } catch (e) {
                setErr(e instanceof Error ? e.message : "Could not save");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving…" : "Save Gemini settings"}
          </Button>
          {msg && <span className="text-sm text-emerald-700">{msg}</span>}
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>
      </div>
    </Section>
  );
}
