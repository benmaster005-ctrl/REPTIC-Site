/**
 * Génère les modèles d'e-mails d'authentification Supabase à la charte REPTIC.CM.
 *
 *   node scripts/email-templates.mjs            → écrit supabase/templates/*.html
 *   node scripts/email-templates.mjs <dossier>  → écrit aussi un aperçu avec des valeurs d'exemple
 *
 * Les liens utilisent le jeton (token_hash) plutôt que {{ .ConfirmationURL }} :
 * ils fonctionnent même si l'e-mail est ouvert sur un autre appareil que celui
 * de l'inscription. Ils pointent vers {{ .SiteURL }} (Authentication > URL
 * Configuration > Site URL), à régler sur l'adresse réelle du site.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderEmail } from "../src/lib/email/layout.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "supabase", "templates");

const hello = `{{ if .Data.first_name }}Bonjour {{ .Data.first_name }},{{ else }}Bonjour,{{ end }}`;
const callback = (type, next) => `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&amp;type=${type}&amp;suite=${encodeURIComponent(next)}`;
const reason = "Vous recevez cet e-mail car une action a été effectuée sur votre compte REPTIC.CM avec cette adresse.";
const ignore = "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message : aucune modification ne sera faite sur votre compte.";

export const templates = [
  {
    file: "confirmation.html",
    dashboard: "Confirm signup",
    subject: "Confirmez votre adresse e-mail | REPTIC.CM",
    content: {
      preheader: "Une dernière étape pour activer votre compte candidat et poursuivre votre demande d'adhésion.",
      eyebrow: "Création de compte",
      title: "Confirmez votre adresse e-mail",
      blocks: [
        { type: "paragraph", html: hello },
        { type: "paragraph", html: "Merci de votre intérêt pour le Réseau des Entreprises &amp; Professionnels du Secteur des Télécoms et du Numérique au Cameroun. Pour activer votre compte candidat, confirmez votre adresse e-mail :" },
        { type: "button", label: "Confirmer mon adresse", url: callback("email", "/espace/adhesion") },
        { type: "paragraph", html: "Vous pourrez ensuite constituer votre dossier d'adhésion en ligne, l'enregistrer en cours de route et suivre son instruction depuis votre espace." },
        { type: "link", label: "Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :", url: callback("email", "/espace/adhesion") },
        { type: "note", html: `Ce lien est personnel et expire au bout d'une heure. ${ignore}` },
      ],
      reason: "Vous recevez cet e-mail car un compte REPTIC.CM vient d'être créé avec cette adresse.",
    },
  },
  {
    file: "recovery.html",
    dashboard: "Reset password",
    subject: "Réinitialisation de votre mot de passe | REPTIC.CM",
    content: {
      preheader: "Choisissez un nouveau mot de passe pour votre compte REPTIC.CM.",
      eyebrow: "Sécurité du compte",
      title: "Réinitialisez votre mot de passe",
      blocks: [
        { type: "paragraph", html: hello },
        { type: "paragraph", html: "Une demande de réinitialisation du mot de passe a été faite pour le compte associé à <strong>{{ .Email }}</strong>. Cliquez sur le bouton ci-dessous pour en choisir un nouveau :" },
        { type: "button", label: "Choisir un nouveau mot de passe", url: callback("recovery", "/reinitialiser-mot-de-passe") },
        { type: "link", label: "Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :", url: callback("recovery", "/reinitialiser-mot-de-passe") },
        { type: "note", html: `Ce lien est valable une heure et ne peut servir qu'une fois. ${ignore} Votre mot de passe actuel reste valable.` },
      ],
      reason,
    },
  },
  {
    file: "invite.html",
    dashboard: "Invite user",
    subject: "Votre invitation à rejoindre REPTIC.CM",
    content: {
      preheader: "Vous êtes invité à rejoindre l'espace en ligne du réseau REPTIC.CM.",
      eyebrow: "Invitation",
      title: "Vous êtes invité à rejoindre REPTIC.CM",
      blocks: [
        { type: "paragraph", html: "Bonjour," },
        { type: "paragraph", html: "Le secrétariat du REPTIC.CM vous a ouvert un accès à son espace en ligne. Pour l'activer, choisissez votre mot de passe :" },
        { type: "button", label: "Activer mon accès", url: callback("invite", "/reinitialiser-mot-de-passe") },
        { type: "link", label: "Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :", url: callback("invite", "/reinitialiser-mot-de-passe") },
        { type: "note", html: "Cette invitation est personnelle. Si vous ne l'attendiez pas, vous pouvez ignorer ce message ou nous écrire." },
      ],
      reason: "Vous recevez cet e-mail car le secrétariat du REPTIC.CM vous a invité avec cette adresse.",
    },
  },
  {
    file: "magic_link.html",
    dashboard: "Magic link",
    subject: "Votre lien de connexion | REPTIC.CM",
    content: {
      preheader: "Connectez-vous à votre espace REPTIC.CM en un clic.",
      eyebrow: "Connexion",
      title: "Votre lien de connexion",
      blocks: [
        { type: "paragraph", html: hello },
        { type: "paragraph", html: "Voici votre lien de connexion à l'espace REPTIC.CM :" },
        { type: "button", label: "Me connecter", url: callback("email", "/espace") },
        { type: "link", label: "Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :", url: callback("email", "/espace") },
        { type: "note", html: `Ce lien est valable une heure et ne peut servir qu'une fois. ${ignore}` },
      ],
      reason,
    },
  },
  {
    file: "email_change.html",
    dashboard: "Change email address",
    subject: "Confirmez votre nouvelle adresse e-mail | REPTIC.CM",
    content: {
      preheader: "Confirmez le changement d'adresse e-mail de votre compte REPTIC.CM.",
      eyebrow: "Sécurité du compte",
      title: "Confirmez votre nouvelle adresse",
      blocks: [
        { type: "paragraph", html: hello },
        { type: "paragraph", html: "Vous avez demandé à modifier l'adresse e-mail de votre compte REPTIC.CM :" },
        { type: "facts", rows: [{ label: "Adresse actuelle", value: "{{ .Email }}" }, { label: "Nouvelle adresse", value: "{{ .NewEmail }}" }] },
        { type: "button", label: "Confirmer le changement", url: callback("email_change", "/espace/profil") },
        { type: "link", label: "Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :", url: callback("email_change", "/espace/profil") },
        { type: "note", html: "Si vous n'êtes pas à l'origine de cette demande, ne cliquez pas : votre adresse reste inchangée. Nous vous recommandons alors de modifier votre mot de passe." },
      ],
      reason,
    },
  },
  {
    file: "reauthentication.html",
    dashboard: "Reauthentication",
    subject: "Votre code de vérification | REPTIC.CM",
    content: {
      preheader: "Code de vérification pour confirmer une opération sensible sur votre compte.",
      eyebrow: "Sécurité du compte",
      title: "Votre code de vérification",
      blocks: [
        { type: "paragraph", html: hello },
        { type: "paragraph", html: "Pour confirmer cette opération sur votre compte, saisissez le code suivant :" },
        { type: "code", value: "{{ .Token }}" },
        { type: "note", html: `Ce code est valable quelques minutes. Ne le communiquez jamais : le secrétariat ne vous le demandera pas. ${ignore}` },
      ],
      reason,
    },
  },
];

mkdirSync(out, { recursive: true });
for (const t of templates) {
  writeFileSync(join(out, t.file), renderEmail({ ...t.content, siteUrl: "{{ .SiteURL }}" }), "utf8");
}
writeFileSync(
  join(out, "README.md"),
  `# Modèles d'e-mails Supabase (authentification)

Générés par \`node scripts/email-templates.mjs\` à partir de \`src/lib/email/layout.ts\` : ne pas les modifier à la main.

Dans le tableau de bord Supabase : **Authentication > Emails > Templates**. Pour chaque modèle, coller le **sujet** puis le contenu du fichier (onglet *Source*).

| Modèle Supabase | Sujet | Fichier |
|---|---|---|
${templates.map((t) => `| ${t.dashboard} | ${t.subject} | \`${t.file}\` |`).join("\n")}

Réglages liés :
- **Authentication > URL Configuration > Site URL** : l'adresse réelle du site (aperçu Vercel, puis https://reptic.cm). Les liens des e-mails pointent vers \`{{ .SiteURL }}/auth/callback\`.
- **Authentication > SMTP Settings** : un serveur d'envoi pour expédier depuis \`noreply@reptic.cm\` avec le nom « REPTIC.CM ».
- **Durée des liens** (Email OTP Expiration) : 3600 s par défaut, ce que disent les textes (« une heure »).
`,
  "utf8",
);
console.log(`${templates.length} modèles écrits dans supabase/templates/`);

// Aperçu facultatif avec des valeurs d'exemple
const previewDir = process.argv[2];
if (previewDir) {
  mkdirSync(previewDir, { recursive: true });
  const sample = (html) =>
    html
      .replace(/\{\{ if \.Data\.first_name \}\}Bonjour \{\{ \.Data\.first_name \}\},\{\{ else \}\}Bonjour,\{\{ end \}\}/g, "Bonjour Benjamin,")
      .replace(/\{\{ \.SiteURL \}\}/g, "https://reptic.cm")
      .replace(/\{\{ \.TokenHash \}\}/g, "pkce_3f9a1c")
      .replace(/\{\{ \.Email \}\}/g, "benjamin@exemple.cm")
      .replace(/\{\{ \.NewEmail \}\}/g, "b.noumba@exemple.cm")
      .replace(/\{\{ \.Token \}\}/g, "482 913");
  const cards = templates.map((t) => {
    const html = sample(renderEmail({ ...t.content, siteUrl: "https://reptic.cm" }));
    writeFileSync(join(previewDir, t.file), html, "utf8");
    return `<section><h2>${t.dashboard} <small>${t.subject}</small></h2><iframe src="${t.file}" loading="lazy"></iframe></section>`;
  });
  writeFileSync(
    join(previewDir, "index.html"),
    `<!doctype html><meta charset="utf-8"><title>Aperçu e-mails</title><style>body{font:14px system-ui;background:#e9ebf0;margin:0;padding:24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(640px,1fr));gap:24px}h2{font-size:14px;margin:0 0 8px}small{color:#666;font-weight:400}iframe{width:640px;height:900px;border:0;background:#fff}</style>${cards.join("")}`,
    "utf8",
  );
  console.log(`Aperçu : ${join(previewDir, "index.html")}`);
}
