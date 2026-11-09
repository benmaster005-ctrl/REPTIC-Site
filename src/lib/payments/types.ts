export type PaymentStatus = "paid" | "failed" | "pending";

export type CreatePaymentInput = {
  reference: string;
  amount: number;
  currency: string;
  description: string;
  customer: { email: string; firstName: string; lastName: string };
  returnUrl: string;
  notifyUrl: string;
};

export type ProviderStatus = {
  status: PaymentStatus;
  transactionId?: string | null;
  method?: string | null;
  amount?: number | null;
  raw?: unknown;
};

/** Interface commune : le reste du site ne dépend d'aucun prestataire en particulier. */
export interface PaymentProvider {
  readonly id: "cinetpay" | "demo";
  readonly label: string;
  createPayment(input: CreatePaymentInput): Promise<{ paymentUrl: string; transactionId?: string | null }>;
  /** Interroge le prestataire : seule source de vérité sur le statut d'un paiement. */
  getStatus(reference: string, transactionId?: string | null): Promise<ProviderStatus>;
}

export function formatAmount(amount: number, currency = "XAF") {
  const n = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount).replace(/ | /g, " ");
  return `${n} ${currency === "XAF" ? "FCFA" : currency}`;
}
