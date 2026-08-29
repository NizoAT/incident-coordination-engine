import type { IncidentEventType, IncidentStatus, Severity, SlaStatus } from "./types";
import { SEVERITY_LABELS, STATUS_LABELS } from "./labels";

export const EVENT_TYPE_LABELS: Record<IncidentEventType, string> = {
  IncidentCreated: "Incident créé",
  SeverityChanged: "Sévérité modifiée",
  StatusChanged: "Statut modifié",
  IncidentAssigned: "Assignation modifiée",
  SlaStarted: "SLA démarré",
  SlaBreached: "SLA dépassé",
  EscalationTriggered: "Escalade déclenchée",
  ChangeLinked: "Changement lié",
  DeploymentDetected: "Déploiement enregistré",
};

export const SLA_STATUS_LABELS: Record<SlaStatus, string> = {
  ok: "Dans les temps",
  warning: "Échéance proche",
  breached: "SLA dépassé",
};

function labelSeverity(value: unknown): string {
  if (typeof value === "string" && value in SEVERITY_LABELS) {
    return SEVERITY_LABELS[value as Severity];
  }
  return String(value ?? ": ");
}

function labelStatus(value: unknown): string {
  if (typeof value === "string" && value in STATUS_LABELS) {
    return STATUS_LABELS[value as IncidentStatus];
  }
  return String(value ?? ": ");
}

function labelAssignee(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Non assigné";
  }
  return String(value);
}

function formatDeadline(value: unknown): string {
  if (typeof value !== "string") {
    return ": ";
  }
  return new Date(value).toLocaleString("fr-FR");
}

export function formatEventDescription(
  type: IncidentEventType,
  metadata: Record<string, unknown>,
): string {
  switch (type) {
    case "IncidentCreated": {
      const severity = labelSeverity(metadata.severity);
      const title =
        typeof metadata.title === "string" ? metadata.title : "Sans titre";
      return `${EVENT_TYPE_LABELS[type]}: « ${title} » (${severity})`;
    }
    case "SeverityChanged":
      return `${EVENT_TYPE_LABELS[type]} : ${labelSeverity(metadata.from)} → ${labelSeverity(metadata.to)}`;
    case "StatusChanged":
      return `${EVENT_TYPE_LABELS[type]} : ${labelStatus(metadata.from)} → ${labelStatus(metadata.to)}`;
    case "IncidentAssigned":
      return `${EVENT_TYPE_LABELS[type]} : ${labelAssignee(metadata.previousAssigneeId)} → ${labelAssignee(metadata.assigneeId)}`;
    case "SlaStarted":
      return `${EVENT_TYPE_LABELS[type]}: échéance ${formatDeadline(metadata.deadline)}`;
    case "SlaBreached":
      return `${EVENT_TYPE_LABELS[type]}: deadline ${formatDeadline(metadata.deadline)}`;
    case "EscalationTriggered":
      return `${EVENT_TYPE_LABELS[type]}: policy ${String(metadata.policyId ?? ": ")} → ${String(metadata.notifyRole ?? "lead")}`;
    case "ChangeLinked":
      return `${EVENT_TYPE_LABELS[type]}: « ${String(metadata.changeTitle ?? ": ")} »`;
    case "DeploymentDetected":
      return `${EVENT_TYPE_LABELS[type]}: ${String(metadata.version ?? ": ")} @ ${String(metadata.environment ?? ": ")} (${String(metadata.status ?? ": ")})`;
    default:
      return EVENT_TYPE_LABELS[type];
  }
}
