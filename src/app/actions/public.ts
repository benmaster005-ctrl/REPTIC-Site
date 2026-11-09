"use server";

import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { emailSchema, fieldErrors, formValues, isLikelySpam, type FormState } from "@/lib/forms";
import { internalRecipient, sendTemplated } from "@/lib/email/send";

const NEWSLETTER_CONSENT =
  "J'accepte de recevoir la lettre d'information de REPTIC.CM. Je peux me désinscrire à tout moment.";

const newsletterSchema = z.object({
  email: emailSchema,
  consent: z.literal("on", { error: "Votre consentement est nécessaire." }),
});

export async function subscribeNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isLikelySpam(formData)) return { status: "success", message: "Merci, votre inscription est enregistrée." };

  const parsed = newsletterSchema.safeParse({ email: formData.get("email"), consent: formData.get("consent") });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values: formValues(formData, ["email"]) };
  }
  if (!isSupabaseConfigured) return { status: "error", message: "Service indisponible (base non connectée)." };

  const supabase = await createClient();
  // Crée l'abonné ou réactive un abonné désinscrit, sans révéler si l'adresse existait.
  let { error } = await supabase.rpc("newsletter_subscribe", { p_email: parsed.data.email, p_consent: NEWSLETTER_CONSENT });
  if (error?.code === "PGRST202") {
    // Migration 7 pas encore appliquée : ancienne méthode.
    ({ error } = await supabase.from("newsletter_subscribers").insert({ email: parsed.data.email, consent_text: NEWSLETTER_CONSENT }));
    if (error?.code === "23505") error = null;
  }
  if (error) {
    console.error("subscribeNewsletter", error.message);
    return { status: "error", message: "Une erreur est survenue. Réessayez plus tard." };
  }
  return { status: "success", message: "Merci, votre inscription est enregistrée." };
}

/** Désinscription par le lien personnel figurant dans chaque lettre (confirmée par un bouton). */
export async function unsubscribeNewsletter(formData: FormData) {
  const token = z.uuid().safeParse(formData.get("token"));
  if (!token.success || !isSupabaseConfigured) redirect("/newsletter/desinscription?etat=invalide");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("newsletter_unsubscribe", { p_token: token.data });
  if (error) console.error("unsubscribeNewsletter", error.message);
  redirect(`/newsletter/desinscription?etat=${data ? "ok" : "invalide"}`);
}

const contactSchema = z.object({
  full_name: z.string().trim().min(2, { error: "Indiquez votre nom." }).max(120),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[+\d\s().-]*$/, { error: "Numéro de téléphone invalide." })
    .optional(),
  subject: z.string().trim().min(2, { error: "Indiquez l'objet du message." }).max(200),
  message: z
    .string()
    .trim()
    .min(10, { error: "Votre message doit contenir au moins 10 caractères." })
    .max(5000, { error: "Votre message est trop long (5000 caractères maximum)." }),
  consent: z.literal("on", { error: "Votre accord est nécessaire pour traiter votre demande." }),
});

const CONTACT_FIELDS = ["full_name", "email", "phone", "subject", "message"];

export async function sendContactMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isLikelySpam(formData)) return { status: "success", message: "Merci, votre message a bien été envoyé." };

  const parsed = contactSchema.safeParse({
    ...formValues(formData, CONTACT_FIELDS),
    consent: formData.get("consent") ?? undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Merci de corriger les champs signalés.",
      fieldErrors: fieldErrors(parsed.error),
      values: formValues(formData, CONTACT_FIELDS),
    };
  }
  if (!isSupabaseConfigured) {
    return { status: "error", message: "Service indisponible (base non connectée).", values: formValues(formData, CONTACT_FIELDS) };
  }

  const { full_name, email, phone, subject, message } = parsed.data;
  const row = { full_name, email, phone, subject, message };
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert({ ...row, phone: row.phone || null });
  if (error) {
    console.error("sendContactMessage", error.message);
    return { status: "error", message: "Une erreur est survenue. Réessayez plus tard.", values: formValues(formData, CONTACT_FIELDS) };
  }
  after(async () =>
    sendTemplated(
      "contact.received",
      await internalRecipient(),
      { nom: row.full_name, email: row.email, telephone: row.phone || null, objet: row.subject, message: row.message },
      { replyTo: row.email },
    ),
  );
  return { status: "success", message: "Merci, votre message a bien été envoyé. Nous vous répondrons rapidement." };
}
