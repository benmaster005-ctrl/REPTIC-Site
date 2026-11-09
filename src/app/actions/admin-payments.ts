"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { assertPermission } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { type FormState } from "@/lib/forms";

/** Montant en FCFA (espaces et points de milliers acceptés) ; vide = paiement fermé. */
const amount = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const digits = v.replace(/[\s.  ]/g, "");
    if (!digits) return null;
    const n = Number(digits);
    if (!Number.isInteger(n) || n < 100 || n > 100_000_000) {
      ctx.addIssue({ code: "custom", message: "Montant entier en FCFA attendu (100 minimum)." });
      return z.NEVER;
    }
    return n;
  });

/** Tarifs des cotisations par type de membre (vide = paiement fermé). */
export async function updateFees(_prev: FormState, formData: FormData): Promise<FormState> {
  let ctx;
  try {
    ctx = await assertPermission("members.manage");
  } catch (e) {
    return { status: "error", message: (e as Error).message };
  }
  const values = { physical: String(formData.get("physical") ?? ""), legal: String(formData.get("legal") ?? "") };
  const parsed = z.object({ physical: amount, legal: amount }).safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors as FormState["fieldErrors"], values };
  const supabase = await createClient();
  for (const type of ["physical", "legal"] as const) {
    const { error } = await supabase
      .from("membership_fees")
      .update({ amount: parsed.data[type], updated_by: ctx.user.id, updated_at: new Date().toISOString() })
      .eq("member_type", type);
    if (error) return { status: "error", message: "Les tarifs n'ont pas pu être enregistrés.", values };
  }
  refresh();
  return { status: "success", message: "Tarifs enregistrés. Ils s'appliquent aux prochains paiements.", values };
}
