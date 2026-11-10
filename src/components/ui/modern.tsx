import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Award, Cpu, GraduationCap, Megaphone, Plus, Radar, TrendingUp, type LucideIcon } from "lucide-react";
import type { Mission, MissionIcon } from "@/content/site";
import type { Category, KeyFigure } from "@/lib/types";
import { RevealGroup } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";

const missionIcons: Record<MissionIcon, LucideIcon> = {
  graduation: GraduationCap,
  award: Award,
  megaphone: Megaphone,
  trending: TrendingUp,
  radar: Radar,
  cpu: Cpu,
};

/**
 * Grille « bento » des missions : une tuile photo mise en avant, quatre tuiles
 * avec pictogramme, une tuile large et une tuile d'appel vers la page détaillée.
 */
export function MissionBento({ missions, image, href }: { missions: Mission[]; image: string; href: string }) {
  const [first, ...rest] = missions;
  const FirstIcon = missionIcons[first.icon];
  return (
    <RevealGroup as="ul" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <li className="group relative isolate flex min-h-[19rem] flex-col justify-end overflow-hidden rounded-3xl bg-navy p-8 text-white md:col-span-2">
        <Image src={image} alt="" fill sizes="(min-width: 1024px) 66vw, 100vw" className="-z-20 object-cover transition-transform duration-700 group-hover:scale-105" />
        <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-deep via-navy/80 to-navy/20" />
        <span className="mb-auto grid size-12 place-items-center rounded-2xl bg-white/15 backdrop-blur-sm">
          <FirstIcon aria-hidden className="size-6" />
        </span>
        <span className="font-mono text-[0.75rem] text-cyan">01</span>
        <h3 className="mt-2 max-w-lg font-display text-[1.6rem] leading-tight font-bold tracking-[-0.02em]">{first.title}</h3>
        <p className="mt-3 max-w-xl text-[0.98rem] leading-relaxed text-white/80">{first.description}</p>
      </li>
      {rest.map((m, i) => {
        const Icon = missionIcons[m.icon];
        const wide = i === rest.length - 1;
        return (
          <li
            key={m.title}
            className={`group relative flex flex-col rounded-3xl border border-line bg-white p-7 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-cyan/40 hover:shadow-[0_18px_40px_-20px_rgb(35_45_87/0.35)] ${wide ? "md:col-span-2" : ""}`}
          >
            <div className="flex items-start justify-between">
              <span className="grid size-12 place-items-center rounded-2xl bg-cyan-tint text-cyan-dark transition-colors duration-300 group-hover:bg-cyan group-hover:text-white">
                <Icon aria-hidden className="size-6" />
              </span>
              <span className="font-mono text-[0.75rem] text-muted">{String(i + 2).padStart(2, "0")}</span>
            </div>
            <h3 className="mt-6 font-display text-[1.15rem] leading-snug font-bold tracking-[-0.01em] text-navy">{m.title}</h3>
            <p className="mt-2 text-[0.94rem] leading-relaxed text-muted">{m.description}</p>
          </li>
        );
      })}
      <li className="md:col-span-2 lg:col-span-1">
        <Link
          href={href}
          className="group flex h-full min-h-[12rem] flex-col justify-between rounded-3xl bg-cyan p-7 text-white transition-colors hover:bg-cyan-dark"
        >
          <span className="label text-white/80">Pour aller plus loin</span>
          <span className="flex items-end justify-between gap-4">
            <span className="font-display text-[1.4rem] leading-tight font-bold tracking-[-0.015em]">Objectifs et missions en détail</span>
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-cyan-dark transition-transform duration-300 group-hover:rotate-45">
              <ArrowUpRight aria-hidden className="size-5" />
            </span>
          </span>
        </Link>
      </li>
    </RevealGroup>
  );
}

/** Chiffres clés en cartes, sur fond marine, avec compteur animé. */
export function KeyFigureCards({ figures }: { figures: KeyFigure[] }) {
  return (
    <RevealGroup as="dl" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {figures.map((f) => (
        <div key={f.label} className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm sm:p-8">
          <span aria-hidden className="absolute top-0 left-6 h-[3px] w-10 rounded-b bg-cyan sm:left-8" />
          <dd className="font-display text-[2.4rem] leading-none font-extrabold tracking-[-0.025em] text-white sm:text-[3.2rem]">
            <CountUp value={f.value} />
          </dd>
          <dt className="mt-3 text-[0.85rem] font-medium text-white/70 sm:text-[0.92rem]">{f.label}</dt>
        </div>
      ))}
    </RevealGroup>
  );
}

/**
 * Bandeau défilant des familles d'acteurs. La liste est doublée pour boucler
 * sans à-coup ; la copie est masquée aux lecteurs d'écran. Pause au survol.
 */
export function ActorMarquee({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;
  const item = (c: Category, copy: boolean) => (
    <li key={`${copy ? "b" : "a"}-${c.slug}`} aria-hidden={copy || undefined} className="flex shrink-0 items-center gap-4">
      <Link href={`/acteurs#${c.slug}`} tabIndex={copy ? -1 : undefined} className="rounded-full border border-line bg-white px-5 py-2.5 text-[0.92rem] font-semibold whitespace-nowrap text-navy transition-colors hover:border-navy hover:bg-navy hover:text-white">
        {c.name}
      </Link>
      <span aria-hidden className="size-1.5 rounded-full bg-cyan" />
    </li>
  );
  return (
    <div className="marquee group relative overflow-hidden py-2">
      <ul className="marquee-track flex w-max gap-4 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
        {categories.map((c) => item(c, false))}
        {categories.map((c) => item(c, true))}
      </ul>
    </div>
  );
}

/** Questions fréquentes : accordéon natif (une seule réponse ouverte à la fois). */
export function FaqAccordion({ items, name = "faq" }: { items: { question: string; answer: string }[]; name?: string }) {
  return (
    <RevealGroup className="grid gap-3">
      {items.map((q) => (
        <details key={q.question} name={name} className="faq group rounded-2xl border border-line bg-white transition-colors open:border-navy/30 open:shadow-[0_12px_32px_-20px_rgb(35_45_87/0.35)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
            <span className="font-display text-[1.05rem] leading-snug font-bold text-navy sm:text-[1.12rem]">{q.question}</span>
            <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-cyan-tint text-cyan-dark transition-[transform,background-color,color] duration-300 group-open:rotate-45 group-open:bg-navy group-open:text-white">
              <Plus className="size-4" />
            </span>
          </summary>
          <p className="px-5 pb-6 text-[0.98rem] leading-relaxed text-muted sm:px-6">{q.answer}</p>
        </details>
      ))}
    </RevealGroup>
  );
}

/** Pastilles de filtre (liens) : défilent horizontalement sur mobile. */
export function FilterChips({ label, options, current }: { label: string; options: { label: string; href: string; value: string | null }[]; current: string | null }) {
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        {options.map((o) => {
          const active = o.value === current;
          return (
            <li key={o.href}>
              <Link
                href={o.href}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center rounded-full px-4 py-2 text-[0.88rem] font-semibold whitespace-nowrap transition-colors ${
                  active ? "bg-navy text-white" : "border border-line bg-white text-navy hover:border-navy"
                }`}
              >
                {o.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
