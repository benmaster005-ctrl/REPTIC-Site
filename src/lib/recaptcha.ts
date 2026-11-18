import "server-only";

/**
 * Google reCAPTCHA v3 (invisible, par score), vérification côté serveur.
 *
 * Clés : NEXT_PUBLIC_RECAPTCHA_SITE_KEY (navigateur) et RECAPTCHA_SECRET_KEY
 * (serveur), créées sur https://www.google.com/recaptcha/admin (type « v3 »).
 * Sans clés, la vérification est désactivée (développement local) : le pot de
 * miel reste alors la seule protection des formulaires publics.
 */

const SECRET = process.env.RECAPTCHA_SECRET_KEY ?? "";
/** Score minimal (0 = robot, 1 = humain) ; 0,5 est le seuil conseillé par Google. */
const MIN_SCORE = 0.5;
/** Champ ajouté au formulaire par withRecaptcha (src/components/forms/recaptcha.ts). */
const FIELD = "recaptcha_token";

export const isRecaptchaEnabled = Boolean(SECRET && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);

/** Message affiché quand la vérification échoue. */
export const RECAPTCHA_ERROR = "La vérification anti-robot a échoué. Rechargez la page et réessayez.";

type SiteVerify = { success: boolean; score?: number; action?: string; hostname?: string; "error-codes"?: string[] };

/** Domaines d'où un jeton est accepté : le site officiel, ses aperçus Vercel, le poste local. */
const SITE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "").hostname;
  } catch {
    return "";
  }
})();
function isAllowedHost(host: string | undefined) {
  if (!host) return false;
  return host === SITE_HOST || host === "reptic.cm" || host === "www.reptic.cm" || host.endsWith(".vercel.app") || host === "localhost";
}

let warnedMissingKeys = false;

/** Vrai si le jeton est valide, vient du site, correspond à l'action attendue et a un score suffisant. */
export async function verifyRecaptcha(formData: FormData, action: string): Promise<boolean> {
  if (!isRecaptchaEnabled) {
    // Clés absentes : protection inactive (à corriger en production, sans bloquer le site).
    if (process.env.VERCEL_ENV === "production" && !warnedMissingKeys) {
      warnedMissingKeys = true;
      console.error("reCAPTCHA inactif en production : clés NEXT_PUBLIC_RECAPTCHA_SITE_KEY / RECAPTCHA_SECRET_KEY manquantes");
    }
    return true;
  }
  const token = formData.get(FIELD);
  if (typeof token !== "string" || !token) return false;
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: SECRET, response: token }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as SiteVerify;
    const ok = data.success && data.action === action && isAllowedHost(data.hostname) && (data.score ?? 0) >= MIN_SCORE;
    if (!ok) console.warn("reCAPTCHA refusé", { action, score: data.score, got: data.action, host: data.hostname, errors: data["error-codes"] });
    return ok;
  } catch (e) {
    // Google injoignable : refus (le visiteur peut réessayer un instant plus tard).
    console.error("reCAPTCHA injoignable", e);
    return false;
  }
}
