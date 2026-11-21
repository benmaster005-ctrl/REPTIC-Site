"use client";

import { useRef, useState } from "react";
import { Check, Copy, UserPlus, X } from "lucide-react";
import { createRoleInvitation, revokeRoleInvitation } from "@/app/actions/admin-users";
import { ActionForm } from "./forms";

const roles = [
  { value: "editor", label: "Éditeur", help: "Actualités, événements, pages, bureau et chiffres clés." },
  { value: "manager", label: "Gestionnaire", help: "Demandes d'adhésion, membres, documents, messages." },
  { value: "admin", label: "Administrateur", help: "Tous les droits, dont les comptes et les rôles." },
];

/**
 * Bouton « Ajouter un utilisateur » : ouvre une fenêtre (adresse e-mail + rôle).
 * À la validation, la personne reçoit un e-mail d'invitation ; elle crée son
 * compte ou se connecte depuis le lien et reçoit directement le rôle choisi.
 */
export function AddUserButton() {
  const dialog = useRef<HTMLDialogElement>(null);
  // Remonter le formulaire à chaque ouverture : il repart vide
  const [round, setRound] = useState(0);
  const open = () => {
    setRound((n) => n + 1);
    dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();

  return (
    <>
      <button type="button" onClick={open} className="btn-primary">
        <UserPlus aria-hidden className="size-4" />
        Ajouter un utilisateur
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="add-user-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="app-card m-auto w-[min(32rem,calc(100vw-2rem))] p-0 backdrop:bg-black/50 backdrop:backdrop-blur-[2px]"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="add-user-title" className="text-[1.1rem] font-semibold text-heading">
                Ajouter un utilisateur
              </h2>
              <p className="mt-1 text-[0.88rem] text-muted">La personne reçoit un e-mail pour créer son compte ou se connecter ; le rôle lui est attribué automatiquement.</p>
            </div>
            <button type="button" onClick={close} aria-label="Fermer" className="-m-1 rounded-lg p-1 text-muted hover:bg-surface hover:text-heading">
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <AddUserForm key={round} />
        </div>
      </dialog>
    </>
  );
}

function AddUserForm() {
  return (
    <ActionForm action={createRoleInvitation} submitLabel="Envoyer l'invitation" pendingLabel="Envoi…" initial={{ email: "", role: "editor" }} className="mt-5 grid gap-5">
      {(s) => (
        <>
          <label>
            <span className="field-label">Adresse e-mail</span>
            <input type="email" name="email" required autoComplete="off" defaultValue={s.values?.email ?? ""} placeholder="nom@entreprise.cm" className="field-input" />
          </label>
          <fieldset>
            <legend className="field-label">Rôle</legend>
            <div className="mt-1 grid gap-2">
              {roles.map((r) => (
                <label key={r.value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 has-checked:border-cyan has-checked:bg-ice">
                  <input type="radio" name="role" value={r.value} defaultChecked={(s.values?.role ?? "editor") === r.value} className="mt-1 accent-cyan" />
                  <span>
                    <span className="block text-[0.9rem] font-semibold text-heading">{r.label}</span>
                    <span className="block text-[0.82rem] text-muted">{r.help}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="text-[0.8rem] text-muted">Invitation valable 7 jours, utilisable une seule fois et réservée à cette adresse.</p>
          {s.values?.link && <CopyLink link={s.values.link} />}
        </>
      )}
    </ActionForm>
  );
}

function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copie refusée par le navigateur : le texte reste sélectionnable
    }
  };
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-ice p-3 sm:flex-row sm:items-center">
      <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} aria-label="Lien d'invitation" className="field-input min-w-0 flex-1 font-mono text-[0.8rem]" />
      <button type="button" onClick={copy} className="btn-secondary shrink-0">
        {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
        {copied ? "Copié" : "Copier"}
      </button>
    </div>
  );
}

/** Annulation d'une invitation en attente. */
export function RevokeInviteForm({ id }: { id: string }) {
  return (
    <ActionForm
      action={revokeRoleInvitation}
      hidden={{ id }}
      submitLabel="Annuler"
      tone="secondary"
      pendingLabel="…"
      confirm="Annuler cette invitation ? Le lien ne fonctionnera plus."
      className="[&_button]:px-3 [&_button]:py-1.5 [&_button]:text-[0.8rem]"
    />
  );
}
