"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { saveCampaign, sendCampaignBatch, sendCampaignTest, startCampaign } from "@/app/actions/admin-newsletter";
import { Field } from "@/components/ui/form";
import { formatDate } from "@/lib/format";
import { ActionForm } from "./forms";

type NewsOption = { id: string; title: string; publishedAt: string | null };

export function CampaignForm({ id, initial, news, selected }: { id?: string; initial: Record<string, string>; news: NewsOption[]; selected: string[] }) {
  return (
    <ActionForm action={saveCampaign} hidden={id ? { id } : undefined} initial={initial} submitLabel={id ? "Enregistrer le brouillon" : "Créer le brouillon"}>
      {(s) => (
        <>
          <Field name="subject" label="Objet de l'e-mail" state={s} required placeholder="La lettre du REPTIC.CM · Novembre 2026" />
          <Field name="intro" label="Introduction" state={s} textarea rows={7} required hint="Séparez les paragraphes par une ligne vide." />
          <fieldset>
            <legend className="field-label">Actualités à mettre en avant (8 au maximum)</legend>
            {news.length ? (
              <ul className="mt-2 border-t border-line">
                {news.map((n) => (
                  <li key={n.id} className="border-b border-line">
                    <label className="flex cursor-pointer items-start gap-3 py-3 text-[0.92rem] hover:bg-paper/60">
                      <input type="checkbox" name="news_ids" value={n.id} defaultChecked={selected.includes(n.id)} className="mt-0.5 size-4 accent-navy" />
                      <span>
                        <span className="font-semibold text-navy">{n.title}</span>
                        {n.publishedAt && <span className="ml-2 font-mono text-[0.72rem] text-muted">{formatDate(n.publishedAt, { day: "2-digit", month: "2-digit", year: "numeric" })}</span>}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[0.9rem] text-muted">Aucune actualité publique publiée pour le moment.</p>
            )}
          </fieldset>
        </>
      )}
    </ActionForm>
  );
}

export function CampaignTest({ id }: { id: string }) {
  return (
    <ActionForm action={sendCampaignTest} hidden={{ id }} submitLabel="M'envoyer un test" tone="secondary" pendingLabel="Envoi…" className="space-y-3 [&_button]:px-4 [&_button]:py-2 [&_button]:text-[0.85rem]" />
  );
}

/** Envoi par lots successifs avec barre de progression ; peut être repris si la page est fermée. */
export function CampaignSender({ id, status, total, sent, failed, subscribers }: { id: string; status: string; total: number; sent: number; failed: number; subscribers: number }) {
  const router = useRouter();
  const [progress, setProgress] = useState({ total, sent, failed, pending: Math.max(0, total - sent - failed) });
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function run(resume: boolean) {
    setError(null);
    setRunning(true);
    let current = progress;
    if (!resume) {
      const start = await startCampaign(id);
      if (!start.ok) {
        setRunning(false);
        return setError(start.error);
      }
      current = { total: start.total, sent: 0, failed: 0, pending: start.total };
      setProgress(current);
    }
    while (current.pending > 0) {
      const res = await sendCampaignBatch(id);
      if (!res.ok) {
        setError(res.error);
        break;
      }
      const advanced = res.sent + res.failed > current.sent + current.failed;
      current = { total: current.total, sent: res.sent, failed: res.failed, pending: res.pending };
      setProgress(current);
      if (!advanced && current.pending > 0) {
        setError("L'envoi n'avance plus. Vérifiez la configuration SMTP puis reprenez l'envoi.");
        break;
      }
    }
    setRunning(false);
    startTransition(() => router.refresh());
  }

  const pct = progress.total ? Math.round(((progress.sent + progress.failed) / progress.total) * 100) : 0;

  if (status === "draft" && !running && progress.total === 0) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Envoyer cette lettre à ${subscribers} abonné${subscribers > 1 ? "s" : ""} ? Elle ne pourra plus être modifiée.`)) void run(false);
          }}
          disabled={!subscribers}
          className="btn-primary"
        >
          <Send aria-hidden className="size-4" /> Envoyer à {subscribers} abonné{subscribers > 1 ? "s" : ""}
        </button>
        {error && <p className="text-sm font-medium text-red-700">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold text-navy">{progress.pending ? (running ? "Envoi en cours…" : "Envoi interrompu") : "Envoi terminé"}</span>
        <span className="font-mono text-[0.8rem] text-muted">
          {progress.sent} envoyée{progress.sent > 1 ? "s" : ""} · {progress.failed} échec{progress.failed > 1 ? "s" : ""} · {progress.total} au total
        </span>
      </div>
      <div className="h-2 bg-paper" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Avancement de l'envoi">
        <div className="h-full bg-cyan transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      {running && <p className="flex items-center gap-2 text-[0.85rem] text-muted"><Loader2 aria-hidden className="size-4 animate-spin" /> Gardez cette page ouverte jusqu&apos;à la fin de l&apos;envoi.</p>}
      {!running && progress.pending > 0 && (
        <button type="button" onClick={() => void run(true)} className="btn-primary px-4 py-2 text-[0.85rem]">
          Reprendre l&apos;envoi ({progress.pending} restant{progress.pending > 1 ? "s" : ""})
        </button>
      )}
      {error && <p className="text-sm font-medium text-red-700">{error}</p>}
    </div>
  );
}
