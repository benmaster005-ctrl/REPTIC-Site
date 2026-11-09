/**
 * Mise en page commune de tous les e-mails REPTIC.CM.
 *
 * Utilisée par le site (e-mails transactionnels) ET par le script qui génère
 * les modèles Supabase (supabase/templates). Ce fichier ne doit rien importer
 * et rester en TypeScript « effaçable » pour être exécutable par Node.
 *
 * Contraintes e-mail : tableaux, styles en ligne, 600 px, pas de police web,
 * bouton « à l'épreuve d'Outlook », texte d'aperçu masqué, couleurs fixes.
 */

export const brand = {
  navy: "#232D57",
  navyDeep: "#161D3D",
  cyan: "#209AD7",
  cyanDark: "#157BB0",
  cyanTint: "#E8F4FB",
  ink: "#1A1F33",
  muted: "#5B6178",
  line: "#DDE0E8",
  paper: "#F5F6F8",
  font: "'Helvetica Neue', Helvetica, Arial, sans-serif",
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
  /** Libellé au-dessus du titre (ex. « Demande d'adhésion »). */
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
};

export function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const p = (html: string, extra = "") =>
  `<p style="margin:0 0 18px;font-family:${brand.font};font-size:16px;line-height:26px;color:${brand.ink};${extra}">${html}</p>`;

function button(label: string, url: string) {
  // Bouton « bulletproof » : cellule colorée + VML pour Outlook Windows.
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 26px;">
  <tr>
    <td bgcolor="${brand.navy}" style="background:${brand.navy};mso-padding-alt:15px 26px;">
      <!--[if mso]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:50px;v-text-anchor:middle;width:300px;" stroked="false" fillcolor="${brand.navy}"><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${label}</center></v:rect><![endif]-->
      <!--[if !mso]><!-- --><a href="${url}" target="_blank" style="display:inline-block;padding:15px 26px;font-family:${brand.font};font-size:15px;font-weight:bold;line-height:20px;color:#ffffff;text-decoration:none;">${label}&nbsp;&nbsp;&rarr;</a><!--<![endif]-->
    </td>
  </tr>
</table>`;
}

function facts(rows: { label: string; value: string }[]) {
  const cells = rows
    .map(
      (r, i) => `
  <tr>
    <td style="padding:12px 0;${i ? `border-top:1px solid ${brand.line};` : ""}font-family:${brand.font};font-size:13px;line-height:18px;color:${brand.muted};width:42%;vertical-align:top;">${r.label}</td>
    <td style="padding:12px 0;${i ? `border-top:1px solid ${brand.line};` : ""}font-family:${brand.font};font-size:15px;line-height:20px;color:${brand.navy};font-weight:bold;vertical-align:top;">${r.value}</td>
  </tr>`,
    )
    .join("");
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 26px;border-top:2px solid ${brand.navy};border-bottom:1px solid ${brand.line};">${cells}
</table>`;
}

function quote(html: string, label?: string) {
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 26px;">
  <tr>
    <td style="border-left:3px solid ${brand.cyan};background:${brand.cyanTint};padding:16px 20px;">
      ${label ? `<p style="margin:0 0 6px;font-family:${brand.mono};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${brand.cyanDark};">${label}</p>` : ""}
      <p style="margin:0;font-family:${brand.font};font-size:15px;line-height:24px;color:${brand.ink};">${html}</p>
    </td>
  </tr>
</table>`;
}

function code(value: string) {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 26px;">
  <tr>
    <td style="border:1px solid ${brand.line};border-top:2px solid ${brand.navy};padding:16px 28px;font-family:${brand.mono};font-size:30px;line-height:36px;letter-spacing:8px;font-weight:bold;color:${brand.navy};">${value}</td>
  </tr>
</table>`;
}

function link(label: string, url: string) {
  return `<p style="margin:-8px 0 26px;font-family:${brand.font};font-size:13px;line-height:20px;color:${brand.muted};">${label}<br><a href="${url}" style="color:${brand.cyanDark};word-break:break-all;">${url}</a></p>`;
}

function article(title: string, url: string, html?: string, meta?: string) {
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px;border-top:2px solid ${brand.navy};">
  <tr>
    <td style="padding-top:14px;">
      ${meta ? `<p style="margin:0 0 6px;font-family:${brand.mono};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${brand.cyanDark};">${meta}</p>` : ""}
      <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:19px;line-height:25px;font-weight:bold;"><a href="${url}" style="color:${brand.navy};text-decoration:none;">${title}</a></p>
      ${html ? `<p style="margin:0 0 10px;font-family:${brand.font};font-size:15px;line-height:23px;color:${brand.muted};">${html}</p>` : ""}
      <a href="${url}" style="font-family:${brand.font};font-size:14px;font-weight:bold;color:${brand.cyanDark};text-decoration:none;">Lire la suite &rarr;</a>
    </td>
  </tr>
</table>`;
}

function note(html: string) {
  return `<p style="margin:8px 0 0;padding-top:18px;border-top:1px solid ${brand.line};font-family:${brand.font};font-size:13px;line-height:20px;color:${brand.muted};">${html}</p>`;
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

/** Monogramme : le nuage « .cm » du logo, en tracé simple (rendu partout, sans image). */
function wordmark() {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:28px;font-weight:900;letter-spacing:-0.5px;color:${brand.navy};">REPTIC<span style="color:${brand.cyan};">.cm</span></td>
  </tr>
  <tr>
    <td style="padding-top:6px;font-family:${brand.font};font-size:10px;line-height:14px;color:${brand.muted};">R&eacute;seau des Entreprises &amp; Professionnels du Secteur des T&eacute;l&eacute;coms et du Num&eacute;rique au Cameroun</td>
  </tr>
</table>`;
}

export function renderEmail(c: EmailContent) {
  const contact = c.contactEmail ?? "contact@reptic.cm";
  const site = c.siteUrl ?? "https://reptic.cm";
  const siteLabel = site.replace(/^https?:\/\//, "").replace(/\/$/, "");
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
    .title { font-size:24px !important; line-height:30px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${brand.paper};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(c.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${brand.paper};">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" class="wrap" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;background:#ffffff;">
        <tr><td style="height:4px;line-height:4px;font-size:0;background:${brand.navy};">&nbsp;</td></tr>
        <tr>
          <td class="pad" style="padding:30px 44px 26px;border-bottom:1px solid ${brand.line};">${wordmark()}</td>
        </tr>
        <tr>
          <td class="pad" style="padding:38px 44px 34px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 16px;">
              <tr>
                <td style="width:9px;height:9px;border:2px solid ${brand.cyan};border-radius:50%;font-size:0;line-height:0;">&nbsp;</td>
                <td style="padding-left:10px;font-family:${brand.mono};font-size:11px;line-height:14px;letter-spacing:1.4px;text-transform:uppercase;color:${brand.muted};">${c.eyebrow}</td>
              </tr>
            </table>
            <h1 class="title" style="margin:0 0 22px;font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:34px;font-weight:900;letter-spacing:-0.5px;color:${brand.navy};">${c.title}</h1>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 26px;"><tr><td style="width:56px;height:3px;line-height:3px;font-size:0;background:${brand.cyan};">&nbsp;</td></tr></table>
            ${c.blocks.map(renderBlock).join("\n")}
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:26px 44px 30px;background:${brand.navy};">
            <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:900;color:#ffffff;">REPTIC<span style="color:${brand.cyan};">.cm</span></p>
            <p style="margin:0 0 14px;font-family:${brand.font};font-size:12px;line-height:19px;color:#B9C0D6;">Yaound&eacute;, Cameroun &middot; <a href="mailto:${contact}" style="color:#ffffff;text-decoration:none;">${contact}</a> &middot; <a href="${site}" style="color:#ffffff;text-decoration:none;">${siteLabel}</a></p>
            <p style="margin:0;font-family:${brand.font};font-size:11px;line-height:17px;color:#8E97B3;">${c.reason}${c.unsubscribeUrl ? ` <a href="${c.unsubscribeUrl}" style="color:#ffffff;">Se d&eacute;sinscrire</a>` : ""}</p>
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
  const lines: string[] = ["REPTIC.CM", "", strip(c.title).toUpperCase(), ""];
  for (const b of c.blocks) {
    if (b.type === "paragraph" || b.type === "note") lines.push(strip(b.html), "");
    else if (b.type === "quote") lines.push(`${b.label ? `${strip(b.label)} : ` : ""}${strip(b.html)}`, "");
    else if (b.type === "button" || b.type === "link") lines.push(`${strip(b.label)} : ${b.url}`, "");
    else if (b.type === "code") lines.push(b.value, "");
    else if (b.type === "facts") lines.push(...b.rows.map((r) => `${strip(r.label)} : ${strip(r.value)}`), "");
    else if (b.type === "article") lines.push(`${b.meta ? `[${strip(b.meta)}] ` : ""}${strip(b.title)}`, ...(b.html ? [strip(b.html)] : []), b.url, "");
  }
  lines.push("--", "REPTIC.CM · Yaoundé, Cameroun", strip(c.reason));
  if (c.unsubscribeUrl) lines.push(`Se désinscrire : ${c.unsubscribeUrl}`);
  return lines.join("\n");
}
