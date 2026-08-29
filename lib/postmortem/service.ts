import type { SessionUser } from "@/lib/auth/types";
import {
  listLinkedChanges,
  listLinkedDeployments,
} from "@/lib/causality/store";
import { getIncidentForUser, listIncidentEvents } from "@/lib/incidents/store";

import { buildCausalTimeline } from "./causal-timeline";
import type { PostMortemReport } from "./types";

export class PostMortemNotFoundError extends Error {
  constructor() {
    super("NOT_FOUND");
    this.name = "PostMortemNotFoundError";
  }
}

export async function getPostMortemReport(
  user: SessionUser,
  incidentId: string,
): Promise<PostMortemReport> {
  const incident = await getIncidentForUser(user, incidentId);
  if (!incident) {
    throw new PostMortemNotFoundError();
  }

  const [events, linkedChanges, linkedDeployments] = await Promise.all([
    listIncidentEvents(incidentId),
    listLinkedChanges(incidentId),
    listLinkedDeployments(incidentId),
  ]);

  const causalTimeline = buildCausalTimeline({
    incident,
    events,
    linkedChanges,
    linkedDeployments,
  });

  return {
    incident,
    events,
    linkedChanges,
    linkedDeployments,
    causalTimeline,
    generatedAt: new Date().toISOString(),
  };
}
