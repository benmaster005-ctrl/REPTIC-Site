import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Bell, Settings2 } from "lucide-react";
import { appFont } from "@/lib/fonts";
import { AppShell } from "@/components/app/AppShell";
import { AccountCard, AccountCardFallback, TopbarLink } from "@/components/app/AccountCard";
import { SideNav, SideNavList, type SideNavSection } from "@/components/app/SideNav";
import { getSpaceContext, displayName } from "@/lib/space";
import { getUnreadCount } from "@/lib/data/member";

export const metadata: Metadata = {
  title: { default: "Mon espace", template: "%s | Espace membre REPTIC.CM" },
  robots: { index: false },
};

/** Menu des candidats (adhésion en cours), par catégories. */
const candidateNav: SideNavSection[] = [
  {
    title: "Général",
    items: [
      { href: "/espace", label: "Tableau de bord" },
      { href: "/espace/notifications", label: "Notifications" },
    ],
  },
  { title: "Adhésion", items: [{ href: "/espace/adhesion", label: "Ma demande" }] },
  {
    title: "Mon compte",
    items: [
      { href: "/espace/profil", label: "Mon profil" },
      { href: "/espace/securite", label: "Sécurité" },
    ],
  },
];

/** Menu des membres, par catégories. */
const memberNav: SideNavSection[] = [
  {
    title: "Général",
    items: [
      { href: "/espace", label: "Tableau de bord" },
      { href: "/espace/notifications", label: "Notifications" },
    ],
  },
  {
    title: "Mon adhésion",
    items: [
      { href: "/espace/adhesion", label: "Adhésion" },
      { href: "/espace/cotisation", label: "Cotisation" },
      { href: "/espace/documents", label: "Mes documents" },
    ],
  },
  {
    title: "Le réseau",
    items: [
      { href: "/espace/annuaire", label: "Annuaire" },
      { href: "/espace/actualites", label: "Actualités" },
      { href: "/espace/evenements", label: "Événements" },
    ],
  },
  {
    title: "Échanges",
    items: [
      { href: "/espace/messages", label: "Messages" },
      { href: "/espace/inviter", label: "Inviter un contact" },
    ],
  },
  {
    title: "Mon compte",
    items: [
      { href: "/espace/profil", label: "Mon profil" },
      { href: "/espace/securite", label: "Sécurité" },
    ],
  },
];

export default function SpaceLayout({ children }: { children: React.ReactNode }) {
  return (
    // Univers « application », distinct du site public : barre latérale,
    // barre supérieure fine, cartes à filet (jetons .app-shell, globals.css).
    <div className={`${appFont.variable} app-ui app-shell min-h-screen`}>
      <a href="#contenu" className="sr-only z-[60] bg-navy px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Aller au contenu
      </a>
      <AppShell
        product="Espace membre"
        nav={
          <Suspense fallback={<SideNavList sections={candidateNav} label="Espace membre" root="/espace" pathname={null} />}>
            <NavForUser />
          </Suspense>
        }
        account={
          <Suspense fallback={<AccountCardFallback />}>
            <Account />
          </Suspense>
        }
        topbar={
          <Suspense fallback={null}>
            <Topbar />
          </Suspense>
        }
      >
        {children}
      </AppShell>
    </div>
  );
}

async function Account() {
  const { user, isMember } = await getSpaceContext();
  return <AccountCard name={displayName(user)} detail={isMember ? "Membre" : "Candidat"} />;
}

/** Barre supérieure : notifications et accès à l'administration pour l'équipe. */
async function Topbar() {
  const { user } = await getSpaceContext();
  const unread = await getUnreadCount(user.id);
  const staff = user.status === "active" && ["editor", "manager", "admin"].includes(user.role);
  return (
    <>
      {staff && (
        <TopbarLink href="/admin">
          <Settings2 aria-hidden className="size-4" /> <span className="hidden sm:inline">Administration</span>
        </TopbarLink>
      )}
      <Link
        href="/espace/notifications"
        aria-label={unread ? `Notifications, ${unread} non lue(s)` : "Notifications"}
        className="relative grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-ice hover:text-heading"
      >
        <Bell aria-hidden className="size-[1.1rem]" />
        {unread > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-cyan ring-2 ring-surface" />}
      </Link>
    </>
  );
}

async function NavForUser() {
  const { user, isMember } = await getSpaceContext();
  const unread = await getUnreadCount(user.id);
  const sections = (isMember ? memberNav : candidateNav).map((s) => ({
    ...s,
    items: s.items.map((i) => (i.href === "/espace/notifications" ? { ...i, badge: unread } : i)),
  }));
  return <SideNav sections={sections} label="Espace membre" root="/espace" />;
}

