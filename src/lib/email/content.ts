import { escapeHtml, renderEmail, renderText, type EmailBlock } from "./layout";

/**
 * E-mails de contenu : messages de diffusion, lettre d'information, alertes
 * de publication. Même mise en page que les e-mails transactionnels.
 */

type Site = { siteUrl: string; contactEmail: string };

/** Texte saisi (paragraphes séparés par une ligne vide) → blocs échappés. */
function paragraphs(text: string): EmailBlock[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({ type: "paragraph", html: escapeHtml(p).replace(/\n/g, "<br>") }));
}

function build(content: Parameters<typeof renderEmail>[0]) {
  return { html: renderEmail(content), text: renderText(content) };
}

export function buildBroadcastEmail(b: { title: string; body: string; url: string }, site: Site) {
  const subject = b.title.trim();
  return {
    subject,
    ...build({
      preheader: b.body.replace(/\s+/g, " ").slice(0, 140),
      eyebrow: "Message du secrétariat",
      title: escapeHtml(subject),
      blocks: [...paragraphs(b.body), { type: "button", label: "Lire dans mon espace", url: b.url }],
      reason: "Vous recevez ce message en tant que membre du REPTIC.CM. Il est aussi disponible dans les notifications de votre espace.",
      ...site,
    }),
  };
}

export type NewsletterArticle = { title: string; excerpt: string | null; url: string; meta?: string };

export function buildNewsletterEmail(n: { subject: string; intro: string; articles: NewsletterArticle[]; unsubscribeUrl: string }, site: Site) {
  const blocks: EmailBlock[] = [...paragraphs(n.intro)];
  if (n.articles.length) {
    blocks.push({ type: "paragraph", html: "<strong>À lire sur le site</strong>" });
    for (const a of n.articles) blocks.push({ type: "article", title: escapeHtml(a.title), html: a.excerpt ? escapeHtml(a.excerpt) : undefined, url: a.url, meta: a.meta ? escapeHtml(a.meta) : undefined });
  }
  blocks.push({ type: "button", label: "Toutes les actualités", url: `${site.siteUrl}/actualites` });
  return {
    subject: n.subject.trim(),
    ...build({
      preheader: n.intro.replace(/\s+/g, " ").slice(0, 140),
      eyebrow: "Lettre d'information",
      title: escapeHtml(n.subject.trim()),
      blocks,
      reason: "Vous recevez cette lettre car vous vous êtes inscrit à la lettre d'information du REPTIC.CM.",
      unsubscribeUrl: n.unsubscribeUrl,
      ...site,
    }),
  };
}

export function buildPublicationEmail(p: { kind: "news" | "event"; title: string; excerpt: string | null; url: string; meta?: string }, site: Site) {
  const isNews = p.kind === "news";
  const subject = `${isNews ? "Nouvelle actualité" : "Nouvel événement"} : ${p.title}`;
  return {
    subject,
    ...build({
      preheader: p.excerpt ?? p.title,
      eyebrow: isNews ? "Actualité du réseau" : "Agenda du réseau",
      title: escapeHtml(p.title),
      blocks: [
        { type: "paragraph", html: isNews ? "Une nouvelle actualité vient d'être publiée sur le portail du REPTIC.CM." : "Un nouvel événement du réseau vient d'être annoncé." },
        { type: "article", title: escapeHtml(p.title), html: p.excerpt ? escapeHtml(p.excerpt) : undefined, url: p.url, meta: p.meta ? escapeHtml(p.meta) : undefined },
        { type: "note", html: `Vous recevez cet e-mail car vous avez choisi d'être prévenu des publications. Pour ne plus le recevoir, modifiez vos préférences dans <a href="${site.siteUrl}/espace/profil" style="color:#157BB0;">Mon profil</a>.` },
      ],
      reason: "Vous recevez cet e-mail en tant que membre du REPTIC.CM.",
      ...site,
    }),
  };
}
