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
      <li className="group grid overflow-hidden rounded-xl bg-navy text-white md:col-span-2 md:grid-cols-2">
        <div className="relative min-h-[12rem] overflow-hidden">
          <Image src={image} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
        <div className="flex flex-col p-8">
          <div className="flex items-center justify-between">
            <span className="grid size-12 place-items-center rounded-lg border-2 border-cyan text-cyan">
              <FirstIcon aria-hidden className="size-6" />
            </span>
            <span className="font-mono text-[0.75rem] text-cyan">01</span>
          </div>
          <h3 className="mt-auto pt-8 font-display text-[1.45rem] leading-tight font-bold tracking-[-0.02em]">{first.title}</h3>
          <p className="mt-3 text-[0.96rem] leading-relaxed text-white/75">{first.description}</p>
        </div>
      </li>
      {rest.map((m, i) => {
        const Icon = missionIcons[m.icon];
        const wide = i === rest.length - 1;
        return (
          <li
            key={m.title}
            className={`group relative flex flex-col rounded-xl border border-line bg-white p-7 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-navy ${wide ? "md:col-span-2" : ""}`}
          >
            <div className="flex items-start justify-between">
              <span className="grid size-12 place-items-center rounded-lg bg-cyan-tint text-cyan-dark transition-colors duration-300 group-hover:bg-cyan group-hover:text-white">
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
          className="group flex h-full min-h-[12rem] flex-col justify-between rounded-xl bg-cyan p-7 text-white transition-colors hover:bg-cyan-dark"
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

/**
 * Chiffres clés posés sur une trace de circuit (le motif du logo) : un filet
 * marine court sous les chiffres, chaque chiffre est un nœud du réseau.
 */
export function KeyFigures({ figures }: { figures: KeyFigure[] }) {
  return (
    <RevealGroup as="dl" className="grid grid-cols-2 gap-y-12 lg:grid-cols-4">
      {figures.map((f, i) => (
        <div key={f.label} className={`relative pt-9 pr-4 ${i % 2 === 1 ? "pl-5 sm:pl-8" : ""} ${i >= 1 ? "lg:pl-8" : ""}`}>
          {/* segment de trace + nœud annulaire */}
          <span aria-hidden className="absolute top-0 right-0 left-0 h-[2px] bg-navy" />
          <span aria-hidden className={`absolute -top-[5px] size-3 rounded-full border-2 border-cyan bg-white ${i % 2 === 1 ? "left-5 sm:left-8" : "left-0"} ${i >= 1 ? "lg:left-8" : ""}`} />
          <span className="font-mono text-[0.72rem] text-cyan-dark">{String(i + 1).padStart(2, "0")}</span>
          <dd className="mt-3 font-display text-[2.8rem] leading-none font-extrabold tracking-[-0.035em] text-navy sm:text-[4rem]">
            <CountUp value={f.value} />
          </dd>
          <dt className="mt-3 max-w-[14rem] text-[0.95rem] leading-snug text-muted">{f.label}</dt>
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
        <details key={q.question} name={name} className="faq group rounded-lg border border-line bg-white transition-colors open:border-navy">
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
