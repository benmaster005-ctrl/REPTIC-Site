import type { Metadata } from "next";
import Image from "next/image";
import { getGovernance } from "@/lib/data/public";
import { initials } from "@/lib/format";
import { EmptyState, PageHero } from "@/components/ui/content";
import { RevealGroup } from "@/components/motion/Reveal";
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
      <section className="container-site py-16 sm:py-24">
        {members.length ? (
          <RevealGroup as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {members.map((m) => {
              const pending = m.fullName === "À renseigner";
              return (
                <li key={m.id} className="group overflow-hidden rounded-3xl border border-line bg-white transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-cyan/40 hover:shadow-[0_22px_48px_-24px_rgb(35_45_87/0.4)]">
                  <div className="relative aspect-square overflow-hidden bg-paper">
                    {m.photoUrl ? (
                      <Image src={m.photoUrl} alt={`Portrait de ${m.fullName}`} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover grayscale-[35%] transition-[filter,transform] duration-700 group-hover:scale-105 group-hover:grayscale-0" />
                    ) : (
                      <span aria-hidden className="absolute inset-0 grid place-items-center font-display text-6xl font-extrabold tracking-[-0.025em] text-line-strong">
                        {initials(pending ? m.positionTitle : m.fullName)}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="inline-flex rounded-full bg-cyan-tint px-3 py-1 text-[0.74rem] font-semibold text-cyan-dark">{m.positionTitle}</p>
                    <p className={`mt-3 font-display text-[1.2rem] font-bold tracking-[-0.01em] ${pending ? "text-muted" : "text-navy"}`}>{m.fullName}</p>
                    {m.organization && <p className="mt-1 text-[0.92rem] text-muted">{m.organization}</p>}
                  </div>
                </li>
              );
            })}
          </RevealGroup>
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
