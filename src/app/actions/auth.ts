"use server";

import { headers } from "next/headers";
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

/** Origine réelle de la requête (aperçu Vercel, production, local), à défaut NEXT_PUBLIC_SITE_URL. */
async function siteOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  return origin && /^https?:\/\/[^/]+$/.test(origin) ? origin : SITE_URL;
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

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/connexion");
}

const signUpSchema = z
  .object({
    first_name: z.string().trim().min(1, { error: "Indiquez votre prénom." }).max(80),
    last_name: z.string().trim().min(1, { error: "Indiquez votre nom." }).max(80),
    email: emailSchema,
    password: z
      .string()
      .min(10, { error: "10 caractères minimum." })
      .regex(/[A-Za-z]/, { error: "Au moins une lettre." })
      .regex(/d/, { error: "Au moins un chiffre." }),
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
