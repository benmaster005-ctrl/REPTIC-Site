import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/forms/AuthForms";

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
        <Suspense fallback={<LoginForm />}>
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
  const { suite } = await searchParams;
  return <LoginForm next={typeof suite === "string" ? suite : undefined} />;
}
