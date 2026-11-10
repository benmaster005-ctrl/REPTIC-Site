import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Logo } from "@/components/layout/Logo";
import { SpaceNav, SpaceNavList, type SpaceNavItem } from "@/components/space/SpaceNav";
import { getSpaceContext, displayName } from "@/lib/space";
import { getUnreadCount } from "@/lib/data/member";

export const metadata: Metadata = {
  title: { default: "Mon espace", template: "%s | Espace membre REPTIC.CM" },
  robots: { index: false },
};

const candidateNav: SpaceNavItem[] = [
  { href: "/espace", label: "Tableau de bord" },
  { href: "/espace/adhesion", label: "Ma demande" },
  { href: "/espace/profil", label: "Mon profil" },
  { href: "/espace/notifications", label: "Notifications" },
  { href: "/espace/securite", label: "Sécurité" },
];

const memberNav: SpaceNavItem[] = [
  { href: "/espace", label: "Tableau de bord" },
  { href: "/espace/adhesion", label: "Mon adhésion" },
  { href: "/espace/cotisation", label: "Cotisation" },
  { href: "/espace/profil", label: "Mon profil" },
  { href: "/espace/documents", label: "Mes documents" },
  { href: "/espace/annuaire", label: "Annuaire" },
  { href: "/espace/actualites", label: "Actualités" },
  { href: "/espace/evenements", label: "Événements" },
  { href: "/espace/messages", label: "Messages" },
  { href: "/espace/inviter", label: "Inviter" },
  { href: "/espace/notifications", label: "Notifications" },
  { href: "/espace/securite", label: "Sécurité" },
];

export default function SpaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <a href="#contenu" className="sr-only z-[60] bg-navy px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Aller au contenu
      </a>
      <header className="border-b border-line bg-white print:hidden">
        <div className="container-site flex h-16 items-center justify-between gap-3 sm:h-[4.5rem] sm:gap-4">
          <div className="flex items-center gap-5">
            <Logo className="h-8 w-auto sm:h-10" />
            <span aria-hidden className="hidden h-6 w-px bg-line sm:block" />
            <span className="label hidden sm:inline">Espace membre</span>
          </div>
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <Suspense fallback={null}>
              <UserName />
              <AdminLink />
            </Suspense>
            <Link href="/" className="hidden text-sm font-semibold text-muted hover:text-navy md:inline">
              Site public
            </Link>
            <form action={signOut}>
              <button type="submit" className="btn-secondary px-3.5 py-2">
                <LogOut aria-hidden className="size-4" /> <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="container-site grid grid-cols-1 gap-6 py-6 lg:grid-cols-12 lg:gap-6 lg:py-12">
        <aside className="min-w-0 lg:col-span-3 lg:pr-8 print:hidden">
          <div className="lg:sticky lg:top-8">
            <Suspense fallback={<SpaceNavList items={candidateNav} pathname={null} />}>
              <NavForUser />
            </Suspense>
          </div>
        </aside>
        <main id="contenu" className="min-w-0 lg:col-span-9">
          {children}
        </main>
      </div>
    </div>
  );
}

async function NavForUser() {
  const { user, isMember } = await getSpaceContext();
  const unread = await getUnreadCount(user.id);
  const items = (isMember ? memberNav : candidateNav).map((i) => (i.href === "/espace/notifications" ? { ...i, badge: unread } : i));
  return <SpaceNav items={items} />;
}

async function AdminLink() {
  const { user } = await getSpaceContext();
  if (user.status !== "active" || !["editor", "manager", "admin"].includes(user.role)) return null;
  return (
    <Link href="/admin" className="text-sm font-semibold text-cyan-dark hover:text-navy">
      <span className="sm:hidden">Admin</span>
      <span className="hidden sm:inline">Administration</span>
    </Link>
  );
}

async function UserName() {
  const { user } = await getSpaceContext();
  return <span className="hidden max-w-48 truncate text-sm font-semibold text-navy md:inline">{displayName(user)}</span>;
}
