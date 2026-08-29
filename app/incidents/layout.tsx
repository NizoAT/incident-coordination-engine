import AppShellLayout from "@/components/layout/app-shell";

export default function IncidentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShellLayout subtitle="M16: CD GHCR">
      {children}
    </AppShellLayout>
  );
}

