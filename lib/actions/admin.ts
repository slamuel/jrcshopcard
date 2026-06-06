"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { setOrgSetting, SETTING_KEYS } from "@/lib/settings";
import type { MembershipRole } from "@prisma/client";

const ROLES: MembershipRole[] = ["owner", "admin", "member"];

function assertRole(role: string): MembershipRole {
  if (!ROLES.includes(role as MembershipRole)) throw new Error("Invalid role");
  return role as MembershipRole;
}

// --- Gemini settings -------------------------------------------------------

export async function updateGeminiSettings(input: { model: string; apiKey?: string }) {
  const { orgId } = await requireAdmin();
  await setOrgSetting(orgId, SETTING_KEYS.geminiModel, input.model.trim() || null);
  // Only overwrite the key when a non-empty value is provided, so saving the
  // form without re-entering the key leaves the stored key intact.
  if (input.apiKey && input.apiKey.trim()) {
    await setOrgSetting(orgId, SETTING_KEYS.geminiApiKey, input.apiKey.trim());
  }
  revalidatePath("/admin");
  revalidatePath("/roof-preview");
}

export async function clearGeminiApiKey() {
  const { orgId } = await requireAdmin();
  await setOrgSetting(orgId, SETTING_KEYS.geminiApiKey, null);
  revalidatePath("/admin");
  revalidatePath("/roof-preview");
}

// --- User management -------------------------------------------------------

export async function listOrgUsers() {
  const { orgId } = await requireAdmin();
  const memberships = await prisma.membership.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  return memberships.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
  }));
}

export async function createOrgUser(input: {
  email: string;
  name?: string;
  password: string;
  role: string;
}) {
  const { orgId } = await requireAdmin();
  const email = input.email.trim().toLowerCase();
  const role = assertRole(input.role);
  if (!email || !input.password || input.password.length < 8) {
    throw new Error("Email and a password of at least 8 characters are required");
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("A user with that email already exists");

  const passwordHash = await bcrypt.hash(input.password, 10);
  await prisma.user.create({
    data: {
      email,
      name: input.name?.trim() || null,
      passwordHash,
      memberships: { create: { organizationId: orgId, role } },
    },
  });
  revalidatePath("/admin");
}

export async function updateUserRole(userId: string, role: string) {
  const { orgId, userId: actorId } = await requireAdmin();
  const newRole = assertRole(role);
  if (userId === actorId) {
    throw new Error("You can't change your own role (ask another admin)");
  }
  const membership = await prisma.membership.findFirst({
    where: { userId, organizationId: orgId },
  });
  if (!membership) throw new Error("User not found in this organization");

  // Never leave the org without an owner.
  if (membership.role === "owner" && newRole !== "owner") {
    const owners = await prisma.membership.count({
      where: { organizationId: orgId, role: "owner" },
    });
    if (owners <= 1) throw new Error("Can't remove the last owner");
  }
  await prisma.membership.update({
    where: { id: membership.id },
    data: { role: newRole },
  });
  revalidatePath("/admin");
}

export async function resetUserPassword(userId: string, password: string) {
  const { orgId } = await requireAdmin();
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  const membership = await prisma.membership.findFirst({
    where: { userId, organizationId: orgId },
  });
  if (!membership) throw new Error("User not found in this organization");
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  revalidatePath("/admin");
}
