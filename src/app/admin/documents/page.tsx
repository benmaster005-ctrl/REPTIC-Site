import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePermission } from "@/lib/admin";
import { listAssociationDocuments } from "@/lib/data/admin";
import { deleteAssociationDocument } from "@/app/actions/admin-content";
import { formatBytes } from "@/lib/membership";
import { formatDate } from "@/lib/format";
import { AdminHeader, DataTable, Panel } from "@/components/admin/ui";
import { AssociationDocumentUpload } from "@/components/admin/editors";
import { ConfirmSubmit } from "@/components/admin/forms";

export const metadata: Metadata = { title: "Documents" };

export default function DocumentsAdminPage() {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <DocumentsAdmin />
    </Suspense>
  );
}

async function DocumentsAdmin() {
  await requirePermission("documents.manage");
  const docs = await listAssociationDocuments();
  return (
    <>
      <AdminHeader label="Contenus" title="Documents de l'association" description="Statuts, règlement, comptes rendus… Stockés de façon privée, téléchargeables depuis l'espace membre par lien temporaire." />
      <Panel className="mt-8">
        <h2 className="label mb-5">Publier un document</h2>
        <AssociationDocumentUpload />
      </Panel>
      <DataTable head={["Document", "Accès", "Taille", "Publié le", ""]} empty={docs.length ? undefined : "Aucun document publié."}>
        {docs.map((d) => (
          <tr key={d.id as string}>
            <td>
              <span className="block font-semibold text-navy">{(d.title as string) ?? (d.file_name as string)}</span>
              <span className="text-[0.8rem] text-muted">{d.file_name as string}</span>
            </td>
            <td className="whitespace-nowrap text-muted">{d.visibility === "members" ? "Membres" : "Comptes connectés"}</td>
            <td className="font-mono text-[0.8rem] whitespace-nowrap text-muted">{formatBytes(Number(d.size_bytes))}</td>
            <td className="font-mono text-[0.8rem] whitespace-nowrap text-muted">{formatDate(d.created_at as string, { day: "2-digit", month: "2-digit", year: "numeric" })}</td>
            <td>
              <form action={deleteAssociationDocument}>
                <input type="hidden" name="id" value={d.id as string} />
                <ConfirmSubmit message="Supprimer ce document ? Il ne sera plus accessible aux membres." className="text-[0.85rem] font-semibold text-red-700 hover:underline">
                  Supprimer
                </ConfirmSubmit>
              </form>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
