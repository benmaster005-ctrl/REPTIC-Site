"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminNavSection = { title: string; items: { href: string; label: string; badge?: number }[] };

export function AdminNav({ sections }: { sections: AdminNavSection[] }) {
  return <AdminNavList sections={sections} pathname={usePathname()} />;
}

/** Variante sans lecture d'URL pour la coque statique. */
export function AdminNavList({ sections, pathname }: { sections: AdminNavSection[]; pathname: string | null }) {
  return (
    <nav aria-label="Administration" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <div className="flex gap-6 lg:flex-col lg:gap-8">
        {sections.map((s) => (
          <div key={s.title} className="shrink-0">
            <p className="label mb-2 hidden lg:block">{s.title}</p>
            <ul className="flex gap-1 whitespace-nowrap lg:flex-col lg:gap-0 lg:border-t lg:border-line">
              {s.items.map((item) => {
                const active = pathname !== null && (item.href === "/admin" ? pathname === "/admin" : pathname === item.href || pathname.startsWith(`${item.href}/`));
                return (
                  <li key={item.href} className="lg:border-b lg:border-line">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`relative flex items-center justify-between gap-3 px-3 py-2 text-[0.9rem] font-semibold transition-[color,padding] duration-300 lg:px-0 lg:py-2.5 ${
                        active ? "text-navy max-lg:bg-white lg:pl-4" : "text-muted hover:text-navy lg:hover:pl-2"
                      }`}
                    >
                      {active && <span aria-hidden className="absolute top-1/2 left-0 hidden h-5 w-[3px] -translate-y-1/2 bg-cyan lg:block" />}
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
