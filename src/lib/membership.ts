import { z } from "zod";
import { emailSchema } from "@/lib/forms";

/**
 * Règles du dossier d'adhésion (cahier des charges §4).
 * Les champs sont stockés dans applications.payload ; la liste reste
 * provisoire tant que le règlement d'adhésion n'est pas validé (§10).
 */

export type ApplicantType = "physical" | "legal";
export type ApplicationStatus = "draft" | "submitted" | "under_review" | "additional_info" | "accepted" | "rejected";

export const applicantTypeLabels: Record<ApplicantType, string> = {
  physical: "Personne physique",
  legal: "Personne morale",
};

export const statusLabels: Record<ApplicationStatus, string> = {
  draft: "Brouillon",
  submitted: "Soumise, en attente",
  under_review: "En cours d'examen",
  additional_info: "Complément requis",
  accepted: "Acceptée",
  rejected: "Refusée",
};

export const statusDescriptions: Record<ApplicationStatus, string> = {
  draft: "Votre demande n'est pas encore envoyée.",
  submitted: "Votre dossier a été reçu et attend d'être examiné.",
  under_review: "Un gestionnaire examine votre dossier.",
  additional_info: "Des informations ou des pièces supplémentaires sont nécessaires.",
  accepted: "Votre demande est approuvée. Bienvenue dans le réseau.",
  rejected: "Votre demande n'a pas été retenue.",
};

export const isEditable = (s: ApplicationStatus) => s === "draft" || s === "additional_info";

export const wizardSteps = [
  { key: "type", label: "Type de demande" },
  { key: "informations", label: "Informations" },
  { key: "pieces", label: "Justificatifs" },
  { key: "verification", label: "Vérification" },
  { key: "suivi", label: "Suivi" },
] as const;
export type WizardStep = (typeof wizardSteps)[number]["key"];

export const legalForms = ["SARL", "SARLU", "SA", "SAS", "SASU", "GIE", "Établissement", "Association", "Autre"];
export const countries = ["Cameroun", "Gabon", "Congo", "Tchad", "République centrafricaine", "Guinée équatoriale", "Nigeria", "France", "Autre"];

// ---------------------------------------------------------------------------
// Schémas de validation
// ---------------------------------------------------------------------------
const req = (label: string, max = 160) => z.string().trim().min(1, { error: `${label} : champ obligatoire.` }).max(max, { error: `${label} : trop long.` });
const opt = (max = 160) => z.string().trim().max(max).optional().transform((v) => v || undefined);
const phone = z
  .string()
  .trim()
  .min(6, { error: "Numéro de téléphone invalide." })
  .max(30)
  .regex(/^[+\d\s().-]+$/, { error: "Numéro de téléphone invalide." });
const optUrl = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => (v ? (/^https?:\/\//i.test(v) ? v : `https://${v}`) : undefined))
  .pipe(z.url({ error: "Adresse de site web invalide." }).optional());

export const physicalSchema = z.object({
  first_name: req("Prénom", 80),
  last_name: req("Nom", 80),
  birth_date: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined)
    .refine((v) => !v || (!Number.isNaN(Date.parse(v)) && new Date(v) < new Date()), { error: "Date de naissance invalide." }),
  phone,
  city: req("Ville", 80),
  country: req("Pays", 80),
  profession: req("Profession", 120),
  organization: opt(160),
  activity_category: req("Domaine d'activité", 80),
  experience_years: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number({ error: "Indiquez un nombre d'années." }).int({ error: "Nombre entier attendu." }).min(0, { error: "Valeur invalide." }).max(60, { error: "Valeur invalide." }),
  ),
  motivation: opt(1500),
});

export const legalSchema = z.object({
  legal_name: req("Dénomination sociale", 160),
  legal_form: req("Forme juridique", 40),
  sector: req("Secteur d'activité", 80),
  registration_number: req("Numéro RCCM", 60),
  tax_id: req("NIU", 40),
  address: req("Adresse du siège", 200),
  city: req("Ville", 80),
  country: req("Pays", 80),
  phone,
  email: emailSchema,
  website: optUrl,
  rep_first_name: req("Prénom du représentant", 80),
  rep_last_name: req("Nom du représentant", 80),
  rep_title: req("Fonction du représentant", 80),
  rep_email: emailSchema,
  rep_phone: phone,
  motivation: opt(1500),
});

export const schemaFor = (t: ApplicantType) => (t === "physical" ? physicalSchema : legalSchema);
export const fieldsFor = (t: ApplicantType) => Object.keys(schemaFor(t).shape);

/** Libellés pour le récapitulatif. */
export const fieldLabels: Record<string, string> = {
  first_name: "Prénom",
  last_name: "Nom",
  birth_date: "Date de naissance",
  phone: "Téléphone",
  city: "Ville",
  country: "Pays",
  profession: "Profession",
  organization: "Organisation",
  activity_category: "Domaine d'activité",
  experience_years: "Années d'expérience",
  motivation: "Motivation",
  legal_name: "Dénomination sociale",
  legal_form: "Forme juridique",
  sector: "Secteur d'activité",
  registration_number: "Numéro RCCM",
  tax_id: "NIU",
  address: "Adresse du siège",
  email: "E-mail",
  website: "Site web",
  rep_first_name: "Prénom du représentant",
  rep_last_name: "Nom du représentant",
  rep_title: "Fonction du représentant",
  rep_email: "E-mail du représentant",
  rep_phone: "Téléphone du représentant",
};

// ---------------------------------------------------------------------------
// Fichiers
// ---------------------------------------------------------------------------
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function safeFileName(name: string) {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "fichier";
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) : "";
  return ext ? `${base}.${ext}` : base;
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} Ko`;
  return `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
}
