import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { unsubscribeNewsletter } from "@/app/actions/public";
import { PageHero } from "@/components/ui/content";
import { ReadingColumn } from "@/components/ui/editorial";

export const metadata: Metadata = { title: "Désinscription de la lettre d'information", robots: { index: false } };

/**
 * Lien personnel présent dans chaque lettre : /newsletter/desinscription?t=<jeton>.
 * La désinscription demande un clic de confirmation, pour que les logiciels qui
 * pré-ouvrent les liens des e-mails ne désinscrivent personne par erreur.
 */
export default function UnsubscribePage({ searchParams }: PageProps<"/newsletter/desinscription">) {
  return (
    <>
      <PageHero title="Lettre d'information" eyebrow="Désinscription" />
      <ReadingColumn>
        <Suspense fallback={<div className="h-40 animate-pulse bg-paper" />}>
          <Unsubscribe searchParams={searchParams} />
        </Suspense>
      </ReadingColumn>
    </>
  );
}

async function Unsubscribe({ searchParams }: Pick<PageProps<"/newsletter/desinscription">, "searchParams">) {
  const { t, etat } = await searchParams;
  const token = typeof t === "string" && /^[0-9a-f-]{36}$/i.test(t) ? t : null;

  if (etat === "ok") {
    return (
      <div className="max-w-xl border-l-[3px] border-cyan pl-6">
        <p className="font-display text-xl font-bold text-navy">Vous êtes désinscrit.</p>
        <p className="mt-2 text-muted">Vous ne recevrez plus la lettre d&apos;information du REPTIC.CM. Vous pouvez vous réinscrire à tout moment depuis le pied de page du site.</p>
        <Link href="/" className="link-arrow mt-6">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }
  if (etat === "invalide" || !token) {
    return (
      <div className="max-w-xl border-l-[3px] border-amber-500 pl-6">
        <p className="font-display text-xl font-bold text-navy">Lien de désinscription invalide ou expiré.</p>
        <p className="mt-2 text-muted">
          Utilisez le lien figurant en bas de la dernière lettre reçue, ou{" "}
          <Link href="/contact" className="font-semibold text-navy underline underline-offset-4">
            écrivez-nous
          </Link>{" "}
          : nous vous désinscrirons.
        </p>
      </div>
    );
  }
  return (
    <form action={unsubscribeNewsletter} className="max-w-xl">
      <input type="hidden" name="token" value={token} />
      <p className="font-display text-xl font-bold text-navy">Ne plus recevoir la lettre d&apos;information ?</p>
      <p className="mt-2 text-muted">Confirmez votre désinscription. Vous continuerez à recevoir les e-mails liés à votre compte ou à votre adhésion.</p>
      <button type="submit" className="btn-primary mt-6">
        Me désinscrire
      </button>
    </form>
  );
}
