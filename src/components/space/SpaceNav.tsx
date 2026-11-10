"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type SpaceNavItem = { href: string; label: string; badge?: number };

const isActive = (href: string, pathname: string | null) =>
  pathname !== null && (href === "/espace" ? pathname === "/espace" : pathname === href || pathname.startsWith(`${href}/`));

/**
 * Navigation de l'espace.
 * Ordinateur : liste verticale. Mobile : menu déroulant qui affiche la page en cours
 * (pas de bandeau horizontal à faire défiler).
 */
export function SpaceNav({ items }: { items: SpaceNavItem[] }) {
  return <SpaceNavList items={items} pathname={usePathname()} />;
}

/** Variante sans lecture d'URL, utilisable comme repli dans la coque statique. */
export function SpaceNavList({ items, pathname }: { items: SpaceNavItem[]; pathname: string | null }) {
  // Le menu mobile est ouvert « pour » une page : il se referme dès que la page change.
  const [openFor, setOpenFor] = useState<string | null | undefined>(undefined);
  const open = openFor === pathname;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => setOpenFor((typeof v === "function" ? v(open) : v) ? pathname : undefined);
  const current = items.find((i) => isActive(i.href, pathname));
  const unread = items.reduce((n, i) => n + (i.badge ?? 0), 0);

  return (
    <nav aria-label="Espace membre">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="espace-menu"
        className="flex w-full items-center justify-between gap-3 border border-line bg-white px-4 py-3 text-left lg:hidden"
      >
        <span className="min-w-0">
          <span className="label block">Mon espace</span>
          <span className="block truncate font-semibold text-navy">{current?.label ?? "Menu"}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {unread > 0 && <span className="grid min-w-5 place-items-center bg-cyan px-1.5 font-mono text-[0.7rem] text-white">{unread}</span>}
          <ChevronDown aria-hidden className={`size-5 text-navy transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      <ul id="espace-menu" className={`${open ? "block" : "hidden"} border-x border-b border-line bg-white lg:block lg:border-0 lg:border-t-2 lg:border-navy lg:bg-transparent`}>
        {items.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <li key={item.href} className="border-b border-line last:border-b-0 lg:last:border-b">
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center justify-between gap-3 px-4 py-3.5 text-[0.95rem] font-semibold transition-[color,padding] duration-300 lg:px-0 lg:text-[0.92rem] ${
                  active ? "bg-cyan-tint/60 text-navy lg:bg-transparent lg:pl-4" : "text-muted hover:text-navy lg:hover:pl-2"
                }`}
              >
                {active && <span aria-hidden className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 bg-cyan" />}
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
