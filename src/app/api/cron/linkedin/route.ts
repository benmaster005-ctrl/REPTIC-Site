import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { syncLinkedin } from "@/lib/linkedin";
import { tags } from "@/lib/data/public";

/**
 * Tâche planifiée (Vercel Cron, voir vercel.json) : fait avancer la
 * synchronisation LinkedIn d'une étape. Protégée par CRON_SECRET, que Vercel
 * envoie automatiquement dans l'en-tête Authorization.
 */
/** Comparaison en temps constant (ne révèle pas, par la durée, où les chaînes diffèrent). */
function sameSecret(received: string | null, expected: string) {
  const a = Buffer.from(received ?? "");
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !sameSecret(request.headers.get("authorization"), `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const result = await syncLinkedin(null);
  if (result.status === "imported") revalidateTag(tags.linkedin, "max");
  console.info("Synchronisation LinkedIn", result);
  return NextResponse.json(result, { status: result.status === "failed" ? 502 : 200 });
}
