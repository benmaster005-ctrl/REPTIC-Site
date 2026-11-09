"use client";

import { useEffect, useRef } from "react";

/**
 * En-tête collant qui se retire quand on descend et revient dès qu'on remonte.
 * Reste visible près du haut de page et quand le focus clavier y est.
 */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const goingDown = y > lastY + 4;
      const goingUp = y < lastY - 4;
      if (y < 160 || goingUp || el.contains(document.activeElement)) delete el.dataset.hidden;
      else if (goingDown) el.dataset.hidden = "";
      if (y > 8) el.dataset.scrolled = "";
      else delete el.dataset.scrolled;
      if (goingDown || goingUp) lastY = y;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    const onFocus = () => delete el.dataset.hidden;

    window.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("focusin", onFocus);
    return () => {
      window.removeEventListener("scroll", onScroll);
      el.removeEventListener("focusin", onFocus);
    };
  }, []);

  return (
    <header ref={ref} className="site-header sticky top-0 z-50 bg-white" style={{ viewTransitionName: "site-header" }}>
      {children}
    </header>
  );
}
