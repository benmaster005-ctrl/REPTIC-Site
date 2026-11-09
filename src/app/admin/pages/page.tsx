import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requirePermission } from "@/lib/admin";
import { listPages } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";
import { AdminHeader, DataTable, StatusTag } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Pages institutionnelles" };

const publicPath: Record<string, string> = {
  presentation: "/presentation",
  "objectifs-missions": "/objectifs-missions",
  "mot-du-president": "/mot-du-president",
  "conditions-adhesion": "/adhesion",
  "mentions-legales": "/mentions-legales",
  confidentialite: "/confidentialite",
};

export default function PagesAdminPage() {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <PagesAdmin />
    </Suspense>
  );
}

async function PagesAdmin() {
  await requirePermission("content.manage");
  const pages = await listPages();
  return (
    <>
      <AdminHeader label="Contenus" title="Pages institutionnelles" description="Textes des rubriques du site. La structure (menus, adresses) est fixe ; le contenu est libre." />
      <DataTable head={["Page", "Adresse", "Statut", "Modifiée"]}>
        {pages.map((p) => (
          <tr key={p.id as string}>
            <td>
              <Link href={`/admin/pages/${p.id}`} className="font-semibold text-navy underline-offset-4 hover:text-cyan-dark hover:underline">
                {p.title as string}
              </Link>
            </td>
            <td className="font-mono text-[0.8rem] text-muted">{publicPath[p.slug as string] ?? `/${p.slug}`}</td>
            <td>
              <StatusTag tone={p.status === "published" ? "success" : "neutral"}>{p.status === "published" ? "En ligne" : "Brouillon"}</StatusTag>
            </td>
            <td className="font-mono text-[0.8rem] text-muted">{formatDate(p.updated_at as string, { day: "2-digit", month: "2-digit", year: "numeric" })}</td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
