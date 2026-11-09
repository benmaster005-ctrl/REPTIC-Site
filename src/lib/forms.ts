import { z } from "zod";

/** État renvoyé par les Server Actions de formulaire (useActionState). */
export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };

/** Anti-spam : champ piège invisible + délai minimal de remplissage. */
export const HONEYPOT_FIELD = "site_web";
export const STARTED_AT_FIELD = "debut";
const MIN_FILL_MS = 2500;

export function isLikelySpam(formData: FormData) {
  if (String(formData.get(HONEYPOT_FIELD) ?? "").trim() !== "") return true;
  const startedAt = Number(formData.get(STARTED_AT_FIELD));
  return !Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_MS;
}

export function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
}

export function formValues(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]));
}

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, { error: "Adresse e-mail trop longue." })
  .pipe(z.email({ error: "Adresse e-mail invalide." }));
