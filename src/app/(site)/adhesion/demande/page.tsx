import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/content";
import { ReadingColumn } from "@/components/ui/editorial";

export const metadata: Metadata = {
  title: "Demande d'adhésion",
  robots: { index: false },
};

// Phase 3 du cahier des charges : parcours candidat en 5 étapes (à venir).
export default function ApplicationPage() {
  return (
    <>
      <PageHero title="Demande d'adhésion" crumbs={[{ label: "Adhésion", href: "/adhesion" }]} summary="Le dépôt de dossier en ligne ouvre très prochainement." />
      <ReadingColumn>
        <div className="max-w-2xl border-l-[3px] border-cyan pl-6">
          <p className="font-display text-xl font-bold text-navy">Le formulaire en ligne sera disponible prochainement.</p>
          <p className="mt-2 text-muted">En attendant, écrivez-nous pour toute question sur les conditions d&apos;adhésion.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="btn-primary">
              Nous contacter
            </Link>
            <Link href="/adhesion" className="btn-secondary">
              Revoir les conditions
            </Link>
          </div>
        </div>
      </ReadingColumn>
    </>
  );
}
