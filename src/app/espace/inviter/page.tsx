import type { Metadata } from "next";
import { Suspense } from "react";
import { getSpaceContext } from "@/lib/space";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { MembersOnly, Panel, SpaceHeader, StatusTag } from "@/components/space/ui";
import { InviteForm } from "@/components/space/InviteForm";

export const metadata: Metadata = { title: "Inviter" };

export default function InvitePage() {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Invite />
    </Suspense>
  );
}

async function Invite() {
  const { user, isMember } = await getSpaceContext("/espace/inviter");
  if (!isMember) return (<><SpaceHeader label="Inviter" title="Faire grandir le réseau" /><MembersOnly feature="Les invitations" /></>);
  const supabase = await createClient();
  const { data, error } = await supabase.from("invitations").select("id,email,created_at,accepted_at").eq("inviter_id", user.id).order("created_at", { ascending: false }).limit(50);
  const invitations = data ?? [];
  const accepted = invitations.filter((i) => i.accepted_at).length;

  return (
    <>
      <SpaceHeader
        label="Inviter"
        title="Faire grandir le réseau"
        description="Invitez des entreprises ou des professionnels du numérique à rejoindre le REPTIC.CM. Ils reçoivent un e-mail à votre nom avec un lien vers la demande d'adhésion."
      />
      <div className="mt-8 grid gap-6 xl:grid-cols-12">
        <Panel className="xl:col-span-7">
          <h2 className="font-display text-xl font-bold text-navy">Envoyer une invitation</h2>
          <p className="mt-1 mb-6 text-[0.9rem] text-muted">10 invitations par jour au maximum. Une même adresse ne peut être invitée qu&apos;une fois par semaine.</p>
          {error ? <p className="text-muted">Fonction indisponible : la migration du bloc 2 n&apos;est pas encore appliquée.</p> : <InviteForm />}
        </Panel>
        <Panel className="xl:col-span-5">
          <div className="flex items-baseline justify-between">
            <h2 className="label">Mes invitations</h2>
            {invitations.length > 0 && (
              <p className="font-mono text-[0.75rem] text-muted">
                {accepted}/{invitations.length} inscrite{accepted > 1 ? "s" : ""}
              </p>
            )}
          </div>
          {invitations.length ? (
            <ul className="mt-4 border-t-2 border-navy">
              {invitations.map((i) => (
                <li key={i.id as string} className="flex items-center justify-between gap-3 border-b border-line py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-[0.92rem] font-semibold text-navy">{i.email as string}</span>
                    <span className="font-mono text-[0.72rem] text-muted">{formatDate(i.created_at as string, { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                  </span>
                  <StatusTag tone={i.accepted_at ? "success" : "neutral"}>{i.accepted_at ? "Inscrite" : "Envoyée"}</StatusTag>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[0.92rem] text-muted">Vous n&apos;avez encore invité personne.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
