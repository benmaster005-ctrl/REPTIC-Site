/**
 * Dictionnaire de l'interface. Le site est en français ; pour ajouter
 * l'anglais, créer en.ts avec la même forme et brancher getDictionary(locale).
 */
export const fr = {
  siteName: "REPTIC.CM",
  tagline: "Fédérons le numérique camerounais",
  nav: {
    home: "Accueil",
    about: "Le REPTIC",
    members: "Membres",
    news: "Actualités",
    events: "Événements",
    contact: "Contact",
    login: "Se connecter",
    memberSpace: "Mon espace",
    join: "Adhérer",
  },
  common: {
    readMore: "Lire la suite",
    seeAll: "Tout voir",
    backHome: "Retour à l'accueil",
    demoNotice: "Contenu de démonstration — base de données non connectée.",
    toValidate: "Contenu provisoire, à valider par l'association.",
  },
} as const;

export type Dictionary = typeof fr;
export const locale = "fr-CM";
export function getDictionary(): Dictionary {
  return fr;
}
