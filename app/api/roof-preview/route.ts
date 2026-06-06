import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateRoofVisualization } from "@/lib/gemini-roof-visualization";

export const maxDuration = 120;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

/**
 * Job-agnostic roof visualization. Generates a preview from an uploaded image
 * and returns it inline WITHOUT persisting. To save against a job, the client
 * posts to /api/jobs/[jobId]/roof-visualization instead.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const prompt = (form.get("prompt") as string | null) || "";
  const file = form.get("image") as File | null;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "An image file is required" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 20 MB)" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, and HEIC images are allowed" },
      { status: 400 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const result = await generateRoofVisualization({
    imageBase64: buf.toString("base64"),
    imageMimeType: file.type || "image/jpeg",
    userPrompt: prompt,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    imageBase64: result.imageBase64,
    mimeType: result.mimeType || "image/png",
    modelText: result.modelText ?? null,
  });
}
