import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requirePermission } from "@/lib/admin";
import { PAGE_SIZE, listApplications } from "@/lib/data/admin";
import { applicantTypeLabels, statusLabels, type ApplicationStatus } from "@/lib/membership";
import { formatDate } from "@/lib/format";
import { applicationTone } from "@/components/space/application";
import { AdminHeader, DataTable, FilterBar, Pagination, StatusTag, listHref, pageNum, str } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Demandes d'adhésion" };

const statusOptions = [
  { value: "open", label: "À traiter (soumises + en examen)" },
  ...(["submitted", "under_review", "additional_info", "accepted", "rejected", "draft"] as ApplicationStatus[]).map((s) => ({ value: s, label: statusLabels[s] })),
];

export default function ApplicationsPage({ searchParams }: PageProps<"/admin/demandes">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Applications searchParams={searchParams} />
    </Suspense>
  );
}

async function Applications({ searchParams }: Pick<PageProps<"/admin/demandes">, "searchParams">) {
  await requirePermission("applications.read");
  const p = await searchParams;
  const filters = { q: str(p.q), statut: str(p.statut), type: str(p.type) };
  const page = pageNum(p.page);
  const { rows, total } = await listApplications({ status: filters.statut, type: filters.type, q: filters.q, page });

  return (
    <>
      <AdminHeader label="Adhésions" title="Demandes d'adhésion" description={`${total} dossier${total > 1 ? "s" : ""}${filters.statut || filters.type || filters.q ? " pour ces filtres" : " envoyés"}.`} />
      <FilterBar
        q={filters.q}
        placeholder="Référence, nom, raison sociale…"
        selects={[
          { name: "statut", label: "Tous les statuts", value: filters.statut, options: statusOptions },
          { name: "type", label: "Tous les types", value: filters.type, options: [{ value: "physical", label: "Personne physique" }, { value: "legal", label: "Personne morale" }] },
        ]}
      />
      <DataTable head={["Référence", "Candidat", "Type", "Statut", "Envoyée le", "Suivi par"]} empty={rows.length ? undefined : "Aucun dossier ne correspond."}>
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="font-mono text-[0.8rem] whitespace-nowrap">
              <Link href={`/admin/demandes/${r.id}`} className="font-semibold text-navy underline-offset-4 hover:text-cyan-dark hover:underline">
                {r.reference}
              </Link>
            </td>
            <td>
              <span className="block font-semibold text-navy">{r.applicant}</span>
              {r.email && <span className="text-[0.8rem] text-muted">{r.email}</span>}
            </td>
            <td className="whitespace-nowrap text-muted">{applicantTypeLabels[r.type]}</td>
            <td className="whitespace-nowrap">
              <StatusTag tone={applicationTone(r.status)}>{statusLabels[r.status]}</StatusTag>
            </td>
            <td className="font-mono text-[0.8rem] whitespace-nowrap text-muted">{r.submittedAt ? formatDate(r.submittedAt, { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}</td>
            <td className="text-muted">{r.assignee ?? "—"}</td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={page} pages={Math.ceil(total / PAGE_SIZE)} href={(n) => listHref("/admin/demandes", { ...filters, page: n > 1 ? String(n) : undefined })} />
    </>
  );
}
