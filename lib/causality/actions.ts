"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";

import {
  ChangeAlreadyLinkedError,
  createChange,
  linkChangeToIncident,
  registerDeploymentForIncident,
} from "./store";

async function requireUserOrRedirect() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

const createChangeSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire"),
  description: z.string().trim().optional().default(""),
  externalRef: z.string().trim().optional(),
  status: z
    .enum(["planned", "in_progress", "completed", "rolled_back"])
    .optional(),
});

export async function createChangeFormAction(formData: FormData): Promise<void> {
  await requireUserOrRedirect();

  const parsed = createChangeSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    externalRef: formData.get("externalRef") ?? "",
    status: formData.get("status") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Données invalides");
  }

  await createChange(parsed.data);
  revalidatePath("/changes");
}

export async function linkChangeFormAction(formData: FormData): Promise<void> {
  const user = await requireUserOrRedirect();

  const incidentId = String(formData.get("incidentId") ?? "");
  const changeId = String(formData.get("changeId") ?? "");

  if (!incidentId || !changeId) {
    throw new Error("Données invalides");
  }

  try {
    await linkChangeToIncident(user, incidentId, changeId);
  } catch (error) {
    if (error instanceof ChangeAlreadyLinkedError) {
      throw new Error("Ce changement est déjà lié à l'incident");
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      throw new Error("Accès refusé");
    }
    throw error;
  }

  revalidatePath(`/incidents/${incidentId}`);
  revalidatePath("/incidents");
}

const registerDeploymentSchema = z.object({
  version: z.string().trim().min(1, "Version obligatoire"),
  environment: z.string().trim().min(1, "Environnement obligatoire"),
  status: z.enum(["success", "failed"]),
  changeId: z.string().trim().optional(),
});

export async function registerDeploymentFormAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUserOrRedirect();

  const incidentId = String(formData.get("incidentId") ?? "");
  const parsed = registerDeploymentSchema.safeParse({
    version: formData.get("version"),
    environment: formData.get("environment"),
    status: formData.get("status"),
    changeId: formData.get("changeId") || undefined,
  });

  if (!incidentId || !parsed.success) {
    throw new Error(parsed.success ? "Données invalides" : parsed.error.issues[0]?.message ?? "Données invalides");
  }

  try {
    await registerDeploymentForIncident(user, incidentId, {
      ...parsed.data,
      changeId: parsed.data.changeId || null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      throw new Error("Accès refusé");
    }
    throw error;
  }

  revalidatePath(`/incidents/${incidentId}`);
}
