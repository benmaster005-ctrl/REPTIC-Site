"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Bouton « Revenir en haut » : apparaît après un écran de défilement, en bas à
 * droite ; remonte en douceur (immédiatement si le visiteur a demandé de
 * réduire les animations). Le focus revient au début de la page.
 */
export function BackToTop() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      setShown(window.scrollY > window.innerHeight * 0.8);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    document.getElementById("contenu")?.focus({ preventScroll: true });
  };

  return (
    <button
      type="button"
      onClick={goTop}
      aria-label="Revenir en haut de la page"
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
      className={`group fixed z-40 grid size-12 place-items-center rounded-full bg-navy text-white shadow-[0_12px_30px_-10px_rgb(20_26_51/0.55)] ring-1 ring-white/15 transition-[opacity,transform,background-color] duration-300 ease-[var(--ease-out)] hover:bg-cyan-dark focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-cyan bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))] right-[max(1.25rem,env(safe-area-inset-right,0px))] sm:size-13 ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp aria-hidden className="size-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
    </button>
  );
}
