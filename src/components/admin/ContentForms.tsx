"use client";

import { useState } from "react";
import { saveEvent, saveGovernanceMember, saveKeyFigure, saveNews, savePage } from "@/app/actions/admin-content";
import { Field, SelectField } from "@/components/ui/form";
import { type FormState } from "@/lib/forms";
import { ActionForm } from "./forms";
import { ImageField, MarkdownField } from "./editors";

type Option = { value: string; label: string };

function Toggle({ name, label, state, hint }: { name: string; label: string; state: FormState; hint?: string }) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" name={name} defaultChecked={state.values?.[name] === "on"} className="mt-0.5 size-4 shrink-0 accent-navy" />
      <span>
        <span className="font-semibold text-navy">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white p-6 sm:p-8">
      <h2 className="label mb-5">{title}</h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Actualité
// ---------------------------------------------------------------------------
export function NewsForm({ id, initial, categories }: { id?: string; initial: Record<string, string>; categories: Option[] }) {
  const [status, setStatus] = useState(initial.status || "draft");
  return (
    <ActionForm action={saveNews} hidden={id ? { id } : undefined} initial={initial} submitLabel={id ? "Enregistrer" : "Créer l'actualité"} className="space-y-6">
      {(s) => (
        <div className="grid gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-8">
            <Section title="Contenu">
              <Field name="title" label="Titre" state={s} required />
              <Field name="excerpt" label="Chapeau" state={s} textarea rows={2} hint="Résumé affiché dans les listes et les partages (400 caractères max)." />
              <MarkdownField name="body" label="Texte" state={s} />
            </Section>
            <Section title="Référencement">
              <Field name="slug" label="Adresse de la page" state={s} hint="Générée depuis le titre si vide. Ex. forum-numerique-2027" />
              <Field name="seo_title" label="Titre pour les moteurs de recherche" state={s} hint="70 caractères max ; à défaut, le titre." />
              <Field name="seo_description" label="Description pour les moteurs de recherche" state={s} textarea rows={2} hint="170 caractères max ; à défaut, le chapeau." />
            </Section>
          </div>
          <div className="space-y-6 xl:col-span-4">
            <Section title="Publication">
              <label className="block">
                <span className="field-label">Statut</span>
                <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="field-input">
                  <option value="draft">Brouillon</option>
                  <option value="published">Publiée</option>
                  <option value="scheduled">Programmée</option>
                  <option value="archived">Archivée</option>
                </select>
              </label>
              <Field
                name="published_at"
                label={status === "scheduled" ? "Date de publication" : "Date affichée"}
                type="datetime-local"
                state={s}
                required={status === "scheduled"}
                hint={status === "scheduled" ? "Heure du Cameroun. L'article apparaît automatiquement à cette date." : "Vide : date de publication effective."}
              />
              <SelectField name="visibility" label="Accès" state={s} required options={[{ value: "public", label: "Public" }, { value: "members", label: "Réservé aux membres" }]} />
              <SelectField name="category_id" label="Rubrique" state={s} options={categories} placeholder="Sans rubrique" />
            </Section>
            <Section title="Image de couverture">
              <ImageField name="cover_path" label="Visuel" folder="actualites" state={s} />
            </Section>
          </div>
        </div>
      )}
    </ActionForm>
  );
}

// ---------------------------------------------------------------------------
// Événement
// ---------------------------------------------------------------------------
export function EventForm({ id, initial, categories }: { id?: string; initial: Record<string, string>; categories: Option[] }) {
  return (
    <ActionForm action={saveEvent} hidden={id ? { id } : undefined} initial={initial} submitLabel={id ? "Enregistrer" : "Créer l'événement"} className="space-y-6">
      {(s) => (
        <div className="grid gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-8">
            <Section title="Présentation">
              <Field name="title" label="Intitulé" state={s} required />
              <Field name="excerpt" label="Accroche" state={s} textarea rows={2} />
              <MarkdownField name="body" label="Programme et détails" state={s} rows={12} />
              <Field name="slug" label="Adresse de la page" state={s} hint="Générée depuis l'intitulé si vide." />
            </Section>
            <Section title="Date et lieu">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field name="starts_at" label="Début" type="datetime-local" state={s} required hint="Heure du Cameroun." />
                <Field name="ends_at" label="Fin" type="datetime-local" state={s} />
                <Field name="location_name" label="Lieu" state={s} placeholder="Ex. Palais des Congrès" />
                <Field name="city" label="Ville" state={s} />
                <Field name="address" label="Adresse" state={s} />
                <Field name="online_url" label="Lien en ligne" type="url" state={s} hint="Facultatif : visioconférence ou retransmission." />
              </div>
            </Section>
          </div>
          <div className="space-y-6 xl:col-span-4">
            <Section title="Publication">
              <SelectField name="status" label="Statut" state={s} required options={[{ value: "draft", label: "Brouillon" }, { value: "published", label: "Publié" }, { value: "archived", label: "Archivé" }]} />
              <SelectField name="visibility" label="Accès" state={s} required options={[{ value: "public", label: "Public" }, { value: "members", label: "Réservé aux membres" }]} />
              <SelectField name="category_id" label="Type" state={s} options={categories} placeholder="Sans type" />
            </Section>
            <Section title="Inscriptions">
              <Toggle name="registration_enabled" label="Ouvrir les inscriptions" state={s} hint="Les membres s'inscrivent depuis leur espace." />
              <Field name="capacity" label="Nombre de places" type="number" state={s} hint="Vide : illimité. Au-delà : liste d'attente." />
              <Field name="registration_deadline" label="Clôture des inscriptions" type="datetime-local" state={s} />
            </Section>
            <Section title="Visuel">
              <ImageField name="cover_path" label="Image" folder="evenements" state={s} />
            </Section>
          </div>
        </div>
      )}
    </ActionForm>
  );
}

// ---------------------------------------------------------------------------
// Page institutionnelle
// ---------------------------------------------------------------------------
export function PageForm({ id, initial }: { id: string; initial: Record<string, string> }) {
  return (
    <ActionForm action={savePage} hidden={{ id }} initial={initial} submitLabel="Enregistrer la page" className="space-y-6">
      {(s) => (
        <div className="grid gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-8">
            <Section title="Contenu">
              <Field name="title" label="Titre" state={s} required />
              <Field name="summary" label="Introduction" state={s} textarea rows={2} hint="Affichée sous le titre, en tête de page." />
              <MarkdownField name="body" label="Texte" state={s} rows={18} />
            </Section>
          </div>
          <div className="space-y-6 xl:col-span-4">
            <Section title="Publication">
              <SelectField name="status" label="Statut" state={s} required options={[{ value: "published", label: "En ligne" }, { value: "draft", label: "Brouillon (texte par défaut affiché)" }]} />
            </Section>
            <Section title="Référencement">
              <Field name="seo_title" label="Titre SEO" state={s} />
              <Field name="seo_description" label="Description SEO" state={s} textarea rows={3} />
            </Section>
          </div>
        </div>
      )}
    </ActionForm>
  );
}

// ---------------------------------------------------------------------------
// Bureau exécutif et chiffres clés
// ---------------------------------------------------------------------------
export function GovernanceForm({ id, initial }: { id?: string; initial: Record<string, string> }) {
  return (
    <ActionForm key={id ?? "new"} action={saveGovernanceMember} hidden={id ? { id } : undefined} initial={initial} submitLabel={id ? "Enregistrer" : "Ajouter au bureau"} tone={id ? "secondary" : "primary"} className="space-y-4">
      {(s) => (
        <div className="grid gap-4 md:grid-cols-[12rem_1fr]">
          <ImageField name="photo_path" label="Portrait" folder="bureau" state={s} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="full_name" label="Nom complet" state={s} required />
            <Field name="position_title" label="Fonction" state={s} required />
            <Field name="organization" label="Entreprise" state={s} />
            <Field name="sort_order" label="Ordre d'affichage" type="number" state={s} required />
            <div className="sm:col-span-2">
              <Field name="bio" label="Courte présentation" state={s} textarea rows={2} />
            </div>
            <Toggle name="is_published" label="Afficher sur le site" state={s} />
          </div>
        </div>
      )}
    </ActionForm>
  );
}

export function FigureForm({ id, initial }: { id?: string; initial: Record<string, string> }) {
  return (
    <ActionForm key={id ?? "new"} action={saveKeyFigure} hidden={id ? { id } : undefined} initial={initial} submitLabel={id ? "Enregistrer" : "Ajouter"} tone={id ? "secondary" : "primary"} className="flex flex-wrap items-end gap-3 [&>p]:basis-full">
      {(s) => (
        <>
          <div className="w-28">
            <Field name="value" label="Valeur" state={s} required />
          </div>
          <div className="min-w-48 flex-1">
            <Field name="label" label="Libellé" state={s} required />
          </div>
          <div className="w-24">
            <Field name="sort_order" label="Ordre" type="number" state={s} required />
          </div>
          <div className="pb-3">
            <Toggle name="is_published" label="Visible" state={s} />
          </div>
        </>
      )}
    </ActionForm>
  );
}
