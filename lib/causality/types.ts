export type ChangeStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "rolled_back";

export type DeploymentStatus = "success" | "failed";

export type SourceType = "change" | "deployment";

export interface Change {
  id: string;
  title: string;
  description: string;
  externalRef: string | null;
  status: ChangeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Deployment {
  id: string;
  changeId: string | null;
  changeTitle: string | null;
  version: string;
  environment: string;
  status: DeploymentStatus;
  source: string;
  idempotencyKey: string | null;
  githubDeploymentId: string | null;
  deployedAt: string;
  createdAt: string;
}

export interface LinkedChange {
  change: Change;
  linkedAt: string;
}

export interface LinkedDeployment {
  deployment: Deployment;
  linkedAt: string;
}

export const CHANGE_STATUSES: readonly ChangeStatus[] = [
  "planned",
  "in_progress",
  "completed",
  "rolled_back",
] as const;

export const CHANGE_STATUS_LABELS: Record<ChangeStatus, string> = {
  planned: "Planifié",
  in_progress: "En cours",
  completed: "Terminé",
  rolled_back: "Rollback",
};

export const DEPLOYMENT_STATUS_LABELS: Record<DeploymentStatus, string> = {
  success: "Succès",
  failed: "Échec",
};
