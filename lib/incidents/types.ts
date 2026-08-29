export type Severity = "low" | "medium" | "high" | "critical";

export type IncidentStatus =
  | "open"
  | "acknowledged"
  | "investigating"
  | "resolved";

export type SlaStatus = "ok" | "warning" | "breached";

export type IncidentEventType =
  | "IncidentCreated"
  | "SeverityChanged"
  | "StatusChanged"
  | "IncidentAssigned"
  | "SlaStarted"
  | "SlaBreached"
  | "EscalationTriggered"
  | "ChangeLinked"
  | "DeploymentDetected";

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  version: number;
  assigneeId: string | null;
  createdById: string | null;
  assigneeEmail: string | null;
  createdByEmail: string | null;
  slaDeadline: string | null;
  slaStatus: SlaStatus;
  slaCycleId: string | null;
  slaDurationMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentEvent {
  id: string;
  incidentId: string;
  type: IncidentEventType;
  actorId: string | null;
  timestamp: string;
  metadata: Record<string, unknown>;
  sourceType: string | null;
  sourceId: string | null;
}

export const SEVERITIES: readonly Severity[] = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export const INCIDENT_STATUSES: readonly IncidentStatus[] = [
  "open",
  "acknowledged",
  "investigating",
  "resolved",
] as const;

export const INCIDENT_EVENT_TYPES: readonly IncidentEventType[] = [
  "IncidentCreated",
  "SeverityChanged",
  "StatusChanged",
  "IncidentAssigned",
  "SlaStarted",
  "SlaBreached",
  "EscalationTriggered",
  "ChangeLinked",
  "DeploymentDetected",
] as const;

export const SLA_STATUSES: readonly SlaStatus[] = [
  "ok",
  "warning",
  "breached",
] as const;
