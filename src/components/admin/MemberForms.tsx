"use client";

import { renewMembership, setMemberStatus, updateMember, updateOrganization } from "@/app/actions/admin-members";
import { Field, SelectField } from "@/components/ui/form";
import { ActionForm } from "./forms";

export function MemberEditForms({ memberId, member, organization }: {
  memberId: string;
  member: Record<string, string>;
  organization: { id: string; values: Record<string, string> } | null;
}) {
  return (
    <>
      {organization && (
        <section className="bg-white p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-navy">Entreprise</h2>
          <div className="mt-6">
            <ActionForm action={updateOrganization} hidden={{ organization_id: organization.id }} initial={organization.values} submitLabel="Enregistrer l'entreprise">
              {(s) => (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field name="legal_name" label="Raison sociale" state={s} required />
                  <Field name="legal_form" label="Forme juridique" state={s} />
                  <Field name="registration_number" label="RCCM" state={s} />
                  <Field name="tax_id" label="NIU" state={s} />
                  <Field name="address" label="Adresse du siège" state={s} />
                  <Field name="city" label="Ville" state={s} />
                  <Field name="phone" label="Téléphone" state={s} />
                  <Field name="email" label="E-mail" type="email" state={s} />
                  <Field name="website" label="Site web" state={s} />
                  <Field name="rep_first_name" label="Prénom du représentant" state={s} />
                  <Field name="rep_last_name" label="Nom du représentant" state={s} />
                  <Field name="rep_title" label="Fonction du représentant" state={s} />
                </div>
              )}
            </ActionForm>
          </div>
        </section>
      )}
      <section className="bg-white p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold text-navy">{organization ? "Contact référent" : "Fiche membre"}</h2>
        <div className="mt-6">
          <ActionForm action={updateMember} hidden={{ member_id: memberId }} initial={member} submitLabel="Enregistrer la fiche">
            {(s) => (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field name="first_name" label="Prénom" state={s} />
                  <Field name="last_name" label="Nom" state={s} />
                  <Field name="profession" label="Profession / fonction" state={s} />
                  <Field name="phone" label="Téléphone" state={s} />
                  <Field name="city" label="Ville" state={s} />
                  <Field name="country" label="Pays" state={s} />
                  <SelectField
                    name="directory_visibility"
                    label="Annuaire"
                    state={s}
                    required
                    options={[
                      { value: "members", label: "Visible par les membres" },
                      { value: "public", label: "Visible publiquement" },
                      { value: "hidden", label: "Masqué" },
                    ]}
                  />
                </div>
                <Field name="bio" label="Présentation" state={s} textarea rows={3} />
              </>
            )}
          </ActionForm>
        </div>
      </section>
    </>
  );
}

export function RenewForm({ memberId, lastEnd }: { memberId: string; lastEnd: string }) {
  const start = lastEnd ? new Date(new Date(lastEnd).getTime() + 86400000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const end = `${start.slice(0, 4)}-12-31`;
  return (
    <details className="mt-5 border-t border-line pt-4">
      <summary className="cursor-pointer text-sm font-semibold text-navy hover:text-cyan-dark">Renouveler / nouvelle période</summary>
      <div className="mt-4">
        <ActionForm action={renewMembership} hidden={{ member_id: memberId }} initial={{ starts_on: start, ends_on: end }} submitLabel="Créer la période" tone="secondary">
          {(s) => (
            <div className="grid grid-cols-2 gap-3">
              <Field name="starts_on" label="Début" type="date" state={s} required />
              <Field name="ends_on" label="Fin" type="date" state={s} required />
            </div>
          )}
        </ActionForm>
      </div>
    </details>
  );
}

export function MemberStatusActions({ memberId, status }: { memberId: string; status: string }) {
  const actions: { status: "active" | "suspended" | "archived"; label: string; tone: "primary" | "secondary" | "danger"; confirm: string }[] = [];
  if (status !== "active") actions.push({ status: "active", label: "Réactiver le compte", tone: "primary", confirm: "Réactiver ce compte membre ?" });
  if (status === "active") actions.push({ status: "suspended", label: "Suspendre", tone: "secondary", confirm: "Suspendre ce membre ? Il perd l'accès aux contenus réservés." });
  if (status !== "archived") actions.push({ status: "archived", label: "Archiver", tone: "danger", confirm: "Archiver ce membre ? Il est retiré de l'annuaire et son adhésion est close." });
  return (
    <section className="bg-white p-6 sm:p-8">
      <h2 className="label">Statut du compte</h2>
      <div className="mt-4 space-y-4">
        {actions.map((a) => (
          <ActionForm key={a.status} action={setMemberStatus} hidden={{ member_id: memberId, status: a.status }} submitLabel={a.label} tone={a.tone} confirm={a.confirm} className="space-y-3">
            {(s) => (a.status === "active" ? null : <Field name="reason" label="Motif (transmis au membre)" state={s} />)}
          </ActionForm>
        ))}
      </div>
    </section>
  );
}
