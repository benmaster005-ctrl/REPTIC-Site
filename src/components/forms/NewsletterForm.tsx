"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { subscribeNewsletter } from "@/app/actions/public";
import { initialFormState } from "@/lib/forms";
import { FormMessage, SpamGuard, SubmitButton } from "@/components/ui/form";

export function NewsletterForm() {
  const [state, action] = useActionState(subscribeNewsletter, initialFormState);
  const emailError = state.fieldErrors?.email?.[0];
  const consentError = state.fieldErrors?.consent?.[0];

  if (state.status === "success") return <FormMessage state={state} />;

  return (
    <form action={action} className="relative space-y-3" noValidate>
      <SpamGuard />
      <label htmlFor="newsletter-email" className="sr-only">
        Adresse e-mail
      </label>
      <div className="flex border border-navy focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-cyan">
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="Adresse e-mail"
          defaultValue={state.values?.email}
          aria-invalid={emailError ? true : undefined}
          className="min-w-0 flex-1 bg-white px-3.5 py-3 text-[0.92rem] text-ink placeholder:text-muted/60 focus:outline-none"
        />
        <SubmitButton className="btn shrink-0 rounded-none bg-navy px-4 text-white hover:bg-cyan-dark" pendingLabel="">
          <span className="sr-only">S&apos;inscrire</span>
          <ArrowRight aria-hidden className="size-4" />
        </SubmitButton>
      </div>
      {emailError && <p className="field-error">{emailError}</p>}
      <label className="flex items-start gap-2.5 text-[0.78rem] leading-snug text-muted">
        <input type="checkbox" name="consent" required className="mt-0.5 size-4 shrink-0 accent-navy" />
        J&apos;accepte de recevoir la lettre d&apos;information de REPTIC.CM et peux me désinscrire à tout moment.
      </label>
      {consentError && <p className="field-error">{consentError}</p>}
      {state.status === "error" && state.message && <p className="field-error">{state.message}</p>}
    </form>
  );
}
