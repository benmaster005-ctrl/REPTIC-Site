import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/env";
import { getSiteSettings } from "@/lib/data/public";
import { loadNewsletterArticles, recentPublicNews } from "@/lib/data/newsletter";
import { buildNewsletterEmail } from "@/lib/email/content";
import { isEmailConfigured } from "@/lib/email/send";
import { formatDateTime } from "@/lib/format";
import { deleteCampaign } from "@/app/actions/admin-newsletter";
import { AdminHeader, Flash, Panel, StatusTag } from "@/components/admin/ui";
import { CampaignForm, CampaignSender, CampaignTest } from "@/components/admin/NewsletterForms";
import { ConfirmSubmit } from "@/components/admin/forms";

export const metadata: Metadata = { title: "Lettre" };

export default function CampaignPage({ params }: PageProps<"/admin/newsletter/[id]">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Campaign params={params} />
    </Suspense>
  );
}

async function Campaign({ params }: Pick<PageProps<"/admin/newsletter/[id]">, "params">) {
  await requirePermission("contact.manage");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: c }, subscribers] = await Promise.all([
    supabase.from("newsletter_campaigns").select("*").eq("id", id).maybeSingle(),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).is("unsubscribed_at", null),
  ]);
  if (!c) notFound();
  const newsIds = (c.news_ids as string[]) ?? [];
  const [articles, news, { contact }] = await Promise.all([loadNewsletterArticles(newsIds), recentPublicNews(), getSiteSettings()]);
  const preview = buildNewsletterEmail(
    { subject: c.subject as string, intro: c.intro as string, articles, unsubscribeUrl: `${SITE_URL}/newsletter/desinscription?t=apercu` },
    { siteUrl: SITE_URL, contactEmail: contact.email },
  );
  const draft = c.status === "draft";

  return (
    <>
      <Link href="/admin/newsletter" className="link-arrow mb-6">
        <ArrowLeft aria-hidden className="size-4" /> Lettre d&apos;information
      </Link>
      <AdminHeader
        label="Relations · Lettre d'information"
        title={c.subject as string}
        description={c.sent_at ? `Envoyée le ${formatDateTime(c.sent_at as string)}` : c.started_at ? `Envoi démarré le ${formatDateTime(c.started_at as string)}` : "Brouillon"}
        action={<StatusTag tone={draft ? "neutral" : c.status === "sent" ? "success" : "info"}>{draft ? "Brouillon" : c.status === "sent" ? "Envoyée" : "Envoi en cours"}</StatusTag>}
      />
      {!isEmailConfigured && <Flash tone="error">Serveur SMTP non configuré : l&apos;envoi est impossible.</Flash>}

      <div className="mt-8 grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-6">
          {draft && (
            <Panel>
              <h2 className="label mb-5">Contenu</h2>
              <CampaignForm id={id} initial={{ subject: c.subject as string, intro: c.intro as string }} news={news} selected={newsIds} />
            </Panel>
          )}
          <Panel>
            <h2 className="label mb-5">{draft ? "Envoi" : "Suivi de l'envoi"}</h2>
            {draft && (
              <div className="mb-6 border-b border-line pb-6">
                <p className="mb-3 text-[0.9rem] text-muted">Vérifiez le rendu dans votre messagerie avant d&apos;envoyer.</p>
                <CampaignTest id={id} />
              </div>
            )}
            <CampaignSender
              id={id}
              status={c.status as string}
              total={Number(c.total)}
              sent={Number(c.sent_count)}
              failed={Number(c.failed_count)}
              subscribers={subscribers.count ?? 0}
            />
          </Panel>
          {draft && (
            <form action={deleteCampaign}>
              <input type="hidden" name="id" value={id} />
              <ConfirmSubmit message="Supprimer ce brouillon ?" className="text-sm font-semibold text-red-700 hover:underline">
                Supprimer le brouillon
              </ConfirmSubmit>
            </form>
          )}
        </div>
        <div className="xl:col-span-6">
          <p className="label mb-3">Aperçu</p>
          <iframe title="Aperçu de la lettre" srcDoc={preview.html} sandbox="" className="h-[900px] w-full border border-line bg-paper" />
        </div>
      </div>
    </>
  );
}
