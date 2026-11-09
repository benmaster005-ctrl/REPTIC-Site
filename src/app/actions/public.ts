"use server";

import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, fieldErrors, formValues, isLikelySpam, type FormState } from "@/lib/forms";

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
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email: parsed.data.email, consent_text: NEWSLETTER_CONSENT });

  // 23505 = déjà inscrit : on ne le révèle pas.
  if (error && error.code !== "23505") {
    console.error("subscribeNewsletter", error.message);
    return { status: "error", message: "Une erreur est survenue. Réessayez plus tard." };
  }
  return { status: "success", message: "Merci, votre inscription est enregistrée." };
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
  return { status: "success", message: "Merci, votre message a bien été envoyé. Nous vous répondrons rapidement." };
}
