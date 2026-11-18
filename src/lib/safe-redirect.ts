/**
 * Chemin de redirection interne sûr (« suite », lien de notification…).
 *
 * N'accepte qu'un chemin du site lui-même : « //exemple.com », « /\exemple.com »
 * (le navigateur lit l'antislash comme une barre) ou un caractère de contrôle
 * renverraient le visiteur vers un autre site après connexion.
 */
export function safeInternalPath(value: unknown, fallback = "/espace"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.length > 2000) return fallback;
  // Antislash, espaces et caractères de contrôle refusés d'emblée
  if (/[\\\s\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const base = "https://interne.invalid";
    const url = new URL(value, base);
    return url.origin === base ? url.pathname + url.search + url.hash : fallback;
  } catch {
    return fallback;
  }
}
