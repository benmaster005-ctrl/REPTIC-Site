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

export const missions: Mission[] = [
  {
    icon: "graduation",
    title: "Formation, recherche et compétences",
    description: "Soutenir l'innovation, la R&D et l'entrepreneuriat numérique en lien avec les universités et centres de formation.",
  },
  {
    icon: "award",
    title: "Qualité et excellence",
    description: "Promouvoir un label national qui valorise les PME du numérique compétitives et la qualité de leurs services.",
  },
  {
    icon: "megaphone",
    title: "Plaidoyer",
    description: "Porter la voix du secteur privé auprès des pouvoirs publics pour un cadre réglementaire favorable.",
  },
  {
    icon: "trending",
    title: "Développement stratégique",
    description: "Attirer les investissements nationaux et internationaux vers l'écosystème numérique camerounais.",
  },
  {
    icon: "radar",
    title: "Veille et gouvernance",
    description: "Suivre les évolutions juridiques et technologiques et participer à l'élaboration des politiques sectorielles.",
  },
  {
    icon: "cpu",
    title: "Transformation numérique",
    description: "Faire connaître l'offre des membres auprès des administrations et des entreprises.",
  },
];

export const memberBenefits = [
  { title: "Représentation", description: "Une voix collective auprès des institutions et des régulateurs." },
  { title: "Réseau d'affaires", description: "Mises en relation, partenariats et opportunités entre membres." },
  { title: "Accompagnement", description: "Appui sur les questions juridiques, fiscales et sociales." },
  { title: "Veille", description: "Informations réglementaires et technologiques réservées aux membres." },
  { title: "Visibilité", description: "Présence dans l'annuaire et valorisation lors des événements." },
  { title: "Formation", description: "Ateliers, forums et programmes de montée en compétences." },
];

export const applicationSteps = [
  { title: "Type de demande", description: "Personne physique ou personne morale." },
  { title: "Informations", description: "Identité, coordonnées et activité." },
  { title: "Justificatifs", description: "Pièces requises selon votre profil." },
  { title: "Vérification", description: "Relecture, acceptation des conditions et envoi." },
  { title: "Suivi", description: "Accusé de réception et suivi depuis votre espace." },
];

export const requiredDocuments = {
  physical: ["Pièce d'identité en cours de validité", "Curriculum vitae", "Photo d'identité (selon règlement)", "Justificatif d'activité professionnelle"],
  legal: ["Registre du commerce (RCCM)", "Numéro d'identifiant unique (NIU)", "Statuts de l'entreprise", "Pièce d'identité du représentant légal", "Logo (format image)"],
};

// ---------------------------------------------------------------------------
// Données de repli
// ---------------------------------------------------------------------------

export const fallbackContact: SiteContact = {
  address: "Yaoundé, Cameroun",
  phone: "+237 242 233 000",
  email: "contact@reptic.cm",
};

export const fallbackSocial: SiteSocial = {
  facebook: "https://web.facebook.com/reptic.cm",
  twitter: "https://twitter.com/Reptic_Cameroun",
};

export const fallbackKeyFigures: KeyFigure[] = [
  { label: "Année de création", value: "2017" },
  { label: "Membres", value: "100+" },
  { label: "Secteurs représentés", value: "21" },
  { label: "Forums organisés", value: "5+" },
];

export const fallbackActorCategories: Category[] = [
  { slug: "operateurs-telecoms", name: "Opérateurs télécoms", description: "Opérateurs de réseaux et de services de communications électroniques." },
  { slug: "fournisseurs-infrastructures", name: "Fournisseurs d'infrastructures", description: "Fibre, tours, datacenters, énergie et équipements réseau." },
  { slug: "editeurs-logiciels", name: "Éditeurs de logiciels", description: "Conception et commercialisation de solutions logicielles." },
  { slug: "esn", name: "Entreprises de services numériques", description: "Intégration, infogérance, développement et maintenance." },
  { slug: "agences-digitales", name: "Agences digitales", description: "Communication numérique, web, marketing et contenus." },
  { slug: "cabinets-conseil", name: "Cabinets de conseil", description: "Conseil en stratégie, transformation numérique et cybersécurité." },
  { slug: "organismes-formation", name: "Organismes de formation", description: "Formation initiale et continue aux métiers du numérique." },
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
