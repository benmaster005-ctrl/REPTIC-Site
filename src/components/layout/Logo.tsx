import Image from "next/image";
import Link from "next/link";
import logo from "../../../public/brand/logo-reptic.png";

/**
 * Logo officiel. Le fichier actuel est un PNG sur fond blanc (411×122) :
 * à remplacer par la version vectorielle (SVG) et une déclinaison blanche
 * dès que l'association les fournit.
 */
export function Logo({ className = "h-11 w-auto", priority }: { className?: string; priority?: boolean }) {
  return (
    <Link href="/" aria-label="REPTIC.CM, retour à l'accueil" className="inline-block shrink-0">
      <Image src={logo} alt="REPTIC.CM" className={className} priority={priority} sizes="200px" />
    </Link>
  );
}
