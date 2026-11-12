import { Inter } from "next/font/google";

/**
 * Police des espaces de travail (espace membre, administration) : Inter.
 * Plus compacte que Poppins à taille égale, très lisible en petit corps,
 * chiffres alignés pour les montants et les dates. Le site public garde Poppins.
 * Chargée seulement par ces deux espaces (préchargement limité à leurs pages).
 */
export const appFont = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"], display: "swap" });
