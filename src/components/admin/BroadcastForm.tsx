"use client";

import { useState } from "react";
import { sendBroadcast } from "@/app/actions/admin-broadcasts";
import { Field, SelectField } from "@/components/ui/form";
import { ActionForm } from "./forms";

const audiences = [
  { value: "all", label: "Tous les membres actifs" },
  { value: "physical", label: "Membres personnes physiques" },
  { value: "legal", label: "Membres entreprises" },
  { value: "category", label: "Un domaine d'activité" },
  { value: "staff", label: "L'équipe (éditeurs, gestionnaires, administrateurs)" },
];

export function BroadcastForm({ categories }: { categories: { value: string; label: string }[] }) {
  const [audience, setAudience] = useState("all");
  return (
    <ActionForm
      action={sendBroadcast}
      initial={{ audience: "all", send_email: "on" }}
      submitLabel="Diffuser le message"
      pendingLabel="Diffusion en cours…"
      confirm="Diffuser ce message maintenant ? Il ne pourra pas être retiré des boîtes e-mail."
    >
      {(s) => (
        <>
          <Field name="title" label="Titre" state={s} required hint="Sujet de l'e-mail et titre de la notification." />
          <Field name="body" label="Message" state={s} textarea rows={8} required hint="Séparez les paragraphes par une ligne vide. 5000 caractères maximum." />
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">Destinataires *</span>
              <select name="audience" value={audience} onChange={(e) => setAudience(e.target.value)} className="field-input">
                {audiences.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>
            {audience === "category" && <SelectField name="category_id" label="Domaine d'activité" state={s} required options={categories} />}
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="send_email" defaultChecked={s.values?.send_email === "on"} className="mt-0.5 size-4 accent-navy" />
            <span>
              <span className="font-semibold text-navy">Envoyer aussi par e-mail</span>
              <span className="block text-xs text-muted">Sinon, le message apparaît uniquement dans les notifications de l&apos;espace membre.</span>
            </span>
          </label>
        </>
      )}
    </ActionForm>
  );
}
