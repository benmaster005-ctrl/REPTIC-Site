import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { getSpaceContext } from "@/lib/space";
import { getDirectory } from "@/lib/data/member";
import { getActorCategories } from "@/lib/data/public";
import { applicantTypeLabels } from "@/lib/membership";
import { initials } from "@/lib/format";
import { MembersOnly, Panel, SpaceHeader } from "@/components/space/ui";

export const metadata: Metadata = { title: "Annuaire des membres" };

export default function DirectoryPage({ searchParams }: PageProps<"/espace/annuaire">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Directory searchParams={searchParams} />
    </Suspense>
  );
}

async function Directory({ searchParams }: Pick<PageProps<"/espace/annuaire">, "searchParams">) {
  const { isMember } = await getSpaceContext("/espace/annuaire");
  if (!isMember) return (<><SpaceHeader label="Annuaire" title="Annuaire des membres" /><MembersOnly feature="L'annuaire" /></>);
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const category = typeof params.famille === "string" ? params.famille : "";
  const [members, categories] = await Promise.all([getDirectory({ q, category }), getActorCategories()]);

  return (
    <>
      <SpaceHeader label="Annuaire" title="Annuaire des membres" description="Seuls les membres ayant choisi d'apparaître dans l'annuaire sont listés." />
      <form role="search" className="mt-8 grid gap-3 bg-white p-4 sm:grid-cols-[1fr_16rem_auto]">
        <label className="sr-only" htmlFor="annuaire-q">
          Rechercher
        </label>
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <input id="annuaire-q" name="q" defaultValue={q} placeholder="Nom, profession, ville…" className="field-input pl-10" />
        </div>
        <label className="sr-only" htmlFor="annuaire-famille">
          Famille d&apos;acteurs
        </label>
        <select id="annuaire-famille" name="famille" defaultValue={category} className="field-input">
          <option value="">Toutes les familles</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary">
          Rechercher
        </button>
      </form>

      <p className="mt-6 font-mono text-[0.75rem] text-muted">
        {members.length} membre{members.length > 1 ? "s" : ""}
        {q || category ? " correspondant à la recherche" : ""}
      </p>
      {members.length ? (
        <ul className="mt-3 grid gap-px bg-line sm:grid-cols-2">
          {members.map((m) => (
            <li key={m.id} className="flex gap-4 bg-white p-6">
              <span aria-hidden className="grid size-12 shrink-0 place-items-center bg-paper font-display text-lg font-extrabold text-navy">
                {initials(m.name)}
              </span>
              <div className="min-w-0">
                <p className="font-display text-[1.1rem] font-bold text-navy">{m.name}</p>
                <p className="text-[0.88rem] text-muted">{[m.profession, m.city].filter(Boolean).join(" · ") || applicantTypeLabels[m.memberType]}</p>
                {m.category && <p className="label mt-2 text-cyan-dark">{m.category}</p>}
                {m.bio && <p className="mt-2 line-clamp-3 text-[0.88rem] text-ink/80">{m.bio}</p>}
                {m.website && (
                  <a href={m.website} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[0.85rem] font-semibold text-navy hover:text-cyan-dark">
                    Site web <ArrowUpRight aria-hidden className="size-3.5" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Panel className="mt-3">
          <p className="text-muted">Aucun membre ne correspond à cette recherche.</p>
        </Panel>
      )}
    </>
  );
}
