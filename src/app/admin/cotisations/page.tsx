import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Download } from "lucide-react";
import { requirePermission } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { formatAmount, isDemoPayment, isPaymentEnabled, provider } from "@/lib/payments";
import { formatDateTime } from "@/lib/format";
import { AdminHeader, DataTable, FilterBar, Flash, Panel, StatusTag, listHref, str } from "@/components/admin/ui";
import { FeesForm } from "@/components/admin/FeesForm";

export const metadata: Metadata = { title: "Cotisations" };

const statusTag = { paid: ["Payée", "success"], pending: ["En attente", "info"], failed: ["Échouée", "danger"], cancelled: ["Abandonnée", "neutral"] } as const;

export default function FeesAdminPage({ searchParams }: PageProps<"/admin/cotisations">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <FeesAdmin searchParams={searchParams} />
    </Suspense>
  );
}

type PayRow = {
  id: string;
  reference: string;
  year: number;
  amount: number;
  currency: string;
  status: keyof typeof statusTag;
  payment_method: string | null;
  created_at: string;
  paid_at: string | null;
  member: { id: string; member_number: string | null; first_name: string | null; last_name: string | null; organization: { legal_name: string } | null } | null;
};

async function FeesAdmin({ searchParams }: Pick<PageProps<"/admin/cotisations">, "searchParams">) {
  const { can } = await requirePermission("members.read");
  const p = await searchParams;
  const year = str(p.annee) ?? String(new Date().getFullYear());
  const statutParam = str(p.statut);
  const statut = statutParam === undefined ? "paid" : statutParam || "all"; // vide = tous les statuts
  const supabase = await createClient();

  let query = supabase
    .from("payments")
    .select("id,reference,year,amount,currency,status,payment_method,created_at,paid_at,member:members(id,member_number,first_name,last_name,organization:organizations(legal_name))")
    .eq("year", Number(year))
    .order("created_at", { ascending: false })
    .limit(500);
  if (statut !== "all") query = query.eq("status", statut);
  const [{ data: fees, error: feesError }, { data, error }, { count: activeMembers }] = await Promise.all([
    supabase.from("membership_fees").select("member_type,amount"),
    query,
    supabase.from("members").select("id, account:profiles!inner(status)", { count: "exact", head: true }).eq("account.status", "active"),
  ]);
  const rows = (data ?? []) as unknown as PayRow[];
  const { data: paidYear } = await supabase.from("payments").select("amount,member_id").eq("year", Number(year)).eq("status", "paid");
  const total = (paidYear ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const payers = new Set((paidYear ?? []).map((r) => r.member_id)).size;
  const feeOf = (t: string) => (fees ?? []).find((f) => f.member_type === t)?.amount;
  const years = [0, 1, 2].map((i) => String(new Date().getFullYear() + 1 - i));

  return (
    <>
      <AdminHeader
        label="Adhésions"
        title="Cotisations"
        description="Tarifs annuels et paiements en ligne des membres (année civile)."
        action={<StatusTag tone={isPaymentEnabled ? (isDemoPayment ? "warning" : "success") : "neutral"}>{isPaymentEnabled ? (isDemoPayment ? "Mode démonstration" : `Paiement actif · ${provider?.label}`) : "Paiement non configuré"}</StatusTag>}
      />
      {(feesError || error) && <Flash tone="error">Exécutez la migration 20261115000009_cotisations.sql dans Supabase pour activer les cotisations.</Flash>}
      {!isPaymentEnabled && !feesError && (
        <Flash tone="error">Le paiement en ligne n&apos;est pas actif : renseignez les clés CinetPay (ou PAYMENT_PROVIDER=demo pour tester) et PAYMENT_CONFIRM_SECRET.</Flash>
      )}

      <div className="mt-8 grid gap-px bg-line sm:grid-cols-3">
        <div className="bg-white p-6">
          <p className="label">Encaissé en {year}</p>
          <p className="mt-3 font-display text-[2rem] leading-none font-extrabold text-navy tabular-nums">{formatAmount(total)}</p>
        </div>
        <div className="bg-white p-6">
          <p className="label">Membres à jour</p>
          <p className="mt-3 font-display text-[2rem] leading-none font-extrabold text-navy tabular-nums">
            {payers}
            <span className="text-[1rem] font-semibold text-muted"> / {activeMembers ?? 0}</span>
          </p>
        </div>
        <div className="flex flex-col justify-between bg-white p-6">
          <p className="label">Liste des paiements</p>
          <a href={listHref("/admin/cotisations/export", { annee: year, statut })} download className="link-arrow mt-3 self-start">
            <Download aria-hidden className="size-4" /> Exporter (Excel)
          </a>
        </div>
      </div>

      {can("members.manage") && !feesError && (
        <Panel className="mt-6">
          <h2 className="label mb-5">Tarifs annuels</h2>
          <FeesForm initial={{ physical: feeOf("physical") ? String(feeOf("physical")) : "", legal: feeOf("legal") ? String(feeOf("legal")) : "" }} />
        </Panel>
      )}

      <FilterBar
        search={false}
        selects={[
          { name: "annee", label: "Année", value: year, options: years.map((y) => ({ value: y, label: y })) },
          { name: "statut", label: "Tous les statuts", value: statut === "all" ? "" : statut, options: Object.entries(statusTag).map(([value, [label]]) => ({ value, label })) },
        ]}
      />
      <DataTable head={["Référence", "Membre", "Montant", "Statut", "Moyen", "Date"]} empty={rows.length ? undefined : "Aucun paiement pour ces filtres."}>
        {rows.map((r) => {
          const [label, tone] = statusTag[r.status];
          const name = r.member?.organization?.legal_name ?? ([r.member?.first_name, r.member?.last_name].filter(Boolean).join(" ") || "—");
          return (
            <tr key={r.id}>
              <td className="font-mono text-[0.8rem] whitespace-nowrap">{r.reference}</td>
              <td>
                {r.member ? (
                  <Link href={`/admin/membres/${r.member.id}`} className="font-semibold text-navy underline-offset-4 hover:underline">
                    {name}
                  </Link>
                ) : (
                  name
                )}
                {r.member?.member_number && <span className="block font-mono text-[0.72rem] text-muted">{r.member.member_number}</span>}
              </td>
              <td className="font-mono text-[0.85rem] whitespace-nowrap">{formatAmount(r.amount, r.currency)}</td>
              <td className="whitespace-nowrap">
                <StatusTag tone={tone}>{label}</StatusTag>
              </td>
              <td className="text-muted">{r.payment_method ?? "—"}</td>
              <td className="font-mono text-[0.78rem] whitespace-nowrap text-muted">{formatDateTime(r.paid_at ?? r.created_at)}</td>
            </tr>
          );
        })}
      </DataTable>
    </>
  );
}
