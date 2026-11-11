import Link from "next/link";
import Image from "next/image";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { EventItem, NewsItem } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { isDemo } from "@/lib/data/public";
import { Node, SectionLabel } from "@/components/brand/Trace";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { heroBanners } from "@/content/site";

export type Crumb = { label: string; href?: string };

/**
 * En-tête des pages internes : bannière photo pleine largeur sous un voile
 * marine (lisibilité du texte blanc), fil d'Ariane, titre et chapeau.
 * Sans image fournie, la bannière par défaut du site est utilisée.
 *
 * Avec `cover` (article, événement) : la couverture sert de bannière et
 * s'affiche aussi entière à droite, sans recadrage ni voile, pour que le
 * texte d'une affiche reste lisible. Un clic l'ouvre en grand.
 */
export function PageHero({ title, summary, crumbs = [], eyebrow, image, imageAlt = "", cover }: {
  title: string;
  summary?: string | null;
  crumbs?: Crumb[];
  eyebrow?: string;
  /** Photo de la bannière (chemin /images/… ou URL). */
  image?: string | null;
  imageAlt?: string;
  /** Couverture d'un contenu : bannière + image entière lisible. */
  cover?: { src: string; alt: string } | null;
}) {
  const trail: Crumb[] = [{ label: "Accueil", href: "/" }, ...crumbs, { label: title }];
  const banner = cover?.src || image || heroBanners.default;
  return (
    <section className="relative isolate overflow-hidden bg-navy text-white">
      <Image src={banner} alt={cover ? "" : imageAlt} fill priority sizes="100vw" className={`hero-zoom -z-20 object-cover ${cover ? "hidden lg:block" : ""}`} />
      {/* Voile marine uni : lisibilité du texte blanc (sur mobile en mode couverture, aplat seul : l’affiche nette suit le titre) */}
      <span aria-hidden className={`absolute inset-0 -z-10 ${cover ? "bg-navy/95" : "bg-navy/85"}`} />
      <div className="container-site pt-8 pb-14 sm:pb-20 lg:min-h-[24rem]">
        <nav aria-label="Fil d'Ariane">
          <ol className="flex flex-wrap items-center gap-2 font-mono text-[0.75rem] text-white/65">
            {trail.map((c, i) => (
              <li key={i} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden className="text-white/35">/</span>}
                {c.href ? (
                  <Link href={c.href} className="hover:text-white">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current={i === trail.length - 1 ? "page" : undefined} className={i === trail.length - 1 ? "text-white" : ""}>
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        {cover ? (
          <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-12 lg:items-center lg:gap-12">
            <div className="intro lg:col-span-7">
              {eyebrow && <SectionLabel tone="inverse">{eyebrow}</SectionLabel>}
              <h1 className={`heading-lg ${eyebrow ? "mt-5" : ""} text-balance !text-white`}>{title}</h1>
              {summary && <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-white/80">{summary}</p>}
            </div>
            <figure className="intro [--intro-delay:150ms] lg:col-span-5 lg:justify-self-end">
              <a href={cover.src} target="_blank" rel="noopener noreferrer" className="group block w-fit overflow-hidden rounded-xl border border-white/15 bg-navy-deep">
                <Image
                  src={cover.src}
                  alt={cover.alt}
                  // Dimensions indicatives : le CSS (largeur et hauteur auto) rend les proportions réelles.
                  width={1600}
                  height={1600}
                  priority
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="block h-auto max-h-[70vh] w-auto max-w-full transition-transform duration-500 group-hover:scale-[1.01] lg:max-h-[32rem]"
                />
              </a>
              <figcaption className="mt-3">
                <a href={cover.src} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-white/80 hover:text-white">
                  Voir l&apos;image en grand <ArrowUpRight aria-hidden className="size-3.5" />
                </a>
              </figcaption>
            </figure>
          </div>
        ) : (
          <div className="mt-14 grid gap-8 lg:mt-20 lg:grid-cols-12 lg:items-end">
            <div className="intro lg:col-span-8">
              {eyebrow && <SectionLabel tone="inverse">{eyebrow}</SectionLabel>}
              <h1 className={`heading-lg ${eyebrow ? "mt-5" : ""} max-w-4xl text-balance !text-white`}>{title}</h1>
            </div>
            {summary && (
              <p className="intro text-[1.05rem] leading-relaxed text-white/80 [--intro-delay:150ms] lg:col-span-4 lg:pb-2">{summary}</p>
            )}
          </div>
        )}
      </div>
      <span aria-hidden className="hero-bar absolute bottom-0 left-0 h-[3px] w-[max(4rem,calc((100vw-84rem)/2+3rem))] bg-cyan" />
    </section>
  );
}

/** En-tête de section : libellé à gauche, titre et action à droite (grille 12). */
export function SectionHeader({ label, title, description, action, tone = "default" }: {
  label: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  tone?: "default" | "inverse";
}) {
  const inverse = tone === "inverse";
  return (
    <Reveal className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-3 lg:pt-3">
        <SectionLabel tone={inverse ? "inverse" : "default"}>{label}</SectionLabel>
        <Reveal variant="line" delay={250} className={`mt-4 hidden h-[2px] w-20 lg:block ${inverse ? "bg-white/40" : "bg-cyan"}`} />
      </div>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between lg:col-span-9">
        <div className="max-w-3xl">
          <h2 className={`heading-lg text-balance ${inverse ? "text-white" : ""}`}>{title}</h2>
          {description && <p className={`mt-4 max-w-2xl text-[1.05rem] leading-relaxed ${inverse ? "text-white/70" : "text-muted"}`}>{description}</p>}
        </div>
        {action && (
          <Link
            href={action.href}
            className={inverse ? "inline-flex shrink-0 items-center gap-2 border-b border-white pb-0.5 text-sm font-semibold text-white hover:border-cyan hover:text-cyan" : "link-arrow shrink-0"}
          >
            {action.label} <ArrowRight aria-hidden className="size-4" />
          </Link>
        )}
      </div>
    </Reveal>
  );
}

export function RichText({ children }: { children: string | null }) {
  if (!children) return null;
  return (
    <div className="prose-site">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
          // Les tableaux défilent horizontalement sur mobile au lieu d'élargir la page.
          table: ({ children }) => (
            <div className="-mx-1 overflow-x-auto px-1">
              <table>{children}</table>
            </div>
          ),
          a: ({ href, children }) => (
            <a href={href} {...(href?.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {children}
            </a>
          ),
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}

/** Liste éditoriale (missions, avantages) : lignes séparées par des filets. */
export function RuledList({ items, columns = 1 }: { items: { title: string; description: string }[]; columns?: 1 | 2 }) {
  return (
    <RevealGroup as="ul" className={`grid border-b border-line ${columns === 2 ? "md:grid-cols-2 md:gap-x-12" : ""}`}>
      {items.map((m) => (
        <li key={m.title} className="group grid gap-3 border-t border-line py-7 sm:grid-cols-12 sm:gap-8">
          <h3 className={`flex items-start gap-3 font-display text-[1.2rem] leading-snug font-bold tracking-[-0.01em] text-navy ${columns === 2 ? "sm:col-span-12" : "sm:col-span-5"}`}>
            <Node className="mt-[0.45em] size-2.5 transition-colors group-hover:bg-cyan" />
            {m.title}
          </h3>
          <p className={`text-[0.98rem] leading-relaxed text-muted ${columns === 2 ? "pl-[1.375rem] sm:col-span-12" : "pl-[1.375rem] sm:col-span-7 sm:pl-0"}`}>{m.description}</p>
        </li>
      ))}
    </RevealGroup>
  );
}

/** Visuel de repli des cartes sans photo : aplat marine et nom du réseau. */
function CardPlaceholder() {
  return (
    <span aria-hidden className="absolute inset-0 grid place-items-center bg-navy font-display text-[1.4rem] font-extrabold tracking-[-0.02em]">
      <span>
        <span className="text-white/90">REPTIC</span>
        <span className="text-cyan">.cm</span>
      </span>
    </span>
  );
}

/**
 * Carte d'actualité : photo (ou visuel de repli) avec catégorie en pastille,
 * date, titre, chapeau et lien « Lire ». Trois formats : standard, à la une
 * (grande) et compacte (vignette à gauche, pour les listes latérales).
 */
export function NewsCard({ item, size = "default", delay = 0 }: { item: NewsItem; size?: "default" | "feature" | "compact"; delay?: number }) {
  const feature = size === "feature";
  const compact = size === "compact";
  const date = formatDate(item.publishedAt, { day: "numeric", month: "long", year: "numeric" });
  return (
    <Reveal
      as="article"
      delay={delay}
      className={`group relative flex overflow-hidden rounded-xl border border-line bg-white transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-navy ${
        compact ? "flex-row items-stretch" : "h-full flex-col"
      }`}
    >
      <div className={`relative shrink-0 overflow-hidden bg-paper ${compact ? "w-[38%] min-h-[9rem]" : feature ? "aspect-[16/10]" : "aspect-[16/9]"}`}>
        {item.coverUrl ? (
          <Image
            src={item.coverUrl}
            alt=""
            fill
            sizes={compact ? "(min-width: 1024px) 15vw, 40vw" : feature ? "(min-width: 1024px) 55vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <CardPlaceholder />
        )}
        {item.category && !compact && (
          <span className="absolute top-4 left-4 rounded-full bg-white px-3 py-1 text-[0.72rem] font-semibold text-navy">{item.category}</span>
        )}
      </div>
      <div className={`flex flex-1 flex-col ${compact ? "p-5" : feature ? "p-7 sm:p-9" : "p-6"}`}>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8rem] text-muted">
          {compact && item.category && (
            <>
              <span className="font-semibold text-cyan-dark">{item.category}</span>
              <span aria-hidden>·</span>
            </>
          )}
          <time dateTime={item.publishedAt}>{date}</time>
        </p>
        <h3
          className={`mt-2.5 font-display font-bold tracking-[-0.015em] text-balance text-navy transition-colors group-hover:text-cyan-dark ${
            feature ? "text-[1.6rem] leading-[1.15] sm:text-[2rem]" : compact ? "line-clamp-3 text-[1.02rem] leading-snug" : "text-[1.2rem] leading-snug"
          }`}
        >
          <Link href={`/actualites/${item.slug}`} className="after:absolute after:inset-0">
            {item.title}
          </Link>
        </h3>
        {item.excerpt && !compact && <p className={`mt-3 text-muted ${feature ? "text-[1.02rem] leading-relaxed" : "line-clamp-3 text-[0.94rem]"}`}>{item.excerpt}</p>}
        {!compact && (
          <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-navy">
            Lire l&apos;article
            <span className="grid size-8 place-items-center rounded-full bg-cyan-tint text-cyan-dark transition-[transform,background-color,color] duration-300 group-hover:translate-x-1 group-hover:bg-cyan group-hover:text-white">
              <ArrowRight aria-hidden className="size-4" />
            </span>
          </span>
        )}
      </div>
    </Reveal>
  );
}

/** Carte d'agenda : pavé date, catégorie, intitulé et lieu, flèche. */
export function EventRow({ item }: { item: EventItem }) {
  const day = formatDate(item.startsAt, { day: "2-digit" });
  const month = formatDate(item.startsAt, { month: "short" }).replace(".", "");
  const year = formatDate(item.startsAt, { year: "numeric" });
  const time = formatDate(item.startsAt, { hour: "2-digit", minute: "2-digit" });
  const shortDate = formatDate(item.startsAt, { day: "numeric", month: "short", year: "numeric" });
  return (
    <li className="group relative grid grid-cols-[4.75rem_1fr] items-center gap-5 rounded-xl border border-line bg-white p-4 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-navy sm:grid-cols-[6rem_1fr_auto] sm:gap-7 sm:p-5">
      {item.coverUrl ? (
        // Miniature de la couverture (le haut de l'affiche, là où se trouve le titre)
        <span className="relative block aspect-square overflow-hidden rounded-lg border border-line bg-paper">
          <Image src={item.coverUrl} alt="" fill sizes="96px" className="object-cover object-top transition-transform duration-500 group-hover:scale-105" />
        </span>
      ) : (
        <p className="grid aspect-square place-content-center rounded-lg bg-navy text-center leading-none text-white transition-colors duration-300 group-hover:bg-cyan-dark">
          <span className="block font-display text-[2rem] font-extrabold tracking-[-0.025em] sm:text-[2.4rem]">{day}</span>
          <span className="mt-1 block text-[0.7rem] font-semibold tracking-wide text-white/75 uppercase">
            {month} {year}
          </span>
        </p>
      )}
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2">
          {item.category && <span className="rounded-full bg-cyan-tint px-2.5 py-0.5 text-[0.72rem] font-semibold text-cyan-dark">{item.category}</span>}
          <span className="text-[0.8rem] text-muted">
            {/* La date quitte le pavé quand la miniature la remplace : elle passe ici */}
            {item.coverUrl && <time dateTime={item.startsAt}>{shortDate}</time>}
            {item.coverUrl && time !== "00:00" && " · "}
            {time !== "00:00" && time}
          </span>
        </p>
        <h3 className="mt-2 font-display text-[1.12rem] leading-snug font-bold tracking-[-0.01em] text-navy transition-colors group-hover:text-cyan-dark sm:text-[1.25rem]">
          <Link href={`/evenements/${item.slug}`} className="after:absolute after:inset-0">
            {item.title}
          </Link>
        </h3>
        {(item.city || item.locationName) && <p className="mt-1 truncate text-[0.9rem] text-muted">{[item.locationName, item.city].filter(Boolean).join(" · ")}</p>}
      </div>
      <span aria-hidden className="hidden size-12 place-items-center rounded-full border border-line text-navy transition-all duration-300 group-hover:rotate-45 group-hover:border-navy group-hover:bg-navy group-hover:text-white sm:grid">
        <ArrowUpRight className="size-5" />
      </span>
    </li>
  );
}

/** Appel à l'adhésion en bas des pages : aplat marine et photo nette. */
export function JoinBand() {
  return (
    <section className="overflow-hidden bg-navy text-white">
      <div className="container-site grid lg:grid-cols-12">
        <Reveal className="py-16 sm:py-20 lg:col-span-7 lg:pr-12">
          <SectionLabel tone="inverse">Adhésion</SectionLabel>
          <p className="mt-5 font-display text-[2rem] leading-[1.08] font-extrabold tracking-[-0.02em] text-balance sm:text-[2.8rem]">
            Votre entreprise fait le numérique camerounais. Faites-la entendre.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/adhesion" className="btn-inverse">
              Conditions d&apos;adhésion <ArrowRight aria-hidden className="size-4" />
            </Link>
            <Link href="/contact" className="btn-inverse-outline">
              Nous contacter
            </Link>
          </div>
        </Reveal>
        <div className="relative hidden lg:col-span-5 lg:-mr-[max(1.5rem,calc((100vw-84rem)/2+1.5rem))] lg:block">
          <Image src="/images/reptic/pages/adhesion-reseau.webp" alt="" fill sizes="40vw" className="object-cover" />
        </div>
      </div>
    </section>
  );
}

export function DemoNotice() {
  if (!isDemo) return null;
  return (
    <div className="border-b border-amber-200 bg-amber-50 text-amber-900">
      <p className="container-site py-1.5 text-center font-mono text-[0.72rem]">
        Mode démonstration : base Supabase non connectée, contenus provisoires.
      </p>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-white p-10">
      <p className="font-semibold text-navy">{title}</p>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
  );
}
