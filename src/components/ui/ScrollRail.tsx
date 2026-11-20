"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Bande défilante horizontale (Bureau, actualités).
 * - Doigt et pavé tactile : défilement natif avec aimantation.
 * - Souris : boutons précédent / suivant (la molette garde le défilement de
 *   la page, pour ne jamais piéger le visiteur dans la bande).
 * - Clavier : la bande reçoit le focus, flèches gauche / droite.
 */
export function ScrollRail({ children, className = "", label }: { children: React.ReactNode; className?: string; label: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const step = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
    // Filet de sécurité : l'état des boutons est recalculé après l'animation.
    window.setTimeout(update, 450);
  };

  const btn =
    "grid size-11 place-items-center rounded-full bg-surface text-heading shadow-[0_6px_20px_-8px_rgb(20_26_51/0.35)] ring-1 ring-line transition-[opacity,transform] hover:scale-105 disabled:pointer-events-none disabled:opacity-0";

  return (
    <div className="relative">
      <ul
        ref={ref}
        data-stagger
        tabIndex={0}
        aria-label={label}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
        className={`flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan [&::-webkit-scrollbar]:hidden ${className}`}
      >
        {children}
      </ul>
      <div className="pointer-events-none absolute inset-y-0 right-3 left-3 hidden items-center justify-between [@media(hover:hover)]:flex">
        <button type="button" onClick={() => step(-1)} disabled={atStart} aria-label="Précédent" className={`pointer-events-auto ${btn}`}>
          <ChevronLeft aria-hidden className="size-5" />
        </button>
        <button type="button" onClick={() => step(1)} disabled={atEnd} aria-label="Suivant" className={`pointer-events-auto ${btn}`}>
          <ChevronRight aria-hidden className="size-5" />
        </button>
      </div>
    </div>
  );
}
