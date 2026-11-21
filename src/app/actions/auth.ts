"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured, publicOrigin } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, fieldErrors, type FormState } from "@/lib/forms";
import { RECAPTCHA_ERROR, verifyRecaptcha } from "@/lib/recaptcha";
import { safeInternalPath } from "@/lib/safe-redirect";
import { RECOVERY_COOKIE } from "@/lib/recovery";

/** N'accepte que des chemins internes pour éviter les redirections ouvertes. */
const safeNext = (value: FormDataEntryValue | null) => safeInternalPath(value);

/**
 * Adresse publique du site, pour les liens de retour envoyés à Supabase
 * (voir publicOrigin : jamais l'adresse interne du proxy en production).
 */
async function siteOrigin() {
  return publicOrigin((await headers()).get("origin"));
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
  if (!(await verifyRecaptcha(formData, "connexion"))) return { status: "error", message: RECAPTCHA_ERROR, values };
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

/** Fournisseurs de connexion acceptés : clé du site → fournisseur Supabase. */
const oauthProviders = {
  google: { provider: "google", queryParams: { prompt: "select_account" } },
  linkedin: { provider: "linkedin_oidc", queryParams: undefined },
} as const;

/**
 * Connexion (ou création de compte) avec Google ou LinkedIn, via Supabase.
 * Le fournisseur renvoie sur /auth/callback, qui ouvre la session puis redirige vers « suite ».
 */
export async function signInWithOAuthProvider(formData: FormData) {
  const key = String(formData.get("fournisseur") ?? "");
  if (!(key in oauthProviders)) redirect("/connexion");
  const via = key as keyof typeof oauthProviders;
  const next = safeNext(formData.get("suite"));
  if (!isSupabaseConfigured) redirect(`/connexion?erreur=${via}`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: oauthProviders[via].provider,
    options: {
      redirectTo: `${await siteOrigin()}/auth/callback?via=${via}&suite=${encodeURIComponent(next)}`,
      queryParams: oauthProviders[via].queryParams,
    },
  });
  if (error || !data.url) redirect(`/connexion?erreur=${via}`);
  redirect(data.url);
}

export async function signOut(formData?: FormData) {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  // « suite » facultatif : se reconnecter avec un autre compte puis revenir (ex. lien d'invitation)
  const next = formData?.get("suite");
  redirect(next ? `/connexion?suite=${encodeURIComponent(safeNext(next))}` : "/connexion");
}

const signUpSchema = z
  .object({
    first_name: z.string().trim().min(1, { error: "Indiquez votre prénom." }).max(80),
    last_name: z.string().trim().min(1, { error: "Indiquez votre nom." }).max(80),
    email: emailSchema,
    password: z
      .string()
      .min(8, { error: "8 caractères minimum." })
      .regex(/[A-Za-z]/, { error: "Au moins une lettre." })
      .regex(/\d/, { error: "Au moins un chiffre." }),
    confirm: z.string(),
    privacy: z.literal("on", { error: "Votre accord est nécessaire pour créer le compte." }),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], error: "Les mots de passe ne correspondent pas." });

/** Création du compte candidat. Le compte reste « en attente » jusqu'à l'acceptation du dossier. */
export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = {
    first_name: String(formData.get("first_name") ?? ""),
    last_name: String(formData.get("last_name") ?? ""),
    email: String(formData.get("email") ?? ""),
  };
  const parsed = signUpSchema.safeParse({ ...values, password: formData.get("password"), confirm: formData.get("confirm"), privacy: formData.get("privacy") ?? undefined });
  if (!parsed.success) return { status: "error", message: "Merci de corriger les champs signalés.", fieldErrors: fieldErrors(parsed.error), values };
  if (!(await verifyRecaptcha(formData, "inscription"))) return { status: "error", message: RECAPTCHA_ERROR, values };
  if (!isSupabaseConfigured) return { ...NOT_CONFIGURED, values };

  const next = safeNext(formData.get("suite") ?? "/espace/adhesion");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${await siteOrigin()}/auth/callback?suite=${encodeURIComponent(next)}`,
      data: { first_name: parsed.data.first_name, last_name: parsed.data.last_name },
    },
  });
  if (error) {
    const message =
      error.status === 429
        ? "Trop de demandes en peu de temps. Réessayez dans quelques minutes."
        : error.code === "weak_password"
          ? "Ce mot de passe est trop faible ou trop courant."
          : "Le compte n'a pas pu être créé. Vérifiez votre adresse e-mail.";
    return { status: "error", message, values };
  }
  // Confirmation par e-mail désactivée : la session est déjà ouverte.
  if (data.session) redirect(next);
  // Message identique, que l'adresse soit nouvelle ou déjà utilisée.
  return {
    status: "success",
    message: `Un e-mail de confirmation a été envoyé à ${parsed.data.email}. Cliquez sur le lien qu'il contient pour activer votre compte et poursuivre votre demande.`,
  };
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { status: "error", fieldErrors: { email: ["Adresse e-mail invalide."] } };
  if (!(await verifyRecaptcha(formData, "mot_de_passe_oublie"))) return { status: "error", message: RECAPTCHA_ERROR };
  if (!isSupabaseConfigured) return NOT_CONFIGURED;

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${await siteOrigin()}/auth/callback?suite=/reinitialiser-mot-de-passe`,
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
      .min(8, { error: "8 caractères minimum." })
      .regex(/[A-Za-z]/, { error: "Le mot de passe doit contenir au moins une lettre." })
      .regex(/\d/, { error: "Le mot de passe doit contenir au moins un chiffre." }),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], error: "Les mots de passe ne correspondent pas." });

/**
 * Nouveau mot de passe après un lien « mot de passe oublié ». Le témoin posé
 * par /auth/callback prouve que le lien a été utilisé : sans lui, une session
 * volée ne peut pas changer le mot de passe sans connaître l'ancien (voir
 * changePassword dans l'espace membre).
 */
export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  if (!isSupabaseConfigured) return NOT_CONFIGURED;

  const linkExpired: FormState = {
    status: "error",
    message: "Le lien a expiré ou le mot de passe n'a pas pu être modifié. Refaites une demande de réinitialisation.",
  };
  const jar = await cookies();
  if (!jar.get(RECOVERY_COOKIE)) return linkExpired;

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return linkExpired;
  jar.delete(RECOVERY_COOKIE);
  redirect("/espace?mdp=ok");
}
