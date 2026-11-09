"use client";

import { useActionState } from "react";
import { inviteContacts, updateEmailPreferences } from "@/app/actions/member";
import { type FormState } from "@/lib/forms";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";

export function InviteForm() {
  const [state, action] = useActionState(inviteContacts, { status: "idle" } as FormState);
  return (
    <form action={action} noValidate className="space-y-5" key={state.status === "success" ? state.message : "form"}>
      <FormMessage state={state} />
      <Field name="emails" label="Adresses e-mail" state={state} required textarea rows={2} hint="Jusqu'à 5 adresses, séparées par une virgule ou un retour à la ligne." placeholder="prenom.nom@entreprise.cm" />
      <Field name="message" label="Votre message (facultatif)" state={state} textarea rows={4} hint="Il sera cité dans l'e-mail d'invitation. 600 caractères maximum." />
      <SubmitButton pendingLabel="Envoi des invitations…">Envoyer les invitations</SubmitButton>
    </form>
  );
}

export function EmailPreferencesForm({ enabled }: { enabled: boolean }) {
  const [state, action] = useActionState(updateEmailPreferences, { status: "idle", values: { email_publications: enabled ? "on" : "" } } as FormState);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="email_publications" defaultChecked={state.values?.email_publications === "on"} className="mt-0.5 size-4 accent-navy" />
        <span>
          <span className="font-semibold text-navy">Recevoir un e-mail à chaque nouvelle actualité ou nouvel événement</span>
          <span className="block text-xs text-muted">Les notifications dans votre espace restent actives dans tous les cas. Les messages importants du secrétariat sont toujours envoyés.</span>
        </span>
      </label>
      <SubmitButton className="btn-secondary px-4 py-2 text-[0.85rem]" pendingLabel="…">
        Enregistrer
      </SubmitButton>
    </form>
  );
}
