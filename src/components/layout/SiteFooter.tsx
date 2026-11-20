import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getSiteSettings } from "@/lib/data/public";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
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
    <footer className="mx-auto mt-auto w-full max-w-[90rem] px-2 pt-3 pb-2 sm:px-3 sm:pb-3">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-navy-deep text-white sm:rounded-[2rem]">
        <div className="grid gap-12 p-8 sm:p-12 lg:grid-cols-12 lg:p-16">
          <div className="lg:col-span-4">
            <Logo tone="white" className="h-12 w-auto" />
            <address className="mt-8 space-y-1.5 text-[0.92rem] text-white/65 not-italic">
              <p>{contact.address}</p>
              {contact.hours && <p>{contact.hours}</p>}
              <p>
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="text-white hover:text-cyan">
                  {contact.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${contact.email}`} className="text-white hover:text-cyan">
                  {contact.email}
                </a>
              </p>
            </address>
            {socials.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ring-white/20 transition-colors hover:bg-white hover:text-navy"
                    >
                      {s.label} <ArrowUpRight aria-hidden className="size-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-10 sm:grid-cols-3 lg:col-span-4">
            {footerLinks.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h2 className="text-[0.95rem] font-semibold">{col.title}</h2>
                <ul className="mt-5 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className="text-[0.92rem] text-white/65 hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="rounded-3xl bg-surface p-6 text-ink lg:col-span-4">
            <h2 className="text-[1.05rem] font-semibold text-heading">Lettre d&apos;information</h2>
            <p className="mt-2 mb-5 text-[0.92rem] text-muted">Les actualités et les rendez-vous du réseau, une fois par mois.</p>
            <NewsletterForm />
          </div>
        </div>

        {/* Nom du réseau en très grand, rogné en bas du panneau */}
        <p aria-hidden className="pointer-events-none -mb-[0.2em] px-6 text-[17vw] leading-[0.8] font-bold tracking-[-0.06em] text-white/[0.06] select-none xl:text-[15.5rem]">
          REPTIC.CM
        </p>

        <div className="relative flex flex-col gap-3 border-t border-white/10 px-8 py-5 text-[0.8rem] text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-12 lg:px-16">
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
