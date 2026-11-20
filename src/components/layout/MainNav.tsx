"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { heroBanners, type NavItem } from "@/content/site";

/** Photo d'aperçu d'un lien du menu : la bannière de la page visée. */
const previewFor = (href: string) => heroBanners[href.replace(/^\//, "") as keyof typeof heroBanners] ?? heroBanners.default;

const linkBase =
  "nav-link flex h-10 items-center gap-1 rounded-full px-2.5 text-[0.9rem] xl:px-3.5 font-semibold whitespace-nowrap text-navy transition-colors hover:bg-ice aria-expanded:bg-ice";

export function MainNav({ items, cta, mobileExtra }: { items: NavItem[]; cta: React.ReactNode; mobileExtra: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    }
    function onClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  const close = () => {
    setOpenMenu(null);
    setMobileOpen(false);
  };

  return (
    <>
      <nav ref={navRef} aria-label="Navigation principale" className="hidden items-center lg:flex">
        {items.map((item) =>
          item.children ? (
            <div
              key={item.label}
              className="relative"
              onMouseLeave={() => {
                setOpenMenu(null);
                setPreview(null);
              }}
            >
              <button
                type="button"
                aria-expanded={openMenu === item.label}
                onClick={() => setOpenMenu(openMenu === item.label ? null : item.label)}
                onMouseEnter={() => setOpenMenu(item.label)}
                className={linkBase}
              >
                {item.label}
                <ChevronDown aria-hidden className={`size-3.5 transition-transform ${openMenu === item.label ? "rotate-180" : ""}`} />
              </button>
              {openMenu === item.label && (
                // Menu enrichi : liste à gauche, aperçu photo à droite qui suit le lien survolé
                <div className="menu-pop absolute top-full left-0 z-50 pt-3">
                  <div className="grid w-[34rem] grid-cols-[1fr_13rem] gap-2 rounded-3xl bg-white p-2 shadow-[0_18px_50px_-16px_rgb(20_26_51/0.3)] ring-1 ring-line">
                    <ul className="py-1">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={close}
                            onMouseEnter={() => setPreview(child.href)}
                            onFocus={() => setPreview(child.href)}
                            className="group block rounded-2xl px-4 py-3 transition-colors hover:bg-ice focus-visible:bg-ice"
                          >
                            <span className="block text-[0.92rem] font-semibold text-navy">{child.label}</span>
                            {child.description && <span className="mt-0.5 block text-[0.8rem] text-muted">{child.description}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="relative overflow-hidden rounded-2xl bg-ice">
                      {item.children.map((child) => (
                        <Image
                          key={child.href}
                          src={previewFor(child.href)}
                          alt=""
                          fill
                          sizes="208px"
                          className={`object-cover transition-opacity duration-300 ${(preview ?? item.children![0].href) === child.href ? "opacity-100" : "opacity-0"}`}
                        />
                      ))}
                      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy-deep/70 to-transparent" />
                      <span className="absolute inset-x-0 bottom-0 p-4 text-[0.85rem] font-semibold text-white">
                        {item.children.find((c) => c.href === (preview ?? item.children![0].href))?.label}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link key={item.href} href={item.href} className={linkBase}>
              {item.label}
            </Link>
          ),
        )}
      </nav>

      <div className="hidden lg:block">{cta}</div>

      <button
        type="button"
        className="nav-link flex h-11 items-center gap-2.5 rounded-full px-3 text-sm font-semibold text-navy lg:hidden"
        aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={mobileOpen}
        aria-controls="menu-mobile"
        onClick={() => setMobileOpen((v) => !v)}
      >
        <span>{mobileOpen ? "Fermer" : "Menu"}</span>
        <span aria-hidden className="relative block h-3 w-6">
          <span className={`nav-bar absolute left-0 h-[2px] w-6 bg-navy transition-transform ${mobileOpen ? "top-[5px] rotate-45" : "top-0"}`} />
          <span className={`nav-bar absolute left-0 h-[2px] bg-navy transition-all ${mobileOpen ? "top-[5px] w-6 -rotate-45" : "top-[10px] w-4"}`} />
        </span>
      </button>

      {/* Rendu dans <body> : à l'intérieur de la pastille floutée (backdrop-filter),
          un élément « fixed » serait enfermé dans la pastille et invisible. */}
      {mobileOpen &&
        createPortal(
        <div id="menu-mobile" className="menu-pop fixed inset-x-2 top-[5.75rem] bottom-2 z-40 sm:inset-x-3 sm:top-[6.25rem] lg:hidden">
          <nav aria-label="Navigation mobile" className="h-full overflow-y-auto rounded-[1.75rem] bg-white px-6 py-4 shadow-[0_24px_60px_-20px_rgb(20_26_51/0.35)] ring-1 ring-line">
            {items.map((item) =>
              item.children ? (
                <div key={item.label} className="border-b border-line py-4">
                  <p className="label">{item.label}</p>
                  {item.children.map((child) => (
                    <Link key={child.href} href={child.href} onClick={close} className="block py-2.5 font-display text-xl font-bold text-navy">
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link key={item.href} href={item.href} onClick={close} className="block border-b border-line py-4 font-display text-xl font-bold text-navy">
                  {item.label}
                </Link>
              ),
            )}
            <div className="mt-8 grid gap-3 pb-4" onClick={close}>
              {mobileExtra}
              <Link href="/adhesion" className="btn-primary w-full">
                Adhérer
              </Link>
            </div>
          </nav>
        </div>,
          document.body,
        )}
    </>
  );
}
