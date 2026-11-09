import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { applicationSteps, memberBenefits, requiredDocuments } from "@/content/site";
import { getPage } from "@/lib/data/public";
import { PageHero, RichText, RuledList, SectionHeader } from "@/components/ui/content";
import { Node } from "@/components/brand/Trace";
import { RevealGroup } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Adhésion",
  description: "Conditions, catégories de membres, avantages, procédure et pièces à fournir pour adhérer à REPTIC.CM.",
  alternates: { canonical: "/adhesion" },
};

const profiles = [
  { id: "physique", kind: "Personne physique", title: "Professionnels indépendants", audience: "Consultants, experts et indépendants des télécoms et du numérique.", documents: requiredDocuments.physical },
  { id: "morale", kind: "Personne morale", title: "Entreprises et organisations", audience: "Entreprises, startups et associations du secteur numérique.", documents: requiredDocuments.legal },
];

export default async function MembershipPage() {
  const conditions = await getPage("conditions-adhesion");
  return (
    <>
      <PageHero
        title="Adhérer au REPTIC"
        eyebrow="Adhésion"
        summary="Rejoignez le réseau des entreprises et professionnels du numérique au Cameroun. La demande se fait entièrement en ligne."
        crumbs={[{ label: "Membres" }]}
      />

      <section className="container-site py-16 sm:py-24">
        <SectionHeader label="Avantages" title="Pourquoi adhérer" />
        <div className="mt-12 lg:ml-[calc(25%+0.375rem)]">
          <RuledList items={memberBenefits} columns={2} />
        </div>
      </section>

      <section className="bg-paper py-16 sm:py-24">
        <div className="container-site">
          <SectionHeader label="Catégories" title="Deux profils, deux dossiers" description="Les pièces demandées dépendent de votre profil." />
          <RevealGroup className="mt-12 grid gap-px bg-line-strong lg:ml-[calc(25%+0.375rem)] lg:grid-cols-2">
            {profiles.map((p) => (
              <article key={p.id} id={p.id} className="bg-white p-8 sm:p-10">
                <p className="label text-cyan-dark">{p.kind}</p>
                <h2 className="mt-4 font-display text-[1.6rem] leading-tight font-bold tracking-[-0.02em] text-navy">{p.title}</h2>
                <p className="mt-2 text-[0.98rem] text-muted">{p.audience}</p>
                <h3 className="label mt-10">Pièces à fournir</h3>
                <ul className="mt-4 border-b border-line">
                  {p.documents.map((d) => (
                    <li key={d} className="flex items-center gap-3 border-t border-line py-3 text-[0.95rem] text-ink">
                      <Node className="size-2" /> {d}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </RevealGroup>
          <p className="mt-6 font-mono text-[0.75rem] text-muted lg:ml-[calc(25%+0.375rem)]">
            Liste indicative, fixée définitivement par le règlement d&apos;adhésion.
          </p>
        </div>
      </section>

      <section className="container-site py-16 sm:py-24">
        <SectionHeader label="Procédure" title="Cinq étapes, en ligne" />
        <RevealGroup as="ol" className="mt-12 grid border-t-2 border-navy sm:grid-cols-5 lg:ml-[calc(25%+0.375rem)]">
          {applicationSteps.map((s, i) => (
            <li key={s.title} className="relative border-b border-line py-6 sm:border-b-0 sm:pr-6">
              <span aria-hidden className="absolute -top-[7px] left-0 hidden size-3 rounded-full border-2 border-navy bg-white sm:block" />
              <p className="font-mono text-[0.75rem] text-cyan-dark sm:mt-3">Étape {i + 1}</p>
              <p className="mt-2 font-display text-[1.1rem] font-bold text-navy">{s.title}</p>
              <p className="mt-1 text-[0.9rem] leading-relaxed text-muted">{s.description}</p>
            </li>
          ))}
        </RevealGroup>

        {conditions?.body && (
          <div className="mt-20 lg:ml-[calc(25%+0.375rem)]">
            <h2 className="heading-md">{conditions.title}</h2>
            <div className="mt-6">
              <RichText>{conditions.body}</RichText>
            </div>
          </div>
        )}
      </section>

      <section className="bg-navy text-white">
        <div className="container-site flex flex-col gap-8 py-14 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-[1.8rem] leading-tight font-extrabold tracking-[-0.02em]">Prêt à déposer votre dossier ?</p>
            <p className="mt-2 text-white/70">Préparez vos justificatifs : la saisie prend une quinzaine de minutes.</p>
          </div>
          <Link href="/adhesion/demande" className="btn-inverse shrink-0">
            Déposer ma demande <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
