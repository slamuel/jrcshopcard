import { prisma } from "@/lib/prisma";

export const SETTING_KEYS = {
  geminiModel: "gemini_model",
  geminiApiKey: "gemini_api_key",
} as const;

export const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash-preview-image-generation";

/** All settings for an org as a key→value map (null values omitted). */
export async function getOrgSettings(orgId: string): Promise<Record<string, string>> {
  const rows = await prisma.appSetting.findMany({ where: { organizationId: orgId } });
  return Object.fromEntries(
    rows.filter((r) => r.value != null && r.value !== "").map((r) => [r.key, r.value as string])
  );
}

/**
 * Resolve the Gemini config for an org: DB settings take precedence, falling
 * back to server env vars, then the default model.
 */
export async function getGeminiConfig(
  orgId: string
): Promise<{ apiKey: string | undefined; model: string; source: "db" | "env" | "none" }> {
  const s = await getOrgSettings(orgId);
  const dbKey = s[SETTING_KEYS.geminiApiKey];
  const envKey = process.env.GEMINI_API_KEY;
  const apiKey = dbKey || envKey || undefined;
  const model =
    s[SETTING_KEYS.geminiModel] || process.env.GEMINI_IMAGE_MODEL || DEFAULT_GEMINI_MODEL;
  return {
    apiKey,
    model,
    source: dbKey ? "db" : envKey ? "env" : "none",
  };
}

/** Upsert a single org setting. */
export async function setOrgSetting(orgId: string, key: string, value: string | null) {
  await prisma.appSetting.upsert({
    where: { organizationId_key: { organizationId: orgId, key } },
    create: { organizationId: orgId, key, value: value || null },
    update: { value: value || null },
  });
}
