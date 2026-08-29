import type { Severity } from "@/lib/incidents/types";
import { SEVERITY_LABELS } from "@/lib/incidents/labels";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES: Record<Severity, string> = {
  low: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  high: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        SEVERITY_STYLES[severity],
        className,
      )}
    >
      {SEVERITY_LABELS[severity]}
    </span>
  );
}
