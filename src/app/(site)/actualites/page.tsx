import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getNewsPage } from "@/lib/data/public";
import { EmptyState, NewsCard, PageHero } from "@/components/ui/content";

export const metadata: Metadata = {
  title: "Actualités",
  description: "Communiqués, vie du réseau et actualités du secteur numérique camerounais.",
  alternates: { canonical: "/actualites" },
};

const PAGE_SIZE = 9;

export default function NewsListPage({ searchParams }: PageProps<"/actualites">) {
  return (
    <>
      <PageHero title="Actualités" eyebrow="Informations" summary="Communiqués, vie du réseau et actualités du secteur numérique." />
      <section className="container-site py-16 sm:py-24">
        <Suspense fallback={<NewsGridSkeleton />}>
          <NewsGrid searchParams={searchParams} />
        </Suspense>
      </section>
    </>
  );
}

async function NewsGrid({ searchParams }: Pick<PageProps<"/actualites">, "searchParams">) {
  const { page: raw } = await searchParams;
  const page = Math.max(1, Number.parseInt(typeof raw === "string" ? raw : "1", 10) || 1);
  const { items, total } = await getNewsPage(page, PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!items.length) return <EmptyState title="Aucune actualité publiée pour le moment." />;

  return (
    <>
      <div className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
        {items.map((n, i) => (
          <NewsCard key={n.slug} item={n} delay={(i % 3) * 100} />
        ))}
      </div>
      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={p === 1 ? "/actualites" : `/actualites?page=${p}`}
              aria-current={p === page ? "page" : undefined}
              className={`grid size-11 place-items-center font-mono text-sm ${p === page ? "bg-navy text-white" : "border border-line text-navy hover:border-navy"}`}
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
        <div key={i} className="h-56 animate-pulse border-t-2 border-navy bg-paper" />
      ))}
    </div>
  );
}
