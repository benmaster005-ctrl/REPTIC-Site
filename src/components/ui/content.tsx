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
 */
export function PageHero({ title, summary, crumbs = [], eyebrow, image, imageAlt = "" }: {
  title: string;
  summary?: string | null;
  crumbs?: Crumb[];
  eyebrow?: string;
  /** Photo de la bannière (chemin /images/… ou URL). */
  image?: string | null;
  imageAlt?: string;
}) {
  const trail: Crumb[] = [{ label: "Accueil", href: "/" }, ...crumbs, { label: title }];
  const banner = image || heroBanners.default;
  return (
    <section className="relative isolate overflow-hidden bg-navy text-white">
      <Image src={banner} alt={imageAlt} fill priority sizes="100vw" className="hero-zoom -z-20 object-cover" />
      {/* Voile : marine dense à gauche (texte), plus léger à droite (photo) */}
      <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-deep/95 via-navy/85 to-navy/55" />
      <span aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-navy-deep/60 to-transparent" />
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
        <div className="mt-14 grid gap-8 lg:mt-20 lg:grid-cols-12 lg:items-end">
          <div className="intro lg:col-span-8">
            {eyebrow && <SectionLabel tone="inverse">{eyebrow}</SectionLabel>}
            <h1 className={`heading-lg ${eyebrow ? "mt-5" : ""} max-w-4xl text-balance !text-white`}>{title}</h1>
          </div>
          {summary && (
            <p className="intro text-[1.05rem] leading-relaxed text-white/80 [--intro-delay:150ms] lg:col-span-4 lg:pb-2">{summary}</p>
          )}
        </div>
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

/** Visuel de repli des cartes sans photo : dégradé marine et motif de nœuds. */
function CardPlaceholder() {
  return (
    <span aria-hidden className="absolute inset-0 bg-gradient-to-br from-navy via-navy-soft to-cyan-dark">
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.18)_1px,transparent_0)] [background-size:18px_18px]" />
      <span className="absolute right-6 bottom-6 size-10 rounded-full border-2 border-white/40" />
      <span className="absolute right-[2.15rem] bottom-[2.15rem] size-3.5 rounded-full bg-cyan" />
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
      className={`group relative flex overflow-hidden rounded-3xl border border-line bg-white transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-cyan/40 hover:shadow-[0_22px_48px_-24px_rgb(35_45_87/0.4)] ${
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
          <span className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-[0.72rem] font-semibold text-navy shadow-sm backdrop-blur-sm">{item.category}</span>
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
  return (
    <li className="group relative grid grid-cols-[4.75rem_1fr] items-center gap-5 rounded-3xl border border-line bg-white p-4 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-cyan/40 hover:shadow-[0_18px_40px_-22px_rgb(35_45_87/0.4)] sm:grid-cols-[6rem_1fr_auto] sm:gap-7 sm:p-5">
      <p className="grid aspect-square place-content-center rounded-2xl bg-navy text-center leading-none text-white transition-colors duration-300 group-hover:bg-cyan-dark">
        <span className="block font-display text-[2rem] font-extrabold tracking-[-0.025em] sm:text-[2.4rem]">{day}</span>
        <span className="mt-1 block text-[0.7rem] font-semibold tracking-wide text-white/75 uppercase">
          {month} {year}
        </span>
      </p>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2">
          {item.category && <span className="rounded-full bg-cyan-tint px-2.5 py-0.5 text-[0.72rem] font-semibold text-cyan-dark">{item.category}</span>}
          {time !== "00:00" && <span className="text-[0.8rem] text-muted">{time}</span>}
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

/** Appel à l'adhésion en bas des pages : carte marine sur photo, halo cyan. */
export function JoinBand() {
  return (
    <section className="py-16 sm:py-20">
      <div className="container-site">
        <Reveal className="relative isolate overflow-hidden rounded-[2rem] bg-navy px-7 py-14 text-white sm:px-14 sm:py-20">
          <Image src="/images/reptic/pages/adhesion-reseau.webp" alt="" fill sizes="(min-width: 1280px) 80rem, 100vw" className="-z-30 object-cover opacity-40" />
          <span aria-hidden className="absolute inset-0 -z-20 bg-gradient-to-r from-navy-deep via-navy/90 to-navy/40" />
          <span aria-hidden className="glow absolute -top-24 -right-16 -z-10 size-80 rounded-full bg-cyan/40 blur-3xl" />
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <SectionLabel tone="inverse">Adhésion</SectionLabel>
              <p className="mt-5 font-display text-[2rem] leading-[1.08] font-extrabold tracking-[-0.02em] text-balance sm:text-[2.8rem]">
                Votre entreprise fait le numérique camerounais. Faites-la entendre.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
              <Link href="/adhesion" className="btn-inverse">
                Conditions d&apos;adhésion <ArrowRight aria-hidden className="size-4" />
              </Link>
              <Link href="/contact" className="btn-inverse-outline">
                Nous contacter
              </Link>
            </div>
          </div>
        </Reveal>
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
    <div className="rounded-3xl border border-dashed border-line-strong bg-white p-10">
      <p className="font-semibold text-navy">{title}</p>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
  );
}
