import type { Change, Deployment, LinkedChange, LinkedDeployment } from "@/lib/causality/types";
import type { Incident, IncidentEvent, IncidentEventType } from "@/lib/incidents/types";

export type CausalPhase =
  | "change"
  | "deployment"
  | "incident"
  | "sla"
  | "escalation"
  | "resolution";

export const CAUSAL_PHASE_LABELS: Record<CausalPhase, string> = {
  change: "Changement",
  deployment: "Déploiement",
  incident: "Incident",
  sla: "SLA",
  escalation: "Escalade",
  resolution: "Résolution",
};

export const CAUSAL_EVENT_TYPES: readonly IncidentEventType[] = [
  "ChangeLinked",
  "DeploymentDetected",
  "IncidentCreated",
  "SlaStarted",
  "SlaBreached",
  "EscalationTriggered",
] as const;

export interface CausalTimelineEntry {
  id: string;
  phase: CausalPhase;
  timestamp: string;
  title: string;
  description: string;
  eventType?: IncidentEventType;
  sourceType?: string | null;
  sourceId?: string | null;
}

export interface PostMortemReport {
  incident: Incident;
  events: IncidentEvent[];
  linkedChanges: LinkedChange[];
  linkedDeployments: LinkedDeployment[];
  causalTimeline: CausalTimelineEntry[];
  generatedAt: string;
}

export interface PostMortemContext {
  incident: Incident;
  events: IncidentEvent[];
  linkedChanges: LinkedChange[];
  linkedDeployments: LinkedDeployment[];
}

export type { Change, Deployment, LinkedChange, LinkedDeployment };
