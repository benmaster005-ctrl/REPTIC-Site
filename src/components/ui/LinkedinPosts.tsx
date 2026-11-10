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
        <RevealGroup as="ul" className="mt-12 grid gap-6 md:grid-cols-2 lg:ml-[calc(25%+0.375rem)] xl:grid-cols-3">
          {posts.map((p) => (
            <li key={p.id} className="group relative flex flex-col bg-white">
              {p.image && (
                <div className="relative aspect-[16/10] overflow-hidden bg-line/40">
                  <Image src={p.image} alt="" fill sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                </div>
              )}
              <div className="flex flex-1 flex-col border-t-2 border-navy p-6">
                <p className="flex items-center gap-2 font-mono text-[0.72rem] text-muted">
                  <LinkedinIcon className="size-3.5 text-[#0A66C2]" />
                  REPTIC.CM{p.postedAt ? ` · ${formatDate(p.postedAt, { day: "numeric", month: "long", year: "numeric" })}` : ""}
                </p>
                {p.text && <p className="mt-3 line-clamp-6 text-[0.95rem] leading-relaxed whitespace-pre-line text-ink">{p.text}</p>}
                <div className="mt-auto flex items-center justify-between pt-5">
                  <span className="flex items-center gap-4 font-mono text-[0.75rem] text-muted">
                    {p.likes != null && (
                      <span className="flex items-center gap-1">
                        <ThumbsUp aria-hidden className="size-3.5" /> {p.likes}
                      </span>
                    )}
                    {p.comments != null && (
                      <span className="flex items-center gap-1">
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
