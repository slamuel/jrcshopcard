"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function oid() {
  const s = await auth();
  const id = s?.user?.organizationId;
  if (!id) throw new Error("Unauthorized");
  return id;
}

export async function createCatalogMaterial(input: {
  name: string;
  sku?: string;
  unit?: string;
}) {
  const org = await oid();
  const m = await prisma.material.create({
    data: {
      organizationId: org,
      name: input.name.trim(),
      sku: input.sku?.trim() || undefined,
      unit: input.unit?.trim() || undefined,
      isActive: true,
    },
  });
  revalidatePath("/jobs");
  return m;
}
