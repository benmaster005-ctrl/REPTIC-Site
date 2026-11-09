"use client";

import { useState } from "react";
import { saveEmailTemplate, sendTestEmail } from "@/app/actions/admin-emails";
import { Field } from "@/components/ui/form";
import { ActionForm } from "./forms";

export function EmailTemplateEditor({ templateKey, initial, variables, previewHtml, canSend }: {
  templateKey: string;
  initial: Record<string, string>;
  variables: string[];
  previewHtml: string;
  canSend: boolean;
}) {
  const [showPreview, setShowPreview] = useState(false);
  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <div className="xl:col-span-7">
        <ActionForm action={saveEmailTemplate} hidden={{ key: templateKey }} initial={initial} submitLabel="Enregistrer le modèle">
          {(s) => (
            <>
              <Field name="subject" label="Sujet" state={s} required />
              <Field name="body" label="Texte" state={s} textarea rows={11} required hint="Séparez les paragraphes par une ligne vide. Un paragraphe réduit à {{motif}} ou {{message}} s'affiche dans un encadré." />
              <label className="flex items-center gap-3 text-sm font-semibold text-navy">
                <input type="checkbox" name="is_enabled" defaultChecked={s.values?.is_enabled === "on"} className="size-4 accent-navy" />
                Envoyer cet e-mail automatiquement
              </label>
            </>
          )}
        </ActionForm>
      </div>
      <div className="space-y-5 xl:col-span-5">
        <div>
          <p className="label">Variables disponibles</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {variables.map((v) => (
              <li key={v}>
                <code className="border border-line bg-paper px-2 py-1 font-mono text-[0.78rem] text-navy">{`{{${v}}}`}</code>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.8rem] text-muted">Le bouton d&apos;action, le récapitulatif et la mise en page REPTIC sont ajoutés automatiquement.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setShowPreview((v) => !v)} className="btn-secondary px-4 py-2 text-[0.85rem]" aria-expanded={showPreview}>
            {showPreview ? "Masquer l'aperçu" : "Aperçu (version enregistrée)"}
          </button>
          <ActionForm action={sendTestEmail} hidden={{ key: templateKey }} submitLabel="M'envoyer un test" tone="secondary" pendingLabel="Envoi…" className="space-y-3 [&_button]:px-4 [&_button]:py-2 [&_button]:text-[0.85rem]">
            {!canSend && <p className="text-[0.8rem] text-amber-800">Envoi non configuré (serveur SMTP absent).</p>}
          </ActionForm>
        </div>
      </div>
      {showPreview && (
        <div className="xl:col-span-12">
          <iframe title="Aperçu de l'e-mail" srcDoc={previewHtml} sandbox="" className="h-[760px] w-full border border-line bg-paper" />
        </div>
      )}
    </div>
  );
}
