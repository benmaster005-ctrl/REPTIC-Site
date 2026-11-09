import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { requirePermission } from "@/lib/admin";
import { PAGE_SIZE, listEvents } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/format";
import { AdminHeader, DataTable, FilterBar, Flash, Pagination, StatusTag, listHref, pageNum, str } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Événements" };

export default function EventsAdminPage({ searchParams }: PageProps<"/admin/evenements">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <EventsAdmin searchParams={searchParams} />
    </Suspense>
  );
}

async function EventsAdmin({ searchParams }: Pick<PageProps<"/admin/evenements">, "searchParams">) {
  await requirePermission("events.manage");
  const p = await searchParams;
  const filters = { q: str(p.q) };
  const page = pageNum(p.page);
  const { rows, total } = await listEvents({ q: filters.q, page });
  return (
    <>
      <AdminHeader
        label="Contenus"
        title="Événements"
        description={`${total} événement${total > 1 ? "s" : ""}.`}
        action={
          <Link href="/admin/evenements/nouveau" className="btn-primary">
            <Plus aria-hidden className="size-4" /> Nouvel événement
          </Link>
        }
      />
      {p.supprime === "1" && <Flash>Événement supprimé.</Flash>}
      <FilterBar q={filters.q} placeholder="Intitulé…" />
      <DataTable head={["Intitulé", "Date", "Statut", "Accès", "Inscrits"]} empty={rows.length ? undefined : "Aucun événement."}>
        {rows.map((e) => {
          const regs = ((e.event_registrations as { status: string }[]) ?? []).filter((r) => r.status === "registered" || r.status === "attended").length;
          return (
            <tr key={e.id as string}>
              <td>
                <Link href={`/admin/evenements/${e.id}`} className="font-semibold text-navy underline-offset-4 hover:text-cyan-dark hover:underline">
                  {e.title as string}
                </Link>
                {e.city ? <span className="block text-[0.8rem] text-muted">{e.city as string}</span> : null}
              </td>
              <td className="font-mono text-[0.8rem] whitespace-nowrap text-muted">{formatDateTime(e.starts_at as string)}</td>
              <td className="whitespace-nowrap">
                <StatusTag tone={e.status === "published" ? "success" : e.status === "archived" ? "warning" : "neutral"}>{e.status === "published" ? "Publié" : e.status === "archived" ? "Archivé" : "Brouillon"}</StatusTag>
              </td>
              <td className="whitespace-nowrap text-muted">{e.visibility === "members" ? "Membres" : "Public"}</td>
              <td className="font-mono text-[0.8rem] whitespace-nowrap">
                {e.registration_enabled ? `${regs}${e.capacity ? ` / ${e.capacity}` : ""}` : <span className="text-muted">—</span>}
              </td>
            </tr>
          );
        })}
      </DataTable>
      <Pagination page={page} pages={Math.ceil(total / PAGE_SIZE)} href={(n) => listHref("/admin/evenements", { ...filters, page: n > 1 ? String(n) : undefined })} />
    </>
  );
}
