"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type AdminNavSection = { title: string; items: { href: string; label: string; badge?: number }[] };

const isActive = (href: string, pathname: string | null) =>
  pathname !== null && (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));

export function AdminNav({ sections }: { sections: AdminNavSection[] }) {
  return <AdminNavList sections={sections} pathname={usePathname()} />;
}

/** Ordinateur : rubriques empilées. Mobile : menu déroulant (variante sans lecture d'URL pour la coque statique). */
export function AdminNavList({ sections, pathname }: { sections: AdminNavSection[]; pathname: string | null }) {
  // Le menu mobile est ouvert « pour » une page : il se referme dès que la page change.
  const [openFor, setOpenFor] = useState<string | null | undefined>(undefined);
  const open = openFor === pathname;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => setOpenFor((typeof v === "function" ? v(open) : v) ? pathname : undefined);
  const current = sections.flatMap((s) => s.items).find((i) => isActive(i.href, pathname));
  const pending = sections.flatMap((s) => s.items).reduce((n, i) => n + (i.badge ?? 0), 0);

  return (
    <nav aria-label="Administration">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="admin-menu"
        className="flex w-full items-center justify-between gap-3 border border-line bg-white px-4 py-3 text-left lg:hidden"
      >
        <span className="min-w-0">
          <span className="label block">Administration</span>
          <span className="block truncate font-semibold text-navy">{current?.label ?? "Menu"}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {pending > 0 && <span className="grid min-w-5 place-items-center bg-cyan px-1.5 font-mono text-[0.7rem] text-white">{pending}</span>}
          <ChevronDown aria-hidden className={`size-5 text-navy transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      <div id="admin-menu" className={`${open ? "block" : "hidden"} border-x border-b border-line bg-white px-4 pb-2 lg:block lg:space-y-8 lg:border-0 lg:bg-transparent lg:p-0`}>
        {sections.map((s) => (
          <div key={s.title} className="pt-4 lg:pt-0">
            <p className="label mb-2">{s.title}</p>
            <ul className="border-t border-line">
              {s.items.map((item) => {
                const active = isActive(item.href, pathname);
                return (
                  <li key={item.href} className="border-b border-line">
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`relative flex items-center justify-between gap-3 py-3 text-[0.92rem] font-semibold transition-[color,padding] duration-300 lg:py-2.5 lg:text-[0.9rem] ${
                        active ? "pl-4 text-navy" : "text-muted hover:pl-2 hover:text-navy"
                      }`}
                    >
                      {active && <span aria-hidden className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 bg-cyan" />}
                      {item.label}
                      {item.badge ? <span className="grid min-w-5 place-items-center bg-cyan px-1.5 font-mono text-[0.7rem] text-white">{item.badge}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
