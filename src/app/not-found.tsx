import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { TraceRule } from "@/components/brand/Trace";

export default function NotFound() {
  return (
    <main id="contenu" className="container-site flex min-h-screen flex-col py-8">
      <Logo className="h-10 w-auto" />
      <div className="flex flex-1 flex-col justify-center py-20">
        <p className="font-mono text-sm text-cyan-dark">Erreur 404</p>
        <h1 className="heading-xl mt-4 max-w-3xl">Ce lien ne mène nulle part.</h1>
        <TraceRule className="mt-10 w-48" />
        <p className="mt-8 max-w-md text-[1.05rem] text-muted">La page demandée n&apos;existe pas ou a été déplacée.</p>
        <Link href="/" className="btn-primary mt-10 self-start">
          <ArrowLeft aria-hidden className="size-4" /> Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
