"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { assertPermission, sqlMessage } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/env";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";
import { buildNewsletterEmail } from "@/lib/email/content";
import { deliver, isEmailConfigured } from "@/lib/email/send";
import { getSiteSettings } from "@/lib/data/public";
import { loadNewsletterArticles } from "@/lib/data/newsletter";

async function guard() {
  return assertPermission("contact.manage");
}

const campaignSchema = z.object({
  subject: z.string().trim().min(3, { error: "Objet trop court." }).max(160),
  intro: z.string().trim().min(10, { error: "Rédigez une introduction." }).max(5000),
});

/** Brouillon de lettre : objet, introduction et sélection d'actualités publiques. */
export async function saveCampaign(_prev: FormState, formData: FormData): Promise<FormState> {
  let ctx;
  try {
    ctx = await guard();
  } catch (e) {
    return { status: "error", message: (e as Error).message };
  }
  const id = String(formData.get("id") ?? "");
  const values = formValues(formData, ["subject", "intro"]);
  const parsed = campaignSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  const newsIds = formData.getAll("news_ids").map(String).filter((v) => /^[0-9a-f-]{36}$/i.test(v)).slice(0, 8);
  const supabase = await createClient();
  const row = { subject: parsed.data.subject, intro: parsed.data.intro, news_ids: newsIds };
  if (id) {
    const { error } = await supabase.from("newsletter_campaigns").update(row).eq("id", id).eq("status", "draft");
    if (error) return { status: "error", message: "La lettre n'a pas pu être enregistrée.", values };
    refresh();
    return { status: "success", message: "Brouillon enregistré.", values };
  }
  const { data, error } = await supabase.from("newsletter_campaigns").insert({ ...row, created_by: ctx.user.id }).select("id").single();
  if (error) return { status: "error", message: "La lettre n'a pas pu être créée.", values };
  redirect(`/admin/newsletter/${data.id}`);
}

async function buildFor(campaignId: string, token: string) {
  const supabase = await createClient();
  const { data: c } = await supabase.from("newsletter_campaigns").select("subject,intro,news_ids").eq("id", campaignId).maybeSingle();
  if (!c) return null;
  const [articles, { contact }] = await Promise.all([loadNewsletterArticles((c.news_ids as string[]) ?? []), getSiteSettings()]);
  const unsubscribeUrl = `${SITE_URL}/newsletter/desinscription?t=${token}`;
  return {
    email: buildNewsletterEmail({ subject: c.subject as string, intro: c.intro as string, articles, unsubscribeUrl }, { siteUrl: SITE_URL, contactEmail: contact.email }),
    headers: {
      "List-Unsubscribe": `<${SITE_URL}/newsletter/desinscription/un-clic?t=${token}>, <mailto:${contact.email}?subject=D%C3%A9sinscription>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

export async function sendCampaignTest(_prev: FormState, formData: FormData): Promise<FormState> {
  let ctx;
  try {
    ctx = await guard();
  } catch (e) {
    return { status: "error", message: (e as Error).message };
  }
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { status: "error", message: "Lettre invalide." };
  const built = await buildFor(id.data, "00000000-0000-0000-0000-000000000000");
  if (!built) return { status: "error", message: "Lettre introuvable." };
  const res = await deliver({ to: ctx.user.email, subject: `[Test] ${built.email.subject}`, html: built.email.html, text: built.email.text });
  return res.ok ? { status: "success", message: `Test envoyé à ${ctx.user.email}.` } : { status: "error", message: res.error };
}

/** Démarre l'envoi : une ligne d'envoi est préparée pour chaque abonné actif. */
export async function startCampaign(campaignId: string): Promise<{ ok: true; total: number } | { ok: false; error: string }> {
  try {
    await guard();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  if (!isEmailConfigured) return { ok: false, error: "Serveur SMTP non configuré : impossible d'envoyer la lettre." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_newsletter_campaign", { p_campaign_id: campaignId });
  const message = sqlMessage(error, "L'envoi n'a pas pu démarrer.");
  if (message) return { ok: false, error: message };
  return { ok: true, total: Number(data ?? 0) };
}

/**
 * Envoie le lot suivant (25 lettres au plus, ~20 s maximum) et renvoie l'avancement.
 * Le navigateur rappelle cette action tant qu'il reste des envois : aucune
 * fonction serveur ne dépasse ainsi sa durée maximale d'exécution.
 */
export async function sendCampaignBatch(campaignId: string): Promise<{ ok: true; sent: number; failed: number; pending: number } | { ok: false; error: string }> {
  try {
    await guard();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const started = Date.now();
  const supabase = await createClient();
  const { data: batch } = await supabase.from("newsletter_deliveries").select("subscriber_id,email,token").eq("campaign_id", campaignId).eq("status", "pending").limit(25);

  // Lettre construite une fois par lot ; seul le jeton de désinscription change par abonné.
  const PLACEHOLDER = "ffffffff-ffff-ffff-ffff-ffffffffffff";
  const built = batch?.length ? await buildFor(campaignId, PLACEHOLDER) : null;
  if (batch?.length && !built) return { ok: false, error: "Lettre introuvable." };
  const personalize = (s: string, token: string) => s.split(PLACEHOLDER).join(token);

  for (const d of batch ?? []) {
    if (Date.now() - started > 20_000 || !built) break;
    const token = d.token as string;
    const res = await deliver({
      to: d.email as string,
      subject: built.email.subject,
      html: personalize(built.email.html, token),
      text: personalize(built.email.text, token),
      headers: Object.fromEntries(Object.entries(built.headers).map(([k, v]) => [k, personalize(v, token)])),
    });
    await supabase
      .from("newsletter_deliveries")
      .update(res.ok ? { status: "sent", sent_at: new Date().toISOString(), error: null } : { status: "failed", error: res.error.slice(0, 300) })
      .eq("campaign_id", campaignId)
      .eq("subscriber_id", d.subscriber_id);
  }

  const { data, error } = await supabase.rpc("refresh_newsletter_campaign", { p_campaign_id: campaignId });
  if (error) return { ok: false, error: "Impossible de lire l'avancement." };
  const progress = data as { sent: number; failed: number; pending: number };
  if (!progress.pending) refresh();
  return { ok: true, ...progress };
}

export async function deleteCampaign(formData: FormData) {
  await guard();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("newsletter_campaigns").delete().eq("id", id).eq("status", "draft");
  redirect("/admin/newsletter");
}
