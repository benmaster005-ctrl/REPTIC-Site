import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getSpaceContext } from "@/lib/space";
import { getMemberNews } from "@/lib/data/member";
import { formatDate } from "@/lib/format";
import { MembersOnly, Panel, SpaceHeader } from "@/components/space/ui";

export const metadata: Metadata = { title: "Actualités" };

export default function MemberNewsPage() {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <MemberNews />
    </Suspense>
  );
}

async function MemberNews() {
  const { isMember } = await getSpaceContext("/espace/actualites");
  if (!isMember) return (<><SpaceHeader label="Actualités" title="Actualités du réseau" /><MembersOnly feature="Les actualités réservées" /></>);
  const news = await getMemberNews(50);
  return (
    <>
      <SpaceHeader label="Actualités" title="Actualités du réseau" description="Publications publiques et informations réservées aux membres." />
      <Panel className="mt-8 p-0 sm:p-0">
        {news.length ? (
          <ul>
            {news.map((n) => (
              <li key={n.slug} className="border-b border-line last:border-b-0">
                <Link href={`/espace/actualites/${n.slug}`} className="group block px-6 py-6 transition-colors hover:bg-paper sm:px-8">
                  <p className="flex flex-wrap items-center gap-x-3 font-mono text-[0.72rem] text-muted">
                    {formatDate(n.publishedAt, { day: "2-digit", month: "2-digit", year: "numeric" })}
                    {n.category && <span className="label">{n.category}</span>}
                    {n.membersOnly && <span className="label text-cyan-dark">Réservé aux membres</span>}
                  </p>
                  <p className="mt-2 font-display text-[1.2rem] font-bold text-navy group-hover:text-cyan-dark">{n.title}</p>
                  {n.excerpt && <p className="mt-1 line-clamp-2 text-[0.92rem] text-muted">{n.excerpt}</p>}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-8 text-muted">Aucune actualité publiée.</p>
        )}
      </Panel>
    </>
  );
}
