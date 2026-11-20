"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "../../../public/brand/logo-reptic.svg";
import logoWhite from "../../../public/brand/logo-reptic-blanc.svg";

/**
 * Coque des espaces de travail (espace membre, administration) : univers
 * « application », distinct du site public.
 * - Ordinateur : barre latérale fixe (logo, navigation, carte utilisateur)
 *   et barre supérieure fine.
 * - Mobile : la barre latérale s'ouvre en tiroir depuis le bouton menu.
 * Les contenus (navigation, carte utilisateur, actions) arrivent en « slots »
 * rendus côté serveur.
 */
export function AppShell({ product, nav, account, topbar, children }: {
  /** Nom de l'espace, affiché sous le logo (« Espace membre », « Administration »). */
  product: string;
  nav: React.ReactNode;
  account: React.ReactNode;
  topbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname; // le tiroir se referme dès que la page change

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 px-5">
        <Link href="/" aria-label="REPTIC.CM, retour au site" className="shrink-0">
          <Image src={logo} alt="REPTIC.CM" priority unoptimized className="h-7 w-auto dark:hidden" />
          <Image src={logoWhite} alt="REPTIC.CM" priority unoptimized className="hidden h-7 w-auto dark:block" />
        </Link>
        <span className="rounded-md bg-cyan-tint px-2 py-0.5 text-[0.72rem] font-semibold text-cyan-dark">{product}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">{nav}</div>
      <div className="border-t border-line p-3">{account}</div>
    </div>
  );

  return (
    <>
      {/* Barre latérale fixe (ordinateur) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-surface lg:block print:hidden">{sidebar}</aside>

      {/* Tiroir (mobile) */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Fermer le menu" className="absolute inset-0 bg-black/40" onClick={() => setOpenFor(null)} />
          <aside className="menu-pop absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-line bg-surface shadow-xl">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-md sm:px-6 print:hidden">
          <button
            type="button"
            onClick={() => setOpenFor(open ? null : pathname)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            className="-ml-1.5 grid size-9 place-items-center rounded-lg text-heading hover:bg-ice lg:hidden"
          >
            {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
          </button>
          <span className="text-[0.9rem] font-semibold text-heading lg:hidden">{product}</span>
          <div className="ml-auto flex items-center gap-1.5">{topbar}</div>
        </header>
        <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </>
  );
}
