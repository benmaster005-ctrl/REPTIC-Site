import { type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Export CSV des paiements de cotisation (Excel). Réservé à « members.export ». */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new Response("Authentification requise", { status: 401 });
  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_permission", { perm: "members.export" });
  if (!allowed) return new Response("Accès refusé", { status: 403 });

  const year = Number(request.nextUrl.searchParams.get("annee")) || new Date().getFullYear();
  const statut = request.nextUrl.searchParams.get("statut") ?? "paid";
  let query = supabase
    .from("payments")
    .select("reference,year,amount,currency,status,payment_method,provider_transaction_id,created_at,paid_at,member:members(member_number,first_name,last_name,organization:organizations(legal_name))")
    .eq("year", year)
    .order("created_at", { ascending: false })
    .limit(10000);
  if (statut !== "all") query = query.eq("status", statut);
  const { data } = await query;

  const cell = (v: unknown) => {
    const t = v == null ? "" : String(v);
    const safe = /^[=+\-@\t\r]/.test(t) ? `'${t}` : t;
    return /[;"\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const labels: Record<string, string> = { paid: "Payée", pending: "En attente", failed: "Échouée", cancelled: "Abandonnée" };
  const lines = (data ?? []).map((r) => {
    const m = (Array.isArray(r.member) ? r.member[0] : r.member) as { member_number?: string; first_name?: string; last_name?: string; organization?: { legal_name?: string } | { legal_name?: string }[] } | null;
    const org = Array.isArray(m?.organization) ? m?.organization[0] : m?.organization;
    const name = org?.legal_name ?? [m?.first_name, m?.last_name].filter(Boolean).join(" ");
    return [r.reference, m?.member_number ?? "", name, r.year, r.amount, r.currency, labels[r.status as string] ?? r.status, r.payment_method ?? "", r.provider_transaction_id ?? "", String(r.paid_at ?? r.created_at).slice(0, 16).replace("T", " ")]
      .map(cell)
      .join(";");
  });
  await supabase.rpc("log_member_export", { p_count: lines.length, p_filters: { type: "cotisations", year, statut } });
  const csv = "﻿" + ["Référence;Numéro de membre;Membre;Année;Montant;Devise;Statut;Moyen de paiement;Transaction;Date", ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cotisations-${year}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
