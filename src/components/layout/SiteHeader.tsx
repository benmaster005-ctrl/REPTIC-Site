import Link from "next/link";
import { Suspense } from "react";
import { mainNav } from "@/content/site";
import { Logo } from "./Logo";
import { MainNav } from "./MainNav";
import { AccountLink, AccountLinkFallback } from "./AccountLink";
import { HeaderShell } from "@/components/motion/HeaderShell";

/** En-tête flottant : une pastille dépolie détachée du bord, posée sur la page. */
export function SiteHeader() {
  return (
    <HeaderShell>
      <div className="header-pill mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-4 rounded-full bg-white/80 pr-2 pl-5 ring-1 ring-navy/8 backdrop-blur-xl backdrop-saturate-150 sm:pl-6">
        <Logo priority className="h-9 w-auto sm:h-10" />
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
