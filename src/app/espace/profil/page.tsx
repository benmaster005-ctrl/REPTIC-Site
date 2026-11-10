import type { Metadata } from "next";
import { Suspense } from "react";
import { getSpaceContext } from "@/lib/space";
import { getMyMember } from "@/lib/data/member";
import { applicantTypeLabels } from "@/lib/membership";
import { Panel, SpaceHeader } from "@/components/space/ui";
import { AccountForm, MemberProfileForm } from "@/components/space/AccountForms";
import { EmailPreferencesForm } from "@/components/space/InviteForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mon profil" };

export default function ProfilePage() {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Profile />
    </Suspense>
  );
}

async function Profile() {
  const { user, isMember } = await getSpaceContext("/espace/profil");
  const member = isMember ? await getMyMember(user.id) : null;
  const supabase = await createClient();
  const { data: prefs } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const emailPublications = (prefs as { email_publications?: boolean } | null)?.email_publications ?? true;
  return (
    <>
      <SpaceHeader label="Mon profil" title="Informations personnelles" description="Les changements sensibles (identité légale, raison sociale, type de membre) passent par le secrétariat." />
      <Panel className="mt-8">
        <h2 className="font-display text-xl font-bold text-navy">Compte</h2>
        <dl className="mt-4 mb-8 grid gap-x-8 gap-y-1 text-[0.92rem] sm:grid-cols-[auto_1fr]">
          <dt className="text-muted">Identifiant</dt>
          <dd className="font-semibold break-all text-navy">{user.email}</dd>
        </dl>
        <AccountForm initial={{ first_name: user.firstName ?? "", last_name: user.lastName ?? "", phone: user.phone ?? "" }} />
      </Panel>

      {isMember && (
        <Panel className="mt-6">
          <h2 className="font-display text-xl font-bold text-navy">Préférences e-mail</h2>
          <div className="mt-5">
            <EmailPreferencesForm enabled={emailPublications} />
          </div>
        </Panel>
      )}

      {member && (
        <Panel className="mt-6">
          <h2 className="font-display text-xl font-bold text-navy">Fiche membre</h2>
          <p className="mt-1 mb-8 text-[0.92rem] text-muted">
            {applicantTypeLabels[member.memberType]}
            {member.organizationName ? ` · ${member.organizationName}` : ""}
            {member.memberNumber ? ` · n° ${member.memberNumber}` : ""}
          </p>
          <MemberProfileForm
            initial={{
              profession: member.profession ?? "",
              city: member.city ?? "",
              phone: member.phone ?? "",
              bio: member.bio ?? "",
              directory_visibility: member.directoryVisibility ?? "hidden",
            }}
          />
        </Panel>
      )}
    </>
  );
}
