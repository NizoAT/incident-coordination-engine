"use client";

import { useEffect, useState } from "react";

import {
  computeDisplaySlaStatus,
  formatRemainingMs,
} from "@/domain/sla/deadline";
import type { SlaStatus } from "@/lib/incidents/types";

import { SlaBadge } from "./sla-badge";

function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  }

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export function SlaCountdown({
  deadline,
  storedStatus,
  durationMinutes,
  active,
}: {
  deadline: string;
  storedStatus: SlaStatus;
  durationMinutes: number | null;
  active: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!active || !deadline) {
    return (
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        SLA inactif (incident pris en charge ou résolu).
      </p>
    );
  }

  const deadlineDate = new Date(deadline);
  const displayStatus = computeDisplaySlaStatus(
    storedStatus,
    deadlineDate,
    durationMinutes,
    new Date(now),
  );
  const remainingMs = formatRemainingMs(deadlineDate, new Date(now));

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SlaBadge status={displayStatus} />
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Échéance : {deadlineDate.toLocaleString("fr-FR")}
        </span>
      </div>
      {displayStatus === "breached" ? (
        <p className="text-lg font-semibold text-red-700 dark:text-red-400">
          SLA dépassé
        </p>
      ) : (
        <p className="text-2xl font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
          {formatCountdown(remainingMs)}
        </p>
      )}
    </div>
  );
}
