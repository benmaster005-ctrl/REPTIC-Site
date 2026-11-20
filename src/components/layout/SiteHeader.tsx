import Link from "next/link";
import { Suspense } from "react";
import { mainNav } from "@/content/site";
import Image from "next/image";
import logo from "../../../public/brand/logo-reptic.svg";
import logoWhite from "../../../public/brand/logo-reptic-blanc.svg";
import { MainNav } from "./MainNav";
import { AccountLink, AccountLinkFallback } from "./AccountLink";
import { HeaderShell } from "@/components/motion/HeaderShell";

/**
 * En-tête flottant posé sur la bannière : transparent, texte et logo blancs en
 * haut de page ; pastille blanche dépolie dès que la page défile (globals.css,
 * « .site-header[data-scrolled] »).
 */
export function SiteHeader() {
  return (
    <HeaderShell>
      <div className="header-pill mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-4 rounded-full pr-2 pl-5 sm:pl-6">
        {/* Deux versions du logo : blanche sur la bannière, couleur une fois la page défilée */}
        <Link href="/" aria-label="REPTIC.CM, retour à l'accueil" className="relative inline-block shrink-0">
          <Image src={logo} alt="REPTIC.CM" priority unoptimized className="logo-color h-9 w-auto sm:h-10" />
          <Image src={logoWhite} alt="" aria-hidden priority unoptimized className="logo-white absolute inset-0 h-9 w-auto sm:h-10" />
        </Link>
        <MainNav
          items={mainNav}
          cta={
            <div className="flex items-center gap-2">
              {/* Entre 1024 et 1280 px, la place manque : l'espace membre reste dans le pied de page */}
              <span className="hidden xl:contents">
                <Suspense fallback={<AccountLinkFallback variant="nav" />}>
                  <AccountLink variant="nav" />
                </Suspense>
              </span>
              <Link href="/adhesion" className="btn-primary h-12">
                Adhérer
              </Link>
            </div>
          }
          mobileExtra={
            <Suspense fallback={<AccountLinkFallback variant="block" />}>
              <AccountLink variant="block" />
            </Suspense>
          }
        />
      </div>
    </HeaderShell>
  );
}
