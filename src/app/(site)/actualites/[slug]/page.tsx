import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { getNewsBySlug } from "@/lib/data/public";
import { SITE_URL } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { PageHero, RichText } from "@/components/ui/content";
import { heroBanners } from "@/content/site";
import { ReadingColumn } from "@/components/ui/editorial";
import { ShareLinks } from "@/components/ui/ShareLinks";

export async function generateMetadata({ params }: PageProps<"/actualites/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = await getNewsBySlug(slug);
  if (!item) return { title: "Article introuvable" };
  return {
    title: item.title,
    description: item.excerpt ?? undefined,
    alternates: { canonical: `/actualites/${item.slug}` },
    openGraph: { type: "article", title: item.title, description: item.excerpt ?? undefined, publishedTime: item.publishedAt, images: item.coverUrl ? [item.coverUrl] : undefined },
  };
}

export default function NewsArticlePage({ params }: PageProps<"/actualites/[slug]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse border-b border-line bg-paper" />}>
      <Article params={params} />
    </Suspense>
  );
}

async function Article({ params }: Pick<PageProps<"/actualites/[slug]">, "params">) {
  const { slug } = await params;
  const item = await getNewsBySlug(slug);
  if (!item) notFound();

  return (
    <article>
      <PageHero image={heroBanners.actualites} cover={item.coverUrl ? { src: item.coverUrl, alt: item.title } : null} title={item.title} summary={item.excerpt} crumbs={[{ label: "Actualités", href: "/actualites" }]} eyebrow={item.category ?? "Actualité"} />
      <ReadingColumn
        aside={
          <div className="space-y-8 lg:sticky lg:top-36">
            <div>
              <p className="label">Publié le</p>
              <p className="mt-2 font-semibold text-navy">
                <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
              </p>
            </div>
            <ShareLinks url={`${SITE_URL}/actualites/${item.slug}`} title={item.title} />
          </div>
        }
      >
        <RichText>{item.body}</RichText>
        <Link href="/actualites" className="link-arrow mt-16">
          <ArrowLeft aria-hidden className="size-4" /> Toutes les actualités
        </Link>
      </ReadingColumn>
    </article>
  );
}
