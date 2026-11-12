import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignUpForm, SocialSignIn } from "@/components/forms/AuthForms";

export const metadata: Metadata = {
  title: "Créer un compte candidat",
  description: "Créez votre compte pour déposer et suivre votre demande d'adhésion à REPTIC.CM.",
  robots: { index: false },
};

export default function SignUpPage({ searchParams }: PageProps<"/inscription">) {
  return (
    <>
      <p className="label text-cyan-dark">Demande d&apos;adhésion</p>
      <h1 className="heading-md mt-3">Créer votre compte candidat</h1>
      <p className="mt-2 text-muted">Il vous permet de déposer votre dossier, de l&apos;enregistrer en cours de route et d&apos;en suivre l&apos;instruction.</p>
      <div className="mt-8">
        <Suspense fallback={<SignUpForm />}>
          <SignUpWithNext searchParams={searchParams} />
        </Suspense>
      </div>
      <p className="mt-8 text-center text-sm text-muted">
        Déjà un compte ?{" "}
        <Link href="/connexion?suite=/espace/adhesion" className="font-semibold text-navy underline underline-offset-4 hover:text-cyan-dark">
          Se connecter
        </Link>
      </p>
    </>
  );
}

async function SignUpWithNext({ searchParams }: Pick<PageProps<"/inscription">, "searchParams">) {
  const { suite } = await searchParams;
  const next = typeof suite === "string" ? suite : undefined;
  return (
    <>
      <SocialSignIn
        next={next ?? "/espace/adhesion"}
        note={
          <>
            En continuant avec Google ou LinkedIn, vous acceptez la{" "}
            <Link href="/confidentialite" className="font-semibold text-navy underline underline-offset-2">
              politique de confidentialité
            </Link>
            .
          </>
        }
      />
      <SignUpForm next={next} />
    </>
  );
}
