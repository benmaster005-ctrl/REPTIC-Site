import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePermission } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { getCategoriesOf } from "@/lib/data/admin";
import { isEmailConfigured } from "@/lib/email/send";
import { formatDateTime } from "@/lib/format";
import { AdminHeader, DataTable, Flash, Panel } from "@/components/admin/ui";
import { BroadcastForm } from "@/components/admin/BroadcastForm";

export const metadata: Metadata = { title: "Messages de diffusion" };

const audienceLabels: Record<string, string> = {
  all: "Tous les membres",
  physical: "Personnes physiques",
  legal: "Entreprises",
  category: "Domaine d'activité",
  staff: "Équipe",
};

export default function BroadcastPage() {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Broadcasts />
    </Suspense>
  );
}

type Row = { id: string; title: string; audience: string; send_email: boolean; recipients_count: number; emailed_count: number; created_at: string; category: { name: string } | null; author: { first_name: string | null; last_name: string | null; email: string } | null };

async function Broadcasts() {
  await requirePermission("broadcasts.send");
  const supabase = await createClient();
  const [categories, { data, error }] = await Promise.all([
    getCategoriesOf("actor"),
    supabase
      .from("broadcasts")
      .select("id,title,audience,send_email,recipients_count,emailed_count,created_at,category:categories(name),author:profiles(first_name,last_name,email)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <AdminHeader label="Relations" title="Messages de diffusion" description="Alertez les membres : le message apparaît dans leur espace (notification) et peut aussi partir par e-mail." />
      {error && <Flash tone="error">Exécutez la migration 20261114000008_stories_bloc2.sql dans Supabase pour activer les messages de diffusion.</Flash>}
      {!isEmailConfigured && <Flash tone="error">Serveur SMTP non configuré : les messages partiront uniquement en notification.</Flash>}
      <Panel className="mt-8">
        <h2 className="label mb-5">Nouveau message</h2>
        <BroadcastForm categories={categories} />
      </Panel>
      <h2 className="label mt-10">Historique</h2>
      <DataTable head={["Date", "Message", "Destinataires", "Membres", "E-mails", "Par"]} empty={rows.length ? undefined : "Aucun message diffusé."}>
        {rows.map((b) => (
          <tr key={b.id}>
            <td className="font-mono text-[0.78rem] whitespace-nowrap text-muted">{formatDateTime(b.created_at)}</td>
            <td className="font-semibold text-navy">{b.title}</td>
            <td className="whitespace-nowrap text-muted">
              {audienceLabels[b.audience] ?? b.audience}
              {b.category?.name ? ` : ${b.category.name}` : ""}
            </td>
            <td className="font-mono text-[0.85rem]">{b.recipients_count}</td>
            <td className="font-mono text-[0.85rem] text-muted">{b.send_email ? b.emailed_count : "—"}</td>
            <td className="text-muted">{b.author ? [b.author.first_name, b.author.last_name].filter(Boolean).join(" ") || b.author.email : "—"}</td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
