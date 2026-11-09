"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { NavItem } from "@/content/site";

const linkBase =
  "relative flex h-[4.75rem] items-center gap-1 px-3 text-[0.92rem] font-semibold text-navy transition-colors hover:text-cyan-dark after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:origin-left after:scale-x-0 after:bg-cyan after:transition-transform hover:after:scale-x-100";

export function MainNav({ items, cta, mobileExtra }: { items: NavItem[]; cta: React.ReactNode; mobileExtra: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
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
            <div key={item.label} className="relative" onMouseLeave={() => setOpenMenu(null)}>
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
                <div className="absolute top-full left-0 z-50 w-80 border border-t-0 border-line bg-white">
                  <ul>
                    {item.children.map((child) => (
                      <li key={child.href} className="border-t border-line first:border-t-0">
                        <Link href={child.href} onClick={close} className="group block px-5 py-4 hover:bg-paper">
                          <span className="block text-[0.92rem] font-semibold text-navy group-hover:text-cyan-dark">{child.label}</span>
                          {child.description && <span className="mt-0.5 block text-[0.8rem] text-muted">{child.description}</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
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
        className="flex h-11 items-center gap-2.5 px-1 text-sm font-semibold text-navy lg:hidden"
        aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={mobileOpen}
        aria-controls="menu-mobile"
        onClick={() => setMobileOpen((v) => !v)}
      >
        <span>{mobileOpen ? "Fermer" : "Menu"}</span>
        <span aria-hidden className="relative block h-3 w-6">
          <span className={`absolute left-0 h-[2px] w-6 bg-navy transition-transform ${mobileOpen ? "top-[5px] rotate-45" : "top-0"}`} />
          <span className={`absolute left-0 h-[2px] bg-navy transition-all ${mobileOpen ? "top-[5px] w-6 -rotate-45" : "top-[10px] w-4"}`} />
        </span>
      </button>

      {mobileOpen && (
        <div id="menu-mobile" className="fixed inset-x-0 top-[4.8rem] md:top-[7.05rem] bottom-0 z-40 overflow-y-auto border-t border-line bg-white lg:hidden">
          <nav aria-label="Navigation mobile" className="container-site py-4">
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
            <div className="mt-8 grid gap-3" onClick={close}>
              {cta}
              {mobileExtra}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
