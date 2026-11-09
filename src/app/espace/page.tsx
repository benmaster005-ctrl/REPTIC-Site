import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { getSpaceContext, displayName } from "@/lib/space";
import { getMemberEvents, getMemberNews, getMyApplication, getNotifications, upcomingEvents } from "@/lib/data/member";
import { statusLabels, statusDescriptions } from "@/lib/membership";
import { formatDate } from "@/lib/format";
import { Panel, SpaceFlash, SpaceHeader, StatusTag } from "@/components/space/ui";
import { applicationTone } from "@/components/space/application";

export const metadata: Metadata = { title: "Tableau de bord" };

export default function DashboardPage({ searchParams }: PageProps<"/espace">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: Pick<PageProps<"/espace">, "searchParams">) {
  const { user, isMember } = await getSpaceContext();
  const [{ mdp }, application, notifications] = await Promise.all([searchParams, getMyApplication(user.id), getNotifications(user.id, 4)]);
  const [news, events] = isMember ? await Promise.all([getMemberNews(3), getMemberEvents(user.id)]) : [[], []];
  const upcoming = upcomingEvents(events).slice(0, 3);

  return (
    <>
      <SpaceHeader label="Tableau de bord" title={`Bonjour ${displayName(user)}`} description={isMember ? "Retrouvez votre adhésion, les annonces et les prochaines échéances du réseau." : "Votre compte candidat vous permet de constituer et de suivre votre demande d'adhésion."} />
      {mdp === "ok" && <SpaceFlash>Votre mot de passe a été modifié.</SpaceFlash>}

      <div className="mt-8 grid gap-6 xl:grid-cols-5">
        {/* Adhésion */}
        <Panel className="xl:col-span-3">
          <p className="label">{isMember ? "Mon adhésion" : "Ma demande"}</p>
          {application ? (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <StatusTag tone={applicationTone(application.status)}>{statusLabels[application.status]}</StatusTag>
                <span className="font-mono text-[0.75rem] text-muted">{application.reference}</span>
              </div>
              <p className="mt-3 font-display text-[1.4rem] leading-tight font-bold text-navy">{statusDescriptions[application.status]}</p>
              {application.status === "additional_info" && application.decisionReason && (
                <p className="mt-3 border-l-[3px] border-amber-500 pl-4 text-[0.95rem] text-ink">{application.decisionReason}</p>
              )}
              <Link href="/espace/adhesion" className="link-arrow mt-6">
                {application.status === "draft" ? "Reprendre ma demande" : application.status === "additional_info" ? "Compléter mon dossier" : "Voir le suivi"}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </>
          ) : (
            <>
              <p className="mt-3 font-display text-[1.4rem] leading-tight font-bold text-navy">Vous n&apos;avez pas encore commencé votre demande.</p>
              <p className="mt-2 text-[0.95rem] text-muted">Comptez une quinzaine de minutes, justificatifs prêts.</p>
              <Link href="/espace/adhesion" className="btn-primary mt-6">
                Commencer ma demande <ArrowRight aria-hidden className="size-4" />
              </Link>
            </>
          )}
        </Panel>

        {/* Notifications */}
        <Panel className="xl:col-span-2">
          <div className="flex items-center justify-between">
            <p className="label">Notifications</p>
            <Link href="/espace/notifications" className="text-sm font-semibold text-navy hover:text-cyan-dark">
              Tout voir
            </Link>
          </div>
          {notifications.length ? (
            <ul className="mt-4">
              {notifications.map((n) => (
                <li key={n.id} className="border-t border-line py-3 first:border-t-0">
                  <p className={`text-[0.92rem] ${n.readAt ? "text-muted" : "font-semibold text-navy"}`}>{n.title}</p>
                  <p className="mt-0.5 font-mono text-[0.72rem] text-muted">{formatDate(n.createdAt, { day: "2-digit", month: "2-digit", year: "numeric" })}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[0.92rem] text-muted">Aucune notification pour le moment.</p>
          )}
        </Panel>

        {isMember && (
          <>
            <Panel className="xl:col-span-3">
              <div className="flex items-center justify-between">
                <p className="label">Annonces</p>
                <Link href="/espace/actualites" className="text-sm font-semibold text-navy hover:text-cyan-dark">
                  Toutes les actualités
                </Link>
              </div>
              <ul className="mt-4">
                {news.map((n) => (
                  <li key={n.slug} className="border-t border-line py-4 first:border-t-0">
                    <p className="font-mono text-[0.72rem] text-muted">
                      {formatDate(n.publishedAt, { day: "2-digit", month: "2-digit", year: "numeric" })}
                      {n.membersOnly && <span className="ml-3 text-cyan-dark">Réservé aux membres</span>}
                    </p>
                    <Link href={`/espace/actualites/${n.slug}`} className="mt-1 block font-semibold text-navy hover:text-cyan-dark">
                      {n.title}
                    </Link>
                  </li>
                ))}
                {!news.length && <li className="text-[0.92rem] text-muted">Aucune annonce.</li>}
              </ul>
            </Panel>
            <Panel className="xl:col-span-2">
              <div className="flex items-center justify-between">
                <p className="label">Prochaines échéances</p>
                <Link href="/espace/evenements" className="text-sm font-semibold text-navy hover:text-cyan-dark">
                  Agenda
                </Link>
              </div>
              <ul className="mt-4">
                {upcoming.map((e) => (
                  <li key={e.id} className="grid grid-cols-[3.5rem_1fr] gap-3 border-t border-line py-3 first:border-t-0">
                    <span className="font-display text-2xl leading-none font-extrabold text-navy">
                      {formatDate(e.startsAt, { day: "2-digit" })}
                      <span className="mt-1 block font-mono text-[0.68rem] font-normal text-muted uppercase">{formatDate(e.startsAt, { month: "short" })}</span>
                    </span>
                    <span>
                      <span className="block text-[0.92rem] font-semibold text-navy">{e.title}</span>
                      {e.registration && e.registration.status !== "cancelled" && <span className="mt-1 block font-mono text-[0.7rem] text-cyan-dark">Inscrit</span>}
                    </span>
                  </li>
                ))}
                {!upcoming.length && <li className="text-[0.92rem] text-muted">Aucun événement à venir.</li>}
              </ul>
            </Panel>
          </>
        )}
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy className="space-y-6">
      <div className="h-24 animate-pulse bg-white/60" />
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="h-56 animate-pulse bg-white xl:col-span-3" />
        <div className="h-56 animate-pulse bg-white xl:col-span-2" />
      </div>
    </div>
  );
}
