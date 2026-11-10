import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/data/public";
import { heroBanners } from "@/content/site";
import { PageHero, RichText, type Crumb } from "./content";

/** Métadonnées SEO d'une page institutionnelle administrable. */
export async function editorialMetadata(slug: string, path: string): Promise<Metadata> {
  const page = await getPage(slug);
  if (!page) return {};
  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? page.summary ?? undefined,
    alternates: { canonical: path },
  };
}

/** Colonne de lecture alignée sur la grille (colonnes 4 à 12). */
export function ReadingColumn({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="container-site grid gap-10 py-16 sm:py-20 lg:grid-cols-12 lg:gap-6">
      <aside className="lg:col-span-3">{aside}</aside>
      <div className="lg:col-span-9">{children}</div>
    </div>
  );
}

/** Page institutionnelle : en-tête + corps Markdown géré depuis le back-office. */
export async function EditorialPage({ slug, crumbs, eyebrow, children }: { slug: string; crumbs?: Crumb[]; eyebrow?: string; children?: React.ReactNode }) {
  const page = await getPage(slug);
  if (!page) notFound();
  return (
    <>
      <PageHero image={heroBanners[slug as keyof typeof heroBanners] ?? heroBanners.default} title={page.title} summary={page.summary} crumbs={crumbs} eyebrow={eyebrow} />
      {page.body && (
        <ReadingColumn>
          <RichText>{page.body}</RichText>
        </ReadingColumn>
      )}
      {children}
    </>
  );
}
