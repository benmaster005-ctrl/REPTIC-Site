import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Point de retour des liens e-mail Supabase (confirmation, réinitialisation)
 * et de la connexion Google ou LinkedIn.
 * Gère le flux PKCE (?code=) et le flux token_hash (?token_hash=&type=).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const rawNext = searchParams.get("suite") ?? "/espace";
  const via = searchParams.get("via");
  const oauth = via === "google" || via === "linkedin" ? via : null;
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/espace";

  // Connexion annulée ou refusée chez le fournisseur : il renvoie ?error=
  if (searchParams.get("error")) {
    return NextResponse.redirect(new URL(`/connexion?erreur=${oauth ?? "lien"}`, origin));
  }

  const supabase = await createClient();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("Lien incomplet") };

  if (error) {
    return NextResponse.redirect(new URL(`/connexion?erreur=${oauth ?? "lien"}`, origin));
  }
  return NextResponse.redirect(new URL(next, origin));
}
