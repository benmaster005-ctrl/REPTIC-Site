import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Download, Plus } from "lucide-react";
import { requirePermission } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { AdminHeader, DataTable, Flash, Panel, StatusTag } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Lettre d'information" };

export default function NewsletterAdminPage() {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <NewsletterAdmin />
    </Suspense>
  );
}

const statusTag = { draft: ["Brouillon", "neutral"], sending: ["Envoi en cours", "info"], sent: ["Envoyée", "success"] } as const;

async function NewsletterAdmin() {
  await requirePermission("contact.manage");
  const supabase = await createClient();
  const [active, unsubscribed, campaigns] = await Promise.all([
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).is("unsubscribed_at", null),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).not("unsubscribed_at", "is", null),
    supabase.from("newsletter_campaigns").select("id,subject,status,total,sent_count,failed_count,created_at,sent_at").order("created_at", { ascending: false }).limit(50),
  ]);
  const rows = (campaigns.data ?? []) as { id: string; subject: string; status: keyof typeof statusTag; total: number; sent_count: number; failed_count: number; created_at: string; sent_at: string | null }[];

  return (
    <>
      <AdminHeader
        label="Relations"
        title="Lettre d'information"
        description="Rédigez et envoyez la lettre aux abonnés. Chaque lettre contient un lien personnel de désinscription."
        action={
          <Link href="/admin/newsletter/nouvelle" className="btn-primary">
            <Plus aria-hidden className="size-4" /> Nouvelle lettre
          </Link>
        }
      />
      {campaigns.error && <Flash tone="error">Exécutez la migration 20261114000008_stories_bloc2.sql dans Supabase pour activer l&apos;envoi des lettres.</Flash>}
      <div className="mt-8 grid gap-px bg-line sm:grid-cols-3">
        <div className="bg-white p-6">
          <p className="label">Abonnés actifs</p>
          <p className="mt-3 font-display text-[2.4rem] leading-none font-extrabold text-navy tabular-nums">{active.count ?? 0}</p>
        </div>
        <div className="bg-white p-6">
          <p className="label">Désinscrits</p>
          <p className="mt-3 font-display text-[2.4rem] leading-none font-extrabold text-navy tabular-nums">{unsubscribed.count ?? 0}</p>
        </div>
        <div className="flex flex-col justify-between bg-white p-6">
          <p className="label">Liste des abonnés</p>
          <a href="/admin/newsletter/abonnes" download className="link-arrow mt-3 self-start">
            <Download aria-hidden className="size-4" /> Exporter (Excel)
          </a>
        </div>
      </div>
      <Panel className="mt-6 p-0 sm:p-0">
        <DataTable head={["Lettre", "Statut", "Envoi", "Créée le"]} empty={rows.length ? undefined : "Aucune lettre pour le moment."}>
          {rows.map((c) => {
            const [label, tone] = statusTag[c.status] ?? statusTag.draft;
            return (
              <tr key={c.id}>
                <td>
                  <Link href={`/admin/newsletter/${c.id}`} className="font-semibold text-navy underline-offset-4 hover:text-cyan-dark hover:underline">
                    {c.subject}
                  </Link>
                </td>
                <td className="whitespace-nowrap">
                  <StatusTag tone={tone}>{label}</StatusTag>
                </td>
                <td className="font-mono text-[0.8rem] whitespace-nowrap text-muted">
                  {c.status === "draft" ? "—" : `${c.sent_count}/${c.total}${c.failed_count ? ` · ${c.failed_count} échec(s)` : ""}`}
                </td>
                <td className="font-mono text-[0.8rem] whitespace-nowrap text-muted">{formatDateTime(c.created_at)}</td>
              </tr>
            );
          })}
        </DataTable>
      </Panel>
    </>
  );
}
