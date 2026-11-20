import type { Metadata } from "next";
import { Suspense } from "react";
import { UserRound } from "lucide-react";
import { appFont } from "@/lib/fonts";
import { AppShell } from "@/components/app/AppShell";
import { AccountCard, AccountCardFallback, TopbarLink } from "@/components/app/AccountCard";
import { SideNav, SideNavList, type SideNavSection } from "@/components/app/SideNav";
import { getStaffContext, roleLabels, type Permission } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { displayName } from "@/lib/space";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s | Administration REPTIC.CM" },
  robots: { index: false },
};

type Item = { href: string; label: string; perm?: Permission; badge?: "pending" | "contact" };
const sections: { title: string; items: Item[] }[] = [
  { title: "Pilotage", items: [{ href: "/admin", label: "Tableau de bord" }] },
  {
    title: "Adhésions",
    items: [
      { href: "/admin/demandes", label: "Demandes", perm: "applications.read", badge: "pending" },
      { href: "/admin/membres", label: "Membres", perm: "members.read" },
      { href: "/admin/cotisations", label: "Cotisations", perm: "members.read" },
    ],
  },
  {
    title: "Publications",
    items: [
      { href: "/admin/actualites", label: "Actualités", perm: "content.manage" },
      { href: "/admin/evenements", label: "Événements", perm: "events.manage" },
      { href: "/admin/linkedin", label: "LinkedIn", perm: "content.manage" },
    ],
  },
  {
    title: "Contenu du site",
    items: [
      { href: "/admin/pages", label: "Pages", perm: "content.manage" },
      { href: "/admin/institution", label: "Bureau et chiffres", perm: "content.manage" },
      { href: "/admin/documents", label: "Documents", perm: "documents.manage" },
    ],
  },
  {
    title: "Communication",
    items: [
      { href: "/admin/messages", label: "Messages de contact", perm: "contact.manage", badge: "contact" },
      { href: "/admin/diffusion", label: "Diffusion aux membres", perm: "broadcasts.send" },
      { href: "/admin/newsletter", label: "Lettre d'information", perm: "contact.manage" },
    ],
  },
  {
    title: "Paramètres",
    items: [
      { href: "/admin/utilisateurs", label: "Utilisateurs et rôles", perm: "users.manage" },
      { href: "/admin/emails", label: "Modèles d'e-mails", perm: "settings.manage" },
      { href: "/admin/journal", label: "Journal d'activité", perm: "audit.read" },
    ],
  },
];

const strip = (s: typeof sections): SideNavSection[] => s.map((sec) => ({ title: sec.title, items: sec.items.filter((i) => !i.perm).map(({ href, label }) => ({ href, label })) })).filter((sec) => sec.items.length);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // Univers « application », comme l'espace membre (jetons .app-shell, globals.css)
    <div className={`${appFont.variable} app-ui app-shell min-h-screen`}>
      <a href="#contenu" className="sr-only z-[60] bg-navy px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Aller au contenu
      </a>
      <AppShell
        product="Administration"
        nav={
          <Suspense fallback={<SideNavList sections={strip(sections)} label="Administration" root="/admin" pathname={null} />}>
            <NavForStaff />
          </Suspense>
        }
        account={
          <Suspense fallback={<AccountCardFallback />}>
            <StaffAccount />
          </Suspense>
        }
        topbar={
          <TopbarLink href="/espace">
            <UserRound aria-hidden className="size-4" /> <span className="hidden sm:inline">Mon espace</span>
          </TopbarLink>
        }
      >
        {children}
      </AppShell>
    </div>
  );
}

async function NavForStaff() {
  const { can } = await getStaffContext();
  const supabase = await createClient();
  const [pending, contact] = await Promise.all([
    can("applications.read") ? supabase.from("applications").select("id", { count: "exact", head: true }).in("status", ["submitted", "under_review"]) : null,
    can("contact.manage") ? supabase.from("contact_messages").select("id", { count: "exact", head: true }).is("handled_at", null) : null,
  ]);
  const counts = { pending: pending?.count ?? 0, contact: contact?.count ?? 0 };
  const visible: SideNavSection[] = sections
    .map((s) => ({
      title: s.title,
      items: s.items.filter((i) => !i.perm || can(i.perm)).map((i) => ({ href: i.href, label: i.label, badge: i.badge ? counts[i.badge] : undefined })),
    }))
    .filter((s) => s.items.length);
  return <SideNav sections={visible} label="Administration" root="/admin" />;
}

async function StaffAccount() {
  const { user } = await getStaffContext();
  return <AccountCard name={displayName(user)} detail={roleLabels[user.role]} />;
}
