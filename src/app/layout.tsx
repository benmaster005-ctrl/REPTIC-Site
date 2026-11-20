import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

// Police unique du site public : Schibsted Grotesk (variable, 400 à 900).
// Grotesque institutionnelle et ferme, chiffres nets pour les dates et le barème.
const siteFont = Schibsted_Grotesk({ variable: "--font-site", subsets: ["latin", "latin-ext"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "REPTIC.CM | Réseau des entreprises et professionnels du numérique au Cameroun",
    template: "%s | REPTIC.CM",
  },
  description:
    "Réseau des Entreprises & Professionnels du Secteur des Télécoms et du Numérique au Cameroun : missions, actualités, événements et adhésion en ligne.",
  openGraph: { type: "website", locale: "fr_CM", siteName: "REPTIC.CM" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#232d57" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${siteFont.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Active les animations d'apparition seulement si JS tourne : sans JS, tout reste visible. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
