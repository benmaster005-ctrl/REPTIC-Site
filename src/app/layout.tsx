import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], weight: "variable", display: "swap" });
const plex = IBM_Plex_Sans({ variable: "--font-plex", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"], display: "swap" });

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
    <html lang="fr" className={`${archivo.variable} ${plex.variable} ${plexMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Active les animations d'apparition seulement si JS tourne : sans JS, tout reste visible. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
