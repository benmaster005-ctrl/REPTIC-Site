import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowUpRight, Globe, Mail, MapPin, Phone } from "lucide-react";
import { getSpaceContext } from "@/lib/space";
import { getMemberProfile } from "@/lib/data/member";
import { applicantTypeLabels } from "@/lib/membership";
import { formatDate, initials } from "@/lib/format";
import { MembersOnly, Panel } from "@/components/space/ui";
import { SectionLabel } from "@/components/brand/Trace";

export const metadata: Metadata = { title: "Fiche membre" };

export default function MemberProfilePage({ params }: PageProps<"/espace/annuaire/[id]">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Profile params={params} />
    </Suspense>
  );
}

async function Profile({ params }: Pick<PageProps<"/espace/annuaire/[id]">, "params">) {
  const { isMember } = await getSpaceContext("/espace/annuaire");
  if (!isMember) return <MembersOnly feature="L'annuaire" />;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const m = await getMemberProfile(id);
  if (!m) notFound();

  const phone = m.phone ?? m.organizationPhone;
  const contacts = [
    phone && { icon: Phone, label: "Téléphone", value: phone, href: `tel:${phone.replace(/\s/g, "")}` },
    m.organizationEmail && { icon: Mail, label: "E-mail", value: m.organizationEmail, href: `mailto:${m.organizationEmail}` },
    m.website && { icon: Globe, label: "Site web", value: m.website.replace(/^https?:\/\//, "").replace(/\/$/, ""), href: m.website, external: true },
    (m.organizationAddress || m.city) && { icon: MapPin, label: "Adresse", value: [m.organizationAddress, m.city].filter(Boolean).join(", ") },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string; external?: boolean }[];

  return (
    <>
      <Link href="/espace/annuaire" className="link-arrow mb-6">
        <ArrowLeft aria-hidden className="size-4" /> Annuaire
      </Link>

      <Panel>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <span aria-hidden className="grid size-20 shrink-0 place-items-center bg-navy font-display text-2xl font-extrabold text-white">
            {initials(m.name)}
          </span>
          <div className="min-w-0 flex-1">
            <SectionLabel>{applicantTypeLabels[m.memberType]}</SectionLabel>
            <h1 className="heading-md mt-3">{m.name}</h1>
            <p className="mt-1 text-[1.02rem] text-muted">{[m.profession, m.legalForm, m.city].filter(Boolean).join(" · ")}</p>
            {m.category && <p className="label mt-3 text-cyan-dark">{m.category}</p>}
          </div>
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-12">
        <Panel className="xl:col-span-7">
          <h2 className="label">Présentation</h2>
          {m.bio || m.organizationDescription ? (
            <div className="mt-4 space-y-4 text-[1rem] leading-relaxed whitespace-pre-line text-ink">
              {m.organizationDescription && <p>{m.organizationDescription}</p>}
              {m.bio && <p>{m.bio}</p>}
            </div>
          ) : (
            <p className="mt-4 text-muted">Ce membre n&apos;a pas encore rédigé de présentation.</p>
          )}
          {m.contactName && (
            <p className="mt-6 border-t border-line pt-4 text-[0.92rem] text-muted">
              Contact référent : <span className="font-semibold text-navy">{m.contactName}</span>
            </p>
          )}
        </Panel>

        <Panel className="xl:col-span-5">
          <h2 className="label">Coordonnées</h2>
          {contacts.length ? (
            <ul className="mt-4 border-t-2 border-navy">
              {contacts.map(({ icon: Icon, label, value, href, external }) => (
                <li key={label} className="flex gap-3 border-b border-line py-3.5">
                  <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-cyan-dark" />
                  <span className="min-w-0">
                    <span className="block text-[0.78rem] text-muted">{label}</span>
                    {href ? (
                      <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="inline-flex items-center gap-1 font-semibold break-all text-navy hover:text-cyan-dark">
                        {value}
                        {external && <ArrowUpRight aria-hidden className="size-3.5 shrink-0" />}
                      </a>
                    ) : (
                      <span className="font-semibold text-navy">{value}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[0.92rem] text-muted">Ce membre n&apos;a pas rendu ses coordonnées visibles.</p>
          )}
          <p className="mt-5 font-mono text-[0.72rem] text-muted">
            {m.memberNumber ? `${m.memberNumber} · ` : ""}
            {m.memberSince ? `membre depuis ${formatDate(m.memberSince, { month: "long", year: "numeric" })}` : ""}
          </p>
        </Panel>
      </div>
      <p className="mt-6 text-[0.85rem] text-muted">Les informations affichées sont celles que le membre a choisi de rendre visibles dans l&apos;annuaire.</p>
    </>
  );
}
