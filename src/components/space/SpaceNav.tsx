"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type SpaceNavItem = { href: string; label: string; badge?: number };

/** Navigation de l'espace : verticale sur ordinateur, défilante sur mobile. */
export function SpaceNav({ items }: { items: SpaceNavItem[] }) {
  return <SpaceNavList items={items} pathname={usePathname()} />;
}

/** Variante sans lecture d'URL, utilisable comme repli dans la coque statique. */
export function SpaceNavList({ items, pathname }: { items: SpaceNavItem[]; pathname: string | null }) {
  return (
    <nav aria-label="Espace membre" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-1 whitespace-nowrap lg:flex-col lg:gap-0 lg:border-t-2 lg:border-navy">
        {items.map((item) => {
          const active = pathname !== null && (item.href === "/espace" ? pathname === "/espace" : pathname === item.href || pathname.startsWith(`${item.href}/`));
          return (
            <li key={item.href} className="lg:border-b lg:border-line">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center justify-between gap-3 px-3 py-2.5 text-[0.92rem] font-semibold transition-colors lg:px-0 lg:py-3.5 ${
                  active ? "text-navy" : "text-muted hover:text-navy"
                } ${active ? "max-lg:bg-white lg:pl-4" : "lg:hover:pl-2"} lg:transition-[padding,color] lg:duration-300`}
              >
                {active && <span aria-hidden className="absolute top-1/2 left-0 hidden h-5 w-[3px] -translate-y-1/2 bg-cyan lg:block" />}
                {item.label}
                {item.badge ? (
                  <span className="grid min-w-5 place-items-center bg-cyan px-1.5 font-mono text-[0.7rem] text-white" aria-label={`${item.badge} non lue(s)`}>
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
