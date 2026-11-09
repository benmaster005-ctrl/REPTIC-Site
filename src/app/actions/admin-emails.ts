"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { assertPermission } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/env";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";
import { buildEmail, definitions, sampleVars, type TemplateKey } from "@/lib/email/transactional";
import { deliver } from "@/lib/email/send";
import { getSiteSettings } from "@/lib/data/public";

const keySchema = z.enum(Object.keys(definitions) as [TemplateKey, ...TemplateKey[]]);

const templateSchema = z.object({
  key: keySchema,
  subject: z.string().trim().min(3, { error: "Sujet trop court." }).max(160, { error: "160 caractères maximum." }),
  body: z.string().trim().min(10, { error: "Texte trop court." }).max(5000),
  is_enabled: z.string().optional().transform((v) => v === "on"),
});

export async function saveEmailTemplate(_prev: FormState, formData: FormData): Promise<FormState> {
  let ctx;
  try {
    ctx = await assertPermission("settings.manage");
  } catch (e) {
    return { status: "error", message: (e as Error).message };
  }
  const values = formValues(formData, ["subject", "body", "is_enabled"]);
  const parsed = templateSchema.safeParse({ ...values, key: formData.get("key") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  const supabase = await createClient();
  const { error } = await supabase
    .from("email_templates")
    .update({ subject: parsed.data.subject, body: parsed.data.body, is_enabled: parsed.data.is_enabled, updated_by: ctx.user.id, updated_at: new Date().toISOString() })
    .eq("key", parsed.data.key);
  if (error) return { status: "error", message: "Le modèle n'a pas pu être enregistré.", values };
  refresh();
  return { status: "success", message: parsed.data.is_enabled ? "Modèle enregistré." : "Modèle enregistré (envoi désactivé).", values };
}

/** Envoie le modèle enregistré, rempli avec des valeurs d'exemple, à l'adresse de l'administrateur. */
export async function sendTestEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  let ctx;
  try {
    ctx = await assertPermission("settings.manage");
  } catch (e) {
    return { status: "error", message: (e as Error).message };
  }
  const key = keySchema.safeParse(formData.get("key"));
  if (!key.success) return { status: "error", message: "Modèle inconnu." };
  const supabase = await createClient();
  const { data } = await supabase.from("email_templates").select("subject,body").eq("key", key.data).maybeSingle();
  if (!data) return { status: "error", message: "Modèle introuvable." };
  const { contact } = await getSiteSettings();
  const email = buildEmail(key.data, data as { subject: string; body: string }, { ...sampleVars, prenom: ctx.user.firstName ?? sampleVars.prenom }, { siteUrl: SITE_URL, contactEmail: contact.email });
  const result = await deliver({ to: ctx.user.email, subject: `[Test] ${email.subject}`, html: email.html, text: email.text });
  return result.ok ? { status: "success", message: `E-mail de test envoyé à ${ctx.user.email}.` } : { status: "error", message: result.error };
}
