import type { Metadata } from "next";
import { getActorCategories } from "@/lib/data/public";
import { JoinBand, PageHero } from "@/components/ui/content";
import { RevealGroup } from "@/components/motion/Reveal";
import { heroBanners } from "@/content/site";

export const metadata: Metadata = {
  title: "Nomenclature des acteurs",
  description: "Les familles de professionnels des télécoms, des TIC et du numérique représentées au sein de REPTIC.CM.",
  alternates: { canonical: "/acteurs" },
};

export default async function ActorsPage() {
  const categories = await getActorCategories();
  return (
    <>
      <PageHero image={heroBanners.acteurs}
        title="Nomenclature des acteurs"
        eyebrow="Membres"
        summary="Les familles de professionnels qui composent l'écosystème numérique représenté par le réseau."
        crumbs={[{ label: "Membres" }]}
      />
      <section className="panel panel-pad bg-surface">
        <RevealGroup as="ol" className="grid border-b border-line md:grid-cols-2 md:gap-x-12">
          {categories.map((c) => (
            <li key={c.slug} id={c.slug} className="border-t border-line py-8 target:bg-cyan-tint">
              <div>
                <h2 className="font-display text-[1.45rem] leading-tight font-bold tracking-[-0.015em] text-heading">{c.name}</h2>
                {c.description && <p className="mt-2 text-[0.98rem] leading-relaxed text-muted">{c.description}</p>}
              </div>
            </li>
          ))}
        </RevealGroup>
      </section>
      <JoinBand />
    </>
  );
}
