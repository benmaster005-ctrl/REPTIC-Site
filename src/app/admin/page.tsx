import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { getStaffContext } from "@/lib/admin";
import { getAdminStats, listApplications } from "@/lib/data/admin";
import { applicantTypeLabels, statusLabels } from "@/lib/membership";
import { formatDate } from "@/lib/format";
import { applicationTone } from "@/components/space/application";
import { AdminHeader, Flash, Panel, StatusTag } from "@/components/admin/ui";
import { displayName } from "@/lib/space";

export const metadata: Metadata = { title: "Tableau de bord" };

export default function AdminDashboardPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

function Kpi({ label, value, href, hint }: { label: string; value: number | string; href?: string; hint?: string }) {
  const body = (
    <>
      <p className="label">{label}</p>
      <p className="mt-3 font-display text-[2.6rem] leading-none font-extrabold tracking-[-0.025em] text-navy tabular-nums">{value}</p>
      {hint && <p className="mt-2 text-[0.8rem] text-muted">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="group block bg-white p-6 transition-colors hover:bg-cyan-tint">
      {body}
    </Link>
  ) : (
    <div className="bg-white p-6">{body}</div>
  );
}

async function Dashboard({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  const { user, can } = await getStaffContext();
  const sp = await searchParams;
  const [stats, recent] = await Promise.all([
    can("stats.read") ? getAdminStats() : null,
    can("applications.read") ? listApplications({ status: "open", page: 1 }) : null,
  ]);
  const maxCat = Math.max(1, ...(stats?.by_category ?? []).map((c) => c.count));

  return (
    <>
      <AdminHeader label="Pilotage" title={`Bonjour ${displayName(user)}`} description="Vue d'ensemble de l'activité du réseau." />
      {sp.acces === "refuse" && <Flash tone="error">Vous n&apos;avez pas accès à cette rubrique avec votre rôle.</Flash>}

      {stats && (
        <div className="mt-8 grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Dossiers à traiter" value={stats.applications_pending} href={can("applications.read") ? "/admin/demandes?statut=open" : undefined} hint={`${stats.applications_waiting_candidate} en attente de complément`} />
          <Kpi label="Demandes reçues" value={stats.applications_received} hint={`${stats.applications_last_30d} sur les 30 derniers jours`} />
          <Kpi label="Membres actifs" value={stats.members_active} href={can("members.read") ? "/admin/membres?statut=active" : undefined} hint={stats.members_suspended ? `${stats.members_suspended} suspendu(s)` : undefined} />
          <Kpi label="Messages à traiter" value={stats.contact_unread} href={can("contact.manage") ? "/admin/messages" : undefined} hint={`${stats.newsletter} abonné(s) à la lettre`} />
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-12">
        {recent && (
          <Panel className="xl:col-span-7">
            <div className="flex items-center justify-between">
              <h2 className="label">Dossiers en attente</h2>
              <Link href="/admin/demandes?statut=open" className="link-arrow">
                Tout voir <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
            <ul className="mt-4 border-t-2 border-navy">
              {recent.rows.slice(0, 8).map((a) => (
                <li key={a.id} className="border-b border-line">
                  <Link href={`/admin/demandes/${a.id}`} className="grid gap-1 py-3.5 transition-colors hover:bg-paper sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4 sm:px-2">
                    <span>
                      <span className="block font-semibold text-navy">{a.applicant}</span>
                      <span className="font-mono text-[0.72rem] text-muted">
                        {a.reference} · {applicantTypeLabels[a.type]} · {a.submittedAt ? formatDate(a.submittedAt, { day: "2-digit", month: "2-digit" }) : ""}
                      </span>
                    </span>
                    <StatusTag tone={applicationTone(a.status)}>{statusLabels[a.status]}</StatusTag>
                  </Link>
                </li>
              ))}
              {!recent.rows.length && <li className="py-6 text-muted">Aucun dossier en attente. Tout est à jour.</li>}
            </ul>
          </Panel>
        )}

        {stats && (
          <Panel className="xl:col-span-5">
            <h2 className="label">Répartition des membres actifs</h2>
            <div className="mt-5 flex gap-6">
              {(["physical", "legal"] as const).map((t) => (
                <div key={t}>
                  <p className="font-display text-3xl font-extrabold text-navy tabular-nums">{stats.by_type[t] ?? 0}</p>
                  <p className="text-[0.82rem] text-muted">{applicantTypeLabels[t]}</p>
                </div>
              ))}
            </div>
            <h3 className="label mt-8">Par domaine d&apos;activité</h3>
            <ul className="mt-3 space-y-3">
              {stats.by_category.map((c) => (
                <li key={c.name}>
                  <div className="flex justify-between text-[0.85rem]">
                    <span className="text-navy">{c.name}</span>
                    <span className="font-mono text-muted tabular-nums">{c.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-paper">
                    <div className="h-full bg-cyan" style={{ width: `${(c.count / maxCat) * 100}%` }} />
                  </div>
                </li>
              ))}
              {!stats.by_category.length && <li className="text-[0.9rem] text-muted">Aucun membre actif pour le moment.</li>}
            </ul>
          </Panel>
        )}

        {!stats && !recent && (
          <Panel className="xl:col-span-12">
            <p className="text-muted">Utilisez le menu pour gérer les contenus du site.</p>
          </Panel>
        )}
      </div>
    </>
  );
}
