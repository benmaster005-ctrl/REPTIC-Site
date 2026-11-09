import "server-only";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/env";
import { formatDate } from "@/lib/format";
import type { NewsletterArticle } from "@/lib/email/content";

type Row = Record<string, unknown>;

/** Actualités publiques retenues pour une lettre, dans l'ordre choisi. */
export async function loadNewsletterArticles(ids: string[]): Promise<NewsletterArticle[]> {
  if (!ids.length) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("news")
    .select("id,slug,title,excerpt,published_at,visibility,status,category:categories(name)")
    .in("id", ids)
    .eq("visibility", "public")
    .eq("status", "published");
  const byId = new Map((data ?? []).map((r: Row) => [r.id as string, r]));
  return ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((r) => {
      const row = r as Row;
      const cat = (Array.isArray(row.category) ? row.category[0] : row.category) as Row | null;
      return {
        title: row.title as string,
        excerpt: (row.excerpt as string) ?? null,
        url: `${SITE_URL}/actualites/${row.slug}`,
        meta: [cat?.name as string | undefined, row.published_at ? formatDate(row.published_at as string, { day: "numeric", month: "long" }) : null].filter(Boolean).join(" · "),
      };
    });
}

/** Actualités publiques récentes, proposées à la sélection. */
export async function recentPublicNews() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news")
    .select("id,title,published_at")
    .eq("visibility", "public")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(12);
  return (data ?? []).map((r: Row) => ({ id: r.id as string, title: r.title as string, publishedAt: (r.published_at as string) ?? null }));
}
