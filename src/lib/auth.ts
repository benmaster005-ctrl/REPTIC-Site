import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Couche d'accès aux données d'authentification (DAL).
 * Toutes ces fonctions lisent les cookies : à appeler derrière un <Suspense>,
 * dans une Server Action ou un Route Handler. La RLS reste la protection de fond.
 */

export type RoleKey = "candidate" | "member" | "editor" | "manager" | "admin";

export type CurrentUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: RoleKey;
  status: "pending" | "active" | "suspended" | "archived";
};

export const getSessionUserId = cache(async (): Promise<string | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
});

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id,email,first_name,last_name,phone,role_key,status")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone,
    role: data.role_key,
    status: data.status,
  };
});

export async function requireUser(next = "/espace"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?suite=${encodeURIComponent(next)}`);
  return user;
}

const STAFF_ROLES: RoleKey[] = ["editor", "manager", "admin"];
export const isStaff = (user: CurrentUser) => STAFF_ROLES.includes(user.role) && user.status === "active";
