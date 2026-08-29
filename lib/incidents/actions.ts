"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";

import {
  assignIncident,
  createIncident,
  getIncidentForUser,
  updateIncidentSeverity,
  updateIncidentStatus,
} from "./store";
import {
  assertSeverityChange,
  assertTransition,
  isIncidentStatus,
  isSeverity,
} from "./transitions";

const createIncidentSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire"),
  description: z.string().trim().optional().default(""),
  severity: z.enum(["low", "medium", "high", "critical"]),
});

async function requireUserOrRedirect() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
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

  if (!id || !isIncidentStatus(statusRaw)) {
    throw new Error("Données invalides");
  }

  const incident = await getIncidentForUser(user, id);
  if (!incident) {
    throw new Error("Incident introuvable");
  }

  assertTransition(incident.status, statusRaw);

  try {
    await updateIncidentStatus(user, id, statusRaw);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      throw new Error("Accès refusé");
    }
    throw error;
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

  if (!id || !isSeverity(severityRaw)) {
    throw new Error("Données invalides");
  }

  const incident = await getIncidentForUser(user, id);
  if (!incident) {
    throw new Error("Incident introuvable");
  }

  assertSeverityChange(incident.status);

  try {
    await updateIncidentSeverity(user, id, severityRaw);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      throw new Error("Accès refusé");
    }
    throw error;
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

  if (!id) {
    throw new Error("Données invalides");
  }

  const assigneeId =
    assigneeRaw === "" || assigneeRaw === "__unassigned__" ? null : assigneeRaw;

  try {
    await assignIncident(user, id, assigneeId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN") {
        throw new Error("Seul un lead peut assigner");
      }
      throw error;
    }
    throw error;
  }

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${id}`);
}
