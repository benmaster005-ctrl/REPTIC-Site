import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { heroBanners, missions } from "@/content/site";
import { getActorCategories, getEvents, getKeyFigures, getLatestNews } from "@/lib/data/public";
import { EmptyState, EventRow, JoinBand, NewsCard, SectionHeader } from "@/components/ui/content";
import { ActorMarquee, HeroMosaic, MissionBento } from "@/components/ui/modern";
import { SectionLabel } from "@/components/brand/Trace";
import { RevealGroup } from "@/components/motion/Reveal";
import { RiseWords } from "@/components/motion/RiseWords";
import { LinkedinPosts } from "@/components/ui/LinkedinPosts";

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
              <SectionLabel>Télécoms, TIC et numérique</SectionLabel>
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
          <div className="lg:col-span-6">
            <HeroMosaic figures={figures} />
          </div>
        </div>

        <div className="container-site pb-14 sm:pb-16">
          <p className="label mb-4">Les familles d&apos;acteurs du réseau</p>
          <ActorMarquee categories={actors} />
        </div>
      </section>

      {/* Missions */}
      <section className="py-20 sm:py-28">
        <div className="container-site">
          <SectionHeader
            label="Missions"
            title="Six chantiers pour structurer le secteur"
            action={{ label: "Objectifs & missions", href: "/objectifs-missions" }}
          />
          <div className="mt-12">
            <MissionBento missions={missions} image={heroBanners.presentation} href="/objectifs-missions" />
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
          <RevealGroup className="mt-12 grid gap-4 lg:ml-[calc(25%+0.375rem)] lg:grid-cols-2">
            {profiles.map((p) => (
              <Link key={p.anchor} href={`/adhesion#${p.anchor}`} className="group flex flex-col rounded-xl border border-line bg-white p-8 transition-[background-color,transform] duration-300 hover:-translate-y-1 hover:bg-navy sm:p-10">
                <span className="label text-cyan-dark group-hover:text-cyan">{p.kind}</span>
                <span className="mt-4 font-display text-[1.6rem] leading-tight font-bold tracking-[-0.02em] text-navy group-hover:text-white">{p.title}</span>
                <span className="mt-3 text-[0.98rem] leading-relaxed text-muted group-hover:text-white/70">{p.text}</span>
                <span className="mt-10 inline-flex items-center gap-3 text-sm font-semibold text-navy group-hover:text-white">
                  Conditions et pièces à fournir
                  <span className="grid size-9 place-items-center rounded-full bg-cyan-tint text-cyan-dark transition-[transform,background-color,color] duration-300 group-hover:translate-x-1 group-hover:bg-cyan group-hover:text-white">
                    <ArrowRight aria-hidden className="size-4" />
                  </span>
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
              <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
                <div className="lg:col-span-7">
                  <NewsCard item={featured} size="feature" />
                </div>
                <div className="grid content-start gap-4 lg:col-span-5">
                  {others.map((n, i) => (
                    <NewsCard key={n.slug} item={n} size="compact" delay={120 + i * 100} />
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
              <RevealGroup as="ul" className="grid gap-3">
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

      <LinkedinPosts />

      <JoinBand />
    </>
  );
}
