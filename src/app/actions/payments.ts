"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/env";
import { isDemoPayment, isPaymentEnabled, provider, recordPaymentResult } from "@/lib/payments";
import { createPublicClient } from "@/lib/supabase/public";

const BASE = "/espace/cotisation";

/** Story 19 : ouvre le paiement de la cotisation chez le prestataire. */
export async function startFeePayment(formData: FormData) {
  const user = await requireUser(BASE);
  const year = z.coerce.number().int().min(2020).max(2100).safeParse(formData.get("year"));
  if (!year.success || !isPaymentEnabled || !provider) redirect(`${BASE}?erreur=indisponible`);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_fee_payment", { p_year: year.data, p_provider: provider.id });
  if (error) redirect(`${BASE}?erreur=${encodeURIComponent(error.code === "P0001" || error.code === "42501" ? error.message : "creation")}`);
  const pay = (Array.isArray(data) ? data[0] : data) as { reference: string; amount: number; currency: string; label: string; email: string; first_name: string | null; last_name: string | null };

  let paymentUrl: string;
  try {
    const created = await provider.createPayment({
      reference: pay.reference,
      amount: pay.amount,
      currency: pay.currency,
      description: pay.label,
      customer: { email: pay.email ?? user.email, firstName: pay.first_name ?? "", lastName: pay.last_name ?? "" },
      returnUrl: `${SITE_URL}${BASE}/retour?ref=${encodeURIComponent(pay.reference)}`,
      notifyUrl: `${SITE_URL}/api/paiements/cinetpay`,
    });
    paymentUrl = created.paymentUrl;
    if (created.transactionId) await supabase.rpc("attach_payment_transaction", { p_reference: pay.reference, p_transaction_id: created.transactionId });
  } catch (e) {
    console.error("startFeePayment", e);
    await recordPaymentResult(pay.reference, { status: "failed" });
    redirect(`${BASE}?erreur=prestataire`);
  }
  redirect(paymentUrl);
}

/** Simulateur (PAYMENT_PROVIDER=demo uniquement) : choisit l'issue du paiement. */
export async function simulateDemoPayment(formData: FormData) {
  const user = await requireUser(BASE);
  const ref = String(formData.get("ref") ?? "");
  const outcome = formData.get("outcome") === "paid" ? "paid" : "failed";
  if (!isDemoPayment || !/^COT-\d{4}-[A-F0-9]{8}$/.test(ref)) redirect(BASE);
  // Le paiement doit appartenir au membre connecté
  const { data } = await createPublicClient().rpc("payment_for_confirmation", { p_secret: process.env.PAYMENT_CONFIRM_SECRET ?? "", p_reference: ref });
  const pay = (Array.isArray(data) ? data[0] : data) as { email: string } | undefined;
  if (!pay || pay.email.toLowerCase() !== user.email.toLowerCase()) redirect(BASE);
  await recordPaymentResult(ref, { status: outcome, transactionId: `DEMO-${ref}`, method: "Simulation" });
  redirect(`${BASE}/retour?ref=${encodeURIComponent(ref)}`);
}
