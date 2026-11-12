import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { getKeyFigures } from "@/lib/data/public";

/** Quelques visages du bureau, affichés en pastilles qui se chevauchent. */
const boardFaces = [
  { src: "/images/reptic/bureau/pierre-francois-kamanou.webp", name: "Pierre-François Kamanou" },
  { src: "/images/reptic/bureau/nelly-chatue-diop.webp", name: "Nelly Chatue-Diop" },
  { src: "/images/reptic/bureau/jean-guy-wandji.webp", name: "Jean-Guy Wandji" },
  { src: "/images/reptic/bureau/rosine-ekambi.webp", name: "Rosine Ekambi" },
];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const figures = await getKeyFigures();
  // Premier chiffre clé qui n'est pas l'année de création (ex. nombre de membres)
  const figure = figures.find((f) => !/création|fondation/i.test(f.label));
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

      {/* Panneau marine : photo du réseau, chiffre clé, message et visages du bureau */}
      <aside className="hidden flex-col gap-8 bg-navy p-10 text-white lg:col-span-7 lg:flex xl:p-14">
        <p className="text-[0.95rem] font-semibold text-[#7cc4ea]">Espace membre</p>

        <figure className="relative min-h-[18rem] flex-1 overflow-hidden rounded-xl bg-navy-soft">
          <Image
            src="/images/reptic/pages/adhesion-reseau.webp"
            alt="Membres du REPTIC.CM sur le stand de l'association"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 0px"
            className="object-cover object-[center_30%]"
          />
          {figure && (
            <figcaption className="absolute bottom-4 left-4 rounded-xl bg-cyan px-5 py-4 text-white">
              <span className="block font-display text-[2.2rem] leading-none font-extrabold tracking-[-0.03em]">{figure.value}</span>
              <span className="mt-1.5 block max-w-[14rem] text-[0.85rem] leading-snug text-white/90">{figure.label}</span>
            </figcaption>
          )}
        </figure>

        <div>
          <p className="max-w-xl font-display text-[1.7rem] leading-[1.15] font-bold tracking-[-0.02em] text-balance xl:text-[1.9rem]">
            Suivez votre adhésion, accédez aux ressources réservées et retrouvez les membres du réseau.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex">
              {boardFaces.map((p, i) => (
                <span key={p.src} className={`relative size-10 overflow-hidden rounded-full border-2 border-navy bg-navy-soft ${i ? "-ml-3" : ""}`}>
                  <Image src={p.src} alt={p.name} fill sizes="40px" className="object-cover object-top" />
                </span>
              ))}
            </div>
            <p className="text-[0.85rem] text-white/75">Avec les membres du bureau</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
