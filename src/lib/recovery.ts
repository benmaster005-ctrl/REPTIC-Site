/**
 * Témoin posé par /auth/callback quand un lien « mot de passe oublié » vient
 * d'être utilisé. Il autorise un seul changement de mot de passe sans l'ancien,
 * pendant 15 minutes.
 */
export const RECOVERY_COOKIE = "reptic_recuperation";
export const RECOVERY_MAX_AGE = 15 * 60;
export const RECOVERY_PATH = "/reinitialiser-mot-de-passe";
