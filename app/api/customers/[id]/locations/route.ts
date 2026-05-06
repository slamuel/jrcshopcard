import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const org = session?.user?.organizationId;
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const c = await prisma.customer.findFirst({ where: { id, organizationId: org } });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const locations = await prisma.location.findMany({
    where: { customerId: id, organizationId: org },
    select: { id: true, formattedAddress: true },
  });

  return NextResponse.json({ locations });
}
