"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function oid() {
  const session = await auth();
  const id = session?.user?.organizationId;
  if (!id) throw new Error("Unauthorized");
  return id;
}

export async function listCustomers() {
  const org = await oid();
  return prisma.customer.findMany({
    where: { organizationId: org },
    orderBy: { name: "asc" },
  });
}

export async function getCustomerDetail(customerId: string) {
  const org = await oid();
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId: org },
  });
  if (!customer) return null;
  const [locations, jobs] = await Promise.all([
    prisma.location.findMany({ where: { customerId, organizationId: org } }),
    prisma.job.findMany({ where: { customerId, organizationId: org }, orderBy: { createdAt: "desc" } }),
  ]);
  return { customer, locations, jobs };
}

export async function updateCustomer(
  customerId: string,
  data: {
    name: string;
    primaryContactName?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
    address?: string | null;
  }
) {
  const org = await oid();
  const existing = await prisma.customer.findFirst({
    where: { id: customerId, organizationId: org },
  });
  if (!existing) throw new Error("Not found");
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      name: data.name,
      primaryContactName: data.primaryContactName,
      phoneNumber: data.phoneNumber,
      email: data.email,
      address: data.address,
    },
  });
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
}
