import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { getSiteSettings } from "@/lib/data/public";
import { PageHero } from "@/components/ui/content";
import { ContactForm } from "@/components/forms/ContactForm";
import { heroBanners } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez REPTIC.CM : coordonnées, formulaire de contact et liens officiels.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const { contact, social } = await getSiteSettings();
  const socials = [
    social.facebook && { label: "Facebook", href: social.facebook },
    social.twitter && { label: "X (Twitter)", href: social.twitter },
    social.linkedin && { label: "LinkedIn", href: social.linkedin },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <>
      <PageHero image={heroBanners.contact} title="Contact" eyebrow="Nous écrire" summary="Une question sur l'association, l'adhésion ou un partenariat ? Le secrétariat vous répond." />
      <section className="container-site grid gap-14 py-16 sm:py-24 lg:grid-cols-12 lg:gap-6">
        <aside className="lg:col-span-3">
          <dl className="border-t-2 border-navy">
            <div className="border-b border-line py-5">
              <dt className="label">Adresse</dt>
              <dd className="mt-1.5 font-semibold text-navy">{contact.address}</dd>
            </div>
            <div className="border-b border-line py-5">
              <dt className="label">Téléphone</dt>
              <dd className="mt-1.5">
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="font-semibold text-navy hover:text-cyan-dark">
                  {contact.phone}
                </a>
              </dd>
            </div>
            <div className="border-b border-line py-5">
              <dt className="label">E-mail</dt>
              <dd className="mt-1.5">
                <a href={`mailto:${contact.email}`} className="font-semibold break-all text-navy hover:text-cyan-dark">
                  {contact.email}
                </a>
              </dd>
            </div>
            {contact.hours && (
              <div className="border-b border-line py-5">
                <dt className="label">Horaires</dt>
                <dd className="mt-1.5 font-semibold text-navy">{contact.hours}</dd>
              </div>
            )}
            {contact.dpo && (
              <div className="border-b border-line py-5">
                <dt className="label">Données personnelles</dt>
                <dd className="mt-1.5">
                  <a href={`mailto:${contact.dpo}`} className="font-semibold break-all text-navy hover:text-cyan-dark">
                    {contact.dpo}
                  </a>
                </dd>
              </div>
            )}
            {socials.length > 0 && (
              <div className="border-b border-line py-5">
                <dt className="label">Réseaux officiels</dt>
                <dd className="mt-2 space-y-1.5">
                  {socials.map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-semibold text-navy hover:text-cyan-dark">
                      {s.label} <ArrowUpRight aria-hidden className="size-3.5" />
                    </a>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </aside>
        <div className="lg:col-span-8 lg:col-start-5">
          <h2 className="heading-md">Envoyer un message</h2>
          <div className="mt-8">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
