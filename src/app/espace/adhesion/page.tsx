import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Building2, Trash2, UserRound } from "lucide-react";
import { getSpaceContext } from "@/lib/space";
import {
  getApplicationDocuments,
  getApplicationHistory,
  getMyApplication,
  getMyMember,
  getMyMemberships,
  getRequiredDocuments,
  type Application,
  type AppDocument,
  type RequiredDocument,
} from "@/lib/data/member";
import {
  applicantTypeLabels,
  fieldLabels,
  fieldsFor,
  isEditable,
  schemaFor,
  statusDescriptions,
  statusLabels,
  type WizardStep,
} from "@/lib/membership";
import { chooseApplicantType, deleteDocument } from "@/app/actions/membership";
import { formatDate, formatDateTime } from "@/lib/format";
import { Panel, SpaceFlash, SpaceHeader, StatusTag } from "@/components/space/ui";
import { Stepper, applicationTone } from "@/components/space/application";
import { ApplicationInfoForm, DocumentUploader, FileChip, SubmitApplicationForm } from "@/components/space/ApplicationForms";
import { SubmitButton } from "@/components/ui/form";

export const metadata: Metadata = { title: "Ma demande d'adhésion" };

export default function ApplicationPage({ searchParams }: PageProps<"/espace/adhesion">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <ApplicationFlow searchParams={searchParams} />
    </Suspense>
  );
}

const STEP_KEYS: WizardStep[] = ["type", "informations", "pieces", "verification", "suivi"];

async function ApplicationFlow({ searchParams }: Pick<PageProps<"/espace/adhesion">, "searchParams">) {
  const { user, isMember } = await getSpaceContext("/espace/adhesion");
  const [params, app] = await Promise.all([searchParams, getMyApplication(user.id)]);
  const requested = STEP_KEYS.find((s) => s === params.etape);
  const flash = params.envoye === "1";
  const error = typeof params.erreur === "string" ? params.erreur : null;

  // Adhérent déjà validé : page « Mon adhésion ».
  if (isMember && (!app || app.status === "accepted")) return <MembershipSummary userId={user.id} app={app} />;

  // Aucun dossier ou dossier refusé : on (re)commence par le type.
  if (!app || app.status === "rejected") {
    if (app && requested !== "type") return <Tracking app={app} flash={false} />;
    return <TypeStep current={null} error={error} />;
  }

  const [docs, required] = await Promise.all([getApplicationDocuments(app.id), getRequiredDocuments(app.applicantType)]);
  const infoComplete = schemaFor(app.applicantType).safeParse(app.payload).success;
  const missing = required.filter((r) => r.isRequired && !docs.some((d) => d.documentType === r.key));

  if (!isEditable(app.status)) return <Tracking app={app} flash={flash} />;

  const defaultStep: WizardStep = !infoComplete ? "informations" : missing.length ? "pieces" : "verification";
  const reachable: WizardStep[] = [
    ...(app.status === "draft" ? (["type"] as WizardStep[]) : []),
    "informations",
    ...(infoComplete ? (["pieces"] as WizardStep[]) : []),
    ...(infoComplete && !missing.length ? (["verification"] as WizardStep[]) : []),
  ];
  const step = requested && reachable.includes(requested) ? requested : defaultStep;

  const header = (
    <>
      <SpaceHeader
        label={`Demande d'adhésion · ${app.reference}`}
        title={app.status === "additional_info" ? "Compléter votre dossier" : "Votre demande d'adhésion"}
        description={`${applicantTypeLabels[app.applicantType]} · enregistrée automatiquement à chaque étape.`}
        action={<StatusTag tone={applicationTone(app.status)}>{statusLabels[app.status]}</StatusTag>}
      />
      {app.status === "additional_info" && (
        <div className="mt-6 border-l-[3px] border-amber-500 bg-white px-5 py-4">
          <p className="label text-amber-700">Complément demandé par le secrétariat</p>
          <p className="mt-2 text-ink">{app.decisionReason ?? "Des informations ou des pièces supplémentaires sont nécessaires."}</p>
        </div>
      )}
      <Stepper current={step} reachable={reachable} />
    </>
  );

  if (step === "type") return <TypeStep current={app} error={error} header={header} />;

  if (step === "informations") {
    const initial = Object.fromEntries(fieldsFor(app.applicantType).map((k) => [k, app.payload[k] != null ? String(app.payload[k]) : ""]));
    if (!initial.country) initial.country = "Cameroun";
    if (app.applicantType === "legal" && !initial.rep_email) initial.rep_email = user.email;
    if (app.applicantType === "physical") {
      initial.first_name ||= user.firstName ?? "";
      initial.last_name ||= user.lastName ?? "";
    }
    return (
      <>
        {header}
        <Panel className="mt-8">
          <h2 className="font-display text-xl font-bold text-navy">Informations et coordonnées</h2>
          <p className="mt-1 mb-8 text-[0.92rem] text-muted">Les champs marqués d&apos;un astérisque sont obligatoires.</p>
          <ApplicationInfoForm applicationId={app.id} type={app.applicantType} initial={initial} />
        </Panel>
      </>
    );
  }

  if (step === "pieces") {
    return (
      <>
        {header}
        <Panel className="mt-8">
          <h2 className="font-display text-xl font-bold text-navy">Justificatifs</h2>
          <p className="mt-1 text-[0.92rem] text-muted">PDF, JPEG, PNG ou WebP, 10 Mo maximum par fichier. Les pièces sont stockées de façon privée et ne sont visibles que par vous et les gestionnaires.</p>
          <DocumentsList app={app} userId={user.id} docs={docs} required={required} />
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
            <Link href="/espace/adhesion?etape=informations" className="btn-secondary">
              Informations
            </Link>
            {missing.length ? (
              <p className="self-center text-sm text-muted">
                {missing.length} pièce{missing.length > 1 ? "s" : ""} obligatoire{missing.length > 1 ? "s" : ""} manquante{missing.length > 1 ? "s" : ""}
              </p>
            ) : (
              <Link href="/espace/adhesion?etape=verification" className="btn-primary">
                Vérifier et envoyer <ArrowRight aria-hidden className="size-4" />
              </Link>
            )}
          </div>
        </Panel>
      </>
    );
  }

  // Vérification
  return (
    <>
      {header}
      <Panel className="mt-8">
        <h2 className="font-display text-xl font-bold text-navy">Vérification</h2>
        <p className="mt-1 text-[0.92rem] text-muted">Relisez votre dossier avant de l&apos;envoyer. Après l&apos;envoi, il ne sera plus modifiable, sauf si le secrétariat vous demande un complément.</p>
        <Summary app={app} docs={docs} required={required} editable />
        <div className="mt-10">
          <SubmitApplicationForm applicationId={app.id} ready={infoComplete && !missing.length} />
        </div>
      </Panel>
    </>
  );
}

// ---------------------------------------------------------------------------
// Étape 1
// ---------------------------------------------------------------------------
function TypeStep({ current, error, header }: { current: Application | null; error: string | null; header?: React.ReactNode }) {
  const options = [
    { value: "physical", icon: UserRound, title: "Personne physique", text: "Professionnel indépendant, consultant ou expert du numérique." },
    { value: "legal", icon: Building2, title: "Personne morale", text: "Entreprise, startup ou association du secteur numérique." },
  ] as const;
  return (
    <>
      {header ?? (
        <>
          <SpaceHeader label="Demande d'adhésion" title="Commencer votre demande" description="Choisissez le type de demande : les informations et les pièces demandées en dépendent." />
          <Stepper current="type" reachable={[]} />
        </>
      )}
      {error && (
        <SpaceFlash tone="error">
          {error === "pieces"
            ? "Supprimez d'abord les pièces déjà déposées pour changer de type de demande."
            : error === "type"
              ? "Choisissez un type de demande."
              : "La demande n'a pas pu être créée. Réessayez."}
        </SpaceFlash>
      )}
      <Panel className="mt-8">
        <form action={chooseApplicantType}>
          <fieldset>
            <legend className="font-display text-xl font-bold text-navy">Vous adhérez en tant que…</legend>
            <div className="mt-6 grid gap-px bg-line-strong sm:grid-cols-2">
              {options.map(({ value, icon: Icon, title, text }) => (
                <label key={value} className="group relative cursor-pointer bg-white p-7 transition-colors has-[:checked]:bg-navy has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-cyan">
                  <input type="radio" name="applicant_type" value={value} defaultChecked={current?.applicantType === value} required className="peer sr-only" />
                  <Icon aria-hidden className="size-7 text-navy transition-colors group-has-[:checked]:text-cyan" />
                  <span className="mt-5 block font-display text-[1.35rem] font-bold text-navy group-has-[:checked]:text-white">{title}</span>
                  <span className="mt-1.5 block text-[0.92rem] text-muted group-has-[:checked]:text-white/70">{text}</span>
                  <span aria-hidden className="absolute top-6 right-6 size-4 rounded-full border-2 border-line-strong transition-colors group-has-[:checked]:border-cyan group-has-[:checked]:bg-cyan" />
                </label>
              ))}
            </div>
          </fieldset>
          {current && current.applicantType && Object.keys(current.payload).length > 0 && (
            <p className="mt-4 text-sm text-muted">Changer de type efface les informations déjà saisies.</p>
          )}
          <div className="mt-8 flex justify-end border-t border-line pt-6">
            <SubmitButton pendingLabel="Préparation…">
              Continuer <ArrowRight aria-hidden className="size-4" />
            </SubmitButton>
          </div>
        </form>
      </Panel>
    </>
  );
}

// ---------------------------------------------------------------------------
// Pièces
// ---------------------------------------------------------------------------
function DocumentsList({ app, userId, docs, required }: { app: Application; userId: string; docs: AppDocument[]; required: RequiredDocument[] }) {
  return (
    <ul className="mt-8 border-b border-line">
      {required.map((r) => {
        const doc = docs.find((d) => d.documentType === r.key);
        return (
          <li key={r.key} className="grid gap-4 border-t border-line py-5 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-semibold text-navy">{r.label}</span>
                {r.isRequired ? (
                  doc ? <StatusTag tone="success">Déposée</StatusTag> : <StatusTag tone="warning">Obligatoire</StatusTag>
                ) : (
                  <StatusTag tone="neutral">Facultative</StatusTag>
                )}
              </p>
              {r.help && <p className="mt-1 text-[0.88rem] text-muted">{r.help}</p>}
              {doc && (
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <FileChip name={doc.fileName} size={doc.sizeBytes} />
                  <form action={deleteDocument}>
                    <input type="hidden" name="document_id" value={doc.id} />
                    <input type="hidden" name="application_id" value={app.id} />
                    <button type="submit" className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-muted hover:text-red-700">
                      <Trash2 aria-hidden className="size-3.5" /> Retirer
                    </button>
                  </form>
                </div>
              )}
            </div>
            <DocumentUploader applicationId={app.id} userId={userId} documentType={r.key} accept={r.acceptedMime} hasFile={Boolean(doc)} />
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Récapitulatif (vérification et suivi)
// ---------------------------------------------------------------------------
function Summary({ app, docs, required, editable }: { app: Application; docs: AppDocument[]; required: RequiredDocument[]; editable?: boolean }) {
  const entries = fieldsFor(app.applicantType)
    .map((k) => [k, app.payload[k]] as const)
    .filter(([, v]) => v !== undefined && v !== null && v !== "");
  return (
    <div className="mt-8 grid gap-10 xl:grid-cols-5">
      <div className="xl:col-span-3">
        <div className="flex items-center justify-between">
          <h3 className="label">Informations</h3>
          {editable && (
            <Link href="/espace/adhesion?etape=informations" className="text-sm font-semibold text-navy hover:text-cyan-dark">
              Modifier
            </Link>
          )}
        </div>
        <dl className="mt-3 border-t-2 border-navy">
          <div className="grid grid-cols-[minmax(8rem,40%)_1fr] gap-4 border-b border-line py-3 text-[0.92rem]">
            <dt className="text-muted">Type</dt>
            <dd className="font-semibold text-navy">{applicantTypeLabels[app.applicantType]}</dd>
          </div>
          {entries.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[minmax(8rem,40%)_1fr] gap-4 border-b border-line py-3 text-[0.92rem]">
              <dt className="text-muted">{fieldLabels[k] ?? k}</dt>
              <dd className="font-semibold break-words whitespace-pre-line text-navy">{k === "birth_date" ? formatDate(String(v)) : String(v)}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="xl:col-span-2">
        <div className="flex items-center justify-between">
          <h3 className="label">Pièces jointes</h3>
          {editable && (
            <Link href="/espace/adhesion?etape=pieces" className="text-sm font-semibold text-navy hover:text-cyan-dark">
              Modifier
            </Link>
          )}
        </div>
        <ul className="mt-3 border-t-2 border-navy">
          {required.map((r) => {
            const doc = docs.find((d) => d.documentType === r.key);
            return (
              <li key={r.key} className="border-b border-line py-3">
                <p className="text-[0.85rem] text-muted">{r.label}</p>
                {doc ? <FileChip name={doc.fileName} size={doc.sizeBytes} /> : <p className="text-[0.88rem] font-semibold text-muted">{r.isRequired ? "Manquante" : "Non fournie"}</p>}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Suivi (étape 5)
// ---------------------------------------------------------------------------
async function Tracking({ app, flash }: { app: Application; flash: boolean }) {
  const [history, docs, required] = await Promise.all([getApplicationHistory(app.id), getApplicationDocuments(app.id), getRequiredDocuments(app.applicantType)]);
  return (
    <>
      <SpaceHeader
        label={`Demande d'adhésion · ${app.reference}`}
        title="Suivi de votre dossier"
        action={<StatusTag tone={applicationTone(app.status)}>{statusLabels[app.status]}</StatusTag>}
      />
      {flash && (
        <SpaceFlash>
          Votre demande {app.reference} a bien été envoyée. Un accusé de réception figure dans vos notifications ; vous serez informé à chaque étape de l&apos;instruction.
        </SpaceFlash>
      )}
      <Stepper current="suivi" reachable={[]} />
      <div className="mt-8 grid gap-6 xl:grid-cols-5">
        <Panel className="xl:col-span-3">
          <p className="label">État actuel</p>
          <p className="mt-3 font-display text-[1.5rem] leading-tight font-bold text-navy">{statusDescriptions[app.status]}</p>
          {app.status === "rejected" && app.decisionReason && <p className="mt-4 border-l-[3px] border-red-600 pl-4 text-ink">{app.decisionReason}</p>}
          {app.status === "rejected" && (
            <Link href="/espace/adhesion?etape=type" className="btn-secondary mt-6">
              Déposer une nouvelle demande
            </Link>
          )}
          {app.submittedAt && <p className="mt-6 font-mono text-[0.75rem] text-muted">Envoyée le {formatDateTime(app.submittedAt)}</p>}
        </Panel>
        <Panel className="xl:col-span-2">
          <p className="label">Historique</p>
          <ol className="relative mt-5 ml-1.5 border-l-2 border-line">
            {history.map((h, i) => (
              <li key={h.id} className="relative pb-6 pl-6 last:pb-0">
                <span aria-hidden className={`absolute top-1 -left-[7px] size-3 rounded-full border-2 bg-white ${i === 0 ? "border-cyan" : "border-line-strong"}`} />
                <p className={`text-[0.92rem] font-semibold ${i === 0 ? "text-navy" : "text-muted"}`}>{statusLabels[h.toStatus]}</p>
                <p className="font-mono text-[0.72rem] text-muted">{formatDateTime(h.createdAt)}</p>
                {h.comment && <p className="mt-1 text-[0.85rem] text-ink">{h.comment}</p>}
              </li>
            ))}
          </ol>
        </Panel>
      </div>
      <Panel className="mt-6">
        <p className="label">Dossier envoyé</p>
        <Summary app={app} docs={docs} required={required} />
      </Panel>
    </>
  );
}

// ---------------------------------------------------------------------------
// Membre : « Mon adhésion »
// ---------------------------------------------------------------------------
async function MembershipSummary({ userId, app }: { userId: string; app: Application | null }) {
  const member = await getMyMember(userId);
  const memberships = member ? await getMyMemberships(member.id) : [];
  const current = memberships[0];
  const facts = [
    { label: "Type de membre", value: member ? applicantTypeLabels[member.memberType] : "—" },
    { label: "Numéro de membre", value: member?.memberNumber ?? "Attribution en cours" },
    { label: "Membre depuis", value: current ? formatDate(current.startsOn) : member ? formatDate(member.createdAt) : "—" },
    { label: "Statut", value: current ? { active: "Active", expired: "Expirée", suspended: "Suspendue", cancelled: "Résiliée" }[current.status] : "Active" },
    { label: "Échéance", value: current?.endsOn ? formatDate(current.endsOn) : "Sans échéance définie" },
    { label: "Catégorie", value: current?.category ?? member?.category ?? "—" },
  ];
  return (
    <>
      <SpaceHeader label="Mon adhésion" title={member?.organizationName ?? "Votre adhésion au réseau"} action={<StatusTag tone="success">Membre</StatusTag>} />
      <Panel className="mt-8">
        <dl className="grid border-t-2 border-navy sm:grid-cols-2 lg:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label} className="border-b border-line py-5 sm:pr-6">
              <dt className="label">{f.label}</dt>
              <dd className="mt-1.5 font-semibold text-navy">{f.value}</dd>
            </div>
          ))}
        </dl>
        {app && <p className="mt-6 font-mono text-[0.75rem] text-muted">Dossier d&apos;origine : {app.reference}</p>}
        <p className="mt-6 text-[0.92rem] text-muted">Pour toute modification administrative (raison sociale, type de membre, représentant), contactez le secrétariat.</p>
      </Panel>
    </>
  );
}
