import "server-only";
import { after } from "next/server";
import { SITE_URL, isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { getSiteSettings } from "@/lib/data/public";
import { buildEmail, type TemplateKey, type Vars } from "./transactional";

/**
 * Envoi des e-mails du site via Resend (https://resend.com), par simple requête
 * HTTP. Variables d'environnement :
 *   RESEND_API_KEY   clé d'API (sans elle, aucun e-mail n'est envoyé)
 *   EMAIL_FROM       expéditeur, ex. « REPTIC.CM <noreply@reptic.cm> » (domaine vérifié chez Resend)
 *   EMAIL_REPLY_TO   adresse de réponse (par défaut : l'e-mail de contact du site)
 *   EMAIL_NOTIFY_TO  destinataire des alertes internes (par défaut : idem)
 * L'envoi a lieu après la réponse (after()) : il ne ralentit ni ne bloque l'action.
 */

const API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM = process.env.EMAIL_FROM ?? "REPTIC.CM <noreply@reptic.cm>";
export const isEmailConfigured = Boolean(API_KEY);

async function contactEmail() {
  const { contact } = await getSiteSettings();
  return contact.email;
}

export async function internalRecipient() {
  return process.env.EMAIL_NOTIFY_TO || (await contactEmail());
}

async function loadTemplate(key: TemplateKey) {
  if (!isSupabaseConfigured) return null;
  const { data } = await createPublicClient().from("email_templates").select("subject,body,is_enabled").eq("key", key).maybeSingle();
  return data as { subject: string; body: string; is_enabled: boolean } | null;
}

export async function deliver(message: { to: string; subject: string; html: string; text: string; replyTo?: string }) {
  if (!API_KEY) {
    console.info(`[e-mail non envoyé : RESEND_API_KEY absente] « ${message.subject} » → ${message.to}`);
    return { ok: false as const, error: "Envoi désactivé : clé RESEND_API_KEY absente." };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo || process.env.EMAIL_REPLY_TO || (await contactEmail()),
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Envoi e-mail échoué", res.status, detail.slice(0, 300));
    return { ok: false as const, error: `Le service d'envoi a refusé le message (${res.status}).` };
  }
  return { ok: true as const };
}

/** Prépare et envoie un e-mail à partir de son modèle. Ne lève jamais d'erreur. */
export async function sendTemplated(key: TemplateKey, to: string | null | undefined, vars: Vars, opts: { replyTo?: string } = {}) {
  try {
    if (!to) return;
    const template = await loadTemplate(key);
    if (!template || !template.is_enabled) return;
    const email = buildEmail(key, template, vars, { siteUrl: SITE_URL, contactEmail: await contactEmail() });
    await deliver({ to, ...email, replyTo: opts.replyTo });
  } catch (e) {
    console.error(`sendTemplated(${key})`, e);
  }
}

/** Programme l'envoi après la réponse : à utiliser dans les Server Actions. */
export function queueEmail(key: TemplateKey, to: string | null | undefined, vars: Vars, opts: { replyTo?: string } = {}) {
  after(() => sendTemplated(key, to, vars, opts));
}
