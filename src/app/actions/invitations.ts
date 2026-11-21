"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type FormState } from "@/lib/forms";

/** Acceptation d'un lien d'invitation avec rôle par la personne connectée, puis accès à l'administration. */
export async function acceptRoleInvitation(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  if (!/^[0-9a-f]{48}$/.test(token)) return { status: "error", message: "Lien d'invitation invalide." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_role_invitation", { p_token: token });
  if (error) {
    // Messages explicites des contrôles SQL (expirée, déjà utilisée, autre adresse…)
    const message = error.code === "P0001" || error.code === "42501" ? error.message : "L'invitation n'a pas pu être acceptée.";
    return { status: "error", message };
  }
  redirect("/admin");
}
