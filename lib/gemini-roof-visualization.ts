/**
 * Gemini image editing for roof visualization.
 * Calls Gemini models that support image output (see GEMINI_IMAGE_MODEL in env).
 */

const DEFAULT_SYSTEM = `You are an expert architectural visualization assistant.
The attached image shows a building. Modify ONLY the roof according to the user's description below.
Keep everything else unchanged: walls, windows, siding, landscaping, vehicles, sky, shadows, and camera angle must remain consistent with the original photo. Photorealistic quality.
If the scene has no visible roof, infer the roof area and apply the style where appropriate.

User's roof request:`;

export type RoofVizResult =
  | { ok: true; imageBase64: string; mimeType: string; modelText?: string }
  | { ok: false; error: string };

export async function generateRoofVisualization(input: {
  imageBase64: string;
  imageMimeType: string;
  userPrompt: string;
}): Promise<RoofVizResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY is not configured." };
  }

  const model =
    process.env.GEMINI_IMAGE_MODEL ||
    "gemini-2.0-flash-preview-image-generation";

  const fullText = `${DEFAULT_SYSTEM}\n\n${input.userPrompt.trim() || "Replace with modern charcoal architectural asphalt shingles."}`;

  const body = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: input.imageMimeType,
              data: input.imageBase64,
            },
          },
          { text: fullText },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      temperature: 0.4,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error calling Gemini." };
  }

  const raw = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    const msg =
      (raw["error"] as { message?: string } | undefined)?.message ??
      JSON.stringify(raw).slice(0, 500);
    return { ok: false, error: `Gemini API: ${msg}` };
  }

  const candidates = raw["candidates"] as
    | { content?: { parts?: unknown[] } }[]
    | undefined;
  const parts = candidates?.[0]?.content?.parts;
  if (!parts?.length) {
    return { ok: false, error: "Gemini returned no candidates. Try another image or model." };
  }

  let modelText = "";
  for (const p of parts) {
    const part = p as Record<string, unknown>;
    const text = part["text"] as string | undefined;
    if (text) modelText += text;

    const idRaw = part["inlineData"] ?? part["inline_data"];
    if (idRaw && typeof idRaw === "object") {
      const id = idRaw as Record<string, unknown>;
      const mime = (id.mimeType ?? id.mime_type) as string | undefined;
      const data = id.data as string | undefined;
      if (mime && data) {
        return {
          ok: true,
          imageBase64: data,
          mimeType: mime,
          modelText: modelText || undefined,
        };
      }
    }
  }

  return {
    ok: false,
    error:
      modelText ||
      "No image in response. This model may not support image output, or the request was blocked. Set GEMINI_IMAGE_MODEL (e.g. gemini-2.5-flash-image) in .env.",
  };
}
