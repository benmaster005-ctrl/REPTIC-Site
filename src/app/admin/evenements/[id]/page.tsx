import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { requirePermission } from "@/lib/admin";
import { getCategoriesOf, getEventById } from "@/lib/data/admin";
import { deleteEvent, setRegistrationStatus } from "@/app/actions/admin-content";
import { toLocalInput } from "@/lib/datetime";
import { formatDateTime } from "@/lib/format";
import { AdminHeader, DataTable, Flash, Panel } from "@/components/admin/ui";
import { EventForm } from "@/components/admin/ContentForms";
import { ConfirmSubmit } from "@/components/admin/forms";

export const metadata: Metadata = { title: "Modifier un événement" };

const v = (x: unknown) => (x == null ? "" : String(x));
const regLabels: Record<string, string> = { registered: "Inscrit", waitlisted: "Liste d'attente", cancelled: "Annulé", attended: "Présent" };

export default function EditEventPage({ params, searchParams }: PageProps<"/admin/evenements/[id]">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <EditEvent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditEvent({ params, searchParams }: Pick<PageProps<"/admin/evenements/[id]">, "params" | "searchParams">) {
  await requirePermission("events.manage");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [data, categories] = await Promise.all([getEventById(id), getCategoriesOf("event")]);
  if (!data) notFound();
  const e = data.event;
  const initial = Object.fromEntries(
    ["title", "slug", "excerpt", "body", "category_id", "location_name", "address", "city", "online_url", "status", "visibility", "capacity", "cover_path"].map((k) => [k, v(e[k])]),
  );
  initial.starts_at = toLocalInput(v(e.starts_at));
  initial.ends_at = toLocalInput(v(e.ends_at));
  initial.registration_deadline = toLocalInput(v(e.registration_deadline));
  initial.registration_enabled = e.registration_enabled ? "on" : "";
  const active = data.registrations.filter((r) => r.status === "registered" || r.status === "attended").length;

  return (
    <>
      <Link href="/admin/evenements" className="link-arrow mb-6">
        <ArrowLeft aria-hidden className="size-4" /> Événements
      </Link>
      <AdminHeader
        label="Contenus · Événement"
        title={v(e.title)}
        description={formatDateTime(v(e.starts_at))}
        action={
          e.status === "published" ? (
            <a href={`/evenements/${v(e.slug)}`} target="_blank" rel="noopener" className="link-arrow">
              Voir <ArrowUpRight aria-hidden className="size-4" />
            </a>
          ) : null
        }
      />
      {sp.enregistre === "1" && <Flash>Événement créé.</Flash>}
      <div className="mt-8">
        <EventForm id={id} initial={initial} categories={categories} />
      </div>

      <Panel className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-navy">Inscriptions</h2>
          <p className="font-mono text-[0.8rem] text-muted">
            {active} inscrit{active > 1 ? "s" : ""}
            {e.capacity ? ` sur ${v(e.capacity)} places` : ""}
          </p>
        </div>
        <DataTable head={["Participant", "Contact", "Statut", "Date", ""]} empty={data.registrations.length ? undefined : "Aucune inscription."}>
          {data.registrations.map((r) => (
            <tr key={v(r.id)}>
              <td className="font-semibold text-navy">
                {v(r.full_name)}
                {r.organization ? <span className="block text-[0.8rem] font-normal text-muted">{v(r.organization)}</span> : null}
              </td>
              <td className="text-muted">
                {v(r.email)}
                {r.phone ? <span className="block text-[0.8rem]">{v(r.phone)}</span> : null}
              </td>
              <td className="whitespace-nowrap">{regLabels[v(r.status)] ?? v(r.status)}</td>
              <td className="font-mono text-[0.8rem] whitespace-nowrap text-muted">{formatDateTime(v(r.created_at))}</td>
              <td className="whitespace-nowrap">
                <form action={setRegistrationStatus} className="flex gap-2">
                  <input type="hidden" name="registration_id" value={v(r.id)} />
                  {r.status !== "attended" && r.status !== "cancelled" && (
                    <button type="submit" name="status" value="attended" className="text-[0.8rem] font-semibold text-navy hover:text-cyan-dark">
                      Présent
                    </button>
                  )}
                  {r.status === "waitlisted" && (
                    <button type="submit" name="status" value="registered" className="text-[0.8rem] font-semibold text-navy hover:text-cyan-dark">
                      Confirmer
                    </button>
                  )}
                  {r.status !== "cancelled" && (
                    <button type="submit" name="status" value="cancelled" className="text-[0.8rem] font-semibold text-red-700 hover:underline">
                      Annuler
                    </button>
                  )}
                </form>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <form action={deleteEvent} className="mt-10 border-t border-line pt-6">
        <input type="hidden" name="id" value={id} />
        <ConfirmSubmit message="Supprimer définitivement cet événement et ses inscriptions ?" className="text-sm font-semibold text-red-700 hover:underline">
          Supprimer l&apos;événement
        </ConfirmSubmit>
      </form>
    </>
  );
}
