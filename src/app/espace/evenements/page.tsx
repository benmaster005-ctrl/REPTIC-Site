import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getSpaceContext } from "@/lib/space";
import { getMemberEvents, isPast, upcomingEvents } from "@/lib/data/member";
import { cancelEventRegistration, registerForEvent } from "@/app/actions/member";
import { formatDate } from "@/lib/format";
import { MembersOnly, Panel, SpaceFlash, SpaceHeader, StatusTag } from "@/components/space/ui";

export const metadata: Metadata = { title: "Événements" };

export default function MemberEventsPage({ searchParams }: PageProps<"/espace/evenements">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <MemberEvents searchParams={searchParams} />
    </Suspense>
  );
}

async function MemberEvents({ searchParams }: Pick<PageProps<"/espace/evenements">, "searchParams">) {
  const { user, isMember } = await getSpaceContext("/espace/evenements");
  if (!isMember) return (<><SpaceHeader label="Événements" title="Événements" /><MembersOnly feature="L'inscription aux événements" /></>);
  const [params, events] = await Promise.all([searchParams, getMemberEvents(user.id)]);
  const upcoming = upcomingEvents(events);

  return (
    <>
      <SpaceHeader label="Événements" title="Agenda du réseau" description="Inscrivez-vous aux événements ouverts aux inscriptions." />
      {params.inscrit === "1" && <SpaceFlash>Votre inscription est enregistrée.</SpaceFlash>}
      {params.annule === "1" && <SpaceFlash>Votre inscription est annulée.</SpaceFlash>}
      {params.erreur && <SpaceFlash tone="error">L&apos;inscription n&apos;a pas pu être enregistrée (inscriptions closes ou complètes).</SpaceFlash>}

      <Panel className="mt-8 p-0 sm:p-0">
        {upcoming.length ? (
          <ul>
            {upcoming.map((e) => {
              const reg = e.registration && e.registration.status !== "cancelled" ? e.registration : null;
              const closed = isPast(e.registrationDeadline);
              return (
                <li key={e.id} id={`evenement-${e.id}`} className="grid scroll-mt-8 gap-5 border-b border-line px-6 py-6 last:border-b-0 sm:grid-cols-[5rem_1fr_auto] sm:items-center sm:px-8">
                  <p className="leading-none">
                    <span className="block font-display text-[2.2rem] font-extrabold tracking-[-0.025em] text-navy">{formatDate(e.startsAt, { day: "2-digit" })}</span>
                    <span className="mt-1 block font-mono text-[0.72rem] text-muted uppercase">{formatDate(e.startsAt, { month: "short", year: "numeric" })}</span>
                  </p>
                  <div>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {e.membersOnly && <span className="label text-cyan-dark">Réservé aux membres</span>}
                      {reg && <StatusTag tone={reg.status === "waitlisted" ? "warning" : "success"}>{reg.status === "waitlisted" ? "Liste d'attente" : "Inscrit"}</StatusTag>}
                    </p>
                    <p className="mt-1 font-display text-[1.15rem] font-bold text-navy">
                      <Link href={`/evenements/${e.slug}`} className="hover:text-cyan-dark">
                        {e.title}
                      </Link>
                    </p>
                    <p className="text-[0.9rem] text-muted">
                      {formatDate(e.startsAt, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                  </div>
                  <div>
                    {reg ? (
                      <form action={cancelEventRegistration}>
                        <input type="hidden" name="registration_id" value={reg.id} />
                        <button type="submit" className="btn-secondary px-4 py-2 text-[0.85rem]">
                          Annuler
                        </button>
                      </form>
                    ) : e.registrationEnabled && !closed ? (
                      <form action={registerForEvent}>
                        <input type="hidden" name="event_id" value={e.id} />
                        <button type="submit" className="btn-primary px-4 py-2 text-[0.85rem]">
                          S&apos;inscrire
                        </button>
                      </form>
                    ) : (
                      <span className="font-mono text-[0.72rem] text-muted">{closed ? "Inscriptions closes" : "Sans inscription"}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="p-8 text-muted">Aucun événement à venir.</p>
        )}
      </Panel>
    </>
  );
}
