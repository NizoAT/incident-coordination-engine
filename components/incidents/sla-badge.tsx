import type { SlaStatus } from "@/lib/incidents/types";
import { SLA_STATUS_LABELS } from "@/lib/incidents/event-labels";

import { cn } from "@/lib/utils";

const STYLES: Record<SlaStatus, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  breached:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
};

export function SlaBadge({ status }: { status: SlaStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STYLES[status],
      )}
    >
      {SLA_STATUS_LABELS[status]}
    </span>
  );
}
