import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminRole } from "@/lib/session";
import { getGeminiConfig } from "@/lib/settings";
import { listOrgUsers } from "@/lib/actions/admin";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdminGeminiSettings } from "@/components/AdminGeminiSettings";
import { AdminUsers } from "@/components/AdminUsers";

export default async function AdminPage() {
  const session = await auth();
  const role = session?.user?.role;
  const orgId = session?.user?.organizationId;
  const userId = session?.user?.id;
  if (!orgId || !userId || !isAdminRole(role)) {
    redirect("/jobs");
  }

  const [gemini, users] = await Promise.all([
    getGeminiConfig(orgId),
    listOrgUsers(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Admin" description="Organization settings and user management." />
      <AdminGeminiSettings
        model={gemini.model}
        keyConfigured={Boolean(gemini.apiKey)}
        source={gemini.source}
      />
      <AdminUsers users={users} currentUserId={userId} />
    </div>
  );
}
