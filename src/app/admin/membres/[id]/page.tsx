import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { accountStatusLabels, requirePermission, roleLabels } from "@/lib/admin";
import { getMemberDetail } from "@/lib/data/admin";
import { applicantTypeLabels, statusLabels, type ApplicationStatus } from "@/lib/membership";
import { formatDate } from "@/lib/format";
import { AdminHeader, Panel, StatusTag } from "@/components/admin/ui";
import { MemberEditForms, MemberStatusActions, RenewForm } from "@/components/admin/MemberForms";

export const metadata: Metadata = { title: "Fiche membre" };

type Row = Record<string, unknown>;
const one = (v: unknown): Row | null => (Array.isArray(v) ? ((v[0] as Row) ?? null) : ((v as Row) ?? null));
const v = (x: unknown) => (x == null ? "" : String(x));

export default function MemberDetailPage({ params }: PageProps<"/admin/membres/[id]">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: Pick<PageProps<"/admin/membres/[id]">, "params">) {
  const { can } = await requirePermission("members.read");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const m = await getMemberDetail(id);
  if (!m) notFound();

  const org = one(m.organization);
  const account = one(m.account);
  const memberships = ((m.memberships as Row[]) ?? []).sort((a, b) => String(b.starts_on).localeCompare(String(a.starts_on)));
  const name = v(org?.legal_name) || [v(m.first_name), v(m.last_name)].filter(Boolean).join(" ") || "Membre";
  const accountStatus = v(account?.status);
  const editable = can("members.manage");
  const lastEnd = v(memberships[0]?.ends_on);

  return (
    <>
      <Link href="/admin/membres" className="link-arrow mb-6">
        <ArrowLeft aria-hidden className="size-4" /> Membres
      </Link>
      <AdminHeader
        label={`${v(m.member_number) || "Sans numéro"} · ${applicantTypeLabels[m.member_type as "physical" | "legal"]}`}
        title={name}
        description={account ? `${v(account.email)} · ${roleLabels[v(account.role_key)] ?? v(account.role_key)}` : "Aucun compte rattaché"}
        action={accountStatus ? <StatusTag tone={accountStatus === "active" ? "success" : accountStatus === "suspended" ? "warning" : "neutral"}>{accountStatusLabels[accountStatus]}</StatusTag> : null}
      />

      <div className="mt-8 grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          {editable ? (
            <MemberEditForms
              memberId={id}
              member={{
                first_name: v(m.first_name),
                last_name: v(m.last_name),
                profession: v(m.profession),
                city: v(m.city),
                country: v(m.country),
                phone: v(m.phone),
                bio: v(m.bio),
                directory_visibility: v(m.directory_visibility) || "hidden",
              }}
              organization={
                org
                  ? {
                      id: v(org.id),
                      values: Object.fromEntries(
                        ["legal_name", "legal_form", "registration_number", "tax_id", "address", "city", "phone", "email", "website", "rep_first_name", "rep_last_name", "rep_title"].map((k) => [k, v(org[k])]),
                      ),
                    }
                  : null
              }
            />
          ) : (
            <Panel>
              <p className="text-muted">Consultation seule : vous n&apos;avez pas le droit de modifier les fiches.</p>
            </Panel>
          )}
        </div>

        <div className="space-y-6 xl:col-span-4">
          <Panel>
            <h2 className="label">Adhésion</h2>
            <ul className="mt-4 border-t-2 border-navy">
              {memberships.map((ms) => (
                <li key={v(ms.id)} className="border-b border-line py-3 text-[0.9rem]">
                  <p className="font-semibold text-navy">
                    {formatDate(v(ms.starts_on), { day: "2-digit", month: "2-digit", year: "numeric" })} → {ms.ends_on ? formatDate(v(ms.ends_on), { day: "2-digit", month: "2-digit", year: "numeric" }) : "sans échéance"}
                  </p>
                  <p className="font-mono text-[0.72rem] text-muted">
                    {{ active: "Active", expired: "Expirée", suspended: "Suspendue", cancelled: "Résiliée" }[v(ms.status)] ?? v(ms.status)}
                    {one(ms.category)?.name ? ` · ${v(one(ms.category)?.name)}` : ""}
                  </p>
                </li>
              ))}
              {!memberships.length && <li className="py-3 text-muted">Aucune période d&apos;adhésion.</li>}
            </ul>
            {editable && <RenewForm memberId={id} lastEnd={lastEnd} />}
          </Panel>

          {editable && account && <MemberStatusActions memberId={id} status={accountStatus} />}

          <Panel>
            <h2 className="label">Dossiers</h2>
            <ul className="mt-4 space-y-2 text-[0.9rem]">
              {m.applications.map((a) => (
                <li key={v(a.id)}>
                  <Link href={`/admin/demandes/${v(a.id)}`} className="font-mono font-semibold text-navy underline-offset-4 hover:underline">
                    {v(a.reference)}
                  </Link>{" "}
                  <span className="text-muted">· {statusLabels[v(a.status) as ApplicationStatus]}</span>
                </li>
              ))}
              {!m.applications.length && <li className="text-muted">Fiche créée sans dossier en ligne.</li>}
            </ul>
            <p className="mt-4 font-mono text-[0.72rem] text-muted">Fiche créée le {formatDate(v(m.created_at))}</p>
          </Panel>
        </div>
      </div>
    </>
  );
}
