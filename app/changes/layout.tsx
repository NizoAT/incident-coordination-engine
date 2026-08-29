import AppShellLayout from "@/components/layout/app-shell";

export default function ChangesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShellLayout subtitle="M13 — lint test build CI">
      {children}
    </AppShellLayout>
  );
}
