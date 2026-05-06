import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(req: Request) {
  const session = await auth();
  const orgId = session?.user?.organizationId;
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const jobId = form.get("jobId") as string | null;
  if (!file || !jobId) {
    return NextResponse.json({ error: "file and jobId required" }, { status: 400 });
  }

  const job = await prisma.job.findFirst({ where: { id: jobId, organizationId: orgId } });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const ext = file.type.includes("png") ? "png" : "jpg";
  const photoId = crypto.randomUUID();
  const fileName = `${photoId}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  let url: string | null = null;
  let storageKey: string | null = null;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`jobs/${orgId}/${fileName}`, buf, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: file.type || "image/jpeg",
    });
    url = blob.url;
    storageKey = blob.pathname;
  } else {
    const dir = join(process.cwd(), "public", "uploads", "jobs", orgId);
    await mkdir(dir, { recursive: true });
    const path = join(dir, fileName);
    await writeFile(path, buf);
    storageKey = `uploads/jobs/${orgId}/${fileName}`;
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
    },
  });

  return NextResponse.json({ photo });
}
