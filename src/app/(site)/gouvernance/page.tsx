import type { Metadata } from "next";
import Image from "next/image";
import { getGovernance } from "@/lib/data/public";
import { initials } from "@/lib/format";
import { EmptyState, PageHero } from "@/components/ui/content";
import { RevealGroup } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Bureau exécutif",
  description: "La gouvernance de REPTIC.CM : composition du bureau exécutif, fonctions et mandats.",
  alternates: { canonical: "/gouvernance" },
};

export default async function GovernancePage() {
  const members = await getGovernance();
  return (
    <>
      <PageHero
        title="Bureau exécutif"
        eyebrow="Gouvernance"
        summary="Les membres élus qui pilotent l'association et mettent en œuvre ses orientations stratégiques."
        crumbs={[{ label: "Le REPTIC" }]}
      />
      <section className="container-site py-16 sm:py-24">
        {members.length ? (
          <RevealGroup as="ul" className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {members.map((m) => {
              const pending = m.fullName === "À renseigner";
              return (
                <li key={m.id}>
                  <div className="relative aspect-[4/5] overflow-hidden bg-paper">
                    {m.photoUrl ? (
                      <Image src={m.photoUrl} alt={`Portrait de ${m.fullName}`} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover grayscale-[20%]" />
                    ) : (
                      <span aria-hidden className="absolute inset-0 grid place-items-center font-display text-6xl font-extrabold tracking-[-0.04em] text-line-strong">
                        {initials(pending ? m.positionTitle : m.fullName)}
                      </span>
                    )}
                  </div>
                  <div className="border-t-2 border-navy pt-4">
                    <p className="label text-cyan-dark">{m.positionTitle}</p>
                    <p className={`mt-2 font-display text-[1.2rem] font-bold tracking-[-0.01em] ${pending ? "text-muted" : "text-navy"}`}>{m.fullName}</p>
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
