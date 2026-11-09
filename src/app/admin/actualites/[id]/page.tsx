import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { contentStatus, requirePermission } from "@/lib/admin";
import { getCategoriesOf, getNewsById } from "@/lib/data/admin";
import { deleteNews } from "@/app/actions/admin-content";
import { toLocalInput } from "@/lib/datetime";
import { AdminHeader, Flash, StatusTag } from "@/components/admin/ui";
import { NewsForm } from "@/components/admin/ContentForms";
import { ConfirmSubmit } from "@/components/admin/forms";

export const metadata: Metadata = { title: "Modifier une actualité" };

export default function EditNewsPage({ params, searchParams }: PageProps<"/admin/actualites/[id]">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <EditNews params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const v = (x: unknown) => (x == null ? "" : String(x));

async function EditNews({ params, searchParams }: Pick<PageProps<"/admin/actualites/[id]">, "params" | "searchParams">) {
  await requirePermission("content.manage");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [news, categories] = await Promise.all([getNewsById(id), getCategoriesOf("news")]);
  if (!news) notFound();
  const st = contentStatus[v(news.status)] ?? contentStatus.draft;
  const initial = Object.fromEntries(["title", "slug", "excerpt", "body", "category_id", "visibility", "status", "cover_path", "seo_title", "seo_description"].map((k) => [k, v(news[k])]));
  initial.published_at = toLocalInput(v(news.published_at));

  return (
    <>
      <Link href="/admin/actualites" className="link-arrow mb-6">
        <ArrowLeft aria-hidden className="size-4" /> Actualités
      </Link>
      <AdminHeader
        label="Contenus · Actualité"
        title={v(news.title)}
        action={
          <div className="flex items-center gap-4">
            <StatusTag tone={st.tone}>{st.label}</StatusTag>
            {news.status === "published" && (
              <a href={news.visibility === "members" ? `/espace/actualites/${v(news.slug)}` : `/actualites/${v(news.slug)}`} target="_blank" rel="noopener" className="link-arrow">
                Voir <ArrowUpRight aria-hidden className="size-4" />
              </a>
            )}
          </div>
        }
      />
      {sp.enregistre === "1" && <Flash>Actualité créée.</Flash>}
      <div className="mt-8">
        <NewsForm id={id} initial={initial} categories={categories} />
      </div>
      <form action={deleteNews} className="mt-10 border-t border-line pt-6">
        <input type="hidden" name="id" value={id} />
        <ConfirmSubmit message="Supprimer définitivement cette actualité ?" className="text-sm font-semibold text-red-700 hover:underline">
          Supprimer l&apos;actualité
        </ConfirmSubmit>
      </form>
    </>
  );
}
