import type { IncidentStatus } from "@/lib/incidents/types";
import { STATUS_LABELS } from "@/lib/incidents/labels";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<IncidentStatus, string> = {
  open: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  acknowledged:
    "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  investigating:
    "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

export function StatusBadge({
  status,
  className,
}: {
  status: IncidentStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
