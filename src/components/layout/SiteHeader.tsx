import Link from "next/link";
import { Suspense } from "react";
import { mainNav } from "@/content/site";
import { Logo } from "./Logo";
import { MainNav } from "./MainNav";
import { AccountLink, AccountLinkFallback } from "./AccountLink";
import { HeaderShell } from "@/components/motion/HeaderShell";

/** En-tête : une seule barre (logo, navigation, espace membre, adhésion). */
export function SiteHeader() {
  return (
    <HeaderShell>
      <div className="border-b border-line">
        <div className="container-site flex h-[4.75rem] items-center justify-between gap-6">
          <Logo priority className="h-10 w-auto sm:h-11" />
          <MainNav
            items={mainNav}
            cta={
              <div className="flex items-center gap-4 xl:gap-6">
                <Suspense fallback={<AccountLinkFallback variant="nav" />}>
                  <AccountLink variant="nav" />
                </Suspense>
                <Link href="/adhesion" className="btn-primary">
                  Adhérer
                </Link>
              </div>
            }
            mobileExtra={null}
          />
        </div>
      </div>
    </HeaderShell>
  );
}
