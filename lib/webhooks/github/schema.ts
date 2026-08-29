import { z } from "zod";

/** Sous-ensemble du payload GitHub `deployment_status` (docs.github.com/webhooks). */
export const githubDeploymentStatusSchema = z.object({
  action: z.string(),
  deployment: z.object({
    id: z.number().int().positive(),
    ref: z.string(),
    environment: z.string(),
    payload: z.string().optional().nullable(),
  }),
  deployment_status: z.object({
    id: z.number().int().positive(),
    state: z.enum([
      "success",
      "failure",
      "error",
      "inactive",
      "queued",
      "in_progress",
      "pending",
    ]),
    description: z.string().optional().nullable(),
    created_at: z.string(),
  }),
  repository: z
    .object({
      full_name: z.string().optional(),
    })
    .optional(),
});

export type GitHubDeploymentStatusPayload = z.infer<
  typeof githubDeploymentStatusSchema
>;

export function mapGitHubDeploymentState(
  state: GitHubDeploymentStatusPayload["deployment_status"]["state"],
): "success" | "failed" | null {
  if (state === "success") {
    return "success";
  }
  if (state === "failure" || state === "error") {
    return "failed";
  }
  return null;
}

export function parseIncidentIdFromClientPayload(
  payload: string | null | undefined,
): string | undefined {
  if (!payload) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(payload) as { incidentId?: unknown };
    return typeof parsed.incidentId === "string" ? parsed.incidentId : undefined;
  } catch {
    return undefined;
  }
}
