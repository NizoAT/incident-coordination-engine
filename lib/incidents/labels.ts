import type { IncidentStatus, Severity } from "./types";

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Élevée",
  critical: "Critique",
};

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  open: "Ouvert",
  acknowledged: "Pris en charge",
  investigating: "Investigation",
  resolved: "Résolu",
};

export const TRANSITION_LABELS: Record<IncidentStatus, string> = {
  open: "Prendre en charge",
  acknowledged: "Investiguer",
  investigating: "Résoudre",
  resolved: "",
};
