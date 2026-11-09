import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Download } from "lucide-react";
import { accountStatusLabels, requirePermission } from "@/lib/admin";
import { PAGE_SIZE, listMembers } from "@/lib/data/admin";
import { applicantTypeLabels } from "@/lib/membership";
import { formatDate } from "@/lib/format";
import { AdminHeader, DataTable, FilterBar, Pagination, StatusTag, listHref, pageNum, str } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Membres" };

const tone = (s: string | null) => (s === "active" ? "success" : s === "suspended" ? "warning" : s === "archived" ? "neutral" : "info");

export default function MembersPage({ searchParams }: PageProps<"/admin/membres">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Members searchParams={searchParams} />
    </Suspense>
  );
}

async function Members({ searchParams }: Pick<PageProps<"/admin/membres">, "searchParams">) {
  const { can } = await requirePermission("members.read");
  const p = await searchParams;
  const filters = { q: str(p.q), type: str(p.type), statut: str(p.statut) };
  const page = pageNum(p.page);
  const { rows, total } = await listMembers({ q: filters.q, type: filters.type, status: filters.statut, page });

  return (
    <>
      <AdminHeader
        label="Adhésions"
        title="Membres"
        description={`${total} membre${total > 1 ? "s" : ""}${filters.q || filters.type || filters.statut ? " pour ces filtres" : ""}.`}
        action={
          can("members.export") ? (
            <a href={listHref("/admin/membres/export", filters)} className="btn-secondary" download>
              <Download aria-hidden className="size-4" /> Exporter (Excel)
            </a>
          ) : null
        }
      />
      <FilterBar
        q={filters.q}
        placeholder="Numéro, nom, ville, profession…"
        selects={[
          { name: "type", label: "Tous les types", value: filters.type, options: [{ value: "physical", label: "Personne physique" }, { value: "legal", label: "Personne morale" }] },
          { name: "statut", label: "Tous les statuts", value: filters.statut, options: ["active", "suspended", "archived"].map((s) => ({ value: s, label: accountStatusLabels[s] })) },
        ]}
      />
      <DataTable head={["Numéro", "Membre", "Type", "Ville", "Statut", "Fin d'adhésion"]} empty={rows.length ? undefined : "Aucun membre ne correspond."}>
        {rows.map((m) => (
          <tr key={m.id}>
            <td className="font-mono text-[0.8rem] whitespace-nowrap">{m.number ?? "—"}</td>
            <td>
              <Link href={`/admin/membres/${m.id}`} className="font-semibold text-navy underline-offset-4 hover:text-cyan-dark hover:underline">
                {m.name}
              </Link>
              {m.email && <span className="block text-[0.8rem] text-muted">{m.email}</span>}
            </td>
            <td className="whitespace-nowrap text-muted">{applicantTypeLabels[m.type]}</td>
            <td className="text-muted">{m.city ?? "—"}</td>
            <td className="whitespace-nowrap">
              <StatusTag tone={tone(m.accountStatus)}>{m.accountStatus ? accountStatusLabels[m.accountStatus] : "Sans compte"}</StatusTag>
            </td>
            <td className="font-mono text-[0.8rem] whitespace-nowrap text-muted">{m.membershipEnds ? formatDate(m.membershipEnds, { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}</td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={page} pages={Math.ceil(total / PAGE_SIZE)} href={(n) => listHref("/admin/membres", { ...filters, page: n > 1 ? String(n) : undefined })} />
    </>
  );
}
