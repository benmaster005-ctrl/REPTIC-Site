"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { SITE_URL, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, fieldErrors, type FormState } from "@/lib/forms";

/** N'accepte que des chemins internes pour éviter les redirections ouvertes. */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/espace";
}

const NOT_CONFIGURED: FormState = { status: "error", message: "Authentification indisponible : base non connectée." };

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Saisissez votre mot de passe." }),
});

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  const values = { email: String(formData.get("email") ?? "") };
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  if (!isSupabaseConfigured) return { ...NOT_CONFIGURED, values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Message générique : ne pas indiquer si le compte existe.
    const message =
      error.code === "email_not_confirmed"
        ? "Votre adresse e-mail n'est pas encore confirmée. Consultez votre messagerie."
        : error.status === 429
          ? "Trop de tentatives. Patientez quelques minutes avant de réessayer."
          : "Identifiants incorrects.";
    return { status: "error", message, values };
  }
  redirect(safeNext(formData.get("suite")));
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/connexion");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { status: "error", fieldErrors: { email: ["Adresse e-mail invalide."] } };
  if (!isSupabaseConfigured) return NOT_CONFIGURED;

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${SITE_URL}/auth/callback?suite=/reinitialiser-mot-de-passe`,
  });
  // Réponse identique que le compte existe ou non.
  return {
    status: "success",
    message: "Si un compte correspond à cette adresse, vous recevrez un lien de réinitialisation dans quelques minutes.",
  };
}

const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(10, { error: "10 caractères minimum." })
      .regex(/[A-Za-z]/, { error: "Le mot de passe doit contenir au moins une lettre." })
      .regex(/\d/, { error: "Le mot de passe doit contenir au moins un chiffre." }),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], error: "Les mots de passe ne correspondent pas." });

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  if (!isSupabaseConfigured) return NOT_CONFIGURED;

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      status: "error",
      message: "Le lien a expiré ou le mot de passe n'a pas pu être modifié. Refaites une demande de réinitialisation.",
    };
  }
  redirect("/espace?mdp=ok");
}
