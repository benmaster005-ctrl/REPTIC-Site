"use client";

import Link from "next/link";
import { useActionState, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, FileText, Loader2, Upload } from "lucide-react";
import { registerDocument, saveApplicationInfo, submitApplication } from "@/app/actions/membership";
import { createClient } from "@/lib/supabase/client";
import { type FormState } from "@/lib/forms";
import { MAX_FILE_BYTES, OTHER, activityDomains, activitySectors, countries, formatBytes, legalForms, safeFileName, type ApplicantType } from "@/lib/membership";
import { Checkbox, Field, FormMessage, SelectField, SubmitButton } from "@/components/ui/form";

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-line pt-6">
      <legend className="label float-left mb-5 w-full">{legend}</legend>
      <div className="clear-both grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/** Liste avec « Autre » : le champ « Précisez » apparaît quand il est choisi. */
function SelectWithOther({ name, label, options, state, placeholder }: {
  name: string;
  label: string;
  options: string[];
  state: FormState;
  placeholder: string;
}) {
  const [value, setValue] = useState(state.values?.[name] ?? "");
  return (
    <>
      <SelectField name={name} label={label} state={state} required options={options.map((o) => ({ value: o, label: o }))} onValueChange={setValue} />
      {value === OTHER && <Field name={`${name}_other`} label="Précisez" state={state} required placeholder={placeholder} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Étape 2 : informations
// ---------------------------------------------------------------------------
export function ApplicationInfoForm({ applicationId, type, initial }: {
  applicationId: string;
  type: ApplicantType;
  initial: Record<string, string>;
}) {
  const [state, action] = useActionState(saveApplicationInfo, { status: "idle", values: initial } as FormState);
  const countryOptions = countries.map((c) => ({ value: c, label: c }));
  const s = { ...state, values: state.values ?? initial };

  return (
    <form action={action} noValidate className="space-y-8">
      <input type="hidden" name="application_id" value={applicationId} />
      <FormMessage state={s} />
      {type === "physical" ? (
        <>
          <Fieldset legend="Identité">
            <Field name="first_name" label="Prénom" state={s} required autoComplete="given-name" />
            <Field name="last_name" label="Nom" state={s} required autoComplete="family-name" />
            <Field name="birth_date" label="Date de naissance" type="date" state={s} hint="Facultatif" />
          </Fieldset>
          <Fieldset legend="Coordonnées">
            <Field name="phone" label="Téléphone" type="tel" state={s} required autoComplete="tel" placeholder="+237 6XX XX XX XX" />
            <Field name="city" label="Ville" state={s} required autoComplete="address-level2" />
            <SelectField name="country" label="Pays" state={s} required options={countryOptions} />
          </Fieldset>
          <Fieldset legend="Activité professionnelle">
            <Field name="profession" label="Profession" state={s} required placeholder="Ex. architecte réseau, consultant cybersécurité" />
            <Field name="organization" label="Organisation" state={s} hint="Facultatif : employeur ou structure" />
            <Field name="experience_years" label="Années d'expérience" type="number" state={s} required />
          </Fieldset>
          <Fieldset legend="Domaine et secteur d'activité">
            <SelectWithOther name="domain" label="Domaine d'activité" options={activityDomains} state={s} placeholder="Votre domaine" />
            <SelectWithOther name="sector" label="Secteur d'activité" options={activitySectors} state={s} placeholder="Votre secteur" />
          </Fieldset>
        </>
      ) : (
        <>
          <Fieldset legend="Entreprise">
            <Field name="legal_name" label="Dénomination sociale" state={s} required autoComplete="organization" />
            <SelectField name="legal_form" label="Forme juridique" state={s} required options={legalForms.map((f) => ({ value: f, label: f }))} />
            <Field name="website" label="Site web" type="url" state={s} hint="Facultatif" placeholder="www.exemple.cm" />
            <Field name="registration_number" label="Numéro RCCM" state={s} required placeholder="RC/YAO/2020/B/1234" />
            <Field name="tax_id" label="NIU" state={s} required />
          </Fieldset>
          <Fieldset legend="Domaine et secteur d'activité">
            <SelectWithOther name="domain" label="Domaine d'activité" options={activityDomains} state={s} placeholder="Votre domaine" />
            <SelectWithOther name="sector" label="Secteur d'activité" options={activitySectors} state={s} placeholder="Votre secteur" />
          </Fieldset>
          <Fieldset legend="Siège">
            <Field name="address" label="Adresse du siège" state={s} required autoComplete="street-address" />
            <Field name="city" label="Ville" state={s} required autoComplete="address-level2" />
            <SelectField name="country" label="Pays" state={s} required options={countryOptions} />
            <Field name="phone" label="Téléphone" type="tel" state={s} required placeholder="+237 2XX XX XX XX" />
            <Field name="email" label="E-mail de l'entreprise" type="email" state={s} required />
          </Fieldset>
          <Fieldset legend="Représentant légal">
            <Field name="rep_first_name" label="Prénom" state={s} required />
            <Field name="rep_last_name" label="Nom" state={s} required />
            <Field name="rep_title" label="Fonction" state={s} required placeholder="Directeur général, gérant…" />
            <Field name="rep_email" label="E-mail" type="email" state={s} required />
            <Field name="rep_phone" label="Téléphone" type="tel" state={s} required />
          </Fieldset>
        </>
      )}
      <fieldset className="border-t border-line pt-6">
        <legend className="label mb-5">Motivation</legend>
        <Field name="motivation" label="Ce que vous attendez du réseau" state={s} textarea rows={4} hint="Facultatif, 1500 caractères maximum." />
      </fieldset>

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
        <Link href="/espace/adhesion?etape=type" className="btn-secondary">
          <ArrowLeft aria-hidden className="size-4" /> Type de demande
        </Link>
        <SubmitButton pendingLabel="Enregistrement…">
          Enregistrer et continuer <ArrowRight aria-hidden className="size-4" />
        </SubmitButton>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Étape 3 : dépôt d'une pièce (envoi direct au stockage privé)
// ---------------------------------------------------------------------------
export function DocumentUploader({ applicationId, userId, documentType, accept, hasFile }: {
  applicationId: string;
  userId: string;
  documentType: string;
  accept: string[];
  hasFile: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onFile(file: File) {
    setError(null);
    if (!accept.includes(file.type)) {
      setError(`Format non accepté. Formats possibles : ${accept.map((m) => m.split("/")[1].toUpperCase()).join(", ")}.`);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(`Fichier trop volumineux (${formatBytes(file.size)}). Maximum : 10 Mo.`);
      return;
    }
    setProgress(`Envoi de ${file.name}…`);
    const path = `${userId}/${applicationId}/${documentType}-${crypto.randomUUID().slice(0, 8)}-${safeFileName(file.name)}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage.from("private-documents").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      setProgress(null);
      setError("L'envoi a échoué. Vérifiez votre connexion et réessayez.");
      return;
    }
    setProgress("Vérification…");
    const result = await registerDocument({ applicationId, documentType, storagePath: path, fileName: file.name, mimeType: file.type, sizeBytes: file.size });
    setProgress(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  const busy = Boolean(progress) || pending;
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void onFile(f);
        }}
      />
      <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className={hasFile ? "btn-secondary px-4 py-2 text-[0.85rem]" : "btn-primary px-4 py-2 text-[0.85rem]"}>
        {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Upload aria-hidden className="size-4" />}
        {busy ? "Envoi…" : hasFile ? "Remplacer" : "Ajouter le fichier"}
      </button>
      <p aria-live="polite" className="mt-2 text-[0.8rem]">
        {progress && <span className="text-muted">{progress}</span>}
        {error && <span className="font-medium text-red-700">{error}</span>}
      </p>
    </div>
  );
}

export function FileChip({ name, size }: { name: string; size: number }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 text-[0.88rem] text-navy">
      <FileText aria-hidden className="size-4 shrink-0 text-cyan-dark" />
      <span className="truncate">{name}</span>
      <span className="shrink-0 font-mono text-[0.72rem] text-muted">{formatBytes(size)}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Étape 4 : envoi
// ---------------------------------------------------------------------------
export function SubmitApplicationForm({ applicationId, ready }: { applicationId: string; ready: boolean }) {
  const [state, action] = useActionState(submitApplication, { status: "idle" } as FormState);
  return (
    <form action={action} noValidate className="space-y-5">
      <input type="hidden" name="application_id" value={applicationId} />
      <FormMessage state={state} />
      <Checkbox name="accuracy" state={state} required>
        Je certifie l&apos;exactitude des informations fournies et l&apos;authenticité des pièces jointes.
      </Checkbox>
      <Checkbox name="terms" state={state} required>
        J&apos;accepte les statuts et le règlement intérieur de REPTIC.CM, ainsi que le traitement de mes données pour l&apos;instruction de ma demande.
      </Checkbox>
      <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
        <Link href="/espace/adhesion?etape=pieces" className="btn-secondary">
          <ArrowLeft aria-hidden className="size-4" /> Justificatifs
        </Link>
        {ready ? (
          <SubmitButton pendingLabel="Envoi du dossier…">
            Envoyer ma demande <ArrowRight aria-hidden className="size-4" />
          </SubmitButton>
        ) : (
          <button type="button" disabled className="btn-primary">
            Dossier incomplet
          </button>
        )}
      </div>
    </form>
  );
}
