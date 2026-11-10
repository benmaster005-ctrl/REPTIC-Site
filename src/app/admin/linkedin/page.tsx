import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowUpRight } from "lucide-react";
import { requirePermission } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { COMPANY_URL, isLinkedinSyncConfigured } from "@/lib/linkedin";
import { setLinkedinPostVisibility, syncLinkedinNow } from "@/app/actions/admin-linkedin";
import { formatDateTime } from "@/lib/format";
import { AdminHeader, DataTable, Flash, Panel, StatusTag } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/forms";

export const metadata: Metadata = { title: "LinkedIn" };

export default function LinkedinAdminPage() {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <LinkedinAdmin />
    </Suspense>
  );
}

const runTone = { running: ["En cours", "info"], imported: ["Importée", "success"], failed: ["Échouée", "danger"] } as const;

async function LinkedinAdmin() {
  await requirePermission("content.manage");
  const supabase = await createClient();
  const [{ data: posts, error }, { data: runs }] = await Promise.all([
    supabase.from("linkedin_posts").select("id,url,text,posted_at,num_likes,num_comments,is_visible").order("posted_at", { ascending: false, nullsFirst: false }).limit(60),
    supabase.from("linkedin_sync_runs").select("id,status,records,error,created_at,finished_at").order("created_at", { ascending: false }).limit(8),
  ]);

  return (
    <>
      <AdminHeader
        label="Contenus"
        title="Posts LinkedIn"
        description="Posts de la page LinkedIn du REPTIC.CM, collectés par Bright Data et affichés sur l'accueil et la page Actualités."
        action={<StatusTag tone={isLinkedinSyncConfigured ? "success" : "neutral"}>{isLinkedinSyncConfigured ? "Synchronisation configurée" : "Non configurée"}</StatusTag>}
      />
      {error && <Flash tone="error">Exécutez la migration 20261117000012_linkedin.sql dans Supabase.</Flash>}
      {!isLinkedinSyncConfigured && <Flash tone="error">Renseignez BRIGHTDATA_API_KEY et LINKEDIN_SYNC_SECRET dans les variables d&apos;environnement.</Flash>}

      <Panel className="mt-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h2 className="label">Synchronisation</h2>
            <p className="mt-2 max-w-xl text-[0.9rem] text-muted">
              Automatique chaque matin. La collecte prend quelques minutes : un premier clic la lance, un second l&apos;importe. Chaque post collecté est facturé par Bright Data.
            </p>
            <a href={COMPANY_URL} target="_blank" rel="noopener noreferrer" className="link-arrow mt-3">
              Page LinkedIn <ArrowUpRight aria-hidden className="size-4" />
            </a>
          </div>
          <ActionForm action={syncLinkedinNow} submitLabel="Synchroniser maintenant" pendingLabel="Synchronisation…" className="space-y-3" />
        </div>
        {(runs ?? []).length > 0 && (
          <ul className="mt-6 border-t border-line">
            {(runs ?? []).map((r) => {
              const [label, tone] = runTone[r.status as keyof typeof runTone] ?? runTone.running;
              return (
                <li key={r.id as number} className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3 text-[0.88rem]">
                  <span className="font-mono text-[0.78rem] text-muted">{formatDateTime(r.created_at as string)}</span>
                  <span className="text-muted">{r.status === "imported" ? `${r.records ?? 0} post(s)` : ((r.error as string) ?? "")}</span>
                  <StatusTag tone={tone}>{label}</StatusTag>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <DataTable head={["Post", "Date", "Réactions", "Affiché", ""]} empty={(posts ?? []).length ? undefined : "Aucun post importé pour le moment."}>
        {(posts ?? []).map((p) => (
          <tr key={p.id as string}>
            <td className="max-w-md">
              <p className="line-clamp-2 text-navy">{(p.text as string) ?? "(sans texte)"}</p>
              <a href={p.url as string} target="_blank" rel="noopener noreferrer" className="text-[0.8rem] font-semibold text-cyan-dark hover:underline">
                Ouvrir sur LinkedIn
              </a>
            </td>
            <td className="font-mono text-[0.78rem] whitespace-nowrap text-muted">{p.posted_at ? formatDateTime(p.posted_at as string) : "—"}</td>
            <td className="font-mono text-[0.8rem] whitespace-nowrap text-muted">
              {(p.num_likes as number | null) ?? 0} · {(p.num_comments as number | null) ?? 0}
            </td>
            <td>
              <StatusTag tone={p.is_visible ? "success" : "neutral"}>{p.is_visible ? "Oui" : "Masqué"}</StatusTag>
            </td>
            <td>
              <form action={setLinkedinPostVisibility}>
                <input type="hidden" name="id" value={p.id as string} />
                <input type="hidden" name="visible" value={p.is_visible ? "0" : "1"} />
                <button type="submit" className="text-[0.85rem] font-semibold text-navy hover:text-cyan-dark">
                  {p.is_visible ? "Masquer" : "Afficher"}
                </button>
              </form>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
