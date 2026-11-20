import Image from "next/image";
import Link from "next/link";
import { missions } from "@/content/site";
import { getEvents, getGovernance, getKeyFigures, getLatestNews } from "@/lib/data/public";
import { formatDate } from "@/lib/format";
import type { EventItem, NewsItem } from "@/lib/types";
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
  const [figures, news, { upcoming }, board] = await Promise.all([getKeyFigures(), getLatestNews(3), getEvents(), getGovernance()]);
  const [featured, ...others] = news;
  const next = upcoming[0];

  return (
    <>
      {/* Ouverture : le réseau, au sens propre */}
      <section className="relative isolate overflow-hidden bg-navy-deep text-white">
        {/* Bannière photo, assombrie côté texte pour la lisibilité */}
        <Image
          src="/images/reptic/pages/adhesion-reseau.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[70%_30%]"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-navy-deep/80 lg:bg-transparent lg:bg-gradient-to-r lg:from-navy-deep lg:via-navy-deep/85 lg:to-navy-deep/5" />
        <div className="container-site flex min-h-[36rem] items-center py-20 sm:min-h-[40rem] lg:min-h-[44rem] lg:py-24">
          <div className="max-w-[40rem]">
            <h1 className="font-display text-[2.6rem] leading-[1.02] font-bold tracking-[-0.035em] text-balance sm:text-[3.9rem] lg:text-[4.6rem]">
              Le réseau qui fédère le numérique camerounais.
            </h1>
            <p className="mt-7 max-w-[34rem] text-[1.15rem] leading-[1.65] text-white/80">
              Entreprises et professionnels des télécoms et du numérique, réunis pour défendre le secteur, accompagner ses acteurs et accélérer la
              transformation digitale du Cameroun.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/adhesion" className="btn-inverse">
                Devenir membre
              </Link>
              <Link href="/presentation" className="btn-inverse-outline">
                Découvrir le réseau
              </Link>
            </div>
            {figures.length > 0 && (
              <dl className="mt-14 grid max-w-[34rem] grid-cols-3 gap-6 border-t border-white/20 pt-6">
                {figures.slice(0, 3).map((f) => (
                  <div key={f.label}>
                    <dt className="sr-only">{f.label}</dt>
                    <dd className="text-[1.75rem] leading-none font-bold tracking-[-0.03em] tabular-nums">{f.value}</dd>
                    <dd className="mt-2 text-[0.9rem] leading-snug text-white/70">{f.label}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </section>

      {/* Missions : une liste, pas des tuiles */}
      <section className="border-t border-line py-20 sm:py-28">
        <div className="container-site grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <h2 className="heading-lg text-balance">Ce que fait le réseau</h2>
            <p className="mt-5 max-w-[26rem] text-[1.05rem] leading-relaxed text-muted">
              Six chantiers conduits avec les pouvoirs publics, les universités et les partenaires du secteur.
            </p>
            <Link href="/objectifs-missions" className="link-arrow mt-8">
              Objectifs et missions
            </Link>
          </div>
          <ul className="grid gap-x-12 sm:grid-cols-2 lg:col-span-8">
            {missions.map((m) => (
              <li key={m.title} className="border-t border-line py-7">
                <h3 className="text-[1.12rem] leading-snug font-semibold tracking-[-0.01em] text-navy">{m.title}</h3>
                <p className="mt-2.5 text-[0.98rem] leading-relaxed text-muted">{m.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Prochain rendez-vous, présenté comme un billet */}
      {next && (
        <section className="bg-ice py-20 sm:py-24">
          <div className="container-site">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="heading-md">Prochain rendez-vous</h2>
              <Link href="/evenements" className="link-arrow">
                Tout l&apos;agenda
              </Link>
            </div>
            <EventTicket item={next} />
          </div>
        </section>
      )}

      {/* Actualités : une à la une, deux en liste */}
      <section className="py-20 sm:py-28">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="heading-lg">Actualités du réseau</h2>
            <Link href="/actualites" className="link-arrow">
              Toutes les actualités
            </Link>
          </div>
          {featured ? (
            <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-12">
              <FeaturedNews item={featured} />
              <ul className="lg:col-span-5">
                {others.map((n) => (
                  <NewsLine key={n.slug} item={n} />
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-10 text-muted">Les prochaines actualités du réseau seront publiées ici.</p>
          )}
        </div>
      </section>

      {/* Bureau exécutif */}
      {board.length > 0 && (
        <section className="border-t border-line py-20 sm:py-28">
          <div className="container-site grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-4">
              <h2 className="heading-lg text-balance">Le Bureau exécutif</h2>
              <p className="mt-5 max-w-[26rem] text-[1.05rem] leading-relaxed text-muted">
                {board.length} dirigeants du secteur élus pour conduire l&apos;action du réseau.
              </p>
              <Link href="/gouvernance" className="link-arrow mt-8">
                Voir tout le bureau
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:col-span-8">
              {board.slice(0, 8).map((m) => (
                <li key={m.id}>
                  <div className="relative size-24 overflow-hidden rounded-full bg-ice sm:size-28">
                    {m.photoUrl ? (
                      <Image src={m.photoUrl} alt="" fill sizes="112px" className="object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center text-xl font-semibold text-navy/50">{initials(m.fullName)}</span>
                    )}
                  </div>
                  <p className="mt-4 text-[0.98rem] leading-snug font-semibold text-navy">{m.fullName}</p>
                  <p className="mt-1 text-[0.88rem] leading-snug text-muted">{m.positionTitle}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <LinkedinPosts />

      {/* Adhésion */}
      <section className="bg-navy-deep py-20 text-white sm:py-28">
        <div className="container-site grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <h2 className="font-display text-[1.9rem] leading-[1.08] font-bold tracking-[-0.025em] text-balance sm:text-[2.75rem]">Rejoindre le REPTIC.CM</h2>
            <p className="mt-5 max-w-[28rem] text-[1.05rem] leading-relaxed text-white/70">
              La demande se fait en ligne : vous déposez vos justificatifs et suivez l&apos;instruction de votre dossier depuis votre espace.
            </p>
            <Link href="/adhesion" className="btn-inverse mt-9">
              Déposer ma demande
            </Link>
          </div>
          <ul className="lg:col-span-6 lg:col-start-7">
            {profiles.map((p) => (
              <li key={p.anchor} className="border-t border-white/15 py-7 first:border-t-0 first:pt-0 lg:first:border-t lg:first:pt-7">
                <p className="text-[0.9rem] font-medium text-[#7cc4ea]">{p.kind}</p>
                <p className="mt-2 text-[1.3rem] leading-snug font-semibold tracking-[-0.015em]">{p.title}</p>
                <p className="mt-2 text-[0.98rem] leading-relaxed text-white/70">{p.text}</p>
                <Link
                  href={`/adhesion#${p.anchor}`}
                  className="mt-4 inline-block border-b border-white/40 pb-0.5 text-sm font-semibold hover:border-white"
                >
                  Conditions et pièces à fournir
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

function initials(name: string) {
  return name
    .replace(/^(Dr\.?-?(Ing\.)?|Mme|M\.)\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function EventTicket({ item }: { item: EventItem }) {
  const start = new Date(item.startsAt);
  const end = item.endsAt ? new Date(item.endsAt) : null;
  const sameDay = !end || end.toDateString() === start.toDateString();
  const days = sameDay ? formatDate(item.startsAt, { day: "numeric" }) : `${formatDate(item.startsAt, { day: "numeric" })}–${formatDate(item.endsAt!, { day: "numeric" })}`;
  const monthYear = formatDate(item.startsAt, { month: "long", year: "numeric" });
  const place = [item.locationName, item.city].filter(Boolean).join(", ");

  return (
    <Link
      href={`/evenements/${item.slug}`}
      className="group mt-10 grid overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow hover:ring-navy/30 sm:grid-cols-[11rem_1fr] lg:grid-cols-[11rem_1fr_20rem]"
    >
      <div className="flex flex-row items-baseline gap-3 bg-navy px-7 py-6 text-white sm:flex-col sm:justify-center sm:gap-1 sm:py-8">
        <span className="text-[2.6rem] leading-none font-bold tracking-[-0.04em] tabular-nums">{days}</span>
        <span className="text-[0.95rem] text-white/75">{monthYear}</span>
      </div>
      <div className="border-line px-7 py-7 sm:border-l sm:border-dashed sm:py-9">
        {place && <p className="text-[0.92rem] font-medium text-cyan-dark">{place}</p>}
        <h3 className="title-sweep mt-2 inline text-[1.45rem] leading-snug font-bold tracking-[-0.02em] text-navy sm:text-[1.7rem]">{item.title}</h3>
        {item.excerpt && <p className="mt-3 max-w-[40rem] text-[0.98rem] leading-relaxed text-muted">{item.excerpt}</p>}
        <p className="mt-6 text-sm font-semibold text-navy">{item.registrationEnabled ? "S'inscrire" : "Voir le programme"}</p>
      </div>
      {item.coverUrl && (
        <div className="relative hidden lg:block">
          <Image src={item.coverUrl} alt="" fill sizes="320px" className="object-cover" />
        </div>
      )}
    </Link>
  );
}

function FeaturedNews({ item }: { item: NewsItem }) {
  return (
    <article className="group relative lg:col-span-7">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-ice">
        {item.coverUrl && <Image src={item.coverUrl} alt="" fill sizes="(min-width: 1024px) 720px, 100vw" className="object-cover" />}
      </div>
      <p className="mt-6 text-[0.9rem] text-muted">
        {item.category && <span className="font-medium text-cyan-dark">{item.category}</span>}
        {item.category && <span aria-hidden>, </span>}
        <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
      </p>
      <h3 className="mt-2 text-[1.5rem] leading-snug font-bold tracking-[-0.02em] text-navy sm:text-[1.85rem]">
        <Link href={`/actualites/${item.slug}`} className="title-sweep after:absolute after:inset-0">
          {item.title}
        </Link>
      </h3>
      {item.excerpt && <p className="mt-3 max-w-[38rem] text-[1rem] leading-relaxed text-muted">{item.excerpt}</p>}
    </article>
  );
}

function NewsLine({ item }: { item: NewsItem }) {
  return (
    <li className="group relative flex gap-5 border-t border-line py-6 first:border-t-0 first:pt-0 lg:first:border-t lg:first:pt-6">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-ice">
        {item.coverUrl && <Image src={item.coverUrl} alt="" fill sizes="96px" className="object-cover" />}
      </div>
      <div>
        <p className="text-[0.85rem] text-muted">
          <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
        </p>
        <h3 className="mt-1.5 text-[1.05rem] leading-snug font-semibold text-navy">
          <Link href={`/actualites/${item.slug}`} className="title-sweep after:absolute after:inset-0">
            {item.title}
          </Link>
        </h3>
      </div>
    </li>
  );
}
