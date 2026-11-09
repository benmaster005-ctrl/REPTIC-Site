import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionLabel } from "@/components/brand/Trace";

/** En-tête de page de l'espace. */
export function SpaceHeader({ label, title, description, action }: { label: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <SectionLabel>{label}</SectionLabel>
        <h1 className="heading-md mt-4">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[0.98rem] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Bloc blanc de l'espace. */
export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`bg-white p-6 sm:p-8 ${className}`}>{children}</section>;
}

/** Message affiché aux candidats sur les modules réservés aux membres. */
export function MembersOnly({ feature }: { feature: string }) {
  return (
    <Panel className="mt-8">
      <div className="max-w-xl border-l-[3px] border-cyan pl-6">
        <p className="font-display text-xl font-bold text-navy">{feature} : réservé aux membres</p>
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
  const color = {
    info: "border-cyan text-cyan-dark",
    success: "border-emerald-600 text-emerald-700",
    warning: "border-amber-500 text-amber-700",
    danger: "border-red-600 text-red-700",
    neutral: "border-line-strong text-muted",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-2 font-mono text-[0.75rem] font-medium tracking-[0.04em] uppercase ${color.split(" ")[1]}`}>
      <span aria-hidden className={`size-2 rounded-full border-2 ${color.split(" ")[0]}`} />
      {children}
    </span>
  );
}

export function SpaceFlash({ children, tone = "success" }: { children: React.ReactNode; tone?: "success" | "error" }) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`mt-6 border-l-[3px] px-4 py-3 text-sm font-medium ${tone === "error" ? "border-red-600 bg-red-50 text-red-800" : "border-cyan bg-cyan-tint text-navy"}`}>
      {children}
    </p>
  );
}
