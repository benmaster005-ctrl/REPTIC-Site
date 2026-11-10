import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { SUPABASE_URL, isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  Category,
  EventItem,
  GovernanceMember,
  KeyFigure,
  NewsItem,
  Page,
  SiteContact,
  SiteSocial,
} from "@/lib/types";
import {
  fallbackActorCategories,
  fallbackContact,
  fallbackEvents,
  fallbackGovernance,
  fallbackKeyFigures,
  fallbackNews,
  fallbackPages,
  fallbackSocial,
} from "@/content/site";

/**
 * Lecture des contenus publics. Chaque fonction est mise en cache côté serveur
 * ("use cache") avec un tag, invalidé depuis le back-office par revalidateTag().
 * Le client utilisé est anonyme : la RLS ne lui expose que le contenu publié.
 */

export const tags = {
  news: "news",
  events: "events",
  pages: "pages",
  governance: "governance",
  categories: "categories",
  figures: "key-figures",
  settings: "site-settings",
  documents: "documents",
  linkedin: "linkedin",
} as const;

export const isDemo = !isSupabaseConfigured;

export function publicMediaUrl(path: string | null | undefined) {
  if (!path) return null;
  // URL complète, ou image livrée avec le site (dossier public/, ex. /images/reptic/…)
  if (/^https?:\/\//.test(path) || path.startsWith("/")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/public-media/${path}`;
}

type Row = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : null);
const catName = (row: Row) => str((row.category as Row | null)?.name);

function toNews(row: Row): NewsItem {
  return {
    slug: row.slug as string,
    title: row.title as string,
    excerpt: str(row.excerpt),
    body: str(row.body),
    coverUrl: publicMediaUrl(str(row.cover_path)),
    category: catName(row),
    publishedAt: row.published_at as string,
  };
}

function toEvent(row: Row): EventItem {
  return {
    slug: row.slug as string,
    title: row.title as string,
    excerpt: str(row.excerpt),
    body: str(row.body),
    coverUrl: publicMediaUrl(str(row.cover_path)),
    category: catName(row),
    startsAt: row.starts_at as string,
    endsAt: str(row.ends_at),
    locationName: str(row.location_name),
    city: str(row.city),
    registrationEnabled: Boolean(row.registration_enabled),
  };
}

// ---------------------------------------------------------------------------
// Actualités
// ---------------------------------------------------------------------------
const NEWS_COLUMNS = "slug,title,excerpt,body,cover_path,published_at,category:categories(name,slug)";

export async function getLatestNews(limit = 3): Promise<NewsItem[]> {
  "use cache";
  cacheTag(tags.news);
  cacheLife("hours");
  if (isDemo) return fallbackNews.slice(0, limit);
  const { data, error } = await createPublicClient()
    .from("news")
    .select(NEWS_COLUMNS)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) console.error("getLatestNews", error.message);
  return (data ?? []).map(toNews);
}

export async function getNewsPage(page: number, pageSize = 9, category?: string | null): Promise<{ items: NewsItem[]; total: number }> {
  "use cache";
  cacheTag(tags.news);
  cacheLife("hours");
  if (isDemo) {
    const items = category ? fallbackNews.filter((n) => slugify(n.category ?? "") === category) : fallbackNews;
    return { items, total: items.length };
  }
  const from = (page - 1) * pageSize;
  let query = createPublicClient()
    .from("news")
    .select(category ? NEWS_COLUMNS.replace("categories(", "categories!inner(") : NEWS_COLUMNS, { count: "exact" });
  if (category) query = query.eq("category.slug", category);
  const { data, count, error } = await query.order("published_at", { ascending: false }).range(from, from + pageSize - 1);
  if (error) console.error("getNewsPage", error.message);
  return { items: ((data ?? []) as unknown as Row[]).map(toNews), total: count ?? 0 };
}

export async function getNewsBySlug(slug: string): Promise<NewsItem | null> {
  "use cache";
  cacheTag(tags.news, `news:${slug}`);
  cacheLife("hours");
  if (isDemo) return fallbackNews.find((n) => n.slug === slug) ?? null;
  const { data } = await createPublicClient().from("news").select(NEWS_COLUMNS).eq("slug", slug).maybeSingle();
  return data ? toNews(data) : null;
}

export async function getAllNewsSlugs(): Promise<{ slug: string; publishedAt: string }[]> {
  "use cache";
  cacheTag(tags.news);
  cacheLife("hours");
  if (isDemo) return fallbackNews.map(({ slug, publishedAt }) => ({ slug, publishedAt }));
  const { data } = await createPublicClient().from("news").select("slug,published_at").limit(1000);
  return (data ?? []).map((r: Row) => ({ slug: r.slug as string, publishedAt: r.published_at as string }));
}

// ---------------------------------------------------------------------------
// Événements
// ---------------------------------------------------------------------------
const EVENT_COLUMNS =
  "slug,title,excerpt,body,cover_path,starts_at,ends_at,location_name,city,registration_enabled,category:categories(name,slug)";

export async function getEvents(): Promise<{ upcoming: EventItem[]; past: EventItem[] }> {
  "use cache";
  cacheTag(tags.events);
  cacheLife("hours");
  const all = isDemo
    ? fallbackEvents
    : ((await createPublicClient().from("events").select(EVENT_COLUMNS).order("starts_at", { ascending: true }).limit(200))
        .data ?? []).map(toEvent);
  // Comparaison au moment du rendu en cache : la durée de vie "hours" borne le décalage.
  const now = Date.now();
  const isPast = (e: EventItem) => new Date(e.endsAt ?? e.startsAt).getTime() < now;
  return {
    upcoming: all.filter((e) => !isPast(e)).sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    past: all.filter(isPast).sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
  };
}

export async function getEventBySlug(slug: string): Promise<EventItem | null> {
  "use cache";
  cacheTag(tags.events, `event:${slug}`);
  cacheLife("hours");
  if (isDemo) return fallbackEvents.find((e) => e.slug === slug) ?? null;
  const { data } = await createPublicClient().from("events").select(EVENT_COLUMNS).eq("slug", slug).maybeSingle();
  return data ? toEvent(data) : null;
}

export async function getAllEventSlugs(): Promise<string[]> {
  "use cache";
  cacheTag(tags.events);
  cacheLife("hours");
  if (isDemo) return fallbackEvents.map((e) => e.slug);
  const { data } = await createPublicClient().from("events").select("slug").limit(1000);
  return (data ?? []).map((r: Row) => r.slug as string);
}

// ---------------------------------------------------------------------------
// Pages institutionnelles, gouvernance, référentiels
// ---------------------------------------------------------------------------
export async function getPage(slug: string): Promise<Page | null> {
  "use cache";
  cacheTag(tags.pages, `page:${slug}`);
  cacheLife("days");
  const fallback = fallbackPages[slug] ?? null;
  if (isDemo) return fallback;
  const { data } = await createPublicClient()
    .from("pages")
    .select("slug,title,summary,body,seo_title,seo_description")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return fallback;
  return {
    slug: data.slug,
    title: data.title,
    summary: data.summary,
    body: data.body,
    seoTitle: data.seo_title,
    seoDescription: data.seo_description,
  };
}

export async function getGovernance(): Promise<GovernanceMember[]> {
  "use cache";
  cacheTag(tags.governance);
  cacheLife("days");
  if (isDemo) return fallbackGovernance;
  const { data } = await createPublicClient()
    .from("governance_members")
    .select("id,full_name,position_title,organization,photo_path,bio")
    .order("sort_order");
  return (data ?? []).map((r: Row) => ({
    id: r.id as string,
    fullName: r.full_name as string,
    positionTitle: r.position_title as string,
    organization: str(r.organization),
    photoUrl: publicMediaUrl(str(r.photo_path)),
    bio: str(r.bio),
  }));
}

/** Catégories d'actualités qui comptent au moins un article publié (filtres de la page Actualités). */
export async function getNewsCategories(): Promise<{ slug: string; name: string }[]> {
  "use cache";
  cacheTag(tags.news, tags.categories);
  cacheLife("hours");
  if (isDemo) {
    const names = [...new Set(fallbackNews.map((n) => n.category).filter((c): c is string => Boolean(c)))];
    return names.map((name) => ({ slug: slugify(name), name }));
  }
  const { data } = await createPublicClient().from("news").select("category:categories!inner(slug,name,position)").limit(500);
  const seen = new Map<string, { slug: string; name: string; position: number }>();
  for (const r of (data ?? []) as Row[]) {
    const c = r.category as { slug: string; name: string; position: number } | null;
    if (c && !seen.has(c.slug)) seen.set(c.slug, c);
  }
  return [...seen.values()].sort((a, b) => a.position - b.position).map(({ slug, name }) => ({ slug, name }));
}

const slugify = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function getActorCategories(): Promise<Category[]> {
  "use cache";
  cacheTag(tags.categories);
  cacheLife("days");
  if (isDemo) return fallbackActorCategories;
  const { data } = await createPublicClient()
    .from("categories")
    .select("slug,name,description")
    .eq("kind", "actor")
    .order("position");
  return data?.length ? data : fallbackActorCategories;
}

export async function getKeyFigures(): Promise<KeyFigure[]> {
  "use cache";
  cacheTag(tags.figures);
  cacheLife("days");
  if (isDemo) return fallbackKeyFigures;
  const { data } = await createPublicClient().from("key_figures").select("label,value").order("sort_order");
  return data ?? [];
}

export async function getSiteSettings(): Promise<{ contact: SiteContact; social: SiteSocial }> {
  "use cache";
  cacheTag(tags.settings);
  cacheLife("days");
  if (isDemo) return { contact: fallbackContact, social: fallbackSocial };
  const { data } = await createPublicClient().from("site_settings").select("key,value").in("key", ["contact", "social"]);
  const byKey = Object.fromEntries((data ?? []).map((r: Row) => [r.key, r.value]));
  return {
    contact: { ...fallbackContact, ...(byKey.contact ?? {}) },
    social: { ...fallbackSocial, ...(byKey.social ?? {}) },
  };
}

// ---------------------------------------------------------------------------
// Ressources publiques (story 15)
// ---------------------------------------------------------------------------
export type PublicResource = { id: string; title: string; description: string | null; fileName: string; mimeType: string; sizeBytes: number; createdAt: string };

export async function getPublicResources(): Promise<PublicResource[]> {
  "use cache";
  cacheTag(tags.documents);
  cacheLife("hours");
  if (isDemo) return [];
  const { data, error } = await createPublicClient()
    .from("documents")
    .select("id,title,description,file_name,mime_type,size_bytes,created_at")
    .eq("visibility", "public")
    .is("application_id", null)
    .order("created_at", { ascending: false });
  if (error) {
    // Colonne « description » absente tant que la migration 7 n'est pas appliquée
    const { data: fallback } = await createPublicClient()
      .from("documents")
      .select("id,title,file_name,mime_type,size_bytes,created_at")
      .eq("visibility", "public")
      .is("application_id", null)
      .order("created_at", { ascending: false });
    return (fallback ?? []).map((r: Row) => ({ ...toResource(r), description: null }));
  }
  return (data ?? []).map(toResource);
}

function toResource(r: Row): PublicResource {
  return {
    id: r.id as string,
    title: str(r.title) ?? (r.file_name as string),
    description: str(r.description),
    fileName: r.file_name as string,
    mimeType: r.mime_type as string,
    sizeBytes: Number(r.size_bytes),
    createdAt: r.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// Posts LinkedIn (synchronisés par Bright Data, voir src/lib/linkedin.ts)
// ---------------------------------------------------------------------------
export type LinkedinPost = {
  id: string;
  url: string;
  text: string | null;
  postedAt: string | null;
  image: string | null;
  likes: number | null;
  comments: number | null;
};

export async function getLinkedinPosts(limit = 3): Promise<LinkedinPost[]> {
  "use cache";
  cacheTag(tags.linkedin);
  cacheLife("hours");
  if (isDemo) return [];
  const { data, error } = await createPublicClient()
    .from("linkedin_posts")
    .select("id,url,text,posted_at,images,video_thumbnail,document_cover,num_likes,num_comments")
    .order("posted_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) return []; // table absente tant que la migration 12 n'est pas appliquée
  return (data ?? []).map((r: Row) => ({
    id: r.id as string,
    url: r.url as string,
    text: str(r.text),
    postedAt: str(r.posted_at),
    image: ((r.images as string[] | null) ?? [])[0] ?? str(r.video_thumbnail) ?? str(r.document_cover),
    likes: (r.num_likes as number | null) ?? null,
    comments: (r.num_comments as number | null) ?? null,
  }));
}
