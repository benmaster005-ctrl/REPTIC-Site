/**
 * Mise en page commune de tous les e-mails REPTIC.CM.
 *
 * Utilisée par le site (e-mails transactionnels) ET par le script qui génère
 * les modèles Supabase (supabase/templates). Ce fichier ne doit rien importer
 * et rester en TypeScript « effaçable » pour être exécutable par Node.
 *
 * Contraintes e-mail : tableaux, styles en ligne, 600 px, pas de police web,
 * bouton « à l'épreuve d'Outlook », texte d'aperçu masqué, couleurs fixes.
 *
 * Style sobre, comme les grandes plateformes : logo en haut, contenu, pied de page avec le logo,
 * directement sur fond blanc, sans cadre ni bordure.
 */

export const brand = {
  navy: "#232D57",
  navyDeep: "#161D3D",
  cyan: "#209AD7",
  cyanDark: "#157BB0",
  cyanTint: "#E8F4FB",
  ink: "#1F2333",
  muted: "#6B7085",
  line: "#E6E8EE",
  paper: "#F4F5F7",
  soft: "#F7F8FA",
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "'SFMono-Regular', Menlo, Consolas, 'Courier New', monospace",
};

export type EmailBlock =
  | { type: "paragraph"; html: string }
  | { type: "button"; label: string; url: string }
  | { type: "facts"; rows: { label: string; value: string }[] }
  | { type: "quote"; label?: string; html: string }
  | { type: "code"; value: string }
  | { type: "link"; label: string; url: string }
  | { type: "note"; html: string }
  | { type: "article"; title: string; html?: string; url: string; meta?: string };

export type EmailContent = {
  /** Texte d'aperçu affiché par la messagerie à côté du sujet. */
  preheader: string;
  /** Rubrique de l'e-mail (conservée pour le classement, non affichée). */
  eyebrow: string;
  title: string;
  blocks: EmailBlock[];
  /** Phrase de bas de page expliquant pourquoi l'e-mail est reçu. */
  reason: string;
  /** Adresse de contact affichée en pied de page. */
  contactEmail?: string;
  siteUrl?: string;
  /** Lien de désinscription (lettres d'information). */
  unsubscribeUrl?: string;
  /** Formule de fin « L'équipe du REPTIC.CM » (par défaut : oui). */
  signature?: boolean;
};

export function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const text = (size: number, line: number, color: string, extra = "") =>
  `font-family:${brand.font};font-size:${size}px;line-height:${line}px;color:${color};${extra}`;

const p = (html: string) => `<p style="margin:0 0 16px;${text(15, 24, brand.ink)}">${html}</p>`;

/**
 * Bouton moderne : pastille arrondie, flèche en fin, cyan de la marque.
 * « À l'épreuve d'Outlook » : cellule colorée + VML arrondi pour Outlook Windows.
 */
function button(label: string, url: string) {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:12px 0 28px;">
  <tr>
    <td align="center" bgcolor="${brand.cyanDark}" style="background:${brand.cyanDark};border-radius:999px;mso-padding-alt:14px 30px;">
      <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:48px;v-text-anchor:middle;width:300px;" arcsize="50%" stroked="false" fillcolor="${brand.cyanDark}"><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${label} &#8594;</center></v:roundrect><![endif]-->
      <!--[if !mso]><!-- --><a href="${url}" target="_blank" style="display:inline-block;padding:14px 30px;border-radius:999px;${text(15, 20, "#ffffff", "font-weight:600;letter-spacing:0.1px;text-decoration:none;")}">${label}&nbsp;&nbsp;&#8594;</a><!--<![endif]-->
    </td>
  </tr>
</table>`;
}

/** Récapitulatif : libellé à gauche, valeur à droite, sans filets. */
function facts(rows: { label: string; value: string }[]) {
  const cells = rows
    .map(
      (r) => `
  <tr>
    <td style="padding:5px 0;${text(14, 20, brand.muted)}width:45%;vertical-align:top;">${r.label}</td>
    <td style="padding:5px 0;${text(14, 20, brand.ink, "font-weight:600;")}vertical-align:top;">${r.value}</td>
  </tr>`,
    )
    .join("");
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;">${cells}
</table>`;
}

/** Texte libre saisi par une personne (motif, message) : fond gris très clair. */
function quote(html: string, label?: string) {
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 24px;">
  <tr>
    <td style="background:${brand.soft};border-radius:6px;padding:16px 18px;">
      ${label ? `<p style="margin:0 0 6px;${text(13, 18, brand.muted)}">${label}</p>` : ""}
      <p style="margin:0;${text(15, 24, brand.ink)}">${html}</p>
    </td>
  </tr>
</table>`;
}

function code(value: string) {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 24px;">
  <tr>
    <td style="background:${brand.soft};border-radius:6px;padding:14px 26px;font-family:${brand.mono};font-size:28px;line-height:34px;letter-spacing:6px;font-weight:bold;color:${brand.ink};">${value}</td>
  </tr>
</table>`;
}

function link(label: string, url: string) {
  return `<p style="margin:-8px 0 24px;${text(13, 20, brand.muted)}">${label}<br><a href="${url}" style="color:${brand.cyanDark};word-break:break-all;">${url}</a></p>`;
}

/** Article de lettre d'information : titre lien, résumé, filet de séparation. */
function article(title: string, url: string, html?: string, meta?: string) {
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px;">
  <tr>
    <td style="padding:0;">
      ${meta ? `<p style="margin:0 0 4px;${text(12, 18, brand.muted)}">${meta}</p>` : ""}
      <p style="margin:0 0 6px;${text(16, 22, brand.ink, "font-weight:600;")}"><a href="${url}" style="color:${brand.ink};text-decoration:none;">${title}</a></p>
      ${html ? `<p style="margin:0 0 8px;${text(14, 22, brand.muted)}">${html}</p>` : ""}
      <a href="${url}" style="${text(14, 20, brand.cyanDark, "text-decoration:none;")}">Lire la suite</a>
    </td>
  </tr>
</table>`;
}

function note(html: string) {
  return `<p style="margin:8px 0 0;${text(13, 20, brand.muted)}">${html}</p>`;
}

function renderBlock(b: EmailBlock) {
  switch (b.type) {
    case "paragraph":
      return p(b.html);
    case "button":
      return button(b.label, b.url);
    case "facts":
      return facts(b.rows);
    case "quote":
      return quote(b.html, b.label);
    case "code":
      return code(b.value);
    case "link":
      return link(b.label, b.url);
    case "note":
      return note(b.html);
    case "article":
      return article(b.title, b.url, b.html, b.meta);
  }
}

export function renderEmail(c: EmailContent) {
  const contact = c.contactEmail ?? "contact@reptic.cm";
  const site = c.siteUrl ?? "https://reptic.cm";
  // Modèles Supabase : l'adresse est la variable {{ .SiteURL }}, on affiche le domaine officiel.
  const siteLabel = site.startsWith("{{") ? "reptic.cm" : site.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const signature =
    c.signature === false ? "" : `<p style="margin:24px 0 0;${text(15, 24, brand.ink)}">Cordialement,<br>L'équipe du REPTIC.CM</p>`;
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${escapeHtml(c.title)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  :root { color-scheme: light only; }
  body { margin:0; padding:0; }
  a { color:${brand.cyanDark}; }
  @media (max-width:620px) {
    .wrap { width:100% !important; }
    .pad { padding-left:24px !important; padding-right:24px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#ffffff;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(c.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" class="wrap" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;background:#ffffff;">
        <!-- En-tête : logo -->
        <tr>
          <td class="pad" style="padding:8px 24px 0;">
            <a href="${site}" target="_blank" style="text-decoration:none;">
              <img src="${site}/brand/logo-reptic-email.png" width="170" alt="REPTIC.CM" style="display:block;width:170px;height:auto;border:0;outline:none;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:bold;color:${brand.navy};">
            </a>
          </td>
        </tr>
        <!-- Contenu -->
        <tr>
          <td class="pad" style="padding:32px 24px 28px;">
            <h1 style="margin:0 0 20px;${text(22, 30, brand.ink, "font-weight:600;")}">${c.title}</h1>
            ${c.blocks.map(renderBlock).join("\n")}
            ${signature}
          </td>
        </tr>
        <!-- Pied de page : logo en bas, comme une signature professionnelle -->
        <tr>
          <td class="pad" style="padding:8px 24px 24px;">
            <a href="${site}" target="_blank" style="text-decoration:none;">
              <img src="${site}/brand/logo-reptic-email.png" width="150" alt="REPTIC.CM" style="display:block;width:150px;height:auto;margin:0 0 14px;border:0;outline:none;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:bold;color:${brand.navy};">
            </a>
            <p style="margin:0 0 6px;${text(12, 18, brand.muted)}">REPTIC.CM &middot; Yaound&eacute;, Cameroun &middot; <a href="mailto:${contact}" style="color:${brand.muted};">${contact}</a> &middot; <a href="${site}" style="color:${brand.muted};">${siteLabel}</a></p>
            <p style="margin:0;${text(12, 18, brand.muted)}">${c.reason}${c.unsubscribeUrl ? ` <a href="${c.unsubscribeUrl}" style="color:${brand.muted};">Se d&eacute;sinscrire</a>` : ""}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** Version texte (multipart) : améliore la délivrabilité et l'accessibilité. */
export function renderText(c: EmailContent) {
  const strip = (h: string) =>
    h
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&eacute;/g, "é")
      .replace(/&rarr;/g, "→")
      .replace(/&middot;/g, "·");
  const lines: string[] = ["REPTIC.CM", "", strip(c.title), ""];
  for (const b of c.blocks) {
    if (b.type === "paragraph" || b.type === "note") lines.push(strip(b.html), "");
    else if (b.type === "quote") lines.push(`${b.label ? `${strip(b.label)} : ` : ""}${strip(b.html)}`, "");
    else if (b.type === "button" || b.type === "link") lines.push(`${strip(b.label)} : ${b.url}`, "");
    else if (b.type === "code") lines.push(b.value, "");
    else if (b.type === "facts") lines.push(...b.rows.map((r) => `${strip(r.label)} : ${strip(r.value)}`), "");
    else if (b.type === "article") lines.push(`${b.meta ? `[${strip(b.meta)}] ` : ""}${strip(b.title)}`, ...(b.html ? [strip(b.html)] : []), b.url, "");
  }
  if (c.signature !== false) lines.push("Cordialement,", "L'équipe du REPTIC.CM", "");
  lines.push("--", "REPTIC.CM · Yaoundé, Cameroun", strip(c.reason));
  if (c.unsubscribeUrl) lines.push(`Se désinscrire : ${c.unsubscribeUrl}`);
  return lines.join("\n");
}
