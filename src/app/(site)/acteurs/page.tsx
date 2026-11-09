import type { Metadata } from "next";
import { getActorCategories } from "@/lib/data/public";
import { JoinBand, PageHero } from "@/components/ui/content";
import { NetworkDiagram } from "@/components/brand/NetworkDiagram";
import { RevealGroup } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Nomenclature des acteurs",
  description: "Les familles de professionnels des télécoms, des TIC et du numérique représentées au sein de REPTIC.CM.",
  alternates: { canonical: "/acteurs" },
};

export default async function ActorsPage() {
  const categories = await getActorCategories();
  return (
    <>
      <PageHero
        title="Nomenclature des acteurs"
        eyebrow="Membres"
        summary="Les familles de professionnels qui composent l'écosystème numérique représenté par le réseau."
        crumbs={[{ label: "Membres" }]}
      />
      <section className="hidden border-b border-line bg-paper sm:block">
        <div className="container-site py-14">
          <div className="mx-auto max-w-4xl bg-white px-6 py-8">
            <NetworkDiagram categories={categories} />
          </div>
        </div>
      </section>
      <section className="container-site py-16 sm:py-24">
        <RevealGroup as="ol" className="grid border-b border-line md:grid-cols-2 md:gap-x-12">
          {categories.map((c, i) => (
            <li key={c.slug} id={c.slug} className="grid grid-cols-[3rem_1fr] gap-4 border-t border-line py-8 target:bg-cyan-tint">
              <span className="pt-1.5 font-mono text-[0.8rem] text-cyan-dark">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h2 className="font-display text-[1.45rem] leading-tight font-bold tracking-[-0.015em] text-navy">{c.name}</h2>
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
