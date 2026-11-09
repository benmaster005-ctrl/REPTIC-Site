import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePermission } from "@/lib/admin";
import { listAudit } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/format";
import { AdminHeader, DataTable, FilterBar, Pagination, listHref, pageNum, str } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Journal des opérations" };

const actionLabels: Record<string, string> = {
  "application.take": "Dossier pris en charge",
  "application.additional_info": "Complément demandé",
  "application.reject": "Demande refusée",
  "application.accept": "Adhésion acceptée",
  "member.active": "Membre réactivé",
  "member.suspended": "Membre suspendu",
  "member.archived": "Membre archivé",
  "user.role": "Rôle modifié",
  "user.enable": "Compte activé",
  "user.disable": "Compte désactivé",
  "profile.update": "Profil modifié (rôle/statut)",
  "export.members": "Export des membres",
};

const families = [
  { value: "application", label: "Demandes" },
  { value: "member", label: "Membres" },
  { value: "user", label: "Comptes et rôles" },
  { value: "export", label: "Exports" },
  { value: "news", label: "Actualités" },
  { value: "events", label: "Événements" },
  { value: "pages", label: "Pages" },
  { value: "documents", label: "Documents" },
];

function describe(action: string) {
  if (actionLabels[action]) return actionLabels[action];
  const [table, op] = action.split(".");
  const what = { news: "Actualité", events: "Événement", pages: "Page", governance_members: "Bureau", documents: "Document", memberships: "Adhésion" }[table] ?? table;
  const verb = { insert: "créé(e)", update: "modifié(e)", delete: "supprimé(e)" }[op] ?? op;
  return `${what} ${verb}`;
}

function detailText(d: Record<string, unknown>) {
  const parts = [d.reference, d.member_number, d.title, d.email, d.reason, d.count != null ? `${d.count} ligne(s)` : null];
  const pair = (x: unknown) => (x && typeof x === "object" ? (x as { from?: unknown; to?: unknown }) : null);
  const role =
    typeof d.from === "string" && typeof d.to === "string"
      ? `${d.from} → ${d.to}`
      : [pair(d.role), pair(d.status)].filter((x) => x && x.from !== x.to).map((x) => `${x!.from} → ${x!.to}`).join(", ") || null;
  return [...parts, role].filter(Boolean).join(" · ");
}

export default function AuditPage({ searchParams }: PageProps<"/admin/journal">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Audit searchParams={searchParams} />
    </Suspense>
  );
}

async function Audit({ searchParams }: Pick<PageProps<"/admin/journal">, "searchParams">) {
  await requirePermission("audit.read");
  const p = await searchParams;
  const filters = { action: str(p.action) };
  const page = pageNum(p.page);
  const { rows, total } = await listAudit({ action: filters.action, page });
  return (
    <>
      <AdminHeader label="Pilotage" title="Journal des opérations sensibles" description="Décisions, changements de rôle et de statut, exports et modifications de contenus. En lecture seule." />
      <FilterBar search={false} selects={[{ name: "action", label: "Toutes les opérations", value: filters.action, options: families }]} />
      <DataTable head={["Date", "Opération", "Détail", "Auteur"]} empty={rows.length ? undefined : "Aucune opération enregistrée."}>
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="font-mono text-[0.78rem] whitespace-nowrap text-muted">{formatDateTime(r.createdAt)}</td>
            <td className="font-semibold whitespace-nowrap text-navy">{describe(r.action)}</td>
            <td className="text-[0.85rem] text-muted">{detailText(r.details) || "—"}</td>
            <td className="whitespace-nowrap text-muted">{r.actor}</td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={page} pages={Math.ceil(total / 50)} href={(n) => listHref("/admin/journal", { ...filters, page: n > 1 ? String(n) : undefined })} />
    </>
  );
}
