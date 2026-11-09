import Link from "next/link";
import { Search } from "lucide-react";

export { Panel, SpaceFlash as Flash, SpaceHeader as AdminHeader, StatusTag } from "@/components/space/ui";

/** Barre de filtres en GET : recherche + listes déroulantes. */
export function FilterBar({ q, placeholder = "Rechercher…", selects = [], hiddens = {}, search = true }: {
  q?: string;
  search?: boolean;
  placeholder?: string;
  selects?: { name: string; label: string; value?: string; options: { value: string; label: string }[] }[];
  hiddens?: Record<string, string>;
}) {
  return (
    <form role="search" className="mt-8 flex flex-wrap gap-3 bg-white p-4">
      {Object.entries(hiddens).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {search && (
      <label className="relative min-w-56 flex-1">
        <span className="sr-only">Rechercher</span>
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
        <input name="q" defaultValue={q} placeholder={placeholder} className="field-input pl-10" />
      </label>
      )}
      {selects.map((s) => (
        <label key={s.name} className="min-w-44">
          <span className="sr-only">{s.label}</span>
          <select name={s.name} defaultValue={s.value ?? ""} className="field-input">
            <option value="">{s.label}</option>
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <button type="submit" className="btn-primary">
        Filtrer
      </button>
    </form>
  );
}

export function Pagination({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  const list = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 2);
  return (
    <nav aria-label="Pagination" className="mt-6 flex flex-wrap items-center gap-1.5">
      {list.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && list[i - 1] !== p - 1 && <span className="px-1 text-muted">…</span>}
          <Link
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={`grid size-10 place-items-center font-mono text-sm ${p === page ? "bg-navy text-white" : "border border-line bg-white text-navy hover:border-navy"}`}
          >
            {p}
          </Link>
        </span>
      ))}
    </nav>
  );
}

/** Tableau de données sobre : en-têtes mono, lignes filetées. */
export function DataTable({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: string }) {
  return (
    <div className="mt-4 overflow-x-auto bg-white">
      <table className="w-full min-w-[44rem] text-left text-[0.9rem]">
        <thead>
          <tr className="border-b-2 border-navy">
            {head.map((h) => (
              <th key={h} scope="col" className="label px-4 py-3 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-b [&>tr]:border-line [&>tr:hover]:bg-paper/60 [&_td]:px-4 [&_td]:py-3.5 [&_td]:align-top">{children}</tbody>
      </table>
      {empty && <p className="px-4 py-8 text-muted">{empty}</p>}
    </div>
  );
}

/** Construit une URL de liste en conservant les filtres. */
export function listHref(base: string, params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `${base}?${s}` : base;
}

export const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
export const pageNum = (v: string | string[] | undefined) => Math.max(1, Number.parseInt(str(v) ?? "1", 10) || 1);
