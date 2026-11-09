"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { assertPermission, sqlMessage } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { type FormState } from "@/lib/forms";

async function guard(): Promise<FormState | null> {
  try {
    await assertPermission("applications.review");
    return null;
  } catch (e) {
    return { status: "error", message: (e as Error).message };
  }
}

const idSchema = z.uuid({ error: "Dossier invalide." });

export async function takeApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await guard();
  if (denied) return denied;
  const id = idSchema.safeParse(formData.get("application_id"));
  if (!id.success) return { status: "error", message: "Dossier invalide." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_application", { p_application_id: id.data, p_decision: "take" });
  const message = sqlMessage(error, "La prise en charge a échoué.");
  if (message) return { status: "error", message };
  refresh();
  return { status: "success", message: "Dossier pris en charge. Le candidat voit qu'il est en cours d'examen." };
}

const reasonSchema = z.object({
  application_id: idSchema,
  decision: z.enum(["additional_info", "reject"]),
  reason: z.string().trim().min(10, { error: "Rédigez un message d'au moins 10 caractères : il sera transmis au candidat." }).max(2000),
});

export async function decideApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await guard();
  if (denied) return denied;
  const values = { reason: String(formData.get("reason") ?? "") };
  const parsed = reasonSchema.safeParse({ application_id: formData.get("application_id"), decision: formData.get("decision"), reason: values.reason });
  if (!parsed.success) return { status: "error", fieldErrors: { reason: z.flattenError(parsed.error).fieldErrors.reason }, values };
  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_application", {
    p_application_id: parsed.data.application_id,
    p_decision: parsed.data.decision,
    p_reason: parsed.data.reason,
  });
  const message = sqlMessage(error, "La décision n'a pas pu être enregistrée.");
  if (message) return { status: "error", message, values };
  refresh();
  return {
    status: "success",
    message: parsed.data.decision === "reject" ? "Demande refusée. Le candidat a été notifié avec votre motif." : "Complément demandé. Le dossier est rouvert pour le candidat.",
  };
}

const acceptSchema = z
  .object({
    application_id: idSchema,
    category_id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
    starts_on: z.iso.date({ error: "Date de début invalide." }),
    ends_on: z.iso.date({ error: "Date de fin invalide." }).optional().or(z.literal("").transform(() => undefined)),
    directory: z.enum(["members", "public"]),
  })
  .refine((v) => !v.ends_on || v.ends_on >= v.starts_on, { path: ["ends_on"], error: "La fin doit suivre le début." });

export async function acceptApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await guard();
  if (denied) return denied;
  const values = Object.fromEntries(["category_id", "starts_on", "ends_on", "directory"].map((k) => [k, String(formData.get(k) ?? "")]));
  const parsed = acceptSchema.safeParse({ ...values, application_id: formData.get("application_id") });
  if (!parsed.success) return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors as FormState["fieldErrors"], values };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_application", {
    p_application_id: parsed.data.application_id,
    p_category_id: parsed.data.category_id ?? null,
    p_starts_on: parsed.data.starts_on,
    p_ends_on: parsed.data.ends_on ?? null,
    p_directory: parsed.data.directory,
  });
  const message = sqlMessage(error, "L'acceptation a échoué.");
  if (message) return { status: "error", message, values };
  refresh();
  return { status: "success", message: `Adhésion acceptée. Numéro de membre attribué : ${data}. Le compte est actif.` };
}
