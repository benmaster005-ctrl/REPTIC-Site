import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import { Logo } from "@/components/layout/Logo";
import { SectionLabel } from "@/components/brand/Trace";

export const metadata: Metadata = { title: "Mon espace", robots: { index: false } };

const roleLabels: Record<string, string> = {
  candidate: "Candidat",
  member: "Membre",
  editor: "Éditeur",
  manager: "Gestionnaire",
  admin: "Administrateur",
};

// Socle de l'espace membre (phase 3) : contrôle d'accès et déconnexion.
export default function MemberSpacePage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-white">
        <div className="container-site flex h-[4.5rem] items-center justify-between">
          <Logo className="h-10 w-auto" />
          <form action={signOut}>
            <button type="submit" className="btn-secondary py-2.5">
              Se déconnecter
            </button>
          </form>
        </div>
      </header>
      <main id="contenu" className="container-site py-14">
        <Suspense fallback={<div className="h-48 animate-pulse bg-white" />}>
          <Dashboard />
        </Suspense>
      </main>
    </div>
  );
}

async function Dashboard() {
  const user = await requireUser("/espace");
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const facts = [
    { label: "Profil", value: roleLabels[user.role] ?? user.role },
    { label: "Statut du compte", value: user.status === "active" ? "Actif" : "En attente d'activation" },
    { label: "E-mail", value: user.email },
  ];
  return (
    <div className="bg-white p-8 sm:p-12">
      <SectionLabel>Tableau de bord</SectionLabel>
      <h1 className="heading-lg mt-5">Bonjour {name}</h1>
      <dl className="mt-10 grid border-t-2 border-navy sm:grid-cols-3">
        {facts.map((f, i) => (
          <div key={f.label} className={`border-b border-line py-5 sm:border-b-0 ${i > 0 ? "sm:border-l sm:pl-6" : ""}`}>
            <dt className="label">{f.label}</dt>
            <dd className="mt-1.5 truncate font-semibold text-navy">{f.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-10 text-[0.95rem] text-muted">Les modules adhésion, documents, annuaire et notifications arrivent dans la phase suivante.</p>
      <Link href="/" className="link-arrow mt-6">
        Retour au site
      </Link>
    </div>
  );
}
