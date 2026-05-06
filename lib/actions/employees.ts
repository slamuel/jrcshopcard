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

export async function listEmployees() {
  const org = await oid();
  return prisma.employee.findMany({
    where: { organizationId: org, isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getEmployee(id: string) {
  const org = await oid();
  return prisma.employee.findFirst({ where: { id, organizationId: org } });
}

export async function upsertEmployee(data: {
  id?: string;
  name: string;
  phoneNumber?: string | null;
  email?: string | null;
  role?: string | null;
  isActive?: boolean;
}) {
  const org = await oid();
  if (data.id) {
    const ex = await prisma.employee.findFirst({ where: { id: data.id, organizationId: org } });
    if (!ex) throw new Error("Not found");
    await prisma.employee.update({
      where: { id: data.id },
      data: {
        name: data.name,
        phoneNumber: data.phoneNumber,
        email: data.email,
        role: data.role,
        isActive: data.isActive ?? true,
      },
    });
    revalidatePath("/employees");
    revalidatePath(`/employees/${data.id}`);
    revalidatePath("/jobs");
    return data.id;
  }
  const created = await prisma.employee.create({
    data: {
      organizationId: org,
      name: data.name,
      phoneNumber: data.phoneNumber,
      email: data.email,
      role: data.role,
      isActive: true,
    },
  });
  revalidatePath("/employees");
  return created.id;
}
