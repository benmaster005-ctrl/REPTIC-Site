"use client";

import { useActionState, type ReactNode } from "react";
import { type FormState } from "@/lib/forms";
import { FormMessage, SubmitButton } from "@/components/ui/form";

type ServerAction = (prev: FormState, formData: FormData) => Promise<FormState>;

/**
 * Formulaire d'action du back-office : affiche le retour de l'action et,
 * si `confirm` est fourni, demande confirmation avant l'envoi.
 */
export function ActionForm({ action, children, submitLabel, pendingLabel = "Enregistrement…", confirm, tone = "primary", className = "space-y-5", initial, hidden }: {
  action: ServerAction;
  children?: ReactNode | ((state: FormState) => ReactNode);
  submitLabel: ReactNode;
  pendingLabel?: string;
  confirm?: string;
  tone?: "primary" | "secondary" | "danger";
  className?: string;
  initial?: Record<string, string>;
  hidden?: Record<string, string>;
}) {
  const [state, formAction] = useActionState(action, { status: "idle", values: initial } as FormState);
  const s = { ...state, values: state.values ?? initial };
  const btn = tone === "danger" ? "btn border border-red-700 bg-red-700 text-white hover:bg-red-800" : tone === "secondary" ? "btn-secondary" : "btn-primary";
  return (
    <form
      action={formAction}
      noValidate
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <FormMessage state={s} />
      {typeof children === "function" ? children(s) : children}
      <SubmitButton className={btn} pendingLabel={pendingLabel}>
        {submitLabel}
      </SubmitButton>
    </form>
  );
}

/** Bouton d'action simple (sans retour) avec confirmation. */
export function ConfirmSubmit({ children, message, className = "btn-secondary" }: { children: ReactNode; message: string; className?: string }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
