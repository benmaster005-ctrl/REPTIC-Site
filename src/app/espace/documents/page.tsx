import type { Metadata } from "next";
import { Suspense } from "react";
import { Download } from "lucide-react";
import { getSpaceContext } from "@/lib/space";
import { getMyDocuments, type AppDocument } from "@/lib/data/member";
import { downloadDocument } from "@/app/actions/member";
import { formatBytes } from "@/lib/membership";
import { formatDate } from "@/lib/format";
import { MembersOnly, Panel, SpaceFlash, SpaceHeader } from "@/components/space/ui";

export const metadata: Metadata = { title: "Mes documents" };

export default function DocumentsPage({ searchParams }: PageProps<"/espace/documents">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Documents searchParams={searchParams} />
    </Suspense>
  );
}

function DocumentTable({ items, empty }: { items: AppDocument[]; empty: string }) {
  if (!items.length) return <p className="mt-4 text-[0.92rem] text-muted">{empty}</p>;
  return (
    <ul className="mt-4 border-t-2 border-navy">
      {items.map((d) => (
        <li key={d.id} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-line py-4">
          <div className="min-w-0">
            <p className="truncate font-semibold text-navy">{d.title ?? d.fileName}</p>
            <p className="mt-0.5 font-mono text-[0.72rem] text-muted">
              {formatDate(d.createdAt, { day: "2-digit", month: "2-digit", year: "numeric" })} · {formatBytes(d.sizeBytes)} · {d.mimeType.split("/")[1]?.toUpperCase()}
            </p>
          </div>
          <form action={downloadDocument}>
            <input type="hidden" name="document_id" value={d.id} />
            <button type="submit" className="btn-secondary px-3.5 py-2 text-[0.85rem]" aria-label={`Télécharger ${d.title ?? d.fileName}`}>
              <Download aria-hidden className="size-4" /> <span className="hidden sm:inline">Télécharger</span>
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}

async function Documents({ searchParams }: Pick<PageProps<"/espace/documents">, "searchParams">) {
  const { user, isMember } = await getSpaceContext("/espace/documents");
  if (!isMember) return (<><SpaceHeader label="Mes documents" title="Documents" /><MembersOnly feature="Les documents" /></>);
  const [{ erreur }, { personal, shared }] = await Promise.all([searchParams, getMyDocuments(user.id)]);
  return (
    <>
      <SpaceHeader label="Mes documents" title="Documents" description="Les liens de téléchargement sont personnels et expirent au bout d'une minute." />
      {erreur && <SpaceFlash tone="error">Ce document n&apos;est pas accessible ou le lien n&apos;a pas pu être créé.</SpaceFlash>}
      <Panel className="mt-8">
        <h2 className="font-display text-xl font-bold text-navy">Documents de l&apos;association</h2>
        <DocumentTable items={shared} empty="Aucun document partagé pour le moment." />
      </Panel>
      <Panel className="mt-6">
        <h2 className="font-display text-xl font-bold text-navy">Mes pièces</h2>
        <DocumentTable items={personal} empty="Aucune pièce déposée." />
      </Panel>
    </>
  );
}
