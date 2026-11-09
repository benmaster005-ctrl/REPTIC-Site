import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/admin";
import { recentPublicNews } from "@/lib/data/newsletter";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { CampaignForm } from "@/components/admin/NewsletterForms";

export const metadata: Metadata = { title: "Nouvelle lettre" };

export default function NewCampaignPage() {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <NewCampaign />
    </Suspense>
  );
}

async function NewCampaign() {
  await requirePermission("contact.manage");
  const news = await recentPublicNews();
  return (
    <>
      <Link href="/admin/newsletter" className="link-arrow mb-6">
        <ArrowLeft aria-hidden className="size-4" /> Lettre d&apos;information
      </Link>
      <AdminHeader label="Relations" title="Nouvelle lettre" description="Commencez par un brouillon : vous pourrez le prévisualiser et vous l'envoyer avant la diffusion." />
      <Panel className="mt-8">
        <CampaignForm initial={{ intro: "Chers membres et partenaires,\n\n" }} news={news} selected={news.slice(0, 3).map((n) => n.id)} />
      </Panel>
    </>
  );
}
