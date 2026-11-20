"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  AtSign,
  BadgeCheck,
  Bell,
  CalendarDays,
  ChevronDown,
  CreditCard,
  FileText,
  FolderOpen,
  Inbox,
  Landmark,
  LayoutDashboard,
  Mail,
  Megaphone,
  MessageSquare,
  Newspaper,
  ScrollText,
  Send,
  Share2,
  ShieldCheck,
  UserCog,
  UserPlus,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export type SideNavItem = { href: string; label: string; badge?: number };
export type SideNavSection = { title: string; items: SideNavItem[] };

/** Icône de chaque rubrique (espace membre et administration). */
const icons: Record<string, LucideIcon> = {
  "/espace": LayoutDashboard,
  "/espace/notifications": Bell,
  "/espace/adhesion": BadgeCheck,
  "/espace/cotisation": CreditCard,
  "/espace/documents": FileText,
  "/espace/annuaire": Users,
  "/espace/actualites": Newspaper,
  "/espace/evenements": CalendarDays,
  "/espace/messages": MessageSquare,
  "/espace/inviter": UserPlus,
  "/espace/profil": UserRound,
  "/espace/securite": ShieldCheck,
  "/admin": LayoutDashboard,
  "/admin/journal": ScrollText,
  "/admin/demandes": Inbox,
  "/admin/membres": Users,
  "/admin/cotisations": CreditCard,
  "/admin/actualites": Newspaper,
  "/admin/evenements": CalendarDays,
  "/admin/pages": FileText,
  "/admin/institution": Landmark,
  "/admin/documents": FolderOpen,
  "/admin/linkedin": Share2,
  "/admin/messages": Mail,
  "/admin/diffusion": Megaphone,
  "/admin/newsletter": Send,
  "/admin/utilisateurs": UserCog,
  "/admin/emails": AtSign,
};

/** Une rubrique est active sur sa page et ses sous-pages ; la racine (« /espace », « /admin ») seulement sur elle-même. */
const isActive = (href: string, pathname: string | null, root: string) =>
  pathname !== null && (href === root ? pathname === root : pathname === href || pathname.startsWith(`${href}/`));

/**
 * Navigation de la barre latérale, rangée par catégories.
 * Chaque catégorie a son titre et peut se replier ; celle qui contient la page
 * en cours reste toujours ouverte.
 */
export function SideNav({ sections, label, root }: { sections: SideNavSection[]; label: string; root: string }) {
  return <SideNavList sections={sections} label={label} root={root} pathname={usePathname()} />;
}

/** Variante sans lecture d'URL, utilisable comme repli dans la coque statique. */
export function SideNavList({ sections, label, root, pathname }: { sections: SideNavSection[]; label: string; root: string; pathname: string | null }) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  return (
    <nav aria-label={label} className="grid gap-1">
      {sections.map((s, i) => {
        const hasActive = s.items.some((it) => isActive(it.href, pathname, root));
        const open = hasActive || !closed[s.title];
        const id = `nav-${root.replace(/\W/g, "")}-${i}`;
        return (
          <div key={s.title} className={i > 0 ? "border-t border-line pt-2" : ""}>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={id}
              onClick={() => !hasActive && setClosed((c) => ({ ...c, [s.title]: !c[s.title] }))}
              className="group flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[0.75rem] font-semibold tracking-[0.02em] text-muted hover:text-heading"
            >
              {s.title}
              <ChevronDown aria-hidden className={`size-3.5 transition-transform ${open ? "" : "-rotate-90"} ${hasActive ? "opacity-0" : "opacity-60 group-hover:opacity-100"}`} />
            </button>
            {open && (
              <ul id={id} className="mt-0.5 mb-1.5 grid gap-0.5">
                {s.items.map((item) => (
                  <NavLink key={item.href} item={item} active={isActive(item.href, pathname, root)} />
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function NavLink({ item, active }: { item: SideNavItem; active: boolean }) {
  const Icon = icons[item.href] ?? LayoutDashboard;
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.875rem] font-medium transition-colors ${
          active ? "bg-cyan-tint text-cyan-dark" : "text-ink/80 hover:bg-ice hover:text-heading"
        }`}
      >
        <Icon aria-hidden className={`size-[1.05rem] shrink-0 ${active ? "text-cyan-dark" : "text-muted"}`} />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.badge ? (
          <span className="grid min-w-5 place-items-center rounded-full bg-navy px-1.5 py-px text-[0.7rem] font-semibold text-white" aria-label={`${item.badge} en attente`}>
            {item.badge}
          </span>
        ) : null}
      </Link>
    </li>
  );
}
