import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Désinscription « en un clic » (RFC 8058) : appelée en POST par Gmail, Outlook…
 * via l'en-tête List-Unsubscribe-Post des lettres d'information.
 */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t") ?? "";
  if (!isSupabaseConfigured || !/^[0-9a-f-]{36}$/i.test(token)) return new NextResponse("Lien invalide", { status: 400 });
  const { error } = await createPublicClient().rpc("newsletter_unsubscribe", { p_token: token });
  if (error) return new NextResponse("Erreur", { status: 500 });
  return new NextResponse("Désinscription enregistrée", { status: 200 });
}
