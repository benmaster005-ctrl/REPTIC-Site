import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getSiteSettings } from "@/lib/data/public";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { SectionLabel } from "@/components/brand/Trace";
import { Logo } from "./Logo";

const footerLinks = [
  {
    title: "Le REPTIC",
    links: [
      { label: "Présentation", href: "/presentation" },
      { label: "Objectifs & missions", href: "/objectifs-missions" },
      { label: "Mot du Président", href: "/mot-du-president" },
      { label: "Bureau exécutif", href: "/gouvernance" },
    ],
  },
  {
    title: "Membres",
    links: [
      { label: "Nomenclature des acteurs", href: "/acteurs" },
      { label: "Adhérer", href: "/adhesion" },
      { label: "Espace membre", href: "/connexion" },
    ],
  },
  {
    title: "Informations",
    links: [
      { label: "Actualités", href: "/actualites" },
      { label: "Événements", href: "/evenements" },
      { label: "Ressources", href: "/ressources" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export async function SiteFooter() {
  "use cache";
  const { contact, social } = await getSiteSettings();
  const year = new Date().getFullYear();
  const socials = [
    social.facebook && { label: "Facebook", href: social.facebook },
    social.twitter && { label: "X (Twitter)", href: social.twitter },
    social.linkedin && { label: "LinkedIn", href: social.linkedin },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="container-site grid gap-12 py-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo className="h-14 w-auto" />
          <address className="mt-8 space-y-1.5 text-[0.92rem] text-muted not-italic">
            <p>{contact.address}</p>
            <p>
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="text-navy hover:text-cyan-dark">
                {contact.phone}
              </a>
            </p>
            <p>
              <a href={`mailto:${contact.email}`} className="text-navy hover:text-cyan-dark">
                {contact.email}
              </a>
            </p>
          </address>
          {socials.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-navy hover:text-cyan-dark">
                    {s.label} <ArrowUpRight aria-hidden className="size-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid gap-10 sm:grid-cols-3 lg:col-span-5">
          {footerLinks.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="label">{col.title}</h2>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="text-[0.92rem] text-navy hover:text-cyan-dark">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="lg:col-span-3">
          <SectionLabel>Lettre d&apos;information</SectionLabel>
          <p className="mt-4 mb-5 text-[0.92rem] text-muted">Les actualités et les rendez-vous du réseau, une fois par mois.</p>
          <NewsletterForm />
        </div>
      </div>

      <div className="bg-navy text-white/65">
        <div className="container-site flex flex-col gap-3 py-5 text-[0.8rem] sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} REPTIC.CM</p>
          <div className="flex gap-6">
            <Link href="/mentions-legales" className="hover:text-white">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="hover:text-white">
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
