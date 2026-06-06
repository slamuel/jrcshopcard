import { auth } from "@/auth";

export async function requireOrgId(): Promise<string> {
  const session = await auth();
  const orgId = session?.user?.organizationId;
  if (!orgId) {
    throw new Error("No organization context");
  }
  return orgId;
}

export function isAdminRole(role: string | undefined): boolean {
  return role === "owner" || role === "admin";
}

/** Require an authenticated owner/admin. Throws otherwise. */
export async function requireAdmin(): Promise<{
  orgId: string;
  userId: string;
  role: string;
}> {
  const session = await auth();
  const orgId = session?.user?.organizationId;
  const userId = session?.user?.id;
  const role = session?.user?.role;
  if (!orgId || !userId) throw new Error("No organization context");
  if (!isAdminRole(role)) throw new Error("Forbidden: admin access required");
  return { orgId, userId, role: role as string };
}
