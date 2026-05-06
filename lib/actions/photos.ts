"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function updatePhotoCaption(photoId: string, notes: string | null) {
  const s = await auth();
  const org = s?.user?.organizationId;
  if (!org) throw new Error("Unauthorized");
  const p = await prisma.photo.findFirst({ where: { id: photoId, organizationId: org } });
  if (!p) throw new Error("Not found");
  await prisma.photo.update({
    where: { id: photoId },
    data: { notes: notes?.trim() || null, caption: notes?.trim() || null },
  });
  revalidatePath(`/jobs/${p.jobId}`);
}

export async function deleteJobPhoto(photoId: string) {
  const session = await auth();
  const orgId = session?.user?.organizationId;
  if (!orgId) throw new Error("Unauthorized");

  const photo = await prisma.photo.findFirst({
    where: { id: photoId, organizationId: orgId },
  });
  if (!photo) throw new Error("Not found");

  await prisma.photo.delete({ where: { id: photoId } });

  if (photo.storageKey?.startsWith("uploads/")) {
    const { unlink } = await import("fs/promises");
    const { join } = await import("path");
    try {
      await unlink(join(process.cwd(), "public", photo.storageKey));
    } catch {
      /* ignore */
    }
  }

  revalidatePath(`/jobs/${photo.jobId}`);
}
