"use client";

import { useActionState, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { subscribeNewsletter } from "@/app/actions/public";
import { initialFormState } from "@/lib/forms";
import { FormMessage, SpamGuard, SubmitButton } from "@/components/ui/form";
import { preloadRecaptcha, withRecaptcha } from "./recaptcha";
import { RecaptchaNotice } from "./RecaptchaNotice";

const newsletterAction = withRecaptcha(subscribeNewsletter, "newsletter");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function NewsletterForm() {
  const [state, action] = useActionState(newsletterAction, initialFormState);
  const [valid, setValid] = useState(false);
  useEffect(preloadRecaptcha, []);
  const emailError = state.fieldErrors?.email?.[0];
  const consentError = state.fieldErrors?.consent?.[0];

  if (state.status === "success") return <FormMessage state={state} />;

  return (
    <form action={action} className="relative space-y-3" noValidate>
      <SpamGuard />
      <label htmlFor="newsletter-email" className="sr-only">
        Adresse e-mail
      </label>
      {/* Champ en pastille, bouton intégré */}
      <div className="flex items-center rounded-full bg-ice p-1 pl-5 ring-1 ring-transparent transition-shadow focus-within:ring-2 focus-within:ring-cyan">
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="nom@entreprise.cm"
          defaultValue={state.values?.email}
          onChange={(e) => setValid(EMAIL.test(e.currentTarget.value.trim()))}
          aria-invalid={emailError ? true : undefined}
          aria-describedby="newsletter-email-etat"
          className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-[0.92rem] text-ink shadow-none outline-none! placeholder:text-muted/60"
        />
        <SubmitButton className="btn shrink-0 bg-navy px-5 py-2.5 text-white hover:bg-cyan-dark" pendingLabel="Envoi…">
          S&apos;abonner
        </SubmitButton>
      </div>
      <p id="newsletter-email-etat" aria-live="polite" className={`flex items-center gap-1.5 pl-5 text-[0.78rem] font-medium text-cyan-dark transition-opacity ${valid ? "opacity-100" : "h-0 opacity-0"}`}>
        {valid && (
          <>
            <Check aria-hidden className="size-3.5" /> Adresse valide
          </>
        )}
      </p>
      {emailError && <p className="field-error">{emailError}</p>}
      <label className="flex items-start gap-2.5 text-[0.78rem] leading-snug text-muted">
        <input type="checkbox" name="consent" required className="mt-0.5 size-4 shrink-0 accent-navy" />
        J&apos;accepte de recevoir la lettre d&apos;information de REPTIC.CM et peux me désinscrire à tout moment.
      </label>
      {consentError && <p className="field-error">{consentError}</p>}
      {state.status === "error" && state.message && <p className="field-error">{state.message}</p>}
      <RecaptchaNotice />
    </form>
  );
}
