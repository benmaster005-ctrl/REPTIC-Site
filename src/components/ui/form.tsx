"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, AlertCircle, ChevronDown, Loader2 } from "lucide-react";
import { HONEYPOT_FIELD, STARTED_AT_FIELD, type FormState } from "@/lib/forms";

/** Champs anti-spam : piège invisible + horodatage de début de saisie. */
export function SpamGuard() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.value = String(Date.now());
  }, []);
  return (
    <>
      <input ref={ref} type="hidden" name={STARTED_AT_FIELD} defaultValue="" />
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Ne pas remplir
          <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
        </label>
      </div>
    </>
  );
}

export function SubmitButton({ children, className = "btn-primary", pendingLabel = "Envoi…" }: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-disabled={pending}>
      {pending ? (
        <>
          <Loader2 aria-hidden className="size-4 animate-spin" /> {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  const ok = state.status === "success";
  const Icon = ok ? CheckCircle2 : AlertCircle;
  return (
    <p
      role={ok ? "status" : "alert"}
      className={`flex items-start gap-2.5 border-l-[3px] px-4 py-3 text-sm font-medium ${
        ok ? "border-cyan bg-cyan-tint text-navy" : "border-red-600 bg-red-50 text-red-800"
      }`}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      {state.message}
    </p>
  );
}

type FieldProps = {
  name: string;
  label: string;
  state: FormState;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
  textarea?: boolean;
  rows?: number;
};

export function Field({ name, label, state, type = "text", required, autoComplete, placeholder, hint, textarea, rows = 5 }: FieldProps) {
  const errors = state.fieldErrors?.[name];
  const id = `champ-${name}`;
  const describedBy = [errors?.length ? `${id}-erreur` : null, hint ? `${id}-aide` : null].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    name,
    required,
    autoComplete,
    placeholder,
    defaultValue: state.values?.[name] ?? "",
    "aria-invalid": errors?.length ? true : undefined,
    "aria-describedby": describedBy,
    className: "field-input",
  };
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} {required && <span className="text-red-600" aria-hidden>*</span>}
      </label>
      {textarea ? <textarea rows={rows} {...common} /> : <input type={type} {...common} />}
      {hint && (
        <p id={`${id}-aide`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {errors?.map((e) => (
        <p key={e} id={`${id}-erreur`} className="field-error">
          {e}
        </p>
      ))}
    </div>
  );
}

export function SelectField({ name, label, state, options, required, placeholder = "Sélectionner…", hint, onValueChange }: {
  name: string;
  label: string;
  state: FormState;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  /** Appelé à chaque choix (champ dépendant, comme « Autre : précisez »). */
  onValueChange?: (value: string) => void;
}) {
  const errors = state.fieldErrors?.[name];
  const id = `champ-${name}`;
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} {required && <span className="text-red-600" aria-hidden>*</span>}
      </label>
      <div className="relative">
      <select
        id={id}
        name={name}
        required={required}
        defaultValue={state.values?.[name] ?? ""}
        onChange={onValueChange ? (e) => onValueChange(e.target.value) : undefined}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={errors?.length ? `${id}-erreur` : hint ? `${id}-aide` : undefined}
        className="field-input appearance-none pr-10"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-navy" />
      </div>
      {hint && (
        <p id={`${id}-aide`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {errors?.map((e) => (
        <p key={e} id={`${id}-erreur`} className="field-error">
          {e}
        </p>
      ))}
    </div>
  );
}

export function Checkbox({ name, state, children, required }: { name: string; state: FormState; children: React.ReactNode; required?: boolean }) {
  const errors = state.fieldErrors?.[name];
  return (
    <div>
      <label className="flex items-start gap-3 text-sm text-muted">
        <input
          type="checkbox"
          name={name}
          required={required}
          aria-invalid={errors?.length ? true : undefined}
          className="mt-0.5 size-4 shrink-0 accent-navy"
        />
        <span>{children}</span>
      </label>
      {errors?.map((e) => (
        <p key={e} className="field-error">
          {e}
        </p>
      ))}
    </div>
  );
}
