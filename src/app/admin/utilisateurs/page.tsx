import type { Metadata } from "next";
import { Suspense } from "react";
import { accountStatusLabels, requirePermission, roleLabels } from "@/lib/admin";
import { PAGE_SIZE, listUsers } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";
import { AdminHeader, DataTable, FilterBar, Pagination, Panel, StatusTag, listHref, pageNum, str } from "@/components/admin/ui";
import { UserActiveForm, UserRoleForm } from "@/components/admin/UserForms";

export const metadata: Metadata = { title: "Utilisateurs et rôles" };

export default function UsersPage({ searchParams }: PageProps<"/admin/utilisateurs">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Users searchParams={searchParams} />
    </Suspense>
  );
}

const roleHelp = [
  ["Éditeur", "Actualités, événements, pages, bureau et chiffres clés."],
  ["Gestionnaire", "Instruction des demandes, membres, export, documents, messages, événements."],
  ["Administrateur", "Tous les droits, dont les comptes, les rôles et le journal."],
];

async function Users({ searchParams }: Pick<PageProps<"/admin/utilisateurs">, "searchParams">) {
  const { user: me } = await requirePermission("users.manage");
  const p = await searchParams;
  const filters = { q: str(p.q), role: str(p.role) };
  const page = pageNum(p.page);
  const { rows, total } = await listUsers({ q: filters.q, role: filters.role, page });

  return (
    <>
      <AdminHeader label="Paramètres" title="Utilisateurs et rôles" description="Pour donner accès à l'administration, la personne crée d'abord son compte sur le site (Créer un compte), puis vous lui attribuez un rôle ici." />
      <Panel className="mt-8">
        <h2 className="label">Rôles d&apos;équipe (moindre privilège)</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          {roleHelp.map(([r, d]) => (
            <div key={r} className="border-l-2 border-cyan pl-4">
              <dt className="font-semibold text-navy">{r}</dt>
              <dd className="mt-1 text-[0.85rem] text-muted">{d}</dd>
            </div>
          ))}
        </dl>
      </Panel>
      <FilterBar
        q={filters.q}
        placeholder="E-mail, nom…"
        selects={[{ name: "role", label: "Tous les rôles", value: filters.role, options: Object.entries(roleLabels).map(([value, label]) => ({ value, label })) }]}
      />
      <DataTable head={["Compte", "Statut", "Créé le", "Rôle", ""]} empty={rows.length ? undefined : "Aucun compte ne correspond."}>
        {rows.map((u) => {
          const isMe = u.id === me.id;
          const status = u.status as string;
          return (
            <tr key={u.id as string}>
              <td>
                <span className="block font-semibold text-navy">{[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}</span>
                <span className="text-[0.8rem] text-muted">{u.email as string}</span>
              </td>
              <td className="whitespace-nowrap">
                <StatusTag tone={status === "active" ? "success" : status === "suspended" ? "warning" : "neutral"}>{accountStatusLabels[status] ?? status}</StatusTag>
              </td>
              <td className="font-mono text-[0.8rem] whitespace-nowrap text-muted">{formatDate(u.created_at as string, { day: "2-digit", month: "2-digit", year: "numeric" })}</td>
              <td>
                <UserRoleForm userId={u.id as string} role={u.role_key as string} disabled={isMe} />
              </td>
              <td>
                <UserActiveForm userId={u.id as string} active={status === "active"} disabled={isMe} />
              </td>
            </tr>
          );
        })}
      </DataTable>
      <Pagination page={page} pages={Math.ceil(total / PAGE_SIZE)} href={(n) => listHref("/admin/utilisateurs", { ...filters, page: n > 1 ? String(n) : undefined })} />
    </>
  );
}
