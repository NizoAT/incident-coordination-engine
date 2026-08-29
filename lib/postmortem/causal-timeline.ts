import { DEPLOYMENT_STATUS_LABELS } from "@/lib/causality/types";
import { CHANGE_STATUS_LABELS } from "@/lib/causality/types";
import { formatEventDescription } from "@/lib/incidents/event-labels";
import type { IncidentEvent } from "@/lib/incidents/types";

import {
  CAUSAL_EVENT_TYPES,
  type CausalPhase,
  type CausalTimelineEntry,
  type PostMortemContext,
} from "./types";

function phaseForEvent(event: IncidentEvent): CausalPhase {
  switch (event.type) {
    case "ChangeLinked":
      return "change";
    case "DeploymentDetected":
      return "deployment";
    case "IncidentCreated":
      return "incident";
    case "SlaStarted":
    case "SlaBreached":
      return "sla";
    case "EscalationTriggered":
      return "escalation";
    case "StatusChanged":
      return "resolution";
    default:
      return "incident";
  }
}

export function isCausalEvent(event: IncidentEvent): boolean {
  if ((CAUSAL_EVENT_TYPES as readonly string[]).includes(event.type)) {
    return true;
  }
  return (
    event.type === "StatusChanged" && event.metadata.to === "resolved"
  );
}

function entryKey(phase: CausalPhase, sourceId?: string | null): string {
  return `${phase}:${sourceId ?? "none"}`;
}

export function buildCausalTimeline(
  context: PostMortemContext,
): CausalTimelineEntry[] {
  const entries: CausalTimelineEntry[] = [];
  const seen = new Set<string>();

  function add(entry: CausalTimelineEntry) {
    const key = entryKey(entry.phase, entry.sourceId);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    entries.push(entry);
  }

  for (const { change } of context.linkedChanges) {
    add({
      id: `change-${change.id}`,
      phase: "change",
      timestamp: change.createdAt,
      title: change.title,
      description: [
        CHANGE_STATUS_LABELS[change.status],
        change.externalRef ? `(${change.externalRef})` : null,
      ]
        .filter(Boolean)
        .join(" "),
      sourceType: "change",
      sourceId: change.id,
    });
  }

  for (const { deployment } of context.linkedDeployments) {
    add({
      id: `deployment-${deployment.id}`,
      phase: "deployment",
      timestamp: deployment.deployedAt,
      title: `${deployment.version} @ ${deployment.environment}`,
      description: `${DEPLOYMENT_STATUS_LABELS[deployment.status]} · source ${deployment.source}`,
      sourceType: "deployment",
      sourceId: deployment.id,
    });
  }

  for (const event of context.events) {
    if (!isCausalEvent(event)) {
      continue;
    }

    const phase = phaseForEvent(event);

    if (
      event.type === "ChangeLinked" &&
      event.sourceId &&
      seen.has(entryKey("change", event.sourceId))
    ) {
      continue;
    }

    if (
      event.type === "DeploymentDetected" &&
      event.sourceId &&
      seen.has(entryKey("deployment", event.sourceId))
    ) {
      continue;
    }

    add({
      id: event.id,
      phase,
      timestamp: event.timestamp,
      title: formatEventDescription(event.type, event.metadata),
      description: event.sourceType
        ? `sourceType=${event.sourceType}`
        : "",
      eventType: event.type,
      sourceType: event.sourceType,
      sourceId: event.sourceId,
    });
  }

  return entries.sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}
