import Link from "next/link";
import { signOutAction } from "@/lib/actions/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
          <Link href="/jobs" className="text-lg font-semibold leading-tight">
            JRC Shop Card
          </Link>
          <nav className="-mx-1 flex flex-wrap items-center gap-x-4 gap-y-2 overflow-x-auto pb-1 text-sm sm:mx-0 sm:justify-end sm:pb-0 sm:text-sm">
            <Link className="min-h-9 shrink-0 touch-manipulation text-zinc-600 active:text-zinc-900 sm:hover:text-zinc-900" href="/jobs">
              Jobs
            </Link>
            <Link
              className="min-h-9 shrink-0 touch-manipulation text-zinc-600 active:text-zinc-900 sm:hover:text-zinc-900"
              href="/customers"
            >
              Customers
            </Link>
            <Link
              className="min-h-9 shrink-0 touch-manipulation text-zinc-600 active:text-zinc-900 sm:hover:text-zinc-900"
              href="/employees"
            >
              Employees
            </Link>
            <Link
              className="min-h-9 shrink-0 touch-manipulation text-zinc-600 active:text-zinc-900 sm:hover:text-zinc-900"
              href="/reports"
            >
              Reports
            </Link>
            <form action={signOutAction} className="shrink-0">
              <button
                type="submit"
                className="min-h-9 touch-manipulation text-left text-zinc-500 active:text-zinc-800 sm:hover:text-zinc-800"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-3 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-6">
        {children}
      </main>
    </div>
  );
}
