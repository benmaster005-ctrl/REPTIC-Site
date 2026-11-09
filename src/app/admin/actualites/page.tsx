import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { contentStatus, requirePermission } from "@/lib/admin";
import { PAGE_SIZE, listNews } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";
import { AdminHeader, DataTable, FilterBar, Flash, Pagination, StatusTag, listHref, pageNum, str } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Actualités" };


export default function NewsAdminPage({ searchParams }: PageProps<"/admin/actualites">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <NewsAdmin searchParams={searchParams} />
    </Suspense>
  );
}

async function NewsAdmin({ searchParams }: Pick<PageProps<"/admin/actualites">, "searchParams">) {
  await requirePermission("content.manage");
  const p = await searchParams;
  const filters = { q: str(p.q), statut: str(p.statut) };
  const page = pageNum(p.page);
  const { rows, total } = await listNews({ q: filters.q, status: filters.statut, page });
  return (
    <>
      <AdminHeader
        label="Contenus"
        title="Actualités"
        description={`${total} article${total > 1 ? "s" : ""}.`}
        action={
          <Link href="/admin/actualites/nouveau" className="btn-primary">
            <Plus aria-hidden className="size-4" /> Nouvelle actualité
          </Link>
        }
      />
      {p.supprime === "1" && <Flash>Actualité supprimée.</Flash>}
      <FilterBar q={filters.q} placeholder="Titre…" selects={[{ name: "statut", label: "Tous les statuts", value: filters.statut, options: Object.entries(contentStatus).map(([value, v]) => ({ value, label: v.label })) }]} />
      <DataTable head={["Titre", "Statut", "Accès", "Date", "Modifiée"]} empty={rows.length ? undefined : "Aucune actualité."}>
        {rows.map((n) => {
          const st = contentStatus[n.status as string] ?? contentStatus.draft;
          return (
            <tr key={n.id as string}>
              <td>
                <Link href={`/admin/actualites/${n.id}`} className="font-semibold text-navy underline-offset-4 hover:text-cyan-dark hover:underline">
                  {n.title as string}
                </Link>
              </td>
              <td className="whitespace-nowrap">
                <StatusTag tone={st.tone}>{st.label}</StatusTag>
              </td>
              <td className="whitespace-nowrap text-muted">{n.visibility === "members" ? "Membres" : "Public"}</td>
              <td className="font-mono text-[0.8rem] whitespace-nowrap text-muted">{n.published_at ? formatDate(n.published_at as string, { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}</td>
              <td className="font-mono text-[0.8rem] whitespace-nowrap text-muted">{formatDate(n.updated_at as string, { day: "2-digit", month: "2-digit", year: "numeric" })}</td>
            </tr>
          );
        })}
      </DataTable>
      <Pagination page={page} pages={Math.ceil(total / PAGE_SIZE)} href={(n) => listHref("/admin/actualites", { ...filters, page: n > 1 ? String(n) : undefined })} />
    </>
  );
}
