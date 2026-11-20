"use client";

import { useEffect, useRef } from "react";

/**
 * En-tête fixe, toujours visible pendant le défilement.
 * « data-scrolled » passe la barre du mode transparent (sur la bannière) au
 * mode pastille dès que la page a défilé.
 */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let ticking = false;

    const update = () => {
      if (window.scrollY > 8) el.dataset.scrolled = "";
      else delete el.dataset.scrolled;
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

  return (
    <header ref={ref} className="site-header fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-6" style={{ viewTransitionName: "site-header" }}>
      {children}
    </header>
  );
}
