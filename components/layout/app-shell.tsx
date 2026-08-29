import Link from "next/link";

import { logoutFormAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";

const ROLE_LABELS = {
  lead: "Lead",
  responder: "Responder",
} as const;

export default async function AppShellLayout({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle: string;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/incidents"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Incident Coordination Engine
            </Link>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
            <nav className="mt-2 flex gap-4 text-sm">
              <Link href="/incidents" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                Incidents
              </Link>
              <Link href="/changes" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                Changements
              </Link>
            </nav>
          </div>
          {user ? (
            <div className="flex items-center gap-3 text-right">
              <div className="hidden text-xs text-zinc-600 sm:block dark:text-zinc-400">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{user.email}</p>
                <p>{ROLE_LABELS[user.role]}</p>
              </div>
              <form action={logoutFormAction}>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                >
                  Déconnexion
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
