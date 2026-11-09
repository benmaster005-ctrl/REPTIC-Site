"use client";

import { useActionState } from "react";
import { changePassword, updateAccount, updateMemberProfile } from "@/app/actions/member";
import { type FormState } from "@/lib/forms";
import { Field, FormMessage, SelectField, SubmitButton } from "@/components/ui/form";

export function AccountForm({ initial }: { initial: Record<string, string> }) {
  const [state, action] = useActionState(updateAccount, { status: "idle", values: initial } as FormState);
  return (
    <form action={action} noValidate className="space-y-5">
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="first_name" label="Prénom" state={state} required autoComplete="given-name" />
        <Field name="last_name" label="Nom" state={state} required autoComplete="family-name" />
        <Field name="phone" label="Téléphone" type="tel" state={state} autoComplete="tel" />
      </div>
      <SubmitButton pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
    </form>
  );
}

export function MemberProfileForm({ initial }: { initial: Record<string, string> }) {
  const [state, action] = useActionState(updateMemberProfile, { status: "idle", values: initial } as FormState);
  return (
    <form action={action} noValidate className="space-y-5">
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="profession" label="Profession ou activité" state={state} />
        <Field name="city" label="Ville" state={state} />
        <Field name="phone" label="Téléphone affiché" type="tel" state={state} hint="Visible dans l'annuaire selon le réglage ci-dessous." />
        <SelectField
          name="directory_visibility"
          label="Visibilité dans l'annuaire"
          state={state}
          required
          options={[
            { value: "members", label: "Visible par les membres uniquement" },
            { value: "public", label: "Visible publiquement" },
            { value: "hidden", label: "Masqué de l'annuaire" },
          ]}
        />
      </div>
      <Field name="bio" label="Présentation" state={state} textarea rows={4} hint="600 caractères maximum." />
      <SubmitButton pendingLabel="Enregistrement…">Mettre à jour ma fiche</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, { status: "idle" } as FormState);
  return (
    <form action={action} noValidate className="max-w-md space-y-5" key={state.status === "success" ? "ok" : "form"}>
      <FormMessage state={state} />
      <Field name="current" label="Mot de passe actuel" type="password" state={state} required autoComplete="current-password" />
      <Field name="password" label="Nouveau mot de passe" type="password" state={state} required autoComplete="new-password" hint="10 caractères minimum, avec au moins une lettre et un chiffre." />
      <Field name="confirm" label="Confirmer le nouveau mot de passe" type="password" state={state} required autoComplete="new-password" />
      <SubmitButton pendingLabel="Modification…">Modifier le mot de passe</SubmitButton>
    </form>
  );
}
