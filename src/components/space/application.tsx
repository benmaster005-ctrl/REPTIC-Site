import Link from "next/link";
import { Check } from "lucide-react";
import { wizardSteps, type ApplicationStatus, type WizardStep } from "@/lib/membership";

export function applicationTone(s: ApplicationStatus): "info" | "success" | "warning" | "danger" | "neutral" {
  return s === "accepted" ? "success" : s === "rejected" ? "danger" : s === "additional_info" ? "warning" : s === "draft" ? "neutral" : "info";
}

/**
 * Étapes du parcours : chaque étape est reliée à la suivante par une trace
 * (motif de marque). Les étapes atteignables sont cliquables.
 */
export function Stepper({ current, reachable }: { current: WizardStep; reachable: WizardStep[] }) {
  const currentIndex = wizardSteps.findIndex((s) => s.key === current);
  return (
    <nav aria-label="Étapes de la demande" className="mt-8">
      <ol className="grid grid-cols-5">
        {wizardSteps.map((s, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const canGo = reachable.includes(s.key) && !active;
          const node = (
            <span className="flex flex-col items-start gap-3">
              <span className="relative flex w-full items-center">
                <span
                  className={`relative z-10 grid size-7 shrink-0 place-items-center rounded-full border-2 font-mono text-[0.72rem] transition-colors duration-500 ${
                    active ? "border-navy bg-navy text-white" : done ? "border-cyan bg-cyan text-white" : "border-line-strong bg-white text-muted"
                  }`}
                >
                  {done ? <Check aria-hidden className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>
                {i < wizardSteps.length - 1 && (
                  <span aria-hidden className="h-[2px] flex-1 bg-line-strong">
                    <span className={`block h-full origin-left bg-cyan transition-transform duration-700 ${done ? "scale-x-100" : "scale-x-0"}`} />
                  </span>
                )}
              </span>
              <span className={`hidden pr-2 text-[0.8rem] leading-tight font-semibold sm:block ${active ? "text-navy" : done ? "text-navy/80" : "text-muted"}`}>{s.label}</span>
            </span>
          );
          return (
            <li key={s.key} aria-current={active ? "step" : undefined}>
              {canGo ? (
                <Link href={`/espace/adhesion?etape=${s.key}`} className="block hover:opacity-80">
                  {node}
                </Link>
              ) : (
                node
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-sm font-semibold text-navy sm:hidden">
        Étape {currentIndex + 1} sur {wizardSteps.length} : {wizardSteps[currentIndex]?.label}
      </p>
    </nav>
  );
}
