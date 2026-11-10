import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getEventBySlug } from "@/lib/data/public";
import { SITE_URL } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { PageHero, RichText } from "@/components/ui/content";
import { ReadingColumn } from "@/components/ui/editorial";
import { ShareLinks } from "@/components/ui/ShareLinks";

export async function generateMetadata({ params }: PageProps<"/evenements/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = await getEventBySlug(slug);
  if (!item) return { title: "Événement introuvable" };
  return {
    title: item.title,
    description: item.excerpt ?? undefined,
    alternates: { canonical: `/evenements/${item.slug}` },
    openGraph: { title: item.title, description: item.excerpt ?? undefined, images: item.coverUrl ? [item.coverUrl] : undefined },
  };
}

export default function EventPage({ params }: PageProps<"/evenements/[slug]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse border-b border-line bg-paper" />}>
      <EventDetail params={params} />
    </Suspense>
  );
}

async function EventDetail({ params }: Pick<PageProps<"/evenements/[slug]">, "params">) {
  const { slug } = await params;
  const item = await getEventBySlug(slug);
  if (!item) notFound();

  const longDate = (iso: string) => formatDate(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const time = (iso: string) => formatDate(iso, { hour: "2-digit", minute: "2-digit" });
  const sameDay = item.endsAt && formatDate(item.startsAt) === formatDate(item.endsAt);
  const facts = [
    { label: "Date", value: item.endsAt && !sameDay ? `Du ${longDate(item.startsAt)} au ${longDate(item.endsAt)}` : longDate(item.startsAt) },
    { label: "Horaire", value: item.endsAt && sameDay ? `${time(item.startsAt)} – ${time(item.endsAt)}` : time(item.startsAt) },
    ...(item.locationName || item.city ? [{ label: "Lieu", value: [item.locationName, item.city].filter(Boolean).join(", ") }] : []),
  ];

  return (
    <article>
      <PageHero image={item.coverUrl} title={item.title} summary={item.excerpt} crumbs={[{ label: "Événements", href: "/evenements" }]} eyebrow={item.category ?? "Événement"} />
      <ReadingColumn
        aside={
          <div className="space-y-8 lg:sticky lg:top-36">
            <dl className="border-t-2 border-navy">
              {facts.map((f) => (
                <div key={f.label} className="border-b border-line py-4">
                  <dt className="label">{f.label}</dt>
                  <dd className="mt-1.5 font-semibold text-navy first-letter:uppercase">{f.value}</dd>
                </div>
              ))}
            </dl>
            {item.registrationEnabled ? (
              <Link href="/espace/evenements" className="btn-primary w-full justify-between">
                S&apos;inscrire <ArrowRight aria-hidden className="size-4" />
              </Link>
            ) : (
              <p className="border-l-[3px] border-line-strong pl-4 text-[0.9rem] text-muted">Inscriptions non ouvertes pour cet événement.</p>
            )}
            <ShareLinks url={`${SITE_URL}/evenements/${item.slug}`} title={item.title} />
          </div>
        }
      >
        <RichText>{item.body}</RichText>
        <Link href="/evenements" className="link-arrow mt-16">
          <ArrowLeft aria-hidden className="size-4" /> Tous les événements
        </Link>
      </ReadingColumn>
    </article>
  );
}
