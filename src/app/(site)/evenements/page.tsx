import type { Metadata } from "next";
import { getEvents } from "@/lib/data/public";
import { EmptyState, EventRow, PageHero, SectionHeader } from "@/components/ui/content";
import { RevealGroup } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Événements",
  description: "Forums, ateliers et rencontres du réseau des acteurs du numérique camerounais.",
  alternates: { canonical: "/evenements" },
};

export default async function EventsPage() {
  const { upcoming, past } = await getEvents();
  return (
    <>
      <PageHero title="Événements" eyebrow="Agenda" summary="Forums, ateliers et rencontres du réseau." />
      <section className="container-site py-16 sm:py-24">
        <SectionHeader label="À venir" title="Prochains rendez-vous" />
        <div className="mt-12 lg:ml-[calc(25%+0.375rem)]">
          {upcoming.length ? (
            <RevealGroup as="ul" className="border-b border-line">
              {upcoming.map((e) => (
                <EventRow key={e.slug} item={e} />
              ))}
            </RevealGroup>
          ) : (
            <EmptyState title="Aucun événement programmé pour le moment." />
          )}
        </div>
      </section>
      {past.length > 0 && (
        <section className="border-t border-line bg-paper py-16 sm:py-24">
          <div className="container-site">
            <SectionHeader label="Archives" title="Événements passés" />
            <RevealGroup as="ul" className="mt-12 border-b border-line lg:ml-[calc(25%+0.375rem)]">
              {past.slice(0, 10).map((e) => (
                <EventRow key={e.slug} item={e} />
              ))}
            </RevealGroup>
          </div>
        </section>
      )}
    </>
  );
}
