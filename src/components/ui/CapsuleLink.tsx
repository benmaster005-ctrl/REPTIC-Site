import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Bouton à capsule : libellé + pastille ronde cyan portant la flèche, qui
 * glisse et pivote au survol. Réservé à l'action principale d'un bloc.
 * `tone="light"` pour les fonds marine (fond blanc, texte marine).
 */
export function CapsuleLink({ href, children, tone = "dark", className = "" }: { href: string; children: React.ReactNode; tone?: "dark" | "light"; className?: string }) {
  const colors = tone === "light" ? "bg-white text-navy hover:bg-ice" : "bg-navy text-white hover:bg-navy-deep";
  return (
    <Link
      href={href}
      className={`group/cap inline-flex items-center gap-3 rounded-full py-1.5 pr-1.5 pl-6 text-[0.92rem] font-semibold transition-[background-color,transform] duration-200 active:scale-[0.97] ${colors} ${className}`}
    >
      {children}
      <span aria-hidden className="grid size-10 place-items-center rounded-full bg-cyan text-white transition-transform duration-300 ease-[var(--ease-out)] group-hover/cap:translate-x-0.5 group-hover/cap:-rotate-45">
        <ArrowRight className="size-[1.1rem]" />
      </span>
    </Link>
  );
}
