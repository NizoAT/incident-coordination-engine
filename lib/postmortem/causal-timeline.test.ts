import { describe, expect, it } from "vitest";

import {
  buildCausalTimeline,
  isCausalEvent,
} from "@/lib/postmortem/causal-timeline";
import type { PostMortemContext } from "@/lib/postmortem/types";
import type { IncidentEvent } from "@/lib/incidents/types";

const baseIncident = {
  id: "inc-1",
  title: "Checkout down",
  description: "Critical outage",
  severity: "critical" as const,
  status: "resolved" as const,
  version: 3,
  assigneeId: null,
  createdById: "user-1",
  assigneeEmail: null,
  createdByEmail: "lead@demo.local",
  slaDeadline: null,
  slaStatus: "ok" as const,
  slaCycleId: null,
  slaDurationMinutes: 15,
  createdAt: "2026-01-01T14:00:00.000Z",
  updatedAt: "2026-01-01T16:00:00.000Z",
};

function event(
  partial: Partial<IncidentEvent> & Pick<IncidentEvent, "type" | "timestamp">,
): IncidentEvent {
  return {
    id: partial.id ?? crypto.randomUUID(),
    incidentId: "inc-1",
    actorId: null,
    metadata: partial.metadata ?? {},
    sourceType: partial.sourceType ?? null,
    sourceId: partial.sourceId ?? null,
    ...partial,
  };
}

describe("isCausalEvent", () => {
  it("inclut les types causaux et la résolution", () => {
    expect(isCausalEvent(event({ type: "EscalationTriggered", timestamp: "" }))).toBe(true);
    expect(
      isCausalEvent(
        event({
          type: "StatusChanged",
          timestamp: "",
          metadata: { from: "investigating", to: "resolved" },
        }),
      ),
    ).toBe(true);
  });

  it("exclut assignation et transitions intermédiaires", () => {
    expect(isCausalEvent(event({ type: "IncidentAssigned", timestamp: "" }))).toBe(false);
    expect(
      isCausalEvent(
        event({
          type: "StatusChanged",
          timestamp: "",
          metadata: { from: "open", to: "acknowledged" },
        }),
      ),
    ).toBe(false);
  });
});

describe("buildCausalTimeline", () => {
  it("ordonne déploiement avant incident quand deployedAt est antérieur", () => {
    const context: PostMortemContext = {
      incident: baseIncident,
      linkedChanges: [
        {
          change: {
            id: "chg-1",
            title: "Release v2.4.1",
            description: "",
            externalRef: "CHG-842",
            status: "completed",
            createdAt: "2026-01-01T10:00:00.000Z",
            updatedAt: "2026-01-01T10:00:00.000Z",
          },
          linkedAt: "2026-01-01T14:30:00.000Z",
        },
      ],
      linkedDeployments: [
        {
          deployment: {
            id: "dep-1",
            changeId: "chg-1",
            changeTitle: "Release v2.4.1",
            version: "v2.4.1",
            environment: "production",
            status: "success",
            source: "manual",
            idempotencyKey: null,
            githubDeploymentId: null,
            deployedAt: "2026-01-01T12:00:00.000Z",
            createdAt: "2026-01-01T12:00:00.000Z",
          },
          linkedAt: "2026-01-01T14:30:00.000Z",
        },
      ],
      events: [
        event({
          id: "evt-created",
          type: "IncidentCreated",
          timestamp: "2026-01-01T14:00:00.000Z",
          metadata: { title: "Checkout down", severity: "critical" },
        }),
        event({
          id: "evt-escalation",
          type: "EscalationTriggered",
          timestamp: "2026-01-01T14:15:00.000Z",
          metadata: { policyId: "pol-1", notifyRole: "lead" },
        }),
        event({
          id: "evt-resolved",
          type: "StatusChanged",
          timestamp: "2026-01-01T16:00:00.000Z",
          metadata: { from: "investigating", to: "resolved" },
        }),
        event({
          id: "evt-change",
          type: "ChangeLinked",
          timestamp: "2026-01-01T14:30:00.000Z",
          metadata: { changeTitle: "Release v2.4.1" },
          sourceType: "change",
          sourceId: "chg-1",
        }),
        event({
          id: "evt-deploy",
          type: "DeploymentDetected",
          timestamp: "2026-01-01T14:30:00.000Z",
          metadata: { version: "v2.4.1", environment: "production", status: "success" },
          sourceType: "deployment",
          sourceId: "dep-1",
        }),
      ],
    };

    const timeline = buildCausalTimeline(context);
    const phases = timeline.map((e) => e.phase);

    expect(phases).toEqual([
      "change",
      "deployment",
      "incident",
      "escalation",
      "resolution",
    ]);
    expect(timeline[0]!.timestamp).toBe("2026-01-01T10:00:00.000Z");
    expect(timeline[1]!.timestamp).toBe("2026-01-01T12:00:00.000Z");
  });

  it("déduplique ChangeLinked et DeploymentDetected déjà couverts par les relations", () => {
    const context: PostMortemContext = {
      incident: baseIncident,
      linkedChanges: [
        {
          change: {
            id: "chg-1",
            title: "Release",
            description: "",
            externalRef: null,
            status: "completed",
            createdAt: "2026-01-01T10:00:00.000Z",
            updatedAt: "2026-01-01T10:00:00.000Z",
          },
          linkedAt: "2026-01-01T14:30:00.000Z",
        },
      ],
      linkedDeployments: [],
      events: [
        event({
          type: "ChangeLinked",
          timestamp: "2026-01-01T14:30:00.000Z",
          sourceType: "change",
          sourceId: "chg-1",
          metadata: { changeTitle: "Release" },
        }),
      ],
    };

    const timeline = buildCausalTimeline(context);
    expect(timeline.filter((e) => e.phase === "change")).toHaveLength(1);
  });
});
