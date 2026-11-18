"use client";

/**
 * Google reCAPTCHA v3 côté navigateur : le script est chargé à l'affichage du
 * formulaire, puis un jeton est demandé au moment de l'envoi (un jeton n'est
 * valable que deux minutes).
 */

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";
/** Nom du champ lu par verifyRecaptcha (src/lib/recaptcha.ts). */
const FIELD = "recaptcha_token";

type Grecaptcha = { ready: (cb: () => void) => void; execute: (key: string, opts: { action: string }) => Promise<string> };
declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

let loading: Promise<Grecaptcha> | null = null;

function loadScript(): Promise<Grecaptcha> {
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const ready = () => window.grecaptcha!.ready(() => resolve(window.grecaptcha!));
    if (window.grecaptcha) return ready();
    const s = document.createElement("script");
    s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}&hl=fr`;
    s.async = true;
    s.onload = ready;
    s.onerror = () => {
      loading = null;
      reject(new Error("reCAPTCHA indisponible"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/** Précharge le script à l'affichage du formulaire, pour que l'envoi reste rapide. */
export function preloadRecaptcha() {
  if (SITE_KEY) loadScript().catch(() => {});
}

/**
 * Enveloppe une action serveur : ajoute le jeton reCAPTCHA au formulaire avant
 * l'envoi. Sans clé configurée, l'action est appelée telle quelle.
 */
export function withRecaptcha<S>(action: (prev: S, formData: FormData) => Promise<S>, name: string) {
  return async (prev: S, formData: FormData): Promise<S> => {
    if (SITE_KEY) {
      try {
        const g = await loadScript();
        formData.set(FIELD, await g.execute(SITE_KEY, { action: name }));
      } catch {
        // Sans jeton, le serveur refuse l'envoi et affiche un message clair.
      }
    }
    return action(prev, formData);
  };
}
