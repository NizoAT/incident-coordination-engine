import AppShellLayout from "@/components/layout/app-shell";

export default function ChangesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShellLayout subtitle="M8 — registre causal + post-mortem">
      {children}
    </AppShellLayout>
  );
}
