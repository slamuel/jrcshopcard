import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateRoofVisualization } from "@/lib/gemini-roof-visualization";
import { getGeminiConfig } from "@/lib/settings";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const maxDuration = 120;

export async function POST(
  req: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  const session = await auth();
  const orgId = session?.user?.organizationId;
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await context.params;
  const job = await prisma.job.findFirst({
    where: { id: jobId, organizationId: orgId },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const form = await req.formData();
  const prompt = (form.get("prompt") as string | null) || "";
  const file = form.get("image") as File | null;
  const sourcePhotoId = (form.get("sourcePhotoId") as string | null) || null;

  let mime = "image/jpeg";
  let base64: string;

  if (file && file.size > 0) {
    const buf = Buffer.from(await file.arrayBuffer());
    mime = file.type || "image/jpeg";
    base64 = buf.toString("base64");
  } else if (sourcePhotoId) {
    const photo = await prisma.photo.findFirst({
      where: { id: sourcePhotoId, jobId, organizationId: orgId },
    });
    if (!photo?.url) {
      return NextResponse.json({ error: "Source photo not found or has no URL" }, { status: 400 });
    }
    const imgRes = await fetch(photo.url);
    if (!imgRes.ok) {
      return NextResponse.json({ error: "Could not load source image" }, { status: 400 });
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());
    mime = imgRes.headers.get("content-type") || "image/jpeg";
    base64 = buf.toString("base64");
  } else {
    return NextResponse.json(
      { error: "Provide an image file or sourcePhotoId" },
      { status: 400 }
    );
  }

  const { apiKey, model } = await getGeminiConfig(orgId);
  const result = await generateRoofVisualization({
    imageBase64: base64,
    imageMimeType: mime,
    userPrompt: prompt,
    apiKey,
    model,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const outMime = result.mimeType || "image/png";
  const ext = outMime.includes("png") ? "png" : "jpg";
  const outBuf = Buffer.from(result.imageBase64, "base64");
  const photoId = crypto.randomUUID();
  const fileName = `roof-ai-${photoId}.${ext}`;

  let url: string | null = null;
  let storageKey: string | null = null;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`jobs/${orgId}/roof-ai/${fileName}`, outBuf, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: outMime,
    });
    url = blob.url;
    storageKey = blob.pathname;
  } else {
    const dir = join(process.cwd(), "public", "uploads", "jobs", orgId, "roof-ai");
    await mkdir(dir, { recursive: true });
    const path = join(dir, fileName);
    await writeFile(path, outBuf);
    storageKey = `uploads/jobs/${orgId}/roof-ai/${fileName}`;
    url = `/${storageKey}`;
  }

  const photo = await prisma.photo.create({
    data: {
      id: photoId,
      organizationId: orgId,
      jobId,
      fileName,
      url,
      storageKey,
      notes: result.modelText ?? "Roof visualization (Gemini)",
      caption: "Roof preview (AI)",
      isAiRoofPreview: true,
      aiRoofPrompt: prompt || null,
    },
  });

  return NextResponse.json({
    photo,
    modelText: result.modelText,
  });
}
