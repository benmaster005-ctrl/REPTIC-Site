"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, signIn, updatePassword } from "@/app/actions/auth";
import { initialFormState } from "@/lib/forms";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signIn, initialFormState);
  return (
    <form action={action} noValidate className="space-y-5">
      <FormMessage state={state} />
      <input type="hidden" name="suite" value={next ?? "/espace"} />
      <Field name="email" label="Adresse e-mail" type="email" state={state} required autoComplete="email" />
      <Field name="password" label="Mot de passe" type="password" state={state} required autoComplete="current-password" />
      <div className="flex justify-end">
        <Link href="/mot-de-passe-oublie" className="text-sm font-semibold text-navy underline-offset-4 hover:underline">
          Mot de passe oublié ?
        </Link>
      </div>
      <SubmitButton className="btn-primary w-full py-3" pendingLabel="Connexion…">
        Se connecter
      </SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, initialFormState);
  if (state.status === "success") return <FormMessage state={state} />;
  return (
    <form action={action} noValidate className="space-y-5">
      <FormMessage state={state} />
      <Field name="email" label="Adresse e-mail" type="email" state={state} required autoComplete="email" />
      <SubmitButton className="btn-primary w-full py-3">Recevoir un lien</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, initialFormState);
  return (
    <form action={action} noValidate className="space-y-5">
      <FormMessage state={state} />
      <Field
        name="password"
        label="Nouveau mot de passe"
        type="password"
        state={state}
        required
        autoComplete="new-password"
        hint="10 caractères minimum, avec au moins une lettre et un chiffre."
      />
      <Field name="confirm" label="Confirmer le mot de passe" type="password" state={state} required autoComplete="new-password" />
      <SubmitButton className="btn-primary w-full py-3">Enregistrer</SubmitButton>
    </form>
  );
}
