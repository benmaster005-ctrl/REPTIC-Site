import type {
  Category,
  EventItem,
  GovernanceMember,
  KeyFigure,
  NewsItem,
  Page,
  SiteContact,
  SiteSocial,
} from "@/lib/types";

/**
 * Contenus de structure du site et données de repli.
 * Les données de repli s'affichent tant que Supabase n'est pas connecté
 * ou si une table est vide. Elles sont provisoires (cahier des charges §10).
 */

export type NavItem = { label: string; href: string; children?: { label: string; href: string; description?: string }[] };

export const mainNav: NavItem[] = [
  { label: "Accueil", href: "/" },
  {
    label: "Le REPTIC",
    href: "/presentation",
    children: [
      { label: "Présentation", href: "/presentation", description: "Identité, vision et valeurs" },
      { label: "Objectifs & missions", href: "/objectifs-missions", description: "Nos axes d'action" },
      { label: "Mot du Président", href: "/mot-du-president", description: "Message institutionnel" },
      { label: "Bureau exécutif", href: "/gouvernance", description: "Gouvernance et mandats" },
      { label: "Ressources", href: "/ressources", description: "Documents publics à télécharger" },
    ],
  },
  {
    label: "Membres",
    href: "/acteurs",
    children: [
      { label: "Nomenclature des acteurs", href: "/acteurs", description: "Les familles de professionnels" },
      { label: "Adhésion", href: "/adhesion", description: "Conditions, avantages et procédure" },
    ],
  },
  { label: "Actualités", href: "/actualites" },
  { label: "Événements", href: "/evenements" },
  { label: "Contact", href: "/contact" },
];

export type Mission = { title: string; description: string; icon: MissionIcon };
export type MissionIcon = "graduation" | "award" | "megaphone" | "trending" | "radar" | "cpu";

/** Les six objectifs stratégiques publiés sur reptic.cm (descriptions reformulées). */
export const missions: Mission[] = [
  {
    icon: "graduation",
    title: "Formation, Recherche & Compétences",
    description: "Soutenir l'innovation, la recherche, le développement des compétences et l'entrepreneuriat numérique, en lien avec les universités.",
  },
  {
    icon: "award",
    title: "Excellence & Qualité nationale",
    description: "Créer un label national qui distingue l'excellence et la compétitivité des PME Tech camerounaises.",
  },
  {
    icon: "megaphone",
    title: "Plaidoyer & Défense des intérêts",
    description: "Être l'interlocuteur du secteur privé du numérique auprès des pouvoirs publics.",
  },
  {
    icon: "trending",
    title: "Développement & Investissements",
    description: "Encourager les investissements nationaux et internationaux dans l'économie numérique.",
  },
  {
    icon: "radar",
    title: "Veille, Régulation & Gouvernance",
    description: "Assurer une veille juridique et technique, et prendre part à l'élaboration des politiques sectorielles.",
  },
  {
    icon: "cpu",
    title: "Transformation numérique",
    description: "Faire valoir l'offre des membres auprès des administrations et des entreprises publiques engagées dans leur transformation numérique.",
  },
];

/** Avantages de l'adhésion, d'après les conditions publiées sur reptic.cm. */
export const memberBenefits = [
  { title: "Réseau et visibilité", description: "Mises en relation entre acteurs du secteur et valorisation de votre activité." },
  { title: "Représentation collective", description: "Une voix commune auprès des pouvoirs publics et des régulateurs." },
  { title: "Accompagnement", description: "Appui sur les questions juridiques, fiscales et sociales." },
  { title: "Veille sectorielle", description: "Suivi de l'actualité réglementaire et technologique du numérique." },
  { title: "Forums africains", description: "Participation aux rencontres et forums du numérique sur le continent." },
  { title: "Label national", description: "Accès au futur label de qualité « Cameroon Tech Excellence »." },
];

export const applicationSteps = [
  { title: "Type de demande", description: "Personne physique ou personne morale." },
  { title: "Informations", description: "Identité, coordonnées et activité." },
  { title: "Justificatifs", description: "Pièces requises selon votre profil." },
  { title: "Vérification", description: "Relecture, acceptation des conditions et envoi." },
  { title: "Suivi", description: "Accusé de réception et suivi depuis votre espace." },
];

export const requiredDocuments = {
  physical: ["Justificatif d'immatriculation fiscale", "Photo d'identité récente", "Curriculum vitae (facultatif)"],
  legal: ["Registre du commerce (RCCM) à jour", "Attestation de conformité fiscale (quitus)", "Tout autre document légal exigé pour l'activité", "Logo (facultatif)"],
};

// ---------------------------------------------------------------------------
// Données de repli
// ---------------------------------------------------------------------------

export const fallbackContact: SiteContact = {
  address: "Yaoundé, Cameroun",
  phone: "+237 242 233 000",
  email: "contact@reptic.cm",
  hours: "Du lundi au vendredi, de 8 h 00 à 17 h 30",
  dpo: "dpo@reptic.cm",
};

export const fallbackSocial: SiteSocial = {
  facebook: "https://web.facebook.com/reptic.cm",
  twitter: "https://twitter.com/Reptic_Cameroun",
  linkedin: "https://www.linkedin.com/company/reptic-cm/",
};

export const fallbackKeyFigures: KeyFigure[] = [
  { label: "Année de création", value: "2017" },
  { label: "Membres", value: "100+" },
  { label: "Secteurs représentés", value: "21" },
  { label: "Forums organisés", value: "5+" },
];

export const fallbackActorCategories: Category[] = [
  // Les six familles de la nomenclature officielle des acteurs (reptic.cm).
  { slug: "operateur-reseau", name: "Opérateur de réseau de communication électronique", description: "Construit et exploite un réseau ouvert au public pour fournir des services de téléphonie ou d'accès à Internet." },
  { slug: "operateur-infrastructure", name: "Opérateur d'infrastructure ou d'interconnexion", description: "Met à disposition des infrastructures support ou des services d'interconnexion, sans service de communication au public." },
  { slug: "fournisseur-services-communication", name: "Fournisseur de services de communication électronique", description: "Commercialise des services de communication au public en s'appuyant sur le réseau d'un tiers." },
  { slug: "fournisseur-sva", name: "Fournisseur de services à valeur ajoutée", description: "Propose des services applicatifs ou de contenus diffusés par les réseaux publics." },
  { slug: "operateur-plateforme", name: "Opérateur de plateforme numérique", description: "Conçoit ou exploite une solution numérique (SaaS, sur site ou cloud) dédiée à un domaine applicatif." },
  { slug: "services-conseil", name: "Services & Conseil", description: "Accompagne les acteurs de l'écosystème : intégration, distribution, conseil, formation, cybersécurité." },
];

export const fallbackGovernance: GovernanceMember[] = ["Président", "Vice-président", "Secrétaire général", "Trésorier"].map(
  (positionTitle, i) => ({ id: `demo-${i}`, fullName: "À renseigner", positionTitle, organization: null, photoUrl: null, bio: null }),
);

const daysFromNow = (d: number) => new Date(Date.UTC(2026, 10, 9 + d, 8)).toISOString();

export const fallbackNews: NewsItem[] = [
  {
    slug: "lancement-du-nouveau-portail",
    title: "Lancement du nouveau portail REPTIC.CM",
    excerpt: "Le réseau se dote d'une plateforme pour simplifier les adhésions et mieux informer ses membres.",
    body: "Le nouveau portail permet de déposer une demande d'adhésion en ligne, de suivre son dossier et d'accéder à un espace membre sécurisé.\n\n> Article de démonstration.",
    coverUrl: null,
    category: "Vie du réseau",
    publishedAt: daysFromNow(-2),
  },
  {
    slug: "cadre-reglementaire-numerique",
    title: "Cadre réglementaire : les propositions du secteur privé",
    excerpt: "Synthèse des contributions des membres sur l'évolution du cadre réglementaire des communications électroniques.",
    body: "Contenu de démonstration.",
    coverUrl: null,
    category: "Communiqués",
    publishedAt: daysFromNow(-12),
  },
  {
    slug: "programme-formation-2027",
    title: "Un programme de formation pour les PME du numérique",
    excerpt: "Ateliers pratiques sur la cybersécurité, le cloud et la gestion de projet pour les entreprises membres.",
    body: "Contenu de démonstration.",
    coverUrl: null,
    category: "Secteur numérique",
    publishedAt: daysFromNow(-25),
  },
];

export const fallbackEvents: EventItem[] = [
  {
    slug: "forum-numerique-2027",
    title: "Forum du numérique camerounais 2027",
    excerpt: "Rencontre annuelle des acteurs des télécoms, des TIC et du numérique.",
    body: "Programme détaillé à venir.\n\n> Événement de démonstration.",
    coverUrl: null,
    category: "Forum",
    startsAt: daysFromNow(60),
    endsAt: daysFromNow(61),
    locationName: "Lieu à confirmer",
    city: "Yaoundé",
    registrationEnabled: false,
  },
  {
    slug: "atelier-cybersecurite",
    title: "Atelier cybersécurité pour les PME",
    excerpt: "Bonnes pratiques et retours d'expérience des membres.",
    body: "Contenu de démonstration.",
    coverUrl: null,
    category: "Atelier",
    startsAt: daysFromNow(24),
    endsAt: null,
    locationName: "Lieu à confirmer",
    city: "Douala",
    registrationEnabled: false,
  },
];

export const fallbackPages: Record<string, Page> = {
  presentation: {
    slug: "presentation",
    title: "Présentation",
    summary: "Une association professionnelle qui fédère les entreprises des télécoms, des TIC et du numérique au Cameroun.",
    body: "## Qui sommes-nous ?\n\nREPTIC.CM rassemble les entreprises et les professionnels des télécommunications, des technologies de l'information et du numérique au Cameroun.\n\n## Notre vision\n\nUn écosystème numérique camerounais structuré, compétitif et reconnu, capable de porter la transformation digitale du pays.\n\n## Nos valeurs\n\n- **Solidarité** entre les acteurs du secteur\n- **Excellence** et qualité des services\n- **Intégrité** et transparence\n- **Innovation** au service du développement\n\n> Texte provisoire, à remplacer par le contenu validé par l'association.",
    seoTitle: null,
    seoDescription: null,
  },
  "objectifs-missions": {
    slug: "objectifs-missions",
    title: "Objectifs & missions",
    summary: "Six axes d'action pour structurer et faire grandir le secteur numérique camerounais.",
    body: null,
    seoTitle: null,
    seoDescription: null,
  },
  "mot-du-president": {
    slug: "mot-du-president",
    title: "Mot du Président",
    summary: "Le message institutionnel du Président de l'association.",
    body: "Le message du Président sera publié ici après validation.\n\n> Texte provisoire.",
    seoTitle: null,
    seoDescription: null,
  },
  "conditions-adhesion": {
    slug: "conditions-adhesion",
    title: "Conditions d'adhésion",
    summary: "Qui peut adhérer, avantages et pièces à fournir.",
    body: "Les conditions détaillées d'adhésion seront publiées après validation du règlement intérieur.",
    seoTitle: null,
    seoDescription: null,
  },
  "mentions-legales": {
    slug: "mentions-legales",
    title: "Mentions légales",
    summary: null,
    body: "Éditeur, hébergeur et directeur de la publication : informations à fournir.",
    seoTitle: null,
    seoDescription: null,
  },
  confidentialite: {
    slug: "confidentialite",
    title: "Politique de confidentialité",
    summary: null,
    body: "Politique de confidentialité, finalités, durées de conservation et droits des personnes : à rédiger avec le responsable des données.",
    seoTitle: null,
    seoDescription: null,
  },
};

// ---------------------------------------------------------------------------
// Bannières des en-têtes de page (photos reprises de reptic.cm, public/images/reptic)
// ---------------------------------------------------------------------------
const IMG = "/images/reptic";
export const heroBanners = {
  default: `${IMG}/pages/assemblee-generale.webp`,
  presentation: `${IMG}/pages/assemblee-generale.webp`,
  "objectifs-missions": `${IMG}/actualites/convention-universites-yaounde.webp`,
  "mot-du-president": `${IMG}/pages/assemblee-generale.webp`,
  gouvernance: `${IMG}/pages/adhesion-reseau.webp`,
  acteurs: `${IMG}/actualites/forum-economie-numerique-afrique-centrale.webp`,
  adhesion: `${IMG}/pages/adhesion-reseau.webp`,
  actualites: `${IMG}/actualites/forum-economie-numerique-afrique-centrale.webp`,
  evenements: `${IMG}/actualites/label-cameroon-tech-excellence.webp`,
  ressources: `${IMG}/actualites/convention-universites-yaounde.webp`,
  contact: `${IMG}/pages/adhesion-reseau.webp`,
  "mentions-legales": `${IMG}/pages/assemblee-generale.webp`,
  confidentialite: `${IMG}/pages/assemblee-generale.webp`,
} as const;
export type HeroBannerKey = keyof typeof heroBanners;
