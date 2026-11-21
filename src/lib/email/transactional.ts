import { renderEmail, renderText, escapeHtml, type EmailBlock } from "./layout";

/**
 * E-mails transactionnels du site. Le sujet et le texte viennent de la table
 * email_templates (modifiables dans le back-office) ; ce module ajoute la mise
 * en page REPTIC, le bouton d'action et le récapitulatif propres à chaque e-mail.
 * Fichier sans dépendance serveur : utilisé aussi pour l'aperçu du back-office.
 */

export type TemplateKey =
  | "application.submitted"
  | "application.additional_info"
  | "application.accepted"
  | "application.rejected"
  | "member.suspended"
  | "member.reactivated"
  | "event.registered"
  | "contact.received"
  | "invitation.member"
  | "payment.received";

export type Vars = Record<string, string | null | undefined>;

type Definition = {
  eyebrow: string;
  button?: { label: string; path: string };
  facts?: (v: Vars) => { label: string; value: string | null | undefined }[];
  /** Variables affichées en encadré (texte libre saisi par une personne). */
  quoted?: Record<string, string>;
  /**
   * Fiche simple : toutes les données, une par ligne, dans l'ordre du formulaire.
   * Quand elle est définie, l'e-mail se limite à la phrase d'introduction du
   * modèle, à la fiche, puis au bouton (les autres paragraphes sont ignorés).
   */
  record?: (v: Vars) => { label: string; value: string | null | undefined; multiline?: boolean; link?: string }[];
  /**
   * Carte « message reçu » (formulaire de contact) : utilise les variables nom,
   * email, telephone, objet, message et recu_le. Introduction du modèle + carte.
   */
  message?: boolean;
  reason: string;
};

const applicationReason = "Vous recevez cet e-mail car vous avez déposé une demande d'adhésion au REPTIC.CM avec cette adresse.";
const memberReason = "Vous recevez cet e-mail en tant que membre du REPTIC.CM.";

export const definitions: Record<TemplateKey, Definition> = {
  "application.submitted": {
    eyebrow: "Demande d'adhésion",
    button: { label: "Suivre ma demande", path: "/espace/adhesion" },
    facts: (v) => [
      { label: "Référence du dossier", value: v.reference },
      { label: "Type de demande", value: v.type },
      { label: "Date d'envoi", value: v.date },
    ],
    reason: applicationReason,
  },
  "application.additional_info": {
    eyebrow: "Demande d'adhésion",
    button: { label: "Compléter mon dossier", path: "/espace/adhesion" },
    facts: (v) => [{ label: "Référence du dossier", value: v.reference }],
    quoted: { motif: "Message du secrétariat" },
    reason: applicationReason,
  },
  "application.accepted": {
    eyebrow: "Bienvenue",
    button: { label: "Accéder à mon espace membre", path: "/espace" },
    facts: (v) => [
      { label: "Numéro de membre", value: v.numero },
      { label: "Adhésion valable jusqu'au", value: v.date_fin },
      { label: "Dossier", value: v.reference },
    ],
    reason: memberReason,
  },
  "application.rejected": {
    eyebrow: "Demande d'adhésion",
    button: { label: "Consulter mon dossier", path: "/espace/adhesion" },
    facts: (v) => [{ label: "Référence du dossier", value: v.reference }],
    quoted: { motif: "Motif" },
    reason: applicationReason,
  },
  "member.suspended": {
    eyebrow: "Votre compte",
    button: { label: "Contacter le secrétariat", path: "/contact" },
    facts: (v) => [{ label: "Numéro de membre", value: v.numero }],
    quoted: { motif: "Motif" },
    reason: memberReason,
  },
  "member.reactivated": {
    eyebrow: "Votre compte",
    button: { label: "Accéder à mon espace", path: "/espace" },
    facts: (v) => [{ label: "Numéro de membre", value: v.numero }],
    reason: memberReason,
  },
  "event.registered": {
    eyebrow: "Événement",
    button: { label: "Gérer mes inscriptions", path: "/espace/evenements" },
    facts: (v) => [
      { label: "Événement", value: v.evenement },
      { label: "Date", value: v.date },
      { label: "Lieu", value: v.lieu },
      { label: "Statut", value: v.statut },
    ],
    reason: "Vous recevez cet e-mail car vous vous êtes inscrit à un événement du REPTIC.CM.",
  },
  "contact.received": {
    eyebrow: "Formulaire de contact",
    // Carte « message reçu » : expéditeur (nom, e-mail, téléphone), objet, message, date. Sans bouton.
    message: true,
    reason: "Alerte interne envoyée à l'adresse du secrétariat du REPTIC.CM. Répondez directement à cet e-mail pour écrire à l'expéditeur.",
  },
  "invitation.member": {
    eyebrow: "Invitation",
    button: { label: "Découvrir l'adhésion", path: "/adhesion" },
    quoted: { message: "Son message" },
    reason: "Vous recevez cet e-mail car un membre du REPTIC.CM a souhaité vous inviter. Vous ne recevrez pas d'autre message si vous ne donnez pas suite.",
  },
  "payment.received": {
    eyebrow: "Cotisation",
    button: { label: "Voir mon reçu", path: "/espace/cotisation" },
    facts: (v) => [
      { label: "Cotisation", value: v.annee },
      { label: "Montant réglé", value: v.montant },
      { label: "Référence", value: v.reference },
      { label: "Date", value: v.date },
    ],
    reason: memberReason,
  },
};

/** Exemples utilisés par l'aperçu et l'envoi de test du back-office. */
export const sampleVars: Vars = {
  prenom: "Aminata",
  reference: "ADH-2026-4F8C2A",
  type: "Personne morale",
  date: "12 novembre 2026",
  motif: "Merci de joindre l'attestation d'immatriculation fiscale (NIU) en cours de validité.",
  numero: "RPT-2026-0042",
  date_fin: "31 décembre 2026",
  evenement: "Forum du numérique camerounais 2027",
  lieu: "Palais des Congrès, Yaoundé",
  statut: "Inscription confirmée",
  nom: "Aminata Ndongo",
  email: "a.ndongo@exemple.cm",
  telephone: "+237 6 99 00 00 00",
  parrain: "Aminata Ndongo",
  annee: "2027",
  montant: "50 000 FCFA",
  objet: "Partenariat pour le forum 2027",
  recu_le: "12 novembre 2026 à 10:42",
  message: "Bonjour,\nNous souhaiterions présenter notre offre de sponsoring pour le prochain forum.\nCordialement.",
};

const interpolate = (text: string, vars: Vars, escape: boolean) =>
  text.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_, k: string) => {
    const v = vars[k] ?? "";
    return escape ? escapeHtml(v).replace(/\n/g, "<br>") : v;
  });

export function buildEmail(key: TemplateKey, template: { subject: string; body: string }, vars: Vars, opts: { siteUrl: string; contactEmail: string }) {
  const def = definitions[key];
  const subject = interpolate(template.subject, vars, false).replace(/\s+/g, " ").trim();
  const paragraphs = template.body.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);

  // Carte « message reçu » : introduction (premier paragraphe sans variable), puis la carte
  if (def.message) {
    const intro = paragraphs.find((p) => !/\{\{\s*[a-z_]+\s*\}\}/.test(p));
    const name = String(vars.nom ?? "Expéditeur");
    const link = (href: string, label: string) => `<a href="${escapeHtml(href)}" style="color:#157BB0;text-decoration:none;">${escapeHtml(label)}</a>`;
    // En-tête dans l'ordre du formulaire, puis la date de réception
    const rows = [
      { label: "De", value: escapeHtml(name), strong: true },
      vars.email ? { label: "E-mail", value: link(`mailto:${vars.email}`, vars.email) } : null,
      { label: "Téléphone", value: vars.telephone ? link(`tel:${vars.telephone.replace(/\s/g, "")}`, vars.telephone) : "Non renseigné" },
      { label: "Objet", value: escapeHtml(String(vars.objet ?? "")), strong: true },
      vars.recu_le ? { label: "Reçu le", value: escapeHtml(vars.recu_le) } : null,
    ].filter(Boolean) as { label: string; value: string; strong?: boolean }[];
    const blocks: EmailBlock[] = [];
    if (intro) blocks.push({ type: "paragraph", html: interpolate(intro, vars, true) });
    blocks.push({ type: "message", rows, html: escapeHtml(String(vars.message ?? "")).replace(/\n/g, "<br>") });
    const content = {
      preheader: `${name} : ${vars.objet ?? subject}`.slice(0, 140),
      eyebrow: def.eyebrow,
      title: escapeHtml(subject),
      blocks,
      reason: def.reason,
      contactEmail: opts.contactEmail,
      siteUrl: opts.siteUrl,
      signature: false,
    };
    return { subject, html: renderEmail(content), text: renderText(content) };
  }

  // Fiche simple : introduction (premier paragraphe du modèle), fiche, bouton
  if (def.record) {
    const intro = paragraphs.find((p) => !/\{\{\s*[a-z_]+\s*\}\}/.test(p)) ?? paragraphs[0];
    const rows = def.record(vars)
      .filter((r) => r.value)
      .map((r) => {
        let html = escapeHtml(String(r.value));
        if (r.multiline) html = html.replace(/\n/g, "<br>");
        if (r.link) html = `<a href="${escapeHtml(r.link)}" style="color:inherit;text-decoration:underline;">${html}</a>`;
        return { label: escapeHtml(r.label), value: html };
      });
    const recordBlocks: EmailBlock[] = [];
    if (intro) recordBlocks.push({ type: "paragraph", html: interpolate(intro, vars, true) });
    recordBlocks.push({ type: "record", rows });
    if (def.button) recordBlocks.push({ type: "button", label: def.button.label, url: `${opts.siteUrl}${def.button.path}` });
    const recordContent = {
      preheader: `${vars.nom ?? ""} : ${vars.objet ?? subject}`.slice(0, 140),
      eyebrow: def.eyebrow,
      title: escapeHtml(subject),
      blocks: recordBlocks,
      reason: def.reason,
      contactEmail: opts.contactEmail,
      siteUrl: opts.siteUrl,
      signature: false,
    };
    return { subject, html: renderEmail(recordContent), text: renderText(recordContent) };
  }

  const blocks: EmailBlock[] = [];
  let factsInserted = false;
  const facts = (def.facts?.(vars) ?? []).filter((r) => r.value).map((r) => ({ label: escapeHtml(r.label), value: escapeHtml(String(r.value)) }));

  paragraphs.forEach((para, i) => {
    // Un paragraphe réduit à {{motif}} ou {{message}} devient un encadré.
    const only = para.match(/^\{\{\s*([a-z_]+)\s*\}\}$/);
    if (only && def.quoted?.[only[1]]) {
      const value = vars[only[1]];
      if (value) blocks.push({ type: "quote", label: def.quoted[only[1]], html: escapeHtml(value).replace(/\n/g, "<br>") });
      return;
    }
    blocks.push({ type: "paragraph", html: interpolate(para, vars, true) });
    // Récapitulatif placé après le paragraphe d'introduction (le 2e, après la salutation).
    if (!factsInserted && facts.length && (i === 1 || (i === 0 && paragraphs.length === 1))) {
      blocks.push({ type: "facts", rows: facts });
      factsInserted = true;
    }
  });
  if (!factsInserted && facts.length) blocks.push({ type: "facts", rows: facts });
  if (def.button) blocks.push({ type: "button", label: def.button.label, url: `${opts.siteUrl}${def.button.path}` });

  const content = {
    preheader: interpolate(paragraphs[1] ?? paragraphs[0] ?? subject, vars, false).slice(0, 140),
    eyebrow: def.eyebrow,
    title: escapeHtml(subject),
    blocks,
    reason: def.reason,
    contactEmail: opts.contactEmail,
    siteUrl: opts.siteUrl,
    // Alerte interne au secrétariat : pas de formule « L'équipe du REPTIC.CM »
    signature: key !== "contact.received",
  };
  return { subject, html: renderEmail(content), text: renderText(content) };
}
