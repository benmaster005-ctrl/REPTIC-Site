import Image from "next/image";
import Link from "next/link";
import logo from "../../../public/brand/logo-reptic.svg";
import logoWhite from "../../../public/brand/logo-reptic-blanc.svg";

/**
 * Logo officiel REPTIC.CM (fichiers vectoriels de reptic.cm, net à toutes les tailles).
 * `tone="white"` : version blanche, pour les fonds marine.
 */
export function Logo({ className = "h-11 w-auto", priority, tone = "default" }: { className?: string; priority?: boolean; tone?: "default" | "white" }) {
  return (
    <Link href="/" aria-label="REPTIC.CM, retour à l'accueil" className="inline-block shrink-0">
      <Image src={tone === "white" ? logoWhite : logo} alt="REPTIC.CM" className={className} priority={priority} unoptimized />
    </Link>
  );
}
