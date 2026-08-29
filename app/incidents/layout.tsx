import AppShellLayout from "@/components/layout/app-shell";

export default function IncidentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShellLayout subtitle="M15 — Observability">
      {children}
    </AppShellLayout>
  );
}

