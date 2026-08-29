import type { IncidentStatus } from "@/lib/incidents/types";

export function buildIdempotencyKey(
  incidentId: string,
  policyId: string,
  escalationWindowId: string,
): string {
  return `${incidentId}:${policyId}:${escalationWindowId}`;
}

/** Invariant M5 : escalade uniquement si l'incident est encore ouvert (pas ack). */
export function isEligibleForEscalation(status: IncidentStatus): boolean {
  return status === "open";
}
