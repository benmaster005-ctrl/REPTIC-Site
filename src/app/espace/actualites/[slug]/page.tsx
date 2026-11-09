import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { getSpaceContext } from "@/lib/space";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { RichText } from "@/components/ui/content";
import { MembersOnly, Panel } from "@/components/space/ui";

export const metadata: Metadata = { title: "Actualité" };

export default function MemberArticlePage({ params }: PageProps<"/espace/actualites/[slug]">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Article params={params} />
    </Suspense>
  );
}

async function Article({ params }: Pick<PageProps<"/espace/actualites/[slug]">, "params">) {
  const { isMember } = await getSpaceContext("/espace/actualites");
  if (!isMember) return <MembersOnly feature="Les actualités réservées" />;
  const { slug } = await params;
  const supabase = await createClient();
  // La RLS ne renvoie l'article que s'il est publié et accessible à ce membre.
  const { data } = await supabase.from("news").select("title,excerpt,body,published_at,visibility").eq("slug", slug).maybeSingle();
  if (!data) notFound();
  return (
    <Panel>
      <Link href="/espace/actualites" className="link-arrow">
        <ArrowLeft aria-hidden className="size-4" /> Actualités
      </Link>
      <p className="mt-8 font-mono text-[0.75rem] text-muted">
        {formatDate(data.published_at as string)}
        {data.visibility === "members" && <span className="ml-3 text-cyan-dark">Réservé aux membres</span>}
      </p>
      <h1 className="heading-md mt-3 max-w-3xl">{data.title as string}</h1>
      {data.excerpt && <p className="mt-4 max-w-2xl text-[1.05rem] text-muted">{data.excerpt as string}</p>}
      <div className="mt-10 border-t border-line pt-10">
        <RichText>{(data.body as string) ?? null}</RichText>
      </div>
    </Panel>
  );
}
