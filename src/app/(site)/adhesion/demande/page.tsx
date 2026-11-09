import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getSessionUserId } from "@/lib/auth";
import { applicationSteps } from "@/content/site";
import { PageHero } from "@/components/ui/content";
import { ReadingColumn } from "@/components/ui/editorial";

export const metadata: Metadata = {
  title: "Demande d'adhésion",
  robots: { index: false },
};

/** Porte d'entrée du parcours : un compte candidat est nécessaire pour déposer un dossier. */
export default function ApplicationGatewayPage() {
  return (
    <>
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <PageHero
        title="Déposer une demande"
        eyebrow="Adhésion"
        crumbs={[{ label: "Adhésion", href: "/adhesion" }]}
        summary="Le dossier se remplit en ligne depuis votre compte candidat. Vous pouvez l'interrompre et le reprendre à tout moment."
      />
      <ReadingColumn
        aside={
          <ol className="border-t-2 border-navy">
            {applicationSteps.map((s, i) => (
              <li key={s.title} className="flex gap-3 border-b border-line py-3 text-[0.92rem]">
                <span className="font-mono text-cyan-dark">{i + 1}</span>
                <span className="text-navy">{s.title}</span>
              </li>
            ))}
          </ol>
        }
      >
        <div className="grid gap-px bg-line-strong sm:grid-cols-2">
          <div className="bg-white p-8">
            <p className="label text-cyan-dark">Nouveau candidat</p>
            <p className="mt-3 font-display text-[1.5rem] leading-tight font-bold text-navy">Créer un compte</p>
            <p className="mt-2 text-[0.95rem] text-muted">Une adresse e-mail et un mot de passe suffisent. Vous confirmerez l&apos;adresse par e-mail.</p>
            <Link href="/inscription?suite=/espace/adhesion" className="btn-primary mt-8">
              Créer mon compte <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          <div className="bg-white p-8">
            <p className="label">Déjà inscrit</p>
            <p className="mt-3 font-display text-[1.5rem] leading-tight font-bold text-navy">Reprendre mon dossier</p>
            <p className="mt-2 text-[0.95rem] text-muted">Connectez-vous pour compléter ou suivre votre demande.</p>
            <Link href="/connexion?suite=/espace/adhesion" className="btn-secondary mt-8">
              Se connecter
            </Link>
          </div>
        </div>
        <p className="mt-8 text-[0.92rem] text-muted">
          Préparez vos justificatifs au format PDF ou image (10 Mo maximum par fichier). La liste dépend de votre profil :{" "}
          <Link href="/adhesion#physique" className="font-semibold text-navy underline underline-offset-4">
            voir les pièces à fournir
          </Link>
          .
        </p>
      </ReadingColumn>
    </>
  );
}

async function RedirectIfSignedIn() {
  if (await getSessionUserId()) redirect("/espace/adhesion");
  return null;
}
