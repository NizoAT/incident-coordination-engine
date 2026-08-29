"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";

import {
  PatchForbiddenError,
  PatchNotFoundError,
  PatchValidationError,
  VersionConflictError,
  patchIncident,
} from "./patch";
import { createIncident } from "./store";
import { isIncidentStatus, isSeverity } from "./transitions";

const createIncidentSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire"),
  description: z.string().trim().optional().default(""),
  severity: z.enum(["low", "medium", "high", "critical"]),
});

const VERSION_CONFLICT_MESSAGE =
  "Conflit de version: un autre client a modifié l'incident. Rechargez la page.";

async function requireUserOrRedirect() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

function parseVersion(formData: FormData): number {
  const raw = Number(formData.get("version"));
  if (!Number.isInteger(raw) || raw <= 0) {
    throw new Error("Version invalide: rechargez la page.");
  }
  return raw;
}

function handlePatchError(error: unknown): never {
  if (error instanceof VersionConflictError) {
    throw new Error(VERSION_CONFLICT_MESSAGE);
  }
  if (error instanceof PatchForbiddenError) {
    throw new Error("Accès refusé");
  }
  if (error instanceof PatchNotFoundError) {
    throw new Error("Incident introuvable");
  }
  if (error instanceof PatchValidationError) {
    throw error;
  }
  throw error;
}

export async function createIncidentFormAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUserOrRedirect();

  const parsed = createIncidentSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    severity: formData.get("severity"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Données invalides");
  }

  const incident = await createIncident(user, parsed.data);
  revalidatePath("/incidents");
  redirect(`/incidents/${incident.id}`);
}

export async function advanceStatusFormAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUserOrRedirect();

  const id = String(formData.get("id") ?? "");
  const statusRaw = String(formData.get("status") ?? "");
  const version = parseVersion(formData);

  if (!id || !isIncidentStatus(statusRaw)) {
    throw new Error("Données invalides");
  }

  try {
    await patchIncident(user, id, { version, status: statusRaw });
  } catch (error) {
    handlePatchError(error);
  }

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${id}`);
}

export async function updateSeverityFormAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUserOrRedirect();

  const id = String(formData.get("id") ?? "");
  const severityRaw = String(formData.get("severity") ?? "");
  const version = parseVersion(formData);

  if (!id || !isSeverity(severityRaw)) {
    throw new Error("Données invalides");
  }

  try {
    await patchIncident(user, id, { version, severity: severityRaw });
  } catch (error) {
    handlePatchError(error);
  }

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${id}`);
}

export async function assignIncidentFormAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUserOrRedirect();

  const id = String(formData.get("id") ?? "");
  const assigneeRaw = String(formData.get("assigneeId") ?? "");
  const version = parseVersion(formData);

  if (!id) {
    throw new Error("Données invalides");
  }

  const assigneeId =
    assigneeRaw === "" || assigneeRaw === "__unassigned__" ? null : assigneeRaw;

  try {
    await patchIncident(user, id, { version, assigneeId });
  } catch (error) {
    if (error instanceof PatchForbiddenError) {
      throw new Error("Seul un lead peut assigner");
    }
    handlePatchError(error);
  }

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${id}`);
}
