import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { mainNav } from "@/content/site";
import { Logo } from "./Logo";
import { MainNav } from "./MainNav";
import { AccountLink, AccountLinkFallback } from "./AccountLink";
import { HeaderShell } from "@/components/motion/HeaderShell";

export function SiteHeader() {
  return (
    <HeaderShell>
      {/* Barre institutionnelle */}
      <div className="hidden bg-navy text-white/75 md:block">
        <div className="container-site flex h-9 items-center justify-between text-[0.8rem]">
          <p className="font-mono text-[0.72rem] tracking-[0.06em] uppercase">Association professionnelle · Yaoundé, Cameroun</p>
          <div className="flex items-center gap-6">
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
            <Suspense fallback={<AccountLinkFallback />}>
              <AccountLink />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="border-b border-line">
        <div className="container-site flex h-[4.75rem] items-center justify-between gap-6">
          <Logo priority className="h-10 w-auto sm:h-12" />
          <MainNav
            items={mainNav}
            cta={
              <Link href="/adhesion" className="btn-primary">
                Adhérer <ArrowRight aria-hidden className="size-4" />
              </Link>
            }
            mobileExtra={
              <Suspense fallback={<AccountLinkFallback variant="block" />}>
                <AccountLink variant="block" />
              </Suspense>
            }
          />
        </div>
      </div>
    </HeaderShell>
  );
}
