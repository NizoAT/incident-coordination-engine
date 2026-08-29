import type { IncidentStatus, Severity } from "@/lib/incidents/types";

export type SlaStatus = "ok" | "warning" | "breached";

/** Dernière fraction de la fenêtre SLA affichée en warning (ex. 0.25 = 25 %). */
export const SLA_WARNING_TAIL_RATIO = 0.25;

export function calculateSlaDeadline(
  startedAt: Date,
  durationMinutes: number,
): Date {
  return new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
}

export function calculateWarningAt(
  deadline: Date,
  durationMinutes: number,
  warningTailRatio = SLA_WARNING_TAIL_RATIO,
): Date {
  const warningLeadMs = durationMinutes * 60 * 1000 * warningTailRatio;
  return new Date(deadline.getTime() - warningLeadMs);
}

/**
 * Statut affiché : combine l'état persisté et le temps courant
 * (warning dynamique avant que le scheduler ne marque breached).
 */
export function computeDisplaySlaStatus(
  storedStatus: SlaStatus,
  deadline: Date | null,
  durationMinutes: number | null,
  now: Date,
): SlaStatus {
  if (!deadline) {
    return "ok";
  }

  if (storedStatus === "breached") {
    return "breached";
  }

  if (now.getTime() >= deadline.getTime()) {
    return "breached";
  }

  if (durationMinutes != null) {
    const warningAt = calculateWarningAt(deadline, durationMinutes);
    if (now.getTime() >= warningAt.getTime()) {
      return "warning";
    }
  }

  return "ok";
}

export function formatRemainingMs(deadline: Date, now: Date): number {
  return Math.max(0, deadline.getTime() - now.getTime());
}

/** Breach SLA uniquement tant que l'incident n'a pas été pris en charge. */
export function isEligibleForSlaBreach(status: IncidentStatus): boolean {
  return status === "open";
}

export function isSeverity(value: string): value is Severity {
  return (
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "critical"
  );
}

export class SlaPolicyNotFoundError extends Error {
  constructor(public readonly severity: Severity) {
    super(`Aucune SlaPolicy active pour la sévérité ${severity}`);
    this.name = "SlaPolicyNotFoundError";
  }
}
