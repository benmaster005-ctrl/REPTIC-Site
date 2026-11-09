"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, signIn, signUp, updatePassword } from "@/app/actions/auth";
import { initialFormState } from "@/lib/forms";
import { Checkbox, Field, FormMessage, SubmitButton } from "@/components/ui/form";

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

export function SignUpForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signUp, initialFormState);
  if (state.status === "success") {
    return (
      <div className="space-y-6">
        <FormMessage state={state} />
        <p className="text-sm text-muted">
          Rien reçu après quelques minutes ? Vérifiez vos courriers indésirables, puis{" "}
          <Link href="/connexion" className="font-semibold text-navy underline underline-offset-4">
            connectez-vous
          </Link>{" "}
          une fois l&apos;adresse confirmée.
        </p>
      </div>
    );
  }
  return (
    <form action={action} noValidate className="space-y-5">
      <FormMessage state={state} />
      <input type="hidden" name="suite" value={next ?? "/espace/adhesion"} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="first_name" label="Prénom" state={state} required autoComplete="given-name" />
        <Field name="last_name" label="Nom" state={state} required autoComplete="family-name" />
      </div>
      <Field name="email" label="Adresse e-mail" type="email" state={state} required autoComplete="email" hint="Elle servira d'identifiant et recevra le suivi de votre dossier." />
      <Field name="password" label="Mot de passe" type="password" state={state} required autoComplete="new-password" hint="10 caractères minimum, avec au moins une lettre et un chiffre." />
      <Field name="confirm" label="Confirmer le mot de passe" type="password" state={state} required autoComplete="new-password" />
      <Checkbox name="privacy" state={state} required>
        J&apos;accepte que mes données soient traitées pour l&apos;instruction de ma demande, conformément à la{" "}
        <Link href="/confidentialite" className="font-semibold text-navy underline underline-offset-2">
          politique de confidentialité
        </Link>
        .
      </Checkbox>
      <SubmitButton className="btn-primary w-full py-3" pendingLabel="Création du compte…">
        Créer mon compte
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
