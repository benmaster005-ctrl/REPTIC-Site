import Image from "next/image";
import Link from "next/link";
import { missions } from "@/content/site";
import { getEvents, getGovernance, getKeyFigures, getLatestNews } from "@/lib/data/public";
import { formatDate, readingTime } from "@/lib/format";
import { Clock } from "lucide-react";
import type { EventItem, KeyFigure, NewsItem } from "@/lib/types";
import { LinkedinPosts } from "@/components/ui/LinkedinPosts";
import { RiseWords } from "@/components/motion/RiseWords";
import { CapsuleLink } from "@/components/ui/CapsuleLink";
import { AnimatedFigure } from "@/components/ui/AnimatedFigure";
import { Countdown } from "@/components/ui/Countdown";
import { CountUp } from "@/components/motion/CountUp";
import { BoardCard } from "@/components/ui/BoardCard";
import { ScrollRail } from "@/components/ui/ScrollRail";

/*
 * Accueil, version 2 : des panneaux arrondis posés sur une toile gris clair,
 * espacés de 12 px. Ouverture plein écran, grille modulaire dense, actualités
 * en carrousel, Bureau en bande défilante au doigt, appel à l'adhésion.
 */

const panel = "overflow-hidden rounded-[1.75rem] sm:rounded-[2rem]";

export default async function HomePage() {
  const [figures, news, { upcoming }, board] = await Promise.all([getKeyFigures(), getLatestNews(6), getEvents(), getGovernance()]);
  const next = upcoming[0];
  const fig = (needle: string) => figures.find((f) => f.label.toLowerCase().includes(needle));
  const members = fig("membre");
  const sectors = fig("secteur");
  const founded = fig("création") ?? fig("creation");

  return (
    <>
    <div className="mx-auto max-w-[90rem] space-y-3 px-2 pt-3 sm:px-3">
      <Hero next={next} founded={founded} />

      {/* Grille modulaire */}
      <section aria-label="Le réseau en bref" data-stagger className="grid gap-3 lg:grid-cols-12">
        {/* Missions */}
        <div className={`${panel} flex flex-col bg-navy p-7 text-white sm:p-10 lg:col-span-5 lg:row-span-2`}>
          <h2 className="text-[1.9rem] leading-[1.05] font-bold tracking-[-0.03em] sm:text-[2.4rem]">Ce que fait le réseau</h2>
          <ul data-stagger className="mt-8 divide-y divide-white/12 border-y border-white/12">
            {missions.map((m) => (
              <li key={m.title} className="py-3.5 text-[1.02rem] font-medium text-white/90">
                {m.title}
              </li>
            ))}
          </ul>
          <Link href="/objectifs-missions" className="mt-auto inline-flex self-start pt-8 text-sm font-semibold text-[#7cc4ea] hover:text-white">
            Objectifs et missions
          </Link>
        </div>

        {/* Membres */}
        <BigFigure figure={members} fallback={{ value: "100+", label: "Membres" }} className="bg-white lg:col-span-3" href="/adhesion" linkLabel="Rejoindre" since={Number(founded?.value) || 2017} />

        {/* Photo */}
        <Link href="/presentation" className={`${panel} lift group relative min-h-[22rem] lg:col-span-4 lg:row-span-2`}>
          <Image src="/images/reptic/pages/assemblee-generale.webp" alt="" fill sizes="(min-width: 1024px) 30vw, 100vw" className="img-hover object-cover" />
          <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy-deep/85 via-navy-deep/10 to-transparent" />
          <span className="absolute inset-x-0 bottom-0 p-7 text-white">
            <span className="block text-[0.9rem] text-white/75">Assemblée générale, Yaoundé</span>
            <span className="mt-1 block text-[1.5rem] leading-tight font-bold tracking-[-0.02em]">Découvrir l&apos;association</span>
          </span>
        </Link>

        {/* Secteurs */}
        <BigFigure figure={sectors} fallback={{ value: "21", label: "Secteurs représentés" }} className="bg-cyan-tint lg:col-span-3" href="/acteurs" linkLabel="Les familles d'acteurs" />

        {/* Adhésion */}
        <div className={`${panel} grid gap-6 bg-white p-7 sm:p-10 lg:col-span-7 lg:grid-cols-2`}>
          <div>
            <h2 className="text-[1.6rem] leading-[1.1] font-bold tracking-[-0.025em] text-navy sm:text-[2rem]">Deux façons d&apos;adhérer</h2>
            <p className="mt-3 text-[0.98rem] leading-relaxed text-muted">Dossier en ligne, pièces justificatives déposées et suivies depuis votre espace.</p>
            <CapsuleLink href="/adhesion/demande" className="mt-6">
              Déposer ma demande
            </CapsuleLink>
          </div>
          <ul className="grid gap-3">
            <ProfileLink href="/adhesion#physique" kind="Personne physique" title="Professionnels indépendants" />
            <ProfileLink href="/adhesion#morale" kind="Personne morale" title="Entreprises et organisations" />
          </ul>
        </div>

        {/* Contact */}
        <Link href="/contact" className={`${panel} lift group flex flex-col justify-between gap-8 bg-cyan-dark p-7 text-white sm:p-10 lg:col-span-5`}>
          <span className="text-[1.6rem] leading-[1.1] font-bold tracking-[-0.025em] sm:text-[2rem]">Un projet, une question, un partenariat ?</span>
          <span className="flex items-center justify-between gap-4">
            <span className="text-[0.98rem] text-white/80">Le secrétariat vous répond à Yaoundé.</span>
            <span className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-navy transition-transform group-hover:scale-105">Écrire</span>
          </span>
        </Link>
      </section>

      {/* Actualités en carrousel */}
      {news.length > 0 && (
        <section data-anim className={`${panel} bg-white py-8 sm:py-12`}>
          <div className="flex flex-wrap items-end justify-between gap-4 px-7 sm:px-10">
            <h2 className="text-[1.9rem] leading-[1.05] font-bold tracking-[-0.03em] text-navy sm:text-[2.6rem]">Actualités</h2>
            <Link href="/actualites" className="link-arrow">
              Toutes les actualités
            </Link>
          </div>
          <div className="mt-8"><ScrollRail label="Dernières actualités" className="gap-3 scroll-px-7 px-7 pb-2 sm:scroll-px-10 sm:px-10">
            {news.map((n) => (
              <NewsTile key={n.slug} item={n} />
            ))}
          </ScrollRail></div>
        </section>
      )}

      {/* Bureau exécutif */}
      {board.length > 0 && (
        <section data-anim className={`${panel} bg-ice py-8 sm:py-12`}>
          <div className="flex flex-wrap items-end justify-between gap-4 px-7 sm:px-10">
            <div>
              <h2 className="text-[1.9rem] leading-[1.05] font-bold tracking-[-0.03em] text-navy sm:text-[2.6rem]">Le Bureau exécutif</h2>
              <p className="mt-2 text-[0.98rem] text-muted">{board.length} dirigeants du secteur élus pour conduire l&apos;action du réseau.</p>
            </div>
            <Link href="/gouvernance" className="link-arrow">
              Voir tout le bureau
            </Link>
          </div>
          <div className="mt-8"><ScrollRail label="Membres du Bureau exécutif" className="gap-3 scroll-px-7 px-7 pb-2 sm:scroll-px-10 sm:px-10">
            {board.map((m) => (
              <li key={m.id} className="w-[12rem] shrink-0 snap-start">
                <BoardCard member={m} className="h-full" />
              </li>
            ))}
          </ScrollRail></div>
        </section>
      )}

    </div>

      <LinkedinPosts />

    <div className="mx-auto max-w-[90rem] px-2 pt-3 sm:px-3">

      {/* Appel final */}
      <section data-anim className={`${panel} relative isolate bg-navy-deep text-white`}>
        <div className="grid lg:grid-cols-12">
          <div className="p-8 sm:p-12 lg:col-span-7 lg:p-16">
            <h2 className="text-[2.4rem] leading-[1] font-bold tracking-[-0.04em] text-balance sm:text-[3.6rem] lg:text-[4.4rem]">
              Votre entreprise fait le numérique camerounais<span className="text-cyan">.</span>
            </h2>
            <p className="mt-6 max-w-[32rem] text-[1.1rem] leading-relaxed text-white/75">Rejoignez les opérateurs, éditeurs, startups et experts qui portent la voix du secteur.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <CapsuleLink href="/adhesion" tone="light">
                Conditions d&apos;adhésion
              </CapsuleLink>
              <Link href="/contact" className="btn-inverse-outline">
                Nous contacter
              </Link>
            </div>
          </div>
          <div className="relative min-h-[16rem] lg:col-span-5">
            <Image src="/images/reptic/pages/adhesion-reseau.webp" alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover object-[60%_30%]" />
          </div>
        </div>
      </section>
    </div>
    </>
  );
}

function Hero({ next, founded }: { next?: EventItem; founded?: KeyFigure }) {
  return (
    <section className={`${panel} relative isolate flex min-h-[calc(100svh-1.5rem)] flex-col justify-end bg-navy-deep text-white`}>
      <div aria-hidden className="hero-zoom absolute inset-0 -z-20">
        <Image src="/images/reptic/pages/adhesion-reseau.webp" alt="" fill priority sizes="100vw" className="banner-parallax object-cover object-[70%_30%]" />
      </div>
      <div aria-hidden className="absolute inset-0 -z-10 bg-navy-deep/75 lg:bg-transparent lg:bg-gradient-to-r lg:from-navy-deep/95 lg:via-navy-deep/70 lg:to-navy-deep/25" />
      {/* Assombrit le haut de la photo : liens de la navigation lisibles */}
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-44 bg-gradient-to-b from-navy-deep/75 to-transparent" />

      <div className="grid gap-10 p-7 pt-32 sm:p-12 sm:pt-36 lg:grid-cols-12 lg:items-end lg:p-16 lg:pt-40">
        <div className="lg:col-span-8">
          <h1 className="text-[2.9rem] leading-[0.98] font-bold tracking-[-0.045em] sm:text-[4.6rem] lg:text-[6.2rem]">
            <RiseWords text="Le réseau qui fédère le numérique camerounais" accent="." start={150} step={60} />
          </h1>
          <p className="intro mt-7 max-w-[34rem] text-[1.12rem] leading-[1.6] text-white/80 [--intro-delay:650ms]">
            Entreprises et professionnels des télécoms et du numérique, réunis pour défendre le secteur et accélérer la transformation digitale du Cameroun.
          </p>
          <div className="intro mt-9 flex flex-wrap items-center gap-3 [--intro-delay:780ms]">
            <CapsuleLink href="/adhesion" tone="light">
              Devenir membre
            </CapsuleLink>
            <Link href="/presentation" className="btn-inverse-outline">
              Découvrir le réseau
            </Link>
          </div>
        </div>

        <div className="intro lg:col-span-4 [--intro-delay:950ms]">
          {next ? (
            <Link href={`/evenements/${next.slug}`} className="group block rounded-3xl bg-navy-deep/55 p-5 ring-1 ring-white/20 backdrop-blur-xl transition-colors hover:bg-navy-deep/70">
              <span className="flex items-center justify-between gap-3 text-[0.85rem] text-white/70">
                Prochain rendez-vous
                <Countdown startsAt={next.startsAt} className="rounded-full bg-cyan px-2.5 py-0.5 text-[0.75rem] font-semibold text-white" />
              </span>
              <span className="mt-3 flex items-center gap-4">
                <span className="grid size-16 shrink-0 place-content-center rounded-2xl bg-white text-center text-navy">
                  <span className="text-[1.5rem] leading-none font-bold">{formatDate(next.startsAt, { day: "numeric" })}</span>
                  <span className="mt-0.5 text-[0.72rem]">{formatDate(next.startsAt, { month: "short" })}</span>
                </span>
                <span className="text-[1.05rem] leading-snug font-semibold">{next.title}</span>
              </span>
            </Link>
          ) : (
            <div className="rounded-3xl bg-navy-deep/55 p-5 ring-1 ring-white/20 backdrop-blur-xl">
              <span className="text-[0.85rem] text-white/70">Association professionnelle</span>
              <p className="mt-2 text-[1.05rem] leading-snug font-semibold">
                Yaoundé, Cameroun{founded ? `, depuis ${founded.value}` : ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function BigFigure({ figure, fallback, className, href, linkLabel, since }: {
  figure?: KeyFigure;
  fallback: KeyFigure;
  className: string;
  href: string;
  linkLabel: string;
  /** Année de départ : affiche la frise de croissance sous le chiffre. */
  since?: number;
}) {
  const f = figure ?? fallback;
  return (
    <Link href={href} className={`${panel} lift group flex min-h-[13rem] flex-col justify-between gap-6 p-7 sm:p-8 ${className}`}>
      {since ? (
        <AnimatedFigure value={f.value} since={since} />
      ) : (
        <span className="text-[4.2rem] leading-[0.9] font-bold tracking-[-0.05em] text-navy sm:text-[5rem]">
          <CountUp value={f.value} />
        </span>
      )}
      <span className="flex items-end justify-between gap-3">
        <span className="text-[1rem] font-medium text-navy">{f.label}</span>
        <span className="text-[0.85rem] font-semibold text-cyan-dark group-hover:text-navy">{linkLabel}</span>
      </span>
    </Link>
  );
}

function ProfileLink({ href, kind, title }: { href: string; kind: string; title: string }) {
  return (
    <li>
      <Link href={href} className="lift group flex h-full flex-col justify-between rounded-2xl bg-ice p-5 transition-colors hover:bg-navy">
        <span className="text-[0.85rem] text-muted group-hover:text-white/70">{kind}</span>
        <span className="mt-4 text-[1.1rem] leading-snug font-semibold text-navy group-hover:text-white">{title}</span>
      </Link>
    </li>
  );
}

function NewsTile({ item }: { item: NewsItem }) {
  return (
    <li className="lift group relative aspect-[4/5] w-[78%] shrink-0 snap-start overflow-hidden rounded-3xl bg-navy sm:w-[46%] lg:w-[31%]">
      {item.coverUrl && <Image src={item.coverUrl} alt="" fill sizes="(min-width: 1024px) 30vw, 80vw" className="img-hover object-cover" />}
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/35 to-navy-deep/10" />
      {/* Pastille vitrée (catégorie) et temps de lecture */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-5 text-white">
        {item.category ? (
          <span className="rounded-full bg-white/15 px-3 py-1 text-[0.78rem] font-medium ring-1 ring-white/30 backdrop-blur-md">{item.category}</span>
        ) : (
          <span />
        )}
        <span className="flex items-center gap-1.5 text-[0.78rem] text-white/85">
          <Clock aria-hidden className="size-3.5" /> {readingTime(item.body ?? item.excerpt)}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-6 text-white">
        <p className="text-[0.85rem] text-white/75">
          <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
        </p>
        <h3 className="mt-2 text-[1.3rem] leading-snug font-bold tracking-[-0.015em] text-balance">
          <Link href={`/actualites/${item.slug}`} className="after:absolute after:inset-0">
            {item.title}
          </Link>
        </h3>
        {/* Chapeau dévoilé au survol (toujours visible sur écran tactile) */}
        {item.excerpt && <p className="reveal-on-hover text-[0.92rem] leading-relaxed text-white/80">{item.excerpt}</p>}
      </div>
    </li>
  );
}
