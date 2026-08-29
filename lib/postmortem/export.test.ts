import { describe, expect, it } from "vitest";

import { postMortemToMarkdown } from "@/lib/postmortem/export";
import type { PostMortemReport } from "@/lib/postmortem/types";

describe("postMortemToMarkdown", () => {
  it("génère un document avec timeline causale", () => {
    const report: PostMortemReport = {
      incident: {
        id: "inc-1",
        title: "Checkout down",
        description: "Outage critique",
        severity: "critical",
        status: "resolved",
        version: 1,
        assigneeId: null,
        createdById: null,
        assigneeEmail: null,
        createdByEmail: "lead@demo.local",
        slaDeadline: null,
        slaStatus: "ok",
        slaCycleId: null,
        slaDurationMinutes: 15,
        createdAt: "2026-01-01T14:00:00.000Z",
        updatedAt: "2026-01-01T16:00:00.000Z",
      },
      events: [],
      linkedChanges: [],
      linkedDeployments: [],
      causalTimeline: [
        {
          id: "1",
          phase: "incident",
          timestamp: "2026-01-01T14:00:00.000Z",
          title: "Incident créé",
          description: "",
          eventType: "IncidentCreated",
        },
        {
          id: "2",
          phase: "resolution",
          timestamp: "2026-01-01T16:00:00.000Z",
          title: "Résolu",
          description: "",
          eventType: "StatusChanged",
        },
      ],
      generatedAt: "2026-01-01T17:00:00.000Z",
    };

    const md = postMortemToMarkdown(report);

    expect(md).toContain("# Post-mortem: Checkout down");
    expect(md).toContain("## Timeline causale");
    expect(md).toContain("Incident");
    expect(md).toContain("Résolution");
  });
});
