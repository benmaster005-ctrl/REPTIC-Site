"use server";

import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { publicOrigin } from "@/lib/env";
import { refresh } from "next/cache";
import { z } from "zod";
import { assertPermission, getStaffContext, roleLabels, sqlMessage } from "@/lib/admin";
import { sendTemplatedNow } from "@/lib/email/send";
import { formatDate } from "@/lib/format";
import { displayName } from "@/lib/space";
import { createClient } from "@/lib/supabase/server";
import { type FormState } from "@/lib/forms";

async function guard(): Promise<FormState | null> {
  try {
    await assertPermission("users.manage");
    return null;
  } catch (e) {
    unstable_rethrow(e);
    return { status: "error", message: (e as Error).message };
  }
}

const roleSchema = z.object({
  user_id: z.uuid(),
  role: z.enum(["candidate", "member", "editor", "manager", "admin"]),
});

export async function changeUserRole(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await guard();
  if (denied) return denied;
  const parsed = roleSchema.safeParse({ user_id: formData.get("user_id"), role: formData.get("role") });
  if (!parsed.success) return { status: "error", message: "Rôle invalide." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_user_role", { p_user_id: parsed.data.user_id, p_role: parsed.data.role });
  const message = sqlMessage(error, "Le rôle n'a pas pu être modifié.");
  if (message) return { status: "error", message, values: { role: parsed.data.role } };
  refresh();
  return { status: "success", message: "Rôle mis à jour.", values: { role: parsed.data.role } };
}

const inviteSchema = z.object({
  email: z.email({ error: "Saisissez une adresse e-mail valide." }),
  role: z.enum(["editor", "manager", "admin"], { error: "Choisissez un rôle." }),
});
const INVITE_DAYS = 7;

/**
 * Ajout d'un utilisateur : crée une invitation à usage unique (rôle d'équipe,
 * valable 7 jours, réservée à l'adresse saisie) et l'envoie par e-mail.
 */
export async function createRoleInvitation(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await guard();
  if (denied) return denied;
  const raw = { email: String(formData.get("email") ?? "").trim(), role: String(formData.get("role") ?? "") };
  const parsed = inviteSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide.", values: raw };

  const supabase = await createClient();
  const { data: token, error } = await supabase.rpc("create_role_invitation", {
    p_role: parsed.data.role,
    p_email: parsed.data.email,
    p_days: INVITE_DAYS,
    p_note: null,
  });
  const message = sqlMessage(error, "L'invitation n'a pas pu être créée.");
  if (message || !token) return { status: "error", message: message ?? "L'invitation n'a pas pu être créée.", values: raw };

  const { user } = await getStaffContext();
  const link = `${publicOrigin((await headers()).get("origin"))}/invitation/${token}`;
  const sent = await sendTemplatedNow("invitation.team", parsed.data.email, {
    role: roleLabels[parsed.data.role],
    invite_par: displayName(user),
    expire_le: formatDate(new Date(Date.now() + INVITE_DAYS * 86_400_000).toISOString()),
    lien: link,
  });
  refresh();
  if (!sent.ok) {
    // Invitation créée mais e-mail non parti : le lien reste transmissible à la main
    return { status: "error", message: `Invitation créée, mais ${sent.error.charAt(0).toLowerCase()}${sent.error.slice(1)} Transmettez ce lien à la personne :`, values: { ...raw, link } };
  }
  return { status: "success", message: `Invitation envoyée à ${parsed.data.email}.`, values: { email: "", role: parsed.data.role } };
}

export async function revokeRoleInvitation(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await guard();
  if (denied) return denied;
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { status: "error", message: "Invitation invalide." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_role_invitation", { p_id: id.data });
  const message = sqlMessage(error, "L'invitation n'a pas pu être annulée.");
  if (message) return { status: "error", message };
  refresh();
  return { status: "success", message: "Invitation annulée." };
}

export async function toggleUserActive(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await guard();
  if (denied) return denied;
  const id = z.uuid().safeParse(formData.get("user_id"));
  if (!id.success) return { status: "error", message: "Compte invalide." };
  const active = formData.get("active") === "1";
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_user_active", { p_user_id: id.data, p_active: active });
  const message = sqlMessage(error, "Le compte n'a pas pu être modifié.");
  if (message) return { status: "error", message };
  refresh();
  return { status: "success", message: active ? "Compte activé." : "Compte désactivé." };
}
