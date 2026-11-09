"use client";

import { updateFees } from "@/app/actions/admin-payments";
import { Field } from "@/components/ui/form";
import { ActionForm } from "./forms";

export function FeesForm({ initial }: { initial: Record<string, string> }) {
  return (
    <ActionForm action={updateFees} initial={initial} submitLabel="Enregistrer les tarifs" confirm="Modifier les tarifs ? Ils s'appliqueront aux prochains paiements.">
      {(s) => (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="physical" label="Personne physique (FCFA par an)" state={s} placeholder="Ex. 25000" hint="Vide : paiement en ligne fermé." />
          <Field name="legal" label="Personne morale (FCFA par an)" state={s} placeholder="Ex. 150000" hint="Vide : paiement en ligne fermé." />
        </div>
      )}
    </ActionForm>
  );
}
