import { Sidebar } from "@/components/Sidebar";
import { auth } from "@/auth";
import { isAdminRole } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = isAdminRole(session?.user?.role);
  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar isAdmin={isAdmin} />
      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
