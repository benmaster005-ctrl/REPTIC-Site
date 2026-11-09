import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/admin";
import { getCategoriesOf } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/ui";
import { NewsForm } from "@/components/admin/ContentForms";

export const metadata: Metadata = { title: "Nouvelle actualité" };

export default function NewNewsPage() {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <NewNews />
    </Suspense>
  );
}

async function NewNews() {
  await requirePermission("content.manage");
  const categories = await getCategoriesOf("news");
  return (
    <>
      <Link href="/admin/actualites" className="link-arrow mb-6">
        <ArrowLeft aria-hidden className="size-4" /> Actualités
      </Link>
      <AdminHeader label="Contenus" title="Nouvelle actualité" />
      <div className="mt-8">
        <NewsForm initial={{ status: "draft", visibility: "public" }} categories={categories} />
      </div>
    </>
  );
}
