"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { assertPermission, sqlMessage } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/env";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";
import { buildBroadcastEmail } from "@/lib/email/content";
import { deliverBcc, isEmailConfigured } from "@/lib/email/send";
import { getSiteSettings } from "@/lib/data/public";

const schema = z
  .object({
    title: z.string().trim().min(3, { error: "Titre trop court." }).max(160),
    body: z.string().trim().min(10, { error: "Message trop court." }).max(5000, { error: "5000 caractères maximum." }),
    audience: z.enum(["all", "physical", "legal", "category", "staff"]),
    category_id: z.string().optional().transform((v) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : null)),
    send_email: z.string().optional().transform((v) => v === "on"),
  })
  .refine((v) => v.audience !== "category" || v.category_id, { path: ["category_id"], error: "Choisissez un domaine d'activité." });

/** Story 12 : message de diffusion (notification dans l'espace + e-mail en copie cachée). */
export async function sendBroadcast(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await assertPermission("broadcasts.send");
  } catch (e) {
    return { status: "error", message: (e as Error).message };
  }
  const values = formValues(formData, ["title", "body", "audience", "category_id", "send_email"]);
  const parsed = schema.safeParse(values);
  if (!parsed.success) return { status: "error", message: "Merci de corriger les champs signalés.", fieldErrors: fieldErrors(parsed.error), values };
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("send_broadcast", {
    p_title: d.title,
    p_body: d.body,
    p_audience: d.audience,
    p_category_id: d.category_id,
    p_send_email: d.send_email,
  });
  const message = sqlMessage(error, "Le message n'a pas pu être envoyé.");
  if (message) return { status: "error", message, values };

  const rows = (data ?? []) as { broadcast_id: string; email: string | null }[];
  const broadcastId = rows[0]?.broadcast_id;
  const emails = rows.map((r) => r.email).filter((e): e is string => Boolean(e));
  const recipients = d.send_email ? emails.length : (await supabase.from("broadcasts").select("recipients_count").eq("id", broadcastId).maybeSingle()).data?.recipients_count ?? 0;

  let emailed = 0;
  if (d.send_email && emails.length && isEmailConfigured && broadcastId) {
    const { contact } = await getSiteSettings();
    const email = buildBroadcastEmail({ title: d.title, body: d.body, url: `${SITE_URL}/espace/messages/${broadcastId}` }, { siteUrl: SITE_URL, contactEmail: contact.email });
    emailed = await deliverBcc(emails, email);
    await supabase.from("broadcasts").update({ emailed_count: emailed }).eq("id", broadcastId);
  }

  refresh();
  if (!recipients) return { status: "success", message: "Message enregistré, mais aucun membre ne correspond à cette audience." };
  const mailPart = !d.send_email
    ? ""
    : !isEmailConfigured
      ? " L'e-mail n'est pas parti : serveur SMTP non configuré."
      : emailed < emails.length
        ? ` E-mail transmis à ${emailed} sur ${emails.length} destinataires (voir les journaux du serveur).`
        : ` E-mail envoyé à ${emailed} destinataire${emailed > 1 ? "s" : ""}.`;
  return { status: "success", message: `Message diffusé à ${recipients} membre${recipients > 1 ? "s" : ""} dans leur espace.${mailPart}` };
}
