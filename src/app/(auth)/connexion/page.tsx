import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm, SocialSignIn } from "@/components/forms/AuthForms";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Accédez à votre espace membre REPTIC.CM.",
  alternates: { canonical: "/connexion" },
};

export default function LoginPage({ searchParams }: PageProps<"/connexion">) {
  return (
    <>
      <h1 className="heading-md">Connexion</h1>
      <p className="mt-2 text-muted">Connectez-vous pour accéder à votre espace.</p>
      <div className="mt-8">
        <Suspense fallback={<><SocialSignIn next="/espace" /><LoginForm /></>}>
          <LoginWithNext searchParams={searchParams} />
        </Suspense>
      </div>
      <p className="mt-8 text-center text-sm text-muted">
        Pas encore membre ?{" "}
        <Link href="/adhesion" className="font-semibold text-navy underline underline-offset-4 hover:text-cyan-dark">
          Déposer une demande d&apos;adhésion
        </Link>
      </p>
    </>
  );
}

async function LoginWithNext({ searchParams }: Pick<PageProps<"/connexion">, "searchParams">) {
  const { suite, erreur } = await searchParams;
  const next = typeof suite === "string" ? suite : undefined;
  const message =
    erreur === "google" || erreur === "linkedin"
      ? `La connexion avec ${erreur === "google" ? "Google" : "LinkedIn"} n'a pas abouti. Réessayez, ou connectez-vous avec votre adresse e-mail.`
      : erreur === "lien"
        ? "Ce lien a expiré ou a déjà été utilisé. Connectez-vous, ou refaites la demande."
        : null;
  return (
    <>
      {message && (
        <p role="alert" className="mb-6 border-l-[3px] border-red-600 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {message}
        </p>
      )}
      <SocialSignIn next={next ?? "/espace"} />
      <LoginForm next={next} />
    </>
  );
}
