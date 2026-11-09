import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Export CSV des abonnés à la lettre (Excel : « ; » et UTF-8 avec BOM). Réservé à « contact.manage ». */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Authentification requise", { status: 401 });
  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_permission", { perm: "contact.manage" });
  if (!allowed) return new Response("Accès refusé", { status: 403 });

  const { data } = await supabase.from("newsletter_subscribers").select("email,consented_at,unsubscribed_at").order("consented_at", { ascending: false }).limit(20000);
  const cell = (v: unknown) => {
    const t = v == null ? "" : String(v);
    const safe = /^[=+\-@\t\r]/.test(t) ? `'${t}` : t;
    return /[;"\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const lines = (data ?? []).map((r) => [r.email, String(r.consented_at).slice(0, 10), r.unsubscribed_at ? "Désinscrit" : "Abonné", r.unsubscribed_at ? String(r.unsubscribed_at).slice(0, 10) : ""].map(cell).join(";"));
  const csv = "﻿" + ["E-mail;Inscrit le;Statut;Désinscrit le", ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="abonnes-newsletter-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
