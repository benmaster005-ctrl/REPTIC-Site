import Link from "next/link";
import { Globe, LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { initials } from "@/lib/format";

/** Carte de la personne connectée, en bas de la barre latérale. */
export function AccountCard({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl p-2">
      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-navy text-[0.8rem] font-semibold text-white">
        {initials(name)}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[0.875rem] font-semibold text-heading">{name}</span>
        <span className="block truncate text-[0.75rem] text-muted">{detail}</span>
      </span>
      <Link href="/" title="Site public" aria-label="Site public" className="grid size-8 place-items-center rounded-lg text-muted hover:bg-ice hover:text-heading">
        <Globe aria-hidden className="size-4" />
      </Link>
      <form action={signOut}>
        <button type="submit" title="Se déconnecter" aria-label="Se déconnecter" className="grid size-8 place-items-center rounded-lg text-muted hover:bg-ice hover:text-heading">
          <LogOut aria-hidden className="size-4" />
        </button>
      </form>
    </div>
  );
}

/** Repli pendant le chargement de la carte. */
export function AccountCardFallback() {
  return (
    <div className="flex items-center gap-3 p-2">
      <span className="size-9 animate-pulse rounded-full bg-ice" />
      <span className="h-3 flex-1 animate-pulse rounded bg-ice" />
    </div>
  );
}

/** Lien discret de la barre supérieure. */
export function TopbarLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-[0.85rem] font-medium text-muted transition-colors hover:bg-ice hover:text-heading">
      {children}
    </Link>
  );
}
