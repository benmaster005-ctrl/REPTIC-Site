import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowUpRight, FileText } from "lucide-react";
import { requirePermission } from "@/lib/admin";
import { getApplicationDetail, getMemberTypeCategories } from "@/lib/data/admin";
import { applicantTypeLabels, fieldLabels, fieldsFor, formatBytes, statusLabels } from "@/lib/membership";
import { formatDate, formatDateTime } from "@/lib/format";
import { applicationTone } from "@/components/space/application";
import { AdminHeader, Panel, StatusTag } from "@/components/admin/ui";
import { ApplicationDecisions } from "@/components/admin/ApplicationDecisions";

export const metadata: Metadata = { title: "Dossier d'adhésion" };

export default function ApplicationDetailPage({ params }: PageProps<"/admin/demandes/[id]">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: Pick<PageProps<"/admin/demandes/[id]">, "params">) {
  const { can } = await requirePermission("applications.read");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [app, categories] = await Promise.all([getApplicationDetail(id), getMemberTypeCategories()]);
  if (!app) notFound();

  const entries = fieldsFor(app.type)
    .map((k) => [k, app.payload[k]] as const)
    .filter(([, v]) => v !== undefined && v !== null && v !== "");
  const missing = app.required.filter((r) => r.isRequired && !app.documents.some((d) => d.documentType === r.key));
  const defaultCategory = categories.find((c) => c.slug === (app.type === "physical" ? "personne-physique" : "personne-morale"))?.id ?? app.categoryId ?? "";

  return (
    <>
      <Link href="/admin/demandes" className="link-arrow mb-6">
        <ArrowLeft aria-hidden className="size-4" /> Demandes
      </Link>
      <AdminHeader
        label={`${app.reference} · ${applicantTypeLabels[app.type]}`}
        title={app.applicant}
        description={app.submittedAt ? `Envoyée le ${formatDateTime(app.submittedAt)}` : "Dossier non envoyé (brouillon)."}
        action={<StatusTag tone={applicationTone(app.status)}>{statusLabels[app.status]}</StatusTag>}
      />

      <div className="mt-8 grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <Panel>
            <h2 className="label">Informations du dossier</h2>
            <dl className="mt-4 border-t-2 border-navy">
              {entries.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[minmax(9rem,35%)_1fr] gap-4 border-b border-line py-3 text-[0.92rem]">
                  <dt className="text-muted">{fieldLabels[k] ?? k}</dt>
                  <dd className="font-semibold break-words whitespace-pre-line text-navy">{k === "birth_date" ? formatDate(String(v)) : String(v)}</dd>
                </div>
              ))}
              {!entries.length && <p className="py-4 text-muted">Aucune information saisie.</p>}
            </dl>
          </Panel>

          <Panel>
            <div className="flex items-center justify-between">
              <h2 className="label">Pièces justificatives</h2>
              {missing.length > 0 && <StatusTag tone="warning">{missing.length} manquante{missing.length > 1 ? "s" : ""}</StatusTag>}
            </div>
            <ul className="mt-4 border-t-2 border-navy">
              {app.required.map((r) => {
                const doc = app.documents.find((d) => d.documentType === r.key);
                return (
                  <li key={r.key} className="grid gap-2 border-b border-line py-3.5 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="text-[0.85rem] text-muted">
                        {r.label}
                        {!r.isRequired && " (facultative)"}
                      </p>
                      {doc ? (
                        <p className="flex min-w-0 items-center gap-2 text-[0.92rem] font-semibold text-navy">
                          <FileText aria-hidden className="size-4 shrink-0 text-cyan-dark" />
                          <span className="truncate">{doc.fileName}</span>
                          <span className="shrink-0 font-mono text-[0.72rem] font-normal text-muted">{formatBytes(doc.sizeBytes)}</span>
                        </p>
                      ) : (
                        <p className="text-[0.92rem] font-semibold text-muted">Non fournie</p>
                      )}
                    </div>
                    {doc?.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-secondary px-3.5 py-2 text-[0.85rem]">
                        Ouvrir <ArrowUpRight aria-hidden className="size-4" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 font-mono text-[0.72rem] text-muted">Liens d&apos;ouverture valables 5 minutes : rechargez la page si besoin.</p>
          </Panel>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <Panel>
            <h2 className="label">Candidat</h2>
            <dl className="mt-4 space-y-3 text-[0.92rem]">
              <div>
                <dt className="text-muted">Compte</dt>
                <dd className="font-semibold text-navy">{app.candidate.name}</dd>
              </div>
              {app.candidate.email && (
                <div>
                  <dt className="text-muted">E-mail</dt>
                  <dd>
                    <a href={`mailto:${app.candidate.email}`} className="font-semibold break-all text-navy hover:text-cyan-dark">
                      {app.candidate.email}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-muted">Suivi par</dt>
                <dd className="font-semibold text-navy">{app.assignee ?? "Personne"}</dd>
              </div>
              {app.memberId && (
                <div>
                  <dt className="text-muted">Fiche membre</dt>
                  <dd>
                    <Link href={`/admin/membres/${app.memberId}`} className="font-semibold text-navy underline underline-offset-4 hover:text-cyan-dark">
                      Ouvrir la fiche
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </Panel>

          {can("applications.review") && (
            <ApplicationDecisions
              applicationId={app.id}
              status={app.status}
              missingCount={missing.length}
              categories={categories.map((c) => ({ value: c.id, label: c.name }))}
              defaultCategory={defaultCategory}
            />
          )}

          <Panel>
            <h2 className="label">Historique</h2>
            <ol className="relative mt-5 ml-1.5 border-l-2 border-line">
              {app.history.map((h, i) => (
                <li key={h.id} className="relative pb-5 pl-6 last:pb-0">
                  <span aria-hidden className={`absolute top-1 -left-[7px] size-3 rounded-full border-2 bg-white ${i === 0 ? "border-cyan" : "border-line-strong"}`} />
                  <p className={`text-[0.9rem] font-semibold ${i === 0 ? "text-navy" : "text-muted"}`}>{statusLabels[h.toStatus]}</p>
                  <p className="font-mono text-[0.7rem] text-muted">
                    {formatDateTime(h.createdAt)} · {h.author}
                  </p>
                  {h.comment && <p className="mt-1 text-[0.85rem] text-ink">{h.comment}</p>}
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </>
  );
}
