import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
import { getAllEventSlugs, getAllNewsSlugs } from "@/lib/data/public";

const staticRoutes = [
  "",
  "/presentation",
  "/objectifs-missions",
  "/mot-du-president",
  "/gouvernance",
  "/acteurs",
  "/adhesion",
  "/actualites",
  "/evenements",
  "/ressources",
  "/contact",
  "/mentions-legales",
  "/confidentialite",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [news, events] = await Promise.all([getAllNewsSlugs(), getAllEventSlugs()]);
  return [
    ...staticRoutes.map((path) => ({ url: `${SITE_URL}${path}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 })),
    ...news.map((n) => ({ url: `${SITE_URL}/actualites/${n.slug}`, lastModified: n.publishedAt, priority: 0.6 })),
    ...events.map((slug) => ({ url: `${SITE_URL}/evenements/${slug}`, priority: 0.6 })),
  ];
}
