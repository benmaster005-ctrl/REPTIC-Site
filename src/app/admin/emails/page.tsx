import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePermission } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/env";
import { getSiteSettings } from "@/lib/data/public";
import { buildEmail, definitions, sampleVars, type TemplateKey } from "@/lib/email/transactional";
import { isEmailConfigured } from "@/lib/email/send";
import { formatDateTime } from "@/lib/format";
import { AdminHeader, Flash, Panel, StatusTag } from "@/components/admin/ui";
import { EmailTemplateEditor } from "@/components/admin/EmailForms";

export const metadata: Metadata = { title: "E-mails" };

export default function EmailsPage() {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Emails />
    </Suspense>
  );
}

type Row = { key: string; name: string | null; description: string | null; variables: string[]; subject: string; body: string; is_enabled: boolean; updated_at: string };

async function Emails() {
  await requirePermission("settings.manage");
  const supabase = await createClient();
  const [{ data }, { contact }] = await Promise.all([supabase.from("email_templates").select("key,name,description,variables,subject,body,is_enabled,updated_at").order("position"), getSiteSettings()]);
  const rows = ((data ?? []) as Row[]).filter((r) => r.key in definitions);

  return (
    <>
      <AdminHeader
        label="Paramètres"
        title="E-mails automatiques"
        description="Textes des e-mails envoyés par le site. La mise en page aux couleurs du REPTIC est appliquée automatiquement."
        action={<StatusTag tone={isEmailConfigured ? "success" : "warning"}>{isEmailConfigured ? "Envoi actif" : "Envoi non configuré"}</StatusTag>}
      />
      {!isEmailConfigured && (
        <Flash tone="error">
          Aucun e-mail n&apos;est envoyé tant que le serveur SMTP (SMTP_HOST, SMTP_USER, SMTP_PASSWORD…) n&apos;est pas renseigné dans les variables d&apos;environnement. Les textes restent modifiables.
        </Flash>
      )}
      {!rows.length && (
        <Panel className="mt-8">
          <p className="text-muted">Aucun modèle : exécutez la migration 20261112000006_emails.sql dans Supabase.</p>
        </Panel>
      )}
      <div className="mt-8 space-y-4">
        {rows.map((t) => {
          const preview = buildEmail(t.key as TemplateKey, t, sampleVars, { siteUrl: SITE_URL, contactEmail: contact.email });
          return (
            <details key={t.key} className="group bg-white">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-6 hover:bg-paper/60 sm:px-8">
                <span>
                  <span className="block font-display text-[1.1rem] font-bold text-navy">{t.name ?? t.key}</span>
                  <span className="block text-[0.85rem] text-muted">{t.description}</span>
                </span>
                <span className="flex items-center gap-4">
                  <span className="hidden font-mono text-[0.72rem] text-muted sm:inline">Modifié le {formatDateTime(t.updated_at)}</span>
                  <StatusTag tone={t.is_enabled ? "success" : "neutral"}>{t.is_enabled ? "Actif" : "Désactivé"}</StatusTag>
                </span>
              </summary>
              <div className="border-t border-line p-6 sm:p-8">
                <p className="mb-6 text-[0.9rem] text-muted">
                  Sujet actuel : <span className="font-semibold text-navy">{preview.subject}</span>
                </p>
                <EmailTemplateEditor
                  templateKey={t.key}
                  initial={{ subject: t.subject, body: t.body, is_enabled: t.is_enabled ? "on" : "" }}
                  variables={t.variables}
                  previewHtml={preview.html}
                  canSend={isEmailConfigured}
                />
              </div>
            </details>
          );
        })}
      </div>
      <Panel className="mt-8">
        <h2 className="label">E-mails de connexion (Supabase)</h2>
        <p className="mt-3 text-[0.9rem] text-muted">
          La confirmation d&apos;inscription, le mot de passe oublié et les autres e-mails de compte sont envoyés par Supabase. Leurs modèles à la charte REPTIC se trouvent dans le dossier <code className="font-mono text-navy">supabase/templates</code> du projet, à coller dans Supabase &gt; Authentication &gt; Emails.
        </p>
      </Panel>
    </>
  );
}
