import { auth } from "@/auth";

export async function requireOrgId(): Promise<string> {
  const session = await auth();
  const orgId = session?.user?.organizationId;
  if (!orgId) {
    throw new Error("No organization context");
  }
  return orgId;
}
