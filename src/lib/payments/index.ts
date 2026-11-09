import "server-only";
import { SITE_URL, isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { sendTemplated } from "@/lib/email/send";
import { formatDate } from "@/lib/format";
import { cinetpay, isCinetPayConfigured } from "./cinetpay";
import { formatAmount, type PaymentProvider, type PaymentStatus } from "./types";

/**
 * Point d'entrée des paiements.
 *   PAYMENT_PROVIDER=cinetpay (par défaut si les clés CinetPay sont présentes)
 *   PAYMENT_PROVIDER=demo     simulateur local, pour tester le parcours sans compte marchand
 *   PAYMENT_CONFIRM_SECRET    secret partagé avec la base (migration 9)
 */

const demo: PaymentProvider = {
  id: "demo",
  label: "Démonstration",
  async createPayment(input) {
    return { paymentUrl: `${SITE_URL}/espace/cotisation/demo?ref=${encodeURIComponent(input.reference)}`, transactionId: `DEMO-${input.reference}` };
  },
  async getStatus() {
    return { status: "pending" }; // le simulateur confirme lui-même le résultat
  },
};

const choice = process.env.PAYMENT_PROVIDER || (isCinetPayConfigured ? "cinetpay" : "");
const SECRET = process.env.PAYMENT_CONFIRM_SECRET ?? "";

export const provider: PaymentProvider | null = choice === "cinetpay" && isCinetPayConfigured ? cinetpay : choice === "demo" ? demo : null;
export const isDemoPayment = provider?.id === "demo";
export const isPaymentEnabled = Boolean(provider && SECRET && isSupabaseConfigured);
export { formatAmount };

/**
 * Enregistre le résultat vérifié d'un paiement et, s'il vient d'être confirmé,
 * envoie l'e-mail de remerciement. Sans session : utilisable par la notification serveur.
 */
export async function recordPaymentResult(reference: string, result: { status: PaymentStatus; transactionId?: string | null; method?: string | null; raw?: unknown }) {
  const supabase = createPublicClient();
  const { data: before } = await supabase.rpc("payment_for_confirmation", { p_secret: SECRET, p_reference: reference });
  const pay = (Array.isArray(before) ? before[0] : before) as
    | { status: string; amount: number; currency: string; email: string; first_name: string | null; year: number }
    | undefined;
  if (!pay) return { status: "unknown" as const };

  const { data, error } = await supabase.rpc("confirm_fee_payment", {
    p_secret: SECRET,
    p_reference: reference,
    p_status: result.status,
    p_transaction_id: result.transactionId ?? null,
    p_method: result.method ?? null,
    p_payload: result.raw ? JSON.parse(JSON.stringify(result.raw)) : null,
  });
  if (error) {
    console.error("confirm_fee_payment", error.message);
    return { status: "error" as const };
  }
  const status = String(data) as "paid" | "failed" | "pending" | "cancelled";
  if (status === "paid" && pay.status !== "paid") {
    await sendTemplated("payment.received", pay.email, {
      prenom: pay.first_name ?? "",
      annee: String(pay.year),
      montant: formatAmount(pay.amount, pay.currency),
      reference,
      date: formatDate(new Date().toISOString()),
    });
  }
  return { status };
}

/** Vérifie auprès du prestataire puis enregistre (retour du membre ou notification). */
export async function verifyAndRecord(reference: string) {
  if (!provider || !SECRET) return { status: "unknown" as const };
  const supabase = createPublicClient();
  const { data } = await supabase.rpc("payment_for_confirmation", { p_secret: SECRET, p_reference: reference });
  const pay = (Array.isArray(data) ? data[0] : data) as { status: string; provider: string; provider_transaction_id: string | null; amount: number } | undefined;
  if (!pay) return { status: "unknown" as const };
  if (pay.status === "paid" || pay.provider === "demo") return { status: pay.status as PaymentStatus | "cancelled" };
  try {
    const result = await provider.getStatus(reference, pay.provider_transaction_id);
    // Un montant différent de celui attendu n'est jamais accepté.
    if (result.status === "paid" && result.amount != null && result.amount < pay.amount) {
      console.error("Montant payé inférieur au montant attendu", reference, result.amount, pay.amount);
      return { status: "pending" as const };
    }
    return recordPaymentResult(reference, result);
  } catch (e) {
    console.error("verifyAndRecord", reference, e);
    return { status: "pending" as const };
  }
}
