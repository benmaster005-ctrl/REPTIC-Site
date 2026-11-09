import type { Metadata } from "next";
import { Suspense } from "react";
import { getSpaceContext } from "@/lib/space";
import { signOutEverywhere, signOutOthers } from "@/app/actions/member";
import { Panel, SpaceFlash, SpaceHeader } from "@/components/space/ui";
import { PasswordForm } from "@/components/space/AccountForms";

export const metadata: Metadata = { title: "Sécurité" };

export default function SecurityPage({ searchParams }: PageProps<"/espace/securite">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Security searchParams={searchParams} />
    </Suspense>
  );
}

async function Security({ searchParams }: Pick<PageProps<"/espace/securite">, "searchParams">) {
  await getSpaceContext("/espace/securite");
  const { autres } = await searchParams;
  return (
    <>
      <SpaceHeader label="Sécurité" title="Mot de passe et sessions" />
      {autres === "1" && <SpaceFlash>Les autres sessions ont été fermées. Cet appareil reste connecté.</SpaceFlash>}
      <Panel className="mt-8">
        <h2 className="font-display text-xl font-bold text-navy">Modifier le mot de passe</h2>
        <p className="mt-1 mb-8 text-[0.92rem] text-muted">Choisissez un mot de passe que vous n&apos;utilisez sur aucun autre site.</p>
        <PasswordForm />
      </Panel>
      <Panel className="mt-6">
        <h2 className="font-display text-xl font-bold text-navy">Sessions</h2>
        <p className="mt-1 text-[0.92rem] text-muted">Un appareil perdu ou partagé ? Fermez les sessions ouvertes ailleurs.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <form action={signOutOthers}>
            <button type="submit" className="btn-secondary">
              Déconnecter les autres appareils
            </button>
          </form>
          <form action={signOutEverywhere}>
            <button type="submit" className="btn border border-red-700 text-red-700 hover:bg-red-700 hover:text-white">
              Déconnecter partout
            </button>
          </form>
        </div>
      </Panel>
    </>
  );
}
