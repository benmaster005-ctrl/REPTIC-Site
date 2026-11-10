import Link from "next/link";
import Image from "next/image";
import Markdown from "react-markdown";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { EventItem, NewsItem } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { isDemo } from "@/lib/data/public";
import { Node, SectionLabel } from "@/components/brand/Trace";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";

export type Crumb = { label: string; href?: string };

/** En-tête des pages internes : blanc, typographique, fil d'Ariane technique. */
export function PageHero({ title, summary, crumbs = [], eyebrow }: { title: string; summary?: string | null; crumbs?: Crumb[]; eyebrow?: string }) {
  const trail: Crumb[] = [{ label: "Accueil", href: "/" }, ...crumbs, { label: title }];
  return (
    <section className="relative border-b border-line">
      <div className="container-site pt-8 pb-14 sm:pb-20">
        <nav aria-label="Fil d'Ariane">
          <ol className="flex flex-wrap items-center gap-2 font-mono text-[0.75rem] text-muted">
            {trail.map((c, i) => (
              <li key={i} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden className="text-line-strong">/</span>}
                {c.href ? (
                  <Link href={c.href} className="hover:text-navy">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current={i === trail.length - 1 ? "page" : undefined} className={i === trail.length - 1 ? "text-navy" : ""}>
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <div className="mt-14 grid gap-8 lg:mt-20 lg:grid-cols-12 lg:items-end">
          <div className="intro lg:col-span-8">
            {eyebrow && <SectionLabel>{eyebrow}</SectionLabel>}
            <h1 className={`heading-lg ${eyebrow ? "mt-5" : ""} max-w-4xl text-balance`}>{title}</h1>
          </div>
          {summary && (
            <p className="intro text-[1.05rem] leading-relaxed text-muted [--intro-delay:150ms] lg:col-span-4 lg:pb-2">{summary}</p>
          )}
        </div>
      </div>
      <span aria-hidden className="hero-bar absolute bottom-[-1.5px] left-0 h-[3px] w-[max(4rem,calc((100vw-84rem)/2+3rem))] bg-cyan" />
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
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
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

export function NewsCard({ item, size = "default", delay = 0 }: { item: NewsItem; size?: "default" | "feature"; delay?: number }) {
  const feature = size === "feature";
  return (
    <Reveal as="article" delay={delay} className="group relative flex flex-col">
      {item.coverUrl && (
        <div className={`relative mb-6 overflow-hidden bg-paper ${feature ? "aspect-[16/10]" : "aspect-[16/9]"}`}>
          <Image src={item.coverUrl} alt="" fill sizes={feature ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"} className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
        </div>
      )}
      <div className={`border-t-2 border-navy ${feature ? "pt-6" : "pt-5"}`}>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <time dateTime={item.publishedAt} className="font-mono text-[0.75rem] text-muted">
            {formatDate(item.publishedAt, { day: "2-digit", month: "2-digit", year: "numeric" })}
          </time>
          {item.category && <span className="label text-cyan-dark">{item.category}</span>}
        </p>
        <h3 className={`mt-3 font-display font-bold tracking-[-0.015em] text-navy text-balance ${feature ? "text-[1.75rem] leading-[1.15] sm:text-[2.1rem]" : "text-[1.25rem] leading-snug"}`}>
          <Link href={`/actualites/${item.slug}`} className="title-sweep after:absolute after:inset-0 group-hover:text-cyan-dark">
            {item.title}
          </Link>
        </h3>
        {item.excerpt && <p className={`mt-3 text-muted ${feature ? "text-[1.05rem] leading-relaxed" : "line-clamp-3 text-[0.95rem]"}`}>{item.excerpt}</p>}
      </div>
    </Reveal>
  );
}

/** Ligne d'agenda : date | intitulé et lieu | flèche. */
export function EventRow({ item }: { item: EventItem }) {
  const day = formatDate(item.startsAt, { day: "2-digit" });
  const month = formatDate(item.startsAt, { month: "short" }).replace(".", "");
  const year = formatDate(item.startsAt, { year: "numeric" });
  return (
    <li className="group relative isolate grid grid-cols-[4.5rem_1fr] gap-x-6 gap-y-2 border-t border-line py-7 before:absolute before:inset-y-0 before:-right-4 before:-left-4 before:-z-10 before:origin-left before:scale-x-0 before:bg-paper before:transition-transform before:duration-500 before:ease-[cubic-bezier(0.16,1,0.3,1)] hover:before:scale-x-100 sm:grid-cols-[6rem_1fr_auto] sm:items-center">
      <p className="leading-none">
        <span className="block font-display text-[2.6rem] font-extrabold tracking-[-0.025em] text-navy">{day}</span>
        <span className="mt-1 block font-mono text-[0.75rem] text-muted uppercase">
          {month} {year}
        </span>
      </p>
      <div>
        {item.category && <p className="label text-cyan-dark">{item.category}</p>}
        <h3 className="mt-1.5 font-display text-[1.25rem] leading-snug font-bold tracking-[-0.01em] text-navy">
          <Link href={`/evenements/${item.slug}`} className="title-sweep after:absolute after:inset-0 group-hover:text-cyan-dark">
            {item.title}
          </Link>
        </h3>
        {(item.city || item.locationName) && <p className="mt-1.5 text-[0.92rem] text-muted">{[item.locationName, item.city].filter(Boolean).join(" · ")}</p>}
      </div>
      <span aria-hidden className="hidden size-11 place-items-center border border-line text-navy transition-colors group-hover:border-navy group-hover:bg-navy group-hover:text-white sm:grid">
        <ArrowUpRight className="size-4" />
      </span>
    </li>
  );
}

/** Bandeau d'appel à l'adhésion, réutilisé en bas des pages. */
export function JoinBand() {
  return (
    <section className="bg-navy text-white">
      <Reveal className="container-site grid gap-10 py-16 sm:py-20 lg:grid-cols-12 lg:items-end">
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
      </Reveal>
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
    <div className="border border-dashed border-line-strong p-10">
      <p className="font-semibold text-navy">{title}</p>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
  );
}
