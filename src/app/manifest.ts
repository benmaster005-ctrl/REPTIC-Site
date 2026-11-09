import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "REPTIC.CM",
    short_name: "REPTIC.CM",
    description: "Réseau des Entreprises & Professionnels du Secteur des Télécoms et du Numérique au Cameroun",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#232d57",
    lang: "fr",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
