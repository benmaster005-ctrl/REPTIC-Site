import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Logo } from "@/components/layout/Logo";
import { AdminNav, AdminNavList, type AdminNavSection } from "@/components/admin/AdminNav";
import { getStaffContext, roleLabels, type Permission } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { displayName } from "@/lib/space";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s | Administration REPTIC.CM" },
  robots: { index: false },
};

type Item = { href: string; label: string; perm?: Permission; badge?: "pending" | "contact" };
const sections: { title: string; items: Item[] }[] = [
  { title: "Pilotage", items: [{ href: "/admin", label: "Tableau de bord" }, { href: "/admin/journal", label: "Journal", perm: "audit.read" }] },
  {
    title: "Adhésions",
    items: [
      { href: "/admin/demandes", label: "Demandes", perm: "applications.read", badge: "pending" },
      { href: "/admin/membres", label: "Membres", perm: "members.read" },
      { href: "/admin/cotisations", label: "Cotisations", perm: "members.read" },
    ],
  },
  {
    title: "Contenus",
    items: [
      { href: "/admin/actualites", label: "Actualités", perm: "content.manage" },
      { href: "/admin/evenements", label: "Événements", perm: "events.manage" },
      { href: "/admin/pages", label: "Pages", perm: "content.manage" },
      { href: "/admin/institution", label: "Bureau et chiffres", perm: "content.manage" },
      { href: "/admin/documents", label: "Documents", perm: "documents.manage" },
    ],
  },
  {
    title: "Relations",
    items: [
      { href: "/admin/messages", label: "Messages de contact", perm: "contact.manage", badge: "contact" },
      { href: "/admin/diffusion", label: "Diffusion", perm: "broadcasts.send" },
      { href: "/admin/newsletter", label: "Lettre d'information", perm: "contact.manage" },
    ],
  },
  {
    title: "Paramètres",
    items: [
      { href: "/admin/utilisateurs", label: "Utilisateurs et rôles", perm: "users.manage" },
      { href: "/admin/emails", label: "E-mails", perm: "settings.manage" },
    ],
  },
];

const strip = (s: typeof sections): AdminNavSection[] => s.map((sec) => ({ title: sec.title, items: sec.items.filter((i) => !i.perm).map(({ href, label }) => ({ href, label })) })).filter((sec) => sec.items.length);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <a href="#contenu" className="sr-only z-[60] bg-navy px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Aller au contenu
      </a>
      <header className="border-b border-navy-deep bg-navy text-white">
        <div className="container-site flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="bg-white px-2.5 py-1.5">
              <Logo className="h-7 w-auto" />
            </span>
            <span className="font-mono text-[0.72rem] tracking-[0.08em] text-white/70 uppercase">Administration</span>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <Suspense fallback={null}>
              <StaffName />
            </Suspense>
            <Link href="/espace" className="hidden font-semibold text-white/70 hover:text-white md:inline">
              Mon espace
            </Link>
            <Link href="/" className="hidden font-semibold text-white/70 hover:text-white md:inline">
              Site public
            </Link>
            <form action={signOut}>
              <button type="submit" className="btn-inverse-outline px-3 py-1.5" aria-label="Se déconnecter">
                <LogOut aria-hidden className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="container-site grid grid-cols-1 gap-6 py-6 lg:grid-cols-12 lg:gap-6 lg:py-10">
        <aside className="min-w-0 lg:col-span-2 lg:pr-4">
          <div className="lg:sticky lg:top-8">
            <Suspense fallback={<AdminNavList sections={strip(sections)} pathname={null} />}>
              <NavForStaff />
            </Suspense>
          </div>
        </aside>
        <main id="contenu" className="min-w-0 lg:col-span-10">
          {children}
        </main>
      </div>
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
  const visible: AdminNavSection[] = sections
    .map((s) => ({
      title: s.title,
      items: s.items.filter((i) => !i.perm || can(i.perm)).map((i) => ({ href: i.href, label: i.label, badge: i.badge ? counts[i.badge] : undefined })),
    }))
    .filter((s) => s.items.length);
  return <AdminNav sections={visible} />;
}

async function StaffName() {
  const { user } = await getStaffContext();
  return (
    <span className="hidden text-right leading-tight md:block">
      <span className="block max-w-48 truncate font-semibold">{displayName(user)}</span>
      <span className="block font-mono text-[0.68rem] text-cyan">{roleLabels[user.role]}</span>
    </span>
  );
}
