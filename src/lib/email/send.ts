import "server-only";
import { after } from "next/server";
import nodemailer, { type Transporter } from "nodemailer";
import { SITE_URL, isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { getSiteSettings } from "@/lib/data/public";
import { buildEmail, type TemplateKey, type Vars } from "./transactional";

/**
 * Envoi des e-mails du site par SMTP (le même fournisseur que celui configuré
 * dans Supabase pour les e-mails de compte). Variables d'environnement :
 *   SMTP_HOST        serveur SMTP (sans lui, aucun e-mail n'est envoyé)
 *   SMTP_PORT        587 (STARTTLS, par défaut) ou 465 (SSL)
 *   SMTP_SECURE      "true" pour forcer SSL ; par défaut : vrai si le port est 465
 *   SMTP_USER        identifiant
 *   SMTP_PASSWORD    mot de passe ou clé SMTP
 *   EMAIL_FROM       expéditeur, ex. « REPTIC.CM <noreply@reptic.cm> »
 *   EMAIL_REPLY_TO   adresse de réponse (par défaut : l'e-mail de contact du site)
 *   EMAIL_NOTIFY_TO  destinataire des alertes internes (par défaut : idem)
 * L'envoi a lieu après la réponse (after()) : il ne ralentit ni ne bloque l'action.
 */

const HOST = process.env.SMTP_HOST ?? "";
const PORT = Number(process.env.SMTP_PORT || 587);
const SECURE = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : PORT === 465;
const FROM = process.env.EMAIL_FROM ?? "REPTIC.CM <noreply@reptic.cm>";
export const isEmailConfigured = Boolean(HOST);

let transporter: Transporter | null = null;
function getTransporter() {
  transporter ??= nodemailer.createTransport({
    host: HOST,
    port: PORT,
    secure: SECURE,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD ?? "" } : undefined,
    // Délais courts : une fonction serveur ne doit pas rester bloquée sur un SMTP lent.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transporter;
}

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

export type OutgoingEmail = { to: string; bcc?: string[]; subject: string; html: string; text: string; replyTo?: string; headers?: Record<string, string> };

export async function deliver(message: OutgoingEmail) {
  if (!HOST) {
    console.info(`[e-mail non envoyé : SMTP_HOST absent] « ${message.subject} » → ${message.to}`);
    return { ok: false as const, error: "Envoi désactivé : serveur SMTP non configuré (SMTP_HOST)." };
  }
  try {
    await getTransporter().sendMail({
      from: FROM,
      to: message.to,
      bcc: message.bcc,
      headers: message.headers,
      replyTo: message.replyTo || process.env.EMAIL_REPLY_TO || (await contactEmail()),
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    return { ok: true as const };
  } catch (e) {
    const err = e as { code?: string; responseCode?: number; message?: string };
    console.error("Envoi SMTP échoué", err.code, err.responseCode, err.message);
    const reason =
      err.code === "EAUTH"
        ? "identifiant ou mot de passe SMTP refusé"
        : err.code === "ECONNECTION" || err.code === "ETIMEDOUT" || err.code === "ESOCKET"
          ? "serveur SMTP injoignable (hôte ou port)"
          : err.responseCode
            ? `refus du serveur (${err.responseCode})`
            : "erreur inconnue";
    return { ok: false as const, error: `L'e-mail n'a pas pu être envoyé : ${reason}.` };
  }
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

/** Expéditeur nu (sans nom) : destinataire visible des envois groupés en copie cachée. */
export function senderAddress() {
  const m = FROM.match(/<([^>]+)>/);
  return m ? m[1] : FROM;
}

/**
 * Envoi groupé du même message à de nombreux destinataires : copie cachée par
 * lots de 40 (les adresses ne sont jamais visibles entre destinataires).
 * Renvoie le nombre d'adresses effectivement transmises au serveur.
 */
export async function deliverBcc(recipients: string[], email: { subject: string; html: string; text: string; replyTo?: string }) {
  const unique = [...new Set(recipients.filter(Boolean).map((r) => r.toLowerCase()))];
  let sent = 0;
  for (let i = 0; i < unique.length; i += 40) {
    const batch = unique.slice(i, i + 40);
    const res = await deliver({ to: senderAddress(), bcc: batch, ...email });
    if (res.ok) sent += batch.length;
  }
  return sent;
}

/** Programme l'envoi après la réponse : à utiliser dans les Server Actions. */
export function queueEmail(key: TemplateKey, to: string | null | undefined, vars: Vars, opts: { replyTo?: string } = {}) {
  after(() => sendTemplated(key, to, vars, opts));
}
