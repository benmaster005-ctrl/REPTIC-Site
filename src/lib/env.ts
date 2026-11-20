export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * Adresse publique à utiliser pour les liens et redirections.
 * En production (Vercel ou serveur derrière nginx), NEXT_PUBLIC_SITE_URL : l'origine
 * de la requête peut y être l'adresse interne du proxy (ex. localhost:3001).
 * En développement et sur les aperçus Vercel, l'origine de la requête.
 */
export function publicOrigin(requestOrigin: string | null | undefined): string {
  const isPreview = process.env.VERCEL_ENV === "preview";
  if (process.env.NODE_ENV === "production" && !isPreview && process.env.NEXT_PUBLIC_SITE_URL) return SITE_URL;
  return requestOrigin && /^https?:\/\/[^/]+$/.test(requestOrigin) ? requestOrigin : SITE_URL;
}

/** Faux tant que .env.local n'est pas renseigné : le site affiche alors un contenu de démonstration. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
