import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms/AuthForms";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="heading-md">Mot de passe oublié</h1>
      <p className="mt-2 text-muted">Saisissez votre adresse e-mail : nous vous enverrons un lien pour choisir un nouveau mot de passe.</p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
      <p className="mt-8 text-center text-sm">
        <Link href="/connexion" className="font-semibold text-navy underline underline-offset-4 hover:text-cyan-dark">
          Retour à la connexion
        </Link>
      </p>
    </>
  );
}
