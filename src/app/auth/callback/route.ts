import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/safe-redirect";
import { RECOVERY_COOKIE, RECOVERY_MAX_AGE, RECOVERY_PATH } from "@/lib/recovery";

/**
 * Point de retour des liens e-mail Supabase (confirmation, réinitialisation)
 * et de la connexion Google ou LinkedIn.
 * Gère le flux PKCE (?code=) et le flux token_hash (?token_hash=&type=).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const via = searchParams.get("via");
  const oauth = via === "google" || via === "linkedin" ? via : null;
  const next = safeInternalPath(searchParams.get("suite"));

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
  const response = NextResponse.redirect(new URL(next, origin));
  // Lien « mot de passe oublié » utilisé : autorise un changement de mot de passe
  if (!oauth && next === RECOVERY_PATH && (code || type === "recovery")) {
    response.cookies.set(RECOVERY_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: RECOVERY_MAX_AGE,
    });
  }
  return response;
}
