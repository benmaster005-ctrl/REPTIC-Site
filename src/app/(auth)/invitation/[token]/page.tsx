import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/actions/auth";
import { acceptRoleInvitation } from "@/app/actions/invitations";
import { ActionForm } from "@/components/admin/forms";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Invitation à l'équipe",
  robots: { index: false, follow: false },
};

/**
 * Page d'arrivée du lien reçu par e-mail : la personne crée son compte ou se
 * connecte (avec l'adresse invitée), puis accepte l'invitation et reçoit son rôle.
 */
export default function InvitationPage({ params }: PageProps<"/invitation/[token]">) {
  return (
    <Suspense fallback={<div aria-busy className="h-64 animate-pulse rounded-xl bg-surface" />}>
      <Invitation params={params} />
    </Suspense>
  );
}

const stateMessages: Record<string, { title: string; text: string }> = {
  invalid: { title: "Lien invalide", text: "Ce lien d'invitation n'existe pas. Vérifiez que vous l'avez copié en entier, ou demandez une nouvelle invitation." },
  revoked: { title: "Invitation annulée", text: "Cette invitation a été annulée par un administrateur. Demandez-en une nouvelle si besoin." },
  used: { title: "Invitation déjà utilisée", text: "Cette invitation a déjà été acceptée. Connectez-vous pour accéder à votre espace." },
  expired: { title: "Invitation expirée", text: "Le délai de validité de cette invitation est dépassé. Demandez à l'administrateur de vous en envoyer une nouvelle." },
};

async function Invitation({ params }: Pick<PageProps<"/invitation/[token]">, "params">) {
  const { token } = await params;
  const valid = /^[0-9a-f]{48}$/.test(token);
  const supabase = await createClient();
  const { data } = valid ? await supabase.rpc("role_invitation_info", { p_token: token }) : { data: null };
  const info = (Array.isArray(data) ? data[0] : data) as { role_label: string | null; state: string } | null;
  const state = info?.state ?? "invalid";
  const here = `/invitation/${token}`;

  if (state !== "valid") {
    const m = stateMessages[state] ?? stateMessages.invalid;
    return (
      <>
        <p className="label text-cyan-dark">Invitation</p>
        <h1 className="heading-md mt-3">{m.title}</h1>
        <p className="mt-2 text-muted">{m.text}</p>
        <Link href="/connexion" className="btn-primary mt-8 w-full justify-center">
          Se connecter
        </Link>
      </>
    );
  }

  const user = await getCurrentUser();
  const role = info?.role_label ?? "membre de l'équipe";

  return (
    <>
      <p className="label text-cyan-dark">Invitation à l&apos;équipe</p>
      <h1 className="heading-md mt-3">Rejoignez l&apos;équipe du REPTIC.CM</h1>
      <p className="mt-2 text-muted">
        Vous êtes invité à accéder à l&apos;administration du site en tant que <strong className="text-heading">{role}</strong>.
      </p>

      {user ? (
        <div className="mt-8">
          <p className="text-sm text-muted">
            Connecté en tant que <strong className="text-heading">{user.email}</strong>.
          </p>
          <ActionForm action={acceptRoleInvitation} hidden={{ token }} submitLabel="Accepter l'invitation" pendingLabel="Validation…" className="mt-4 grid gap-4 [&_button]:w-full [&_button]:justify-center" />
          <form action={signOut} className="mt-6 text-center text-sm text-muted">
            <input type="hidden" name="suite" value={here} />
            Ce n&apos;est pas l&apos;adresse invitée ?{" "}
            <button type="submit" className="font-semibold text-heading underline underline-offset-4 hover:text-cyan-dark">
              Changer de compte
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-8 grid gap-3">
          <p className="text-sm text-muted">Utilisez l&apos;adresse e-mail à laquelle vous avez reçu cette invitation.</p>
          <Link href={`/inscription?suite=${encodeURIComponent(here)}`} className="btn-primary w-full justify-center">
            Créer mon compte
          </Link>
          <Link href={`/connexion?suite=${encodeURIComponent(here)}`} className="btn-secondary w-full justify-center">
            J&apos;ai déjà un compte : me connecter
          </Link>
        </div>
      )}
    </>
  );
}
