import "server-only";
import type { CreatePaymentInput, PaymentProvider, ProviderStatus } from "./types";

/**
 * Adaptateur CinetPay (nouvelle API « v1 » : authentification par clé + mot de passe).
 *
 * ⚠ À VALIDER avec la documentation officielle et le bac à sable CinetPay à
 * l'ouverture du compte marchand. Les noms de champs ci-dessous proviennent
 * d'intégrations existantes de cette API ; tout le code propre à CinetPay est
 * concentré dans ce fichier pour être ajusté facilement.
 *
 *   Clés de test (sk_test_…) → https://api.cinetpay.net
 *   Clés réelles (sk_live_…) → https://api.cinetpay.co
 *
 * Variables : CINETPAY_API_KEY, CINETPAY_API_PASSWORD, CINETPAY_CHANNEL (facultatif).
 */

const API_KEY = process.env.CINETPAY_API_KEY ?? "";
const API_PASSWORD = process.env.CINETPAY_API_PASSWORD ?? "";
const BASE = process.env.CINETPAY_BASE_URL || (API_KEY.startsWith("sk_live_") ? "https://api.cinetpay.co" : "https://api.cinetpay.net");

export const isCinetPayConfigured = Boolean(API_KEY && API_PASSWORD);

let cachedToken: { value: string; expires: number } | null = null;

async function call(path: string, init: RequestInit & { token?: string } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text.slice(0, 500) };
  }
  // Certaines réponses enveloppent les données dans « data »
  const data = (body.data && typeof body.data === "object" ? body.data : body) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, body, data };
}

async function token() {
  if (cachedToken && cachedToken.expires > Date.now()) return cachedToken.value;
  const r = await call("/v1/oauth/login", { method: "POST", body: JSON.stringify({ api_key: API_KEY, api_password: API_PASSWORD }) });
  const value = (r.data.access_token ?? r.body.access_token) as string | undefined;
  if (!r.ok || !value) throw new Error(`Authentification CinetPay refusée (${r.status})`);
  const ttl = Number(r.data.expires_in ?? r.body.expires_in ?? 240);
  cachedToken = { value, expires: Date.now() + Math.max(30, ttl - 30) * 1000 };
  return value;
}

const FAILED = new Set(["FAILED", "EXPIRED", "INSUFFICIENT_BALANCE", "USER_IS_BLOCKED", "NOT_ALLOWED", "REFUSED", "CANCELED", "CANCELLED"]);

export const cinetpay: PaymentProvider = {
  id: "cinetpay",
  label: "CinetPay",

  async createPayment(input: CreatePaymentInput) {
    const t = await token();
    const r = await call("/v1/payment", {
      method: "POST",
      token: t,
      body: JSON.stringify({
        currency: input.currency,
        merchant_transaction_id: input.reference,
        amount: input.amount,
        lang: "fr",
        designation: input.description,
        client_email: input.customer.email,
        client_first_name: input.customer.firstName || "Membre",
        client_last_name: input.customer.lastName || "REPTIC",
        success_url: input.returnUrl,
        failed_url: input.returnUrl,
        notify_url: input.notifyUrl,
        ...(process.env.CINETPAY_CHANNEL ? { channel: process.env.CINETPAY_CHANNEL } : {}),
      }),
    });
    const paymentUrl = r.data.payment_url as string | undefined;
    if (!r.ok || !paymentUrl) {
      const reason = (r.data.description ?? r.data.message ?? r.body.message ?? `code ${r.status}`) as string;
      throw new Error(`CinetPay a refusé la création du paiement : ${reason}`);
    }
    return { paymentUrl, transactionId: (r.data.transaction_id as string) ?? null };
  },

  async getStatus(reference: string, transactionId?: string | null): Promise<ProviderStatus> {
    const t = await token();
    const r = await call(`/v1/payment/${encodeURIComponent(transactionId || reference)}`, { method: "GET", token: t });
    if (!r.ok) return { status: "pending", raw: r.body };
    // Le paiement interrogé doit bien être le nôtre.
    const merchantRef = r.data.merchant_transaction_id as string | undefined;
    if (merchantRef && merchantRef !== reference) return { status: "pending", raw: r.body };
    const status = String(r.data.status ?? "").toUpperCase();
    return {
      status: status === "SUCCESS" || status === "ACCEPTED" ? "paid" : FAILED.has(status) ? "failed" : "pending",
      transactionId: (r.data.transaction_id as string) ?? transactionId ?? null,
      method: (r.data.payment_method ?? r.data.channel ?? r.data.operator) as string | null,
      amount: r.data.amount != null ? Number(r.data.amount) : null,
      raw: r.data,
    };
  },
};
