"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { assertPermission, sqlMessage } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";

async function guard(): Promise<FormState | null> {
  try {
    await assertPermission("members.manage");
    return null;
  } catch (e) {
    return { status: "error", message: (e as Error).message };
  }
}

const opt = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);

const memberSchema = z.object({
  member_id: z.uuid(),
  first_name: opt(80),
  last_name: opt(80),
  profession: opt(120),
  city: opt(80),
  country: opt(80),
  phone: opt(30),
  bio: opt(600),
  directory_visibility: z.enum(["public", "members", "hidden"]).transform((v) => (v === "hidden" ? null : v)),
});

const MEMBER_FIELDS = ["first_name", "last_name", "profession", "city", "country", "phone", "bio", "directory_visibility"];

/** Correction d'une fiche membre par le secrétariat. */
export async function updateMember(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await guard();
  if (denied) return denied;
  const values = formValues(formData, MEMBER_FIELDS);
  const parsed = memberSchema.safeParse({ ...values, member_id: formData.get("member_id") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  const { member_id, ...row } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("members").update(row).eq("id", member_id);
  if (error) return { status: "error", message: "La fiche n'a pas pu être enregistrée.", values };
  refresh();
  return { status: "success", message: "Fiche membre enregistrée.", values };
}

const orgSchema = z.object({
  organization_id: z.uuid(),
  legal_name: z.string().trim().min(1, { error: "Raison sociale obligatoire." }).max(160),
  legal_form: opt(40),
  registration_number: opt(60),
  tax_id: opt(40),
  address: opt(200),
  city: opt(80),
  phone: opt(30),
  email: z.string().trim().max(254).optional().transform((v) => v || null).pipe(z.email({ error: "E-mail invalide." }).nullable()),
  website: opt(200),
  rep_first_name: opt(80),
  rep_last_name: opt(80),
  rep_title: opt(80),
});
const ORG_FIELDS = ["legal_name", "legal_form", "registration_number", "tax_id", "address", "city", "phone", "email", "website", "rep_first_name", "rep_last_name", "rep_title"];

export async function updateOrganization(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await guard();
  if (denied) return denied;
  const values = formValues(formData, ORG_FIELDS);
  const parsed = orgSchema.safeParse({ ...values, organization_id: formData.get("organization_id") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  const { organization_id, ...row } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update(row).eq("id", organization_id);
  if (error) return { status: "error", message: "L'entreprise n'a pas pu être enregistrée.", values };
  refresh();
  return { status: "success", message: "Informations de l'entreprise enregistrées.", values };
}

const statusSchema = z.object({
  member_id: z.uuid(),
  status: z.enum(["active", "suspended", "archived"]),
  reason: z.string().trim().max(500).optional(),
});

/** Suspendre, réactiver ou archiver (§6.1). */
export async function setMemberStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await guard();
  if (denied) return denied;
  const parsed = statusSchema.safeParse({ member_id: formData.get("member_id"), status: formData.get("status"), reason: formData.get("reason") ?? undefined });
  if (!parsed.success) return { status: "error", message: "Demande invalide." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_member_status", { p_member_id: parsed.data.member_id, p_status: parsed.data.status, p_reason: parsed.data.reason || null });
  const message = sqlMessage(error, "Le statut n'a pas pu être modifié.");
  if (message) return { status: "error", message };
  refresh();
  const done = { active: "Compte réactivé.", suspended: "Compte suspendu.", archived: "Membre archivé." }[parsed.data.status];
  return { status: "success", message: `${done} Le membre a été notifié.` };
}

const renewSchema = z
  .object({
    member_id: z.uuid(),
    starts_on: z.iso.date({ error: "Date invalide." }),
    ends_on: z.iso.date({ error: "Date invalide." }),
  })
  .refine((v) => v.ends_on >= v.starts_on, { path: ["ends_on"], error: "La fin doit suivre le début." });

/** Nouvelle période d'adhésion (renouvellement). */
export async function renewMembership(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await guard();
  if (denied) return denied;
  const values = formValues(formData, ["starts_on", "ends_on"]);
  const parsed = renewSchema.safeParse({ ...values, member_id: formData.get("member_id") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  const supabase = await createClient();
  const { data: last } = await supabase.from("memberships").select("category_id").eq("member_id", parsed.data.member_id).order("starts_on", { ascending: false }).limit(1).maybeSingle();
  await supabase.from("memberships").update({ status: "expired" }).eq("member_id", parsed.data.member_id).eq("status", "active").lt("ends_on", parsed.data.starts_on);
  const { error } = await supabase
    .from("memberships")
    .insert({ member_id: parsed.data.member_id, category_id: last?.category_id ?? null, status: "active", starts_on: parsed.data.starts_on, ends_on: parsed.data.ends_on });
  if (error) return { status: "error", message: "La période n'a pas pu être créée.", values };
  refresh();
  return { status: "success", message: "Nouvelle période d'adhésion enregistrée.", values };
}
