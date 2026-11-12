"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, signIn, signInWithOAuthProvider, signUp, updatePassword } from "@/app/actions/auth";
import { initialFormState } from "@/lib/forms";
import { Checkbox, Field, FormMessage, SubmitButton } from "@/components/ui/form";

/** Logo Google officiel (quatre couleurs), exigé par les règles de marque de Google. */
function GoogleLogo() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="size-5 shrink-0">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/** Logo LinkedIn officiel (carré bleu « in »). */
function LinkedInLogo() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5 shrink-0">
      <path
        fill="#0A66C2"
        d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"
      />
    </svg>
  );
}

function ProviderButton({ provider, next, logo, label }: { provider: "google" | "linkedin"; next: string; logo: React.ReactNode; label: string }) {
  return (
    <form action={signInWithOAuthProvider}>
      <input type="hidden" name="fournisseur" value={provider} />
      <input type="hidden" name="suite" value={next} />
      <SubmitButton className="btn w-full border border-line bg-white py-3 text-navy hover:border-navy" pendingLabel={`Redirection vers ${label}…`}>
        {logo} Continuer avec {label}
      </SubmitButton>
    </form>
  );
}

/** « Continuer avec Google / LinkedIn », suivi d'un séparateur vers le formulaire e-mail. */
export function SocialSignIn({ next, note }: { next: string; note?: React.ReactNode }) {
  return (
    <div>
      <div className="grid gap-3">
        <ProviderButton provider="google" next={next} logo={<GoogleLogo />} label="Google" />
        <ProviderButton provider="linkedin" next={next} logo={<LinkedInLogo />} label="LinkedIn" />
      </div>
      {note && <p className="mt-3 text-center text-[0.8rem] leading-relaxed text-muted">{note}</p>}
      <p className="my-7 flex items-center gap-4 text-[0.8rem] text-muted">
        <span aria-hidden className="h-px flex-1 bg-line" />
        ou avec votre adresse e-mail
        <span aria-hidden className="h-px flex-1 bg-line" />
      </p>
    </div>
  );
}

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
