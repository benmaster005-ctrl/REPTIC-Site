"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import logo from "../../../public/brand/logo-reptic.svg";
import logoWhite from "../../../public/brand/logo-reptic-blanc.svg";

const STORAGE_KEY = "reptic-sidebar-reduite";

/**
 * Coque des espaces de travail (espace membre, administration) : univers
 * « application », distinct du site public.
 * - Ordinateur : barre latérale fixe, réductible en rail d'icônes (bouton dans
 *   la barre supérieure, choix mémorisé dans le navigateur).
 * - Mobile : tiroir qui glisse depuis la gauche, avec bouton de fermeture,
 *   fermeture au clic sur le voile, à la touche Échap et au changement de page.
 * Les contenus (navigation, carte utilisateur, actions) arrivent en « slots »
 * rendus côté serveur.
 */
export function AppShell({ product, nav, account, topbar, children }: {
  /** Nom de l'espace (« Espace membre », « Administration »). */
  product: string;
  nav: React.ReactNode;
  account: React.ReactNode;
  topbar?: React.ReactNode;
  children: React.ReactNode;
}) {

  // Pas de lecture de l'URL ici (usePathname) : avec Cache Components, elle bloquerait
  // le prérendu de toutes les pages. Le tiroir se referme au clic sur un lien.
  const [open, setOpen] = useState(false);

  const [collapsed, setCollapsed] = useState(false);

  // Choix « barre réduite » mémorisé (confort de chaque visiteur, sans garantie)
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
    } catch {}
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(STORAGE_KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });
  };

  // Tiroir mobile : page figée derrière, fermeture à la touche Échap
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const brand = (withClose: boolean) => (
    <div className="flex h-16 shrink-0 items-center gap-3 px-5 lg:group-data-[collapsed=true]/shell:justify-center lg:group-data-[collapsed=true]/shell:px-0">
      <Link href="/" aria-label="REPTIC.CM, retour au site" className="shrink-0">
        <Image src={logo} alt="REPTIC.CM" priority unoptimized className="h-7 w-auto dark:hidden lg:group-data-[collapsed=true]/shell:hidden" />
        <Image src={logoWhite} alt="REPTIC.CM" priority unoptimized className="hidden h-7 w-auto dark:block lg:group-data-[collapsed=true]/shell:hidden" />
        <span aria-hidden className="hidden size-9 place-items-center rounded-lg bg-navy text-[0.8rem] font-bold text-white lg:group-data-[collapsed=true]/shell:grid">R</span>
      </Link>
      <span className="rounded-md bg-cyan-tint px-2 py-0.5 text-[0.72rem] font-semibold text-cyan-dark lg:group-data-[collapsed=true]/shell:hidden">{product}</span>
      {withClose && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fermer le menu"
          className="ml-auto grid size-9 place-items-center rounded-lg text-muted hover:bg-ice hover:text-heading"
        >
          <X aria-hidden className="size-5" />
        </button>
      )}
    </div>
  );

  const body = (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">{nav}</div>
      <div className="shrink-0 border-t border-line p-3">{account}</div>
    </>
  );

  return (
    <div data-collapsed={collapsed} className="group/shell">
      {/* Barre latérale fixe (ordinateur), réductible en rail d'icônes */}
      <aside
        aria-label={product}
        className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface transition-[width] duration-300 ease-[var(--ease-out)] group-data-[collapsed=true]/shell:w-[4.5rem] lg:flex print:hidden"
      >
        {brand(false)}
        {body}
      </aside>

      {/* Tiroir (mobile) : toujours monté pour pouvoir glisser à l'ouverture comme à la fermeture */}
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Fermer le menu"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/45 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          inert={!open}
          // Un clic sur un lien du tiroir (navigation) le referme
          onClickCapture={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col border-r border-line bg-surface shadow-2xl transition-transform duration-300 ease-[var(--ease-out)] ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {brand(true)}
          {body}
        </aside>
      </div>

      <div className="flex min-h-screen flex-col transition-[padding] duration-300 ease-[var(--ease-out)] lg:pl-64 lg:group-data-[collapsed=true]/shell:pl-[4.5rem]">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/85 px-4 backdrop-blur-md sm:px-6 print:hidden">
          {/* Mobile : ouvre le tiroir */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            className="-ml-1.5 grid size-9 place-items-center rounded-lg text-heading hover:bg-ice lg:hidden"
          >
            <Menu aria-hidden className="size-5" />
          </button>
          {/* Ordinateur : réduit ou déploie la barre latérale */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Déployer le menu" : "Réduire le menu"}
            title={collapsed ? "Déployer le menu" : "Réduire le menu"}
            className="-ml-2 hidden size-9 place-items-center rounded-lg text-muted hover:bg-ice hover:text-heading lg:grid"
          >
            {collapsed ? <PanelLeftOpen aria-hidden className="size-[1.15rem]" /> : <PanelLeftClose aria-hidden className="size-[1.15rem]" />}
          </button>
          <span className="text-[0.9rem] font-semibold text-heading lg:hidden">{product}</span>
          <div className="ml-auto flex items-center gap-1.5">{topbar}</div>
        </header>
        <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
