"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendContactMessage } from "@/app/actions/public";
import { initialFormState } from "@/lib/forms";
import { Checkbox, Field, FormMessage, SpamGuard, SubmitButton } from "@/components/ui/form";

export function ContactForm() {
  const [state, action] = useActionState(sendContactMessage, initialFormState);

  if (state.status === "success") {
    return (
      <div>
        <FormMessage state={state} />
      </div>
    );
  }

  return (
    <form action={action} noValidate className="relative space-y-6">
      <SpamGuard />
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="full_name" label="Nom complet" state={state} required autoComplete="name" />
        <Field name="email" label="Adresse e-mail" type="email" state={state} required autoComplete="email" />
        <Field name="phone" label="Téléphone" type="tel" state={state} autoComplete="tel" hint="Facultatif" />
        <Field name="subject" label="Objet" state={state} required />
      </div>
      <Field name="message" label="Message" state={state} required textarea rows={6} />
      <Checkbox name="consent" state={state} required>
        J&apos;accepte que mes données soient utilisées pour répondre à ma demande, conformément à la{" "}
        <Link href="/confidentialite" className="font-semibold text-navy underline underline-offset-2">
          politique de confidentialité
        </Link>
        .
      </Checkbox>
      <SubmitButton>Envoyer le message</SubmitButton>
    </form>
  );
}
