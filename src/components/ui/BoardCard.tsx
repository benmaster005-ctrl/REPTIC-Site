import Image from "next/image";
import type { GovernanceMember } from "@/lib/types";
import { initials } from "@/lib/format";
import { LinkedinIcon } from "@/components/layout/SocialIcons";

/**
 * Carte d'un membre du Bureau : portrait carré arrondi, nom, fonction.
 * Le badge LinkedIn apparaît au survol (toujours visible sur écran tactile).
 */
export function BoardCard({ member, className = "", sizes = "184px" }: { member: GovernanceMember; className?: string; sizes?: string }) {
  const m = member;
  return (
    <div className={`lift group relative rounded-3xl bg-white p-4 ${className}`}>
      <div className="relative">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-ice">
          {m.photoUrl ? (
            <Image src={m.photoUrl} alt={`Portrait de ${m.fullName}`} fill sizes={sizes} className="img-hover object-cover object-top" />
          ) : (
            <span aria-hidden className="grid size-full place-items-center text-3xl font-bold text-navy/30">
              {initials(m.fullName)}
            </span>
          )}
        </div>
        {m.linkedinUrl && (
          <a
            href={m.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Profil LinkedIn de ${m.fullName}`}
            className="absolute -right-1.5 -bottom-1.5 grid size-10 place-items-center rounded-full bg-[#0A66C2] text-white ring-4 ring-white transition-[opacity,transform] duration-300 ease-[var(--ease-out)] hover:scale-110 focus-visible:opacity-100 [@media(hover:hover)]:scale-75 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:scale-100 [@media(hover:hover)]:group-hover:opacity-100"
          >
            <LinkedinIcon className="size-[1.1rem]" />
          </a>
        )}
      </div>
      <p className="mt-4 text-[0.95rem] leading-snug font-semibold text-navy">{m.fullName}</p>
      <p className="mt-1 line-clamp-2 text-[0.84rem] leading-snug text-muted">{m.positionTitle}</p>
      {m.organization && <p className="mt-1 text-[0.82rem] text-muted/80">{m.organization}</p>}
    </div>
  );
}
