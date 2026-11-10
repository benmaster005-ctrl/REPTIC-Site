import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getNewsCategories, getNewsPage } from "@/lib/data/public";
import { EmptyState, NewsCard, PageHero } from "@/components/ui/content";
import { LinkedinPosts } from "@/components/ui/LinkedinPosts";
import { FilterChips } from "@/components/ui/modern";
import { heroBanners } from "@/content/site";

export const metadata: Metadata = {
  title: "Actualités",
  description: "Communiqués, vie du réseau et actualités du secteur numérique camerounais.",
  alternates: { canonical: "/actualites" },
};

const PAGE_SIZE = 9;

export default function NewsListPage({ searchParams }: PageProps<"/actualites">) {
  return (
    <>
      <PageHero image={heroBanners.actualites} title="Actualités" eyebrow="Informations" summary="Communiqués, vie du réseau et actualités du secteur numérique." />
      <section className="container-site py-16 sm:py-24">
        <Suspense fallback={<NewsGridSkeleton />}>
          <NewsGrid searchParams={searchParams} />
        </Suspense>
      </section>
      <LinkedinPosts limit={6} />
    </>
  );
}

async function NewsGrid({ searchParams }: Pick<PageProps<"/actualites">, "searchParams">) {
  const { page: raw, categorie } = await searchParams;
  const page = Math.max(1, Number.parseInt(typeof raw === "string" ? raw : "1", 10) || 1);
  const categories = await getNewsCategories();
  // Seules les catégories connues sont acceptées (pas de requête sur une valeur arbitraire)
  const category = typeof categorie === "string" && categories.some((c) => c.slug === categorie) ? categorie : null;
  const { items, total } = await getNewsPage(page, PAGE_SIZE, category);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number, c: string | null) => {
    const q = new URLSearchParams();
    if (c) q.set("categorie", c);
    if (p > 1) q.set("page", String(p));
    const qs = q.toString();
    return qs ? `/actualites?${qs}` : "/actualites";
  };

  return (
    <>
      {categories.length > 1 && (
        <div className="mb-10">
          <FilterChips
            label="Filtrer par catégorie"
            current={category}
            options={[{ label: "Toutes", value: null, href: href(1, null) }, ...categories.map((c) => ({ label: c.name, value: c.slug, href: href(1, c.slug) }))]}
          />
        </div>
      )}
      {!items.length && <EmptyState title={category ? "Aucune actualité dans cette catégorie." : "Aucune actualité publiée pour le moment."} />}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((n, i) => (
          <NewsCard key={n.slug} item={n} delay={(i % 3) * 100} />
        ))}
      </div>
      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={href(p, category)}
              aria-current={p === page ? "page" : undefined}
              className={`grid size-11 place-items-center rounded-full font-mono text-sm ${p === page ? "bg-navy text-white" : "border border-line text-navy hover:border-navy"}`}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}

function NewsGridSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" aria-busy>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-80 animate-pulse rounded-3xl bg-paper" />
      ))}
    </div>
  );
}
