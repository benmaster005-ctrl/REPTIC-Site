import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/admin";
import { getPageById } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/ui";
import { PageForm } from "@/components/admin/ContentForms";

export const metadata: Metadata = { title: "Modifier une page" };

const v = (x: unknown) => (x == null ? "" : String(x));

export default function EditPagePage({ params }: PageProps<"/admin/pages/[id]">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <EditPage params={params} />
    </Suspense>
  );
}

async function EditPage({ params }: Pick<PageProps<"/admin/pages/[id]">, "params">) {
  await requirePermission("content.manage");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const page = await getPageById(id);
  if (!page) notFound();
  return (
    <>
      <Link href="/admin/pages" className="link-arrow mb-6">
        <ArrowLeft aria-hidden className="size-4" /> Pages
      </Link>
      <AdminHeader label={`Page · /${v(page.slug)}`} title={v(page.title)} />
      <div className="mt-8">
        <PageForm id={id} initial={Object.fromEntries(["title", "summary", "body", "seo_title", "seo_description", "status"].map((k) => [k, v(page[k])]))} />
      </div>
    </>
  );
}
