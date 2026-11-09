import { type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listMembers } from "@/lib/data/admin";
import { applicantTypeLabels } from "@/lib/membership";
import { accountStatusLabels } from "@/lib/admin";

/**
 * Export de la liste des membres au format CSV (ouvrable dans Excel :
 * séparateur « ; », encodage UTF-8 avec BOM). Réservé à « members.export »,
 * et chaque export est journalisé (§6.1).
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new Response("Authentification requise", { status: 401 });
  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_permission", { perm: "members.export" });
  if (!allowed) return new Response("Accès refusé", { status: 403 });

  const sp = request.nextUrl.searchParams;
  const filters = { q: sp.get("q") ?? undefined, type: sp.get("type") ?? undefined, status: sp.get("statut") ?? undefined };
  const { rows } = await listMembers({ ...filters, all: true });

  const header = ["Numéro", "Nom / raison sociale", "Type", "E-mail", "Téléphone", "Ville", "Domaine", "Statut du compte", "Fin d'adhésion", "Membre depuis"];
  const cell = (v: unknown) => {
    const t = v == null ? "" : String(v);
    // Neutralise l'injection de formules dans le tableur
    const safe = /^[=+\-@\t\r]/.test(t) ? `'${t}` : t;
    return /[;"\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const lines = rows.map((r) => {
    const raw = r.raw as Record<string, unknown>;
    const org = (Array.isArray(raw.organization) ? raw.organization[0] : raw.organization) as Record<string, unknown> | null;
    return [
      r.number,
      r.name,
      applicantTypeLabels[r.type],
      r.email,
      (raw.phone as string) ?? org?.phone ?? "",
      r.city,
      r.category,
      r.accountStatus ? accountStatusLabels[r.accountStatus] ?? r.accountStatus : "",
      r.membershipEnds,
      r.createdAt.slice(0, 10),
    ]
      .map(cell)
      .join(";");
  });

  await supabase.rpc("log_member_export", { p_count: rows.length, p_filters: filters });

  const csv = "﻿" + [header.join(";"), ...lines].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="membres-reptic-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
