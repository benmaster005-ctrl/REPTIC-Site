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
          <RevealGroup as="ul" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {members.map((m) => {
              const pending = m.fullName === "À renseigner";
              return (
                <li
                  key={m.id}
                  className="group flex flex-col items-center px-4 pt-4 pb-6 text-center"
                >
                  {/* Portrait rond, cerclé de cyan au survol */}
                  <div className="relative size-32 overflow-hidden rounded-full bg-paper ring-4 ring-paper transition-[box-shadow] duration-300 group-hover:ring-cyan-tint">
                    {m.photoUrl ? (
                      <Image
                        src={m.photoUrl}
                        alt={`Portrait de ${m.fullName}`}
                        fill
                        sizes="128px"
                        className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <span aria-hidden className="absolute inset-0 grid place-items-center font-display text-4xl font-extrabold tracking-[-0.025em] text-line-strong">
                        {initials(pending ? m.positionTitle : m.fullName)}
                      </span>
                    )}
                  </div>
                  <p className={`mt-5 font-display text-[1.15rem] leading-snug font-bold tracking-[-0.01em] text-balance ${pending ? "text-muted" : "text-navy"}`}>
                    {m.fullName}
                  </p>
                  <p className="mt-2 inline-flex rounded-full bg-cyan-tint px-3 py-1 text-[0.74rem] font-semibold text-cyan-dark">{m.positionTitle}</p>
                  {m.organization && <p className="mt-2 text-[0.88rem] text-muted">{m.organization}</p>}
                  {m.linkedinUrl && (
                    <a
                      href={m.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Profil LinkedIn de ${m.fullName}`}
                      className="mt-4 grid size-9 place-content-center rounded-full border border-line text-[#0A66C2] transition-colors hover:border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white"
                    >
                      <svg aria-hidden viewBox="0 0 24 24" className="size-4 fill-current">
                        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
                      </svg>
                    </a>
                  )}
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
