import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePermission } from "@/lib/admin";
import { getInstitution } from "@/lib/data/admin";
import { deleteGovernanceMember, deleteKeyFigure } from "@/app/actions/admin-content";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { FigureForm, GovernanceForm } from "@/components/admin/ContentForms";
import { ConfirmSubmit } from "@/components/admin/forms";

export const metadata: Metadata = { title: "Bureau et chiffres clés" };

const v = (x: unknown) => (x == null ? "" : String(x));

export default function InstitutionPage() {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Institution />
    </Suspense>
  );
}

async function Institution() {
  await requirePermission("content.manage");
  const { governance, figures } = await getInstitution();
  return (
    <>
      <AdminHeader label="Contenus" title="Bureau exécutif et chiffres clés" description="Publiés sur les pages Bureau exécutif et Accueil. Ne publiez que les informations autorisées par les personnes concernées." />

      <Panel className="mt-8">
        <h2 className="font-display text-xl font-bold text-navy">Bureau exécutif</h2>
        <ul className="mt-6 space-y-8">
          {governance.map((g) => (
            <li key={v(g.id)} className="border-t-2 border-navy pt-6">
              <GovernanceForm
                id={v(g.id)}
                initial={{ ...Object.fromEntries(["full_name", "position_title", "organization", "bio", "photo_path", "sort_order"].map((k) => [k, v(g[k])])), is_published: g.is_published ? "on" : "" }}
              />
              <form action={deleteGovernanceMember} className="mt-3">
                <input type="hidden" name="id" value={v(g.id)} />
                <ConfirmSubmit message={`Retirer ${v(g.full_name)} du bureau ?`} className="text-[0.85rem] font-semibold text-red-700 hover:underline">
                  Retirer
                </ConfirmSubmit>
              </form>
            </li>
          ))}
        </ul>
        <div className="mt-10 border-t border-dashed border-line-strong pt-6">
          <h3 className="label mb-4">Ajouter un membre du bureau</h3>
          <GovernanceForm initial={{ sort_order: String(governance.length + 1), is_published: "on" }} />
        </div>
      </Panel>

      <Panel className="mt-6">
        <h2 className="font-display text-xl font-bold text-navy">Chiffres clés</h2>
        <p className="mt-1 text-[0.92rem] text-muted">Affichés sur l&apos;accueil. Un nombre suivi de « + » est animé à l&apos;affichage.</p>
        <ul className="mt-6 space-y-4">
          {figures.map((f) => (
            <li key={v(f.id)} className="flex flex-wrap items-end gap-4 border-t border-line pt-4">
              <div className="flex-1">
                <FigureForm id={v(f.id)} initial={{ label: v(f.label), value: v(f.value), sort_order: v(f.sort_order), is_published: f.is_published ? "on" : "" }} />
              </div>
              <form action={deleteKeyFigure} className="pb-3">
                <input type="hidden" name="id" value={v(f.id)} />
                <ConfirmSubmit message="Supprimer ce chiffre ?" className="text-[0.85rem] font-semibold text-red-700 hover:underline">
                  Supprimer
                </ConfirmSubmit>
              </form>
            </li>
          ))}
        </ul>
        <div className="mt-8 border-t border-dashed border-line-strong pt-6">
          <h3 className="label mb-4">Ajouter un chiffre</h3>
          <FigureForm initial={{ sort_order: String(figures.length + 1), is_published: "on" }} />
        </div>
      </Panel>
    </>
  );
}
