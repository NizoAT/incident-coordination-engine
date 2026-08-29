"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { authenticateUser } from "./credentials";
import { clearSession, setSessionUser } from "./session";

const loginSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(1, "Mot de passe obligatoire"),
});

export async function loginFormAction(formData: FormData): Promise<void> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Données invalides");
  }

  const user = await authenticateUser(parsed.data.email, parsed.data.password);
  if (!user) {
    throw new Error("Email ou mot de passe incorrect");
  }

  await setSessionUser(user);
  redirect("/incidents");
}

export async function logoutFormAction(): Promise<void> {
  await clearSession();
  redirect("/login");
}
