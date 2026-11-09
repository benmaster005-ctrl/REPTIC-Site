import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { requireUser, type CurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Contrôle d'accès du back-office (§6). Les permissions viennent de la base
 * (role_permissions) ; chaque page et chaque action vérifie la sienne, et la
 * RLS / les fonctions SQL revérifient côté base.
 */

export type Permission =
  | "applications.read"
  | "applications.review"
  | "members.read"
  | "members.manage"
  | "members.export"
  | "documents.manage"
  | "content.manage"
  | "events.manage"
  | "contact.manage"
  | "users.manage"
  | "roles.manage"
  | "settings.manage"
  | "audit.read"
  | "stats.read";

export type StaffContext = { user: CurrentUser; permissions: Set<Permission>; can: (p: Permission) => boolean };

export const getStaffContext = cache(async (): Promise<StaffContext> => {
  const user = await requireUser("/admin");
  if (user.status !== "active" || !["editor", "manager", "admin"].includes(user.role)) redirect("/espace?acces=admin");
  const supabase = await createClient();
  const { data } = await supabase.from("role_permissions").select("permission_key").eq("role_key", user.role);
  const permissions = new Set((data ?? []).map((r) => r.permission_key as Permission));
  return { user, permissions, can: (p) => permissions.has(p) };
});

/** Pour une page : redirige vers le tableau de bord si la permission manque. */
export async function requirePermission(p: Permission) {
  const ctx = await getStaffContext();
  if (!ctx.can(p)) redirect("/admin?acces=refuse");
  return ctx;
}

/** Pour une action : lève une erreur lisible si la permission manque. */
export async function assertPermission(p: Permission) {
  const ctx = await getStaffContext();
  if (!ctx.can(p)) throw new Error("Vous n'avez pas les droits nécessaires pour cette action.");
  return ctx;
}

export const roleLabels: Record<string, string> = {
  candidate: "Candidat",
  member: "Membre",
  editor: "Éditeur",
  manager: "Gestionnaire",
  admin: "Administrateur",
};

export const accountStatusLabels: Record<string, string> = {
  pending: "En attente",
  active: "Actif",
  suspended: "Suspendu",
  archived: "Archivé",
};

/** Message d'erreur SQL destiné à l'utilisateur (exceptions métier P0001/P0002/42501). */
export function sqlMessage(error: { code?: string; message: string } | null, fallback: string) {
  if (!error) return null;
  if (error.code === "P0001" || error.code === "P0002" || error.code === "42501") return error.message;
  console.error(fallback, error.message);
  return fallback;
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export const contentStatus: Record<string, { label: string; tone: "success" | "info" | "neutral" | "warning" }> = {
  draft: { label: "Brouillon", tone: "neutral" },
  published: { label: "Publiée", tone: "success" },
  scheduled: { label: "Programmée", tone: "info" },
  archived: { label: "Archivée", tone: "warning" },
};
