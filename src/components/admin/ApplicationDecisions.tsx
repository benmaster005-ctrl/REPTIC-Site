"use client";

import { useState } from "react";
import { acceptApplication, decideApplication, takeApplication } from "@/app/actions/admin-applications";
import type { ApplicationStatus } from "@/lib/membership";
import { Field, SelectField } from "@/components/ui/form";
import { ActionForm } from "./forms";

type Tab = "accept" | "additional_info" | "reject";

function today() {
  return new Date().toISOString().slice(0, 10);
}
function endOfYear() {
  return `${new Date().getFullYear()}-12-31`;
}

/** Panneau des décisions d'instruction (§4.4, §6.1). */
export function ApplicationDecisions({ applicationId, status, missingCount, categories, defaultCategory }: {
  applicationId: string;
  status: ApplicationStatus;
  missingCount: number;
  categories: { value: string; label: string }[];
  defaultCategory: string;
}) {
  const [tab, setTab] = useState<Tab>("accept");
  const open = status === "submitted" || status === "under_review";
  const hidden = { application_id: applicationId };

  return (
    <section className="bg-white p-6 sm:p-8">
      <h2 className="label">Décision</h2>

      {!open ? (
        <p className="mt-4 text-[0.92rem] text-muted">
          {status === "additional_info"
            ? "En attente du complément du candidat. Le dossier reviendra ici dès qu'il le renverra."
            : status === "draft"
              ? "Le candidat n'a pas encore envoyé son dossier."
              : "Ce dossier est clos."}
        </p>
      ) : (
        <>
          {status === "submitted" && (
            <div className="mt-4 border-b border-line pb-5">
              <ActionForm action={takeApplication} hidden={hidden} submitLabel="Prendre en charge" tone="secondary" pendingLabel="…" className="space-y-3">
                <p className="text-[0.88rem] text-muted">Le dossier passe « En cours d&apos;examen » à votre nom.</p>
              </ActionForm>
            </div>
          )}

          <div role="tablist" aria-label="Type de décision" className="mt-5 grid grid-cols-3 border border-line">
            {(
              [
                ["accept", "Accepter"],
                ["additional_info", "Complément"],
                ["reject", "Refuser"],
              ] as [Tab, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`px-2 py-2.5 text-[0.82rem] font-semibold transition-colors ${tab === key ? "bg-navy text-white" : "text-navy hover:bg-paper"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5" role="tabpanel">
            {tab === "accept" && (
              <ActionForm
                key="accept"
                action={acceptApplication}
                hidden={hidden}
                initial={{ category_id: defaultCategory, starts_on: today(), ends_on: endOfYear(), directory: "members" }}
                submitLabel="Accepter l'adhésion"
                pendingLabel="Création du membre…"
                confirm="Accepter cette adhésion ? La fiche membre sera créée et le compte activé."
              >
                {(s) => (
                  <>
                    {missingCount > 0 && (
                      <p className="border-l-[3px] border-amber-500 pl-3 text-[0.85rem] text-amber-800">
                        {missingCount} pièce{missingCount > 1 ? "s" : ""} obligatoire{missingCount > 1 ? "s" : ""} manquante{missingCount > 1 ? "s" : ""}.
                      </p>
                    )}
                    <SelectField name="category_id" label="Catégorie de membre" state={s} options={categories} required />
                    <div className="grid grid-cols-2 gap-3">
                      <Field name="starts_on" label="Début" type="date" state={s} required />
                      <Field name="ends_on" label="Fin" type="date" state={s} hint="Par défaut : 31/12" />
                    </div>
                    <SelectField
                      name="directory"
                      label="Annuaire"
                      state={s}
                      required
                      options={[
                        { value: "members", label: "Visible par les membres" },
                        { value: "public", label: "Visible publiquement" },
                      ]}
                    />
                  </>
                )}
              </ActionForm>
            )}
            {tab !== "accept" && (
              <ActionForm
                key={tab}
                action={decideApplication}
                hidden={{ ...hidden, decision: tab }}
                submitLabel={tab === "reject" ? "Refuser la demande" : "Demander le complément"}
                tone={tab === "reject" ? "danger" : "primary"}
                confirm={tab === "reject" ? "Refuser définitivement cette demande ? Le candidat sera notifié avec votre motif." : undefined}
              >
                {(s) => (
                  <Field
                    name="reason"
                    label={tab === "reject" ? "Motif du refus" : "Ce que le candidat doit compléter"}
                    state={s}
                    textarea
                    rows={5}
                    required
                    hint="Ce message est transmis tel quel au candidat."
                  />
                )}
              </ActionForm>
            )}
          </div>
        </>
      )}
    </section>
  );
}
