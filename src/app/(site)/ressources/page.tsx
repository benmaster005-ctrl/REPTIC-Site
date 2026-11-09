import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { getPublicResources } from "@/lib/data/public";
import { formatBytes } from "@/lib/membership";
import { formatDate } from "@/lib/format";
import { EmptyState, PageHero } from "@/components/ui/content";
import { RevealGroup } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Ressources",
  description: "Documents publics du REPTIC.CM à télécharger : statuts, présentations, publications.",
  alternates: { canonical: "/ressources" },
};

const kind = (mime: string) => (mime === "application/pdf" ? "PDF" : mime.split("/")[1]?.toUpperCase() ?? "Fichier");

export default async function ResourcesPage() {
  const resources = await getPublicResources();
  return (
    <>
      <PageHero
        title="Ressources"
        eyebrow="Le REPTIC"
        summary="Documents de l'association en libre accès. Les membres retrouvent des ressources supplémentaires dans leur espace."
        crumbs={[{ label: "Le REPTIC" }]}
      />
      <section className="container-site py-16 sm:py-24">
        {resources.length ? (
          <RevealGroup as="ul" className="border-b border-line lg:ml-[calc(25%+0.375rem)]">
            {resources.map((r) => (
              <li key={r.id} className="group relative grid grid-cols-[2.5rem_1fr] gap-4 border-t border-line py-6 sm:grid-cols-[2.5rem_1fr_auto] sm:items-center">
                <FileText aria-hidden className="mt-1 size-6 text-cyan-dark sm:mt-0" />
                <div className="min-w-0">
                  <h2 className="font-display text-[1.2rem] leading-snug font-bold text-navy">{r.title}</h2>
                  {r.description && <p className="mt-1 text-[0.95rem] text-muted">{r.description}</p>}
                  <p className="mt-1.5 font-mono text-[0.72rem] text-muted">
                    {kind(r.mimeType)} · {formatBytes(r.sizeBytes)} · {formatDate(r.createdAt, { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </p>
                </div>
                <a
                  href={`/ressources/${r.id}/telecharger`}
                  className="btn-secondary col-start-2 justify-self-start px-4 py-2 text-[0.85rem] sm:col-start-auto"
                  aria-label={`Télécharger ${r.title} (${kind(r.mimeType)}, ${formatBytes(r.sizeBytes)})`}
                >
                  <Download aria-hidden className="size-4" /> Télécharger
                </a>
              </li>
            ))}
          </RevealGroup>
        ) : (
          <div className="lg:ml-[calc(25%+0.375rem)]">
            <EmptyState title="Aucune ressource publique pour le moment." description="Les documents de l'association seront publiés ici." />
          </div>
        )}
        <p className="mt-10 text-[0.92rem] text-muted lg:ml-[calc(25%+0.375rem)]">
          Membre du réseau ?{" "}
          <Link href="/espace/documents" className="font-semibold text-navy underline underline-offset-4">
            Accédez aux documents réservés
          </Link>
          .
        </p>
      </section>
    </>
  );
}
