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
  | "invitation.member";

export type Vars = Record<string, string | null | undefined>;

type Definition = {
  eyebrow: string;
  button?: { label: string; path: string };
  facts?: (v: Vars) => { label: string; value: string | null | undefined }[];
  /** Variables affichées en encadré (texte libre saisi par une personne). */
  quoted?: Record<string, string>;
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
    button: { label: "Ouvrir les messages", path: "/admin/messages" },
    facts: (v) => [
      { label: "Expéditeur", value: v.nom },
      { label: "E-mail", value: v.email },
      { label: "Téléphone", value: v.telephone },
      { label: "Objet", value: v.objet },
    ],
    quoted: { message: "Message" },
    reason: "Alerte interne envoyée à l'adresse du secrétariat du REPTIC.CM.",
  },
  "invitation.member": {
    eyebrow: "Invitation",
    button: { label: "Découvrir l'adhésion", path: "/adhesion" },
    quoted: { message: "Son message" },
    reason: "Vous recevez cet e-mail car un membre du REPTIC.CM a souhaité vous inviter. Vous ne recevrez pas d'autre message si vous ne donnez pas suite.",
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
  objet: "Partenariat pour le forum 2027",
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
  };
  return { subject, html: renderEmail(content), text: renderText(content) };
}
