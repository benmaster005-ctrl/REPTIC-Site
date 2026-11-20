import type { Metadata } from "next";
import { getGovernance } from "@/lib/data/public";
import { EmptyState, PageHero } from "@/components/ui/content";
import { BoardCard } from "@/components/ui/BoardCard";
import { heroBanners } from "@/content/site";

export const metadata: Metadata = {
  title: "Bureau exécutif",
  description: "La gouvernance de REPTIC.CM : composition du bureau exécutif, fonctions et mandats.",
  alternates: { canonical: "/gouvernance" },
};

export default async function GovernancePage() {
  const members = await getGovernance();
  return (
    <>
      <PageHero image={heroBanners.gouvernance}
        title="Bureau exécutif"
        eyebrow="Gouvernance"
        summary="Les membres élus qui pilotent l'association et mettent en œuvre ses orientations stratégiques."
        crumbs={[{ label: "Le REPTIC" }]}
      />
      <section className="panel panel-pad bg-ice">
        {members.length ? (
          <ul data-stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {members.map((m) => (
              <li key={m.id}>
                <BoardCard member={m} className="h-full" sizes="(min-width: 1280px) 18vw, (min-width: 640px) 30vw, 45vw" />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="La composition du bureau sera publiée prochainement." />
        )}
        <p className="mt-16 font-mono text-[0.75rem] text-muted">
          Seules les informations autorisées par les personnes concernées sont publiées.
        </p>
      </section>
    </>
  );
}
