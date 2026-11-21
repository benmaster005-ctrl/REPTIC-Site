"use server";

import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { emailSchema, fieldErrors, formValues, isLikelySpam, type FormState } from "@/lib/forms";
import { internalRecipient, sendTemplated } from "@/lib/email/send";
import { formatDateTime } from "@/lib/format";
import { RECAPTCHA_ERROR, verifyRecaptcha } from "@/lib/recaptcha";

/**
 * Secret partagé avec la base (migration 15) : seules les fonctions
 * newsletter_subscribe et submit_contact_message écrivent dans ces tables,
 * et elles exigent ce secret, que seul le serveur du site connaît.
 */
const FORMS_SECRET = process.env.PUBLIC_FORMS_SECRET ?? "";
const UNAVAILABLE = "Une erreur est survenue. Réessayez plus tard.";

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
  if (!(await verifyRecaptcha(formData, "newsletter"))) {
    return { status: "error", message: RECAPTCHA_ERROR, values: formValues(formData, ["email"]) };
  }
  if (!isSupabaseConfigured) return { status: "error", message: "Service indisponible (base non connectée)." };

  if (!FORMS_SECRET) {
    console.error("subscribeNewsletter : PUBLIC_FORMS_SECRET manquant");
    return { status: "error", message: UNAVAILABLE, values: formValues(formData, ["email"]) };
  }

  const supabase = await createClient();
  // Crée l'abonné ou réactive un abonné désinscrit, sans révéler si l'adresse existait.
  const { error } = await supabase.rpc("newsletter_subscribe", { p_secret: FORMS_SECRET, p_email: parsed.data.email, p_consent: NEWSLETTER_CONSENT });
  if (error) {
    console.error("subscribeNewsletter", error.message);
    return { status: "error", message: UNAVAILABLE, values: formValues(formData, ["email"]) };
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
  if (!(await verifyRecaptcha(formData, "contact"))) {
    return { status: "error", message: RECAPTCHA_ERROR, values: formValues(formData, CONTACT_FIELDS) };
  }
  if (!isSupabaseConfigured) {
    return { status: "error", message: "Service indisponible (base non connectée).", values: formValues(formData, CONTACT_FIELDS) };
  }

  if (!FORMS_SECRET) {
    console.error("sendContactMessage : PUBLIC_FORMS_SECRET manquant");
    return { status: "error", message: UNAVAILABLE, values: formValues(formData, CONTACT_FIELDS) };
  }

  const { full_name, email, phone, subject, message } = parsed.data;
  const row = { full_name, email, phone, subject, message };
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_contact_message", {
    p_secret: FORMS_SECRET,
    p_full_name: row.full_name,
    p_email: row.email,
    p_phone: row.phone || null,
    p_subject: row.subject,
    p_message: row.message,
  });
  if (error) {
    console.error("sendContactMessage", error.message);
    // Limite de 5 messages par heure et par adresse : message explicite
    const message = error.code === "P0001" ? error.message : UNAVAILABLE;
    return { status: "error", message, values: formValues(formData, CONTACT_FIELDS) };
  }
  after(async () =>
    sendTemplated(
      "contact.received",
      await internalRecipient(),
      {
        nom: row.full_name,
        email: row.email,
        telephone: row.phone || null,
        objet: row.subject,
        message: row.message,
        recu_le: formatDateTime(new Date().toISOString()), // ex. « 12 novembre 2026 à 10:42 » (heure de Douala)
      },
      { replyTo: row.email },
    ),
  );
  return { status: "success", message: "Merci, votre message a bien été envoyé. Nous vous répondrons rapidement." };
}
