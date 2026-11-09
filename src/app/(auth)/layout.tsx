import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { SectionLabel } from "@/components/brand/Trace";
import { getActorCategories } from "@/lib/data/public";
import { NetworkDiagram } from "@/components/brand/NetworkDiagram";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const categories = await getActorCategories();
  return (
    <div className="grid min-h-screen lg:grid-cols-12">
      <main id="contenu" className="flex flex-col px-4 py-6 sm:px-10 lg:col-span-5 lg:px-14">
        <div className="flex items-center justify-between gap-4">
          <Logo className="h-10 w-auto" />
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-navy">
            <ArrowLeft aria-hidden className="size-4" /> Retour au site
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-14">{children}</div>
        <p className="font-mono text-[0.72rem] text-muted">Accès réservé aux membres et candidats.</p>
      </main>
      <aside className="hidden flex-col justify-between border-l border-line bg-paper p-14 lg:col-span-7 lg:flex">
        <SectionLabel>Espace membre</SectionLabel>
        <div className="mx-auto w-full max-w-2xl bg-white p-8">
          <NetworkDiagram categories={categories} />
        </div>
        <p className="max-w-lg font-display text-[1.9rem] leading-[1.1] font-extrabold tracking-[-0.03em] text-navy">
          Suivez votre adhésion, accédez aux ressources réservées et retrouvez les membres du réseau.
        </p>
      </aside>
    </div>
  );
}
