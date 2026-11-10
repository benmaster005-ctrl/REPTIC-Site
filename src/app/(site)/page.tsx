import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { missions } from "@/content/site";
import { getActorCategories, getEvents, getKeyFigures, getLatestNews } from "@/lib/data/public";
import { EmptyState, EventRow, JoinBand, NewsCard, RuledList, SectionHeader } from "@/components/ui/content";
import { NetworkDiagram } from "@/components/brand/NetworkDiagram";
import { SectionLabel } from "@/components/brand/Trace";
import { RevealGroup } from "@/components/motion/Reveal";
import { RiseWords } from "@/components/motion/RiseWords";
import { CountUp } from "@/components/motion/CountUp";

const profiles = [
  {
    anchor: "physique",
    kind: "Personne physique",
    title: "Professionnels indépendants",
    text: "Consultants, experts et indépendants des télécoms et du numérique.",
  },
  {
    anchor: "morale",
    kind: "Personne morale",
    title: "Entreprises et organisations",
    text: "Opérateurs, éditeurs, ESN, startups, cabinets, organismes de formation et associations du secteur.",
  },
];

export default async function HomePage() {
  const [figures, news, { upcoming }, actors] = await Promise.all([getKeyFigures(), getLatestNews(3), getEvents(), getActorCategories()]);
  const [featured, ...others] = news;

  return (
    <>
      {/* Ouverture */}
      <section className="overflow-hidden">
        <div className="container-site grid gap-12 pt-14 pb-16 sm:pt-20 lg:grid-cols-12 lg:items-center lg:gap-8 lg:pt-24 lg:pb-24">
          <div className="lg:col-span-6">
            <div className="intro">
              <SectionLabel>Télécoms · TIC · Numérique</SectionLabel>
            </div>
            <h1 className="heading-xl mt-6 text-balance">
              <RiseWords text="Le réseau qui fédère le numérique camerounais" accent="." start={120} />
            </h1>
            <p className="intro mt-7 max-w-xl [--intro-delay:650ms] text-[1.15rem] leading-relaxed text-muted">
              REPTIC.CM réunit les entreprises et les professionnels des télécoms et du numérique pour défendre le secteur,
              accompagner ses acteurs et accélérer la transformation digitale du pays.
            </p>
            <div className="intro mt-10 flex flex-wrap gap-3 [--intro-delay:800ms]">
              <Link href="/adhesion" className="btn-primary">
                Devenir membre <ArrowRight aria-hidden className="size-4" />
              </Link>
              <Link href="/presentation" className="btn-secondary">
                Découvrir le réseau
              </Link>
            </div>
          </div>
          <div className="hidden sm:block lg:col-span-6 lg:-mr-6">
            <NetworkDiagram categories={actors} />
          </div>
        </div>

        {figures.length > 0 && (
          <div className="border-y border-line">
            <RevealGroup as="dl" className="container-site grid grid-cols-2 lg:grid-cols-4">
              {figures.map((f, i) => (
                <div
                  key={f.label}
                  className={`py-8 sm:py-10 ${i % 2 === 1 ? "border-l border-line pl-6 sm:pl-10" : ""} ${i >= 2 ? "border-t border-line lg:border-t-0" : ""} ${i === 2 ? "lg:border-l lg:pl-10" : ""}`}
                >
                  <dt className="label">{f.label}</dt>
                  <dd className="mt-3 font-display text-[2.6rem] leading-none font-extrabold tracking-[-0.025em] text-navy sm:text-[3.4rem]">
                    <CountUp value={f.value} />
                  </dd>
                </div>
              ))}
            </RevealGroup>
          </div>
        )}
      </section>

      {/* Missions */}
      <section className="py-20 sm:py-28">
        <div className="container-site">
          <SectionHeader
            label="Missions"
            title="Six chantiers pour structurer le secteur"
            action={{ label: "Objectifs & missions", href: "/objectifs-missions" }}
          />
          <div className="mt-12 lg:ml-[calc(25%+0.375rem)]">
            <RuledList items={missions} />
          </div>
        </div>
      </section>

      {/* Adhésion */}
      <section className="bg-paper py-20 sm:py-28">
        <div className="container-site">
          <SectionHeader
            label="Adhérer"
            title="Deux portes d'entrée dans le réseau"
            description="La demande se fait en ligne : vous déposez vos justificatifs et suivez l'instruction de votre dossier depuis votre espace."
          />
          <RevealGroup className="mt-12 grid gap-px bg-line-strong lg:ml-[calc(25%+0.375rem)] lg:grid-cols-2">
            {profiles.map((p) => (
              <Link key={p.anchor} href={`/adhesion#${p.anchor}`} className="group flex flex-col bg-white p-8 transition-colors hover:bg-navy sm:p-10">
                <span className="label text-cyan-dark group-hover:text-cyan">{p.kind}</span>
                <span className="mt-4 font-display text-[1.6rem] leading-tight font-bold tracking-[-0.02em] text-navy group-hover:text-white">{p.title}</span>
                <span className="mt-3 text-[0.98rem] leading-relaxed text-muted group-hover:text-white/70">{p.text}</span>
                <span className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-navy group-hover:text-white">
                  Conditions et pièces à fournir <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Actualités */}
      <section className="py-20 sm:py-28">
        <div className="container-site">
          <SectionHeader label="Actualités" title="Ce qui se passe dans le réseau" action={{ label: "Toutes les actualités", href: "/actualites" }} />
          <div className="mt-12">
            {featured ? (
              <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
                <div className="lg:col-span-7">
                  <NewsCard item={featured} size="feature" />
                </div>
                <div className="grid content-start gap-10 lg:col-span-5">
                  {others.map((n, i) => (
                    <NewsCard key={n.slug} item={n} delay={120 + i * 100} />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="Aucune actualité pour le moment." />
            )}
          </div>
        </div>
      </section>

      {/* Agenda */}
      <section className="border-t border-line py-20 sm:py-28">
        <div className="container-site">
          <SectionHeader label="Agenda" title="Prochains rendez-vous" action={{ label: "Tous les événements", href: "/evenements" }} />
          <div className="mt-12 lg:ml-[calc(25%+0.375rem)]">
            {upcoming.length ? (
              <RevealGroup as="ul" className="border-b border-line">
                {upcoming.slice(0, 3).map((e) => (
                  <EventRow key={e.slug} item={e} />
                ))}
              </RevealGroup>
            ) : (
              <EmptyState title="Aucun événement programmé." description="Le prochain rendez-vous sera annoncé ici." />
            )}
          </div>
        </div>
      </section>

      <JoinBand />
    </>
  );
}
