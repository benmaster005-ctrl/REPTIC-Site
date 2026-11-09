import { NextResponse, type NextRequest } from "next/server";
import { verifyAndRecord } from "@/lib/payments";

/**
 * Notification de paiement envoyée par CinetPay (notify_url).
 *
 * Le contenu reçu n'est JAMAIS cru sur parole : on n'en retient que la
 * référence, puis le statut est revérifié auprès de l'API CinetPay avec nos
 * identifiants avant toute mise à jour (verifyAndRecord). On répond toujours
 * 200 pour éviter des rejeux inutiles ; les erreurs sont journalisées.
 */
async function readPayload(request: NextRequest): Promise<Record<string, unknown>> {
  const type = request.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) return (await request.json()) as Record<string, unknown>;
    const form = await request.formData();
    return Object.fromEntries(form.entries());
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  const payload = await readPayload(request);
  const data = (payload.data && typeof payload.data === "object" ? payload.data : payload) as Record<string, unknown>;
  const reference = String(data.merchant_transaction_id ?? data.cpm_trans_id ?? data.transaction_id ?? "");

  if (!/^COT-\d{4}-[A-F0-9]{8}$/.test(reference)) {
    console.warn("Notification CinetPay ignorée : référence inconnue", reference.slice(0, 40));
    return NextResponse.json({ received: true });
  }
  const result = await verifyAndRecord(reference);
  console.info("Notification CinetPay", reference, "→", result.status);
  return NextResponse.json({ received: true });
}

/** Certains prestataires testent l'URL par une requête GET : réponse neutre. */
export function GET() {
  return NextResponse.json({ ok: true });
}
