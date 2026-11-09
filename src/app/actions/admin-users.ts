"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { assertPermission, sqlMessage } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { type FormState } from "@/lib/forms";

async function guard(): Promise<FormState | null> {
  try {
    await assertPermission("users.manage");
    return null;
  } catch (e) {
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
