import type { Metadata } from "next";
import { getEvents } from "@/lib/data/public";
import { EmptyState, PageHero, SectionHeader } from "@/components/ui/content";
import { EventTicket } from "@/components/ui/EventTicket";
import { RevealGroup } from "@/components/motion/Reveal";
import { heroBanners } from "@/content/site";

export const metadata: Metadata = {
  title: "Événements",
  description: "Forums, ateliers et rencontres du réseau des acteurs du numérique camerounais.",
  alternates: { canonical: "/evenements" },
};

export default async function EventsPage() {
  const { upcoming, past } = await getEvents();
  return (
    <>
      <PageHero image={heroBanners.evenements} title="Événements" eyebrow="Agenda" summary="Forums, ateliers et rencontres du réseau." />
      <section className="panel panel-pad bg-surface">
        <SectionHeader label="À venir" title="Prochains rendez-vous" />
        <div className="mt-12 lg:ml-[calc(25%+0.375rem)]">
          {upcoming.length ? (
            <RevealGroup as="ul" className="grid gap-3">
              {upcoming.map((e) => (
                <li key={e.slug}><EventTicket item={e} notch="var(--color-surface)" /></li>
              ))}
            </RevealGroup>
          ) : (
            <EmptyState title="Aucun événement programmé pour le moment." />
          )}
        </div>
      </section>
      {past.length > 0 && (
        <section className="panel panel-pad bg-surface">
          <div>
            <SectionHeader label="Archives" title="Événements passés" />
            <RevealGroup as="ul" className="mt-12 grid gap-3 lg:ml-[calc(25%+0.375rem)]">
              {past.slice(0, 10).map((e) => (
                <li key={e.slug}><EventTicket item={e} notch="var(--color-surface)" /></li>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}
    </>
  );
}
