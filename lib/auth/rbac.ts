import type { SessionUser, UserRole } from "./types";

export function isLead(role: UserRole): boolean {
  return role === "lead";
}

export function canAssignIncidents(user: SessionUser): boolean {
  return isLead(user.role);
}

export function canAccessIncident(
  user: SessionUser,
  incident: { assigneeId: string | null; createdById: string | null },
): boolean {
  if (isLead(user.role)) {
    return true;
  }

  return (
    incident.assigneeId === user.id || incident.createdById === user.id
  );
}

export function incidentVisibilityFilter(user: SessionUser) {
  if (isLead(user.role)) {
    return {};
  }

  return {
    OR: [{ assigneeId: user.id }, { createdById: user.id }],
  };
}
