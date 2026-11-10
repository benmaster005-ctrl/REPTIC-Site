import Image from "next/image";
import { ArrowUpRight, MessageCircle, ThumbsUp } from "lucide-react";
import { getLinkedinPosts } from "@/lib/data/public";
import { formatDate } from "@/lib/format";
import { SectionHeader } from "./content";
import { RevealGroup } from "@/components/motion/Reveal";
import { LinkedinIcon } from "@/components/layout/SocialIcons";

const PAGE_URL = "https://www.linkedin.com/company/reptic-cm/";

/** Derniers posts de la page LinkedIn (rien n'est affiché tant qu'aucun post n'est synchronisé). */
export async function LinkedinPosts({ limit = 3 }: { limit?: number }) {
  const posts = await getLinkedinPosts(limit);
  if (!posts.length) return null;

  return (
    <section className="border-t border-line bg-paper py-20 sm:py-28">
      <div className="container-site">
        <SectionHeader label="Sur LinkedIn" title="Le réseau au quotidien" action={{ label: "Suivre la page", href: PAGE_URL }} />
        {/* Carrousel glissant sur mobile, grille à partir de la tablette */}
        <RevealGroup
          as="ul"
          className="-mx-4 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 lg:ml-[calc(25%+0.375rem)] xl:grid-cols-3 [&::-webkit-scrollbar]:hidden"
        >
          {posts.map((p) => (
            <li
              key={p.id}
              className="group relative flex w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-line bg-white transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_-24px_rgb(35_45_87/0.4)] sm:w-[60%] md:w-auto"
            >
              {p.image && (
                <div className="relative aspect-[16/10] overflow-hidden bg-line/40">
                  <Image src={p.image} alt="" fill sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
              )}
              <div className="flex flex-1 flex-col p-6">
                <p className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-[#0A66C2]/10">
                    <LinkedinIcon className="size-4 text-[#0A66C2]" />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-[0.88rem] font-semibold text-navy">REPTIC.CM</span>
                    {p.postedAt && <span className="block text-[0.75rem] text-muted">{formatDate(p.postedAt, { day: "numeric", month: "long", year: "numeric" })}</span>}
                  </span>
                </p>
                {p.text && <p className="mt-3 line-clamp-6 text-[0.95rem] leading-relaxed whitespace-pre-line text-ink">{p.text}</p>}
                <div className="mt-auto flex items-center justify-between pt-5">
                  <span className="flex items-center gap-2 text-[0.78rem] text-muted">
                    {p.likes != null && (
                      <span className="flex items-center gap-1 rounded-full bg-paper px-2.5 py-1">
                        <ThumbsUp aria-hidden className="size-3.5" /> {p.likes}
                      </span>
                    )}
                    {p.comments != null && (
                      <span className="flex items-center gap-1 rounded-full bg-paper px-2.5 py-1">
                        <MessageCircle aria-hidden className="size-3.5" /> {p.comments}
                      </span>
                    )}
                  </span>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-navy after:absolute after:inset-0 hover:text-cyan-dark">
                    Voir sur LinkedIn <ArrowUpRight aria-hidden className="size-3.5" />
                  </a>
                </div>
              </div>
            </li>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
