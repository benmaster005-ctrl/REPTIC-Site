import { ViewTransition } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { DemoNotice } from "@/components/ui/content";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#contenu" className="sr-only z-[60] bg-navy px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Aller au contenu
      </a>
      <DemoNotice />
      <SiteHeader />
      <main id="contenu" className="flex-1">
        {/* Fondu enchaîné du contenu entre deux pages ; l'en-tête reste fixe. */}
        <ViewTransition default="page">{children}</ViewTransition>
      </main>
      <SiteFooter />
    </>
  );
}
