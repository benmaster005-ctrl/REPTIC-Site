import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** En-tête de page de l'espace. */
export function SpaceHeader({ label, title, description, action }: { label: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    // En-tête d'application : fil (rubrique), titre, description, actions à droite
    <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-[0.8rem] font-medium text-muted">{label}</p>
        <h1 className="mt-1 text-[1.6rem] leading-tight font-semibold tracking-[-0.02em] text-heading">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[0.92rem] text-muted">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}

/** Carte de l'application : fond blanc, filet fin, coins arrondis. */
export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`app-card p-5 sm:p-6 ${className}`}>{children}</section>;
}

/** Message affiché aux candidats sur les modules réservés aux membres. */
export function MembersOnly({ feature }: { feature: string }) {
  return (
    <Panel className="mt-8">
      <div className="max-w-xl border-l-[3px] border-cyan pl-6">
        <p className="font-display text-xl font-bold text-heading">{feature} : réservé aux membres</p>
        <p className="mt-2 text-muted">Ce module s&apos;ouvre dès que votre adhésion est acceptée et votre compte activé.</p>
        <Link href="/espace/adhesion" className="link-arrow mt-6">
          Voir l&apos;état de ma demande <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
    </Panel>
  );
}

/** Pastille d'état sobre (texte + nœud coloré). */
export function StatusTag({ tone, children }: { tone: "info" | "success" | "warning" | "danger" | "neutral"; children: React.ReactNode }) {
  // Pastille arrondie teintée, lisible en clair comme en sombre
  const color = {
    info: "bg-cyan/12 text-cyan-dark",
    success: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    danger: "bg-red-500/12 text-red-700 dark:text-red-300",
    neutral: "bg-ice text-muted",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.78rem] font-semibold ${color}`}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function SpaceFlash({ children, tone = "success" }: { children: React.ReactNode; tone?: "success" | "error" }) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`mt-6 rounded-2xl px-5 py-3.5 text-sm font-medium ${tone === "error" ? "bg-red-500/12 text-red-700 dark:text-red-300" : "bg-cyan-tint text-heading"}`}>
      {children}
    </p>
  );
}
