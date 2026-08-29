import type { IncidentStatus } from "./types";
import { INCIDENT_STATUSES, SEVERITIES } from "./types";
import type { Severity } from "./types";

const ALLOWED_TRANSITIONS: Record<
  IncidentStatus,
  readonly IncidentStatus[]
> = {
  open: ["acknowledged"],
  acknowledged: ["investigating"],
  investigating: ["resolved"],
  resolved: [],
};

export function canTransition(
  from: IncidentStatus,
  to: IncidentStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function nextStatus(from: IncidentStatus): IncidentStatus | null {
  return ALLOWED_TRANSITIONS[from][0] ?? null;
}

export function canChangeSeverity(status: IncidentStatus): boolean {
  return status !== "resolved";
}

export function isSeverity(value: string): value is Severity {
  return (SEVERITIES as readonly string[]).includes(value);
}

export function isIncidentStatus(value: string): value is IncidentStatus {
  return (INCIDENT_STATUSES as readonly string[]).includes(value);
}

export class TransitionError extends Error {
  constructor(
    public readonly from: IncidentStatus,
    public readonly to: IncidentStatus,
  ) {
    super(`Transition invalide : ${from} → ${to}`);
    this.name = "TransitionError";
  }
}

export class SeverityChangeError extends Error {
  constructor(public readonly status: IncidentStatus) {
    super(`Impossible de modifier la sévérité lorsque le statut est ${status}`);
    this.name = "SeverityChangeError";
  }
}

export function assertTransition(
  from: IncidentStatus,
  to: IncidentStatus,
): void {
  if (!canTransition(from, to)) {
    throw new TransitionError(from, to);
  }
}

export function assertSeverityChange(status: IncidentStatus): void {
  if (!canChangeSeverity(status)) {
    throw new SeverityChangeError(status);
  }
}
