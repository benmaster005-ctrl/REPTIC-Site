import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/forms/AuthForms";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

// Atteinte via le lien e-mail : /auth/callback ouvre la session puis redirige ici.
export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="heading-md">Nouveau mot de passe</h1>
      <p className="mt-2 text-muted">Choisissez un mot de passe robuste que vous n&apos;utilisez pas ailleurs.</p>
      <div className="mt-8">
        <ResetPasswordForm />
      </div>
    </>
  );
}
