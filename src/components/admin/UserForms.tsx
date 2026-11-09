"use client";

import { changeUserRole, toggleUserActive } from "@/app/actions/admin-users";
import { ActionForm } from "./forms";

const roles = [
  { value: "candidate", label: "Candidat" },
  { value: "member", label: "Membre" },
  { value: "editor", label: "Éditeur" },
  { value: "manager", label: "Gestionnaire" },
  { value: "admin", label: "Administrateur" },
];

export function UserRoleForm({ userId, role, disabled }: { userId: string; role: string; disabled?: boolean }) {
  if (disabled) return <span className="text-[0.85rem] text-muted">Votre compte</span>;
  return (
    <ActionForm action={changeUserRole} hidden={{ user_id: userId }} initial={{ role }} submitLabel="Appliquer" tone="secondary" pendingLabel="…" className="flex flex-wrap items-center gap-2 [&>p]:basis-full [&_button]:px-3 [&_button]:py-2 [&_button]:text-[0.8rem]" confirm="Modifier le rôle de ce compte ? Ses droits changent immédiatement.">
      {(s) => (
        <select name="role" defaultValue={s.values?.role ?? role} aria-label="Rôle" className="field-input w-40 py-2 text-[0.85rem]">
          {roles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      )}
    </ActionForm>
  );
}

export function UserActiveForm({ userId, active, disabled }: { userId: string; active: boolean; disabled?: boolean }) {
  if (disabled) return null;
  return (
    <ActionForm
      action={toggleUserActive}
      hidden={{ user_id: userId, active: active ? "0" : "1" }}
      submitLabel={active ? "Désactiver" : "Activer"}
      tone={active ? "secondary" : "primary"}
      pendingLabel="…"
      className="[&_button]:px-3 [&_button]:py-2 [&_button]:text-[0.8rem]"
      confirm={active ? "Désactiver ce compte ? La personne ne pourra plus accéder à ses espaces." : undefined}
    />
  );
}
