"use client";

import { useEffect, useRef } from "react";

/**
 * Compteur animé pour les chiffres clés (« 100+ », « 21 », « 5+ »).
 * Le rendu serveur affiche la valeur finale ; l'animation écrit directement
 * dans le DOM (pas de re-rendu React à chaque image). Les années (≥ 1900) et
 * les valeurs non numériques restent fixes.
 */
export function CountUp({ value, duration = 1600 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const match = value.match(/^(\D*)(\d+)(.*)$/);
    if (!el || !match) return;
    const [, prefix, digits, suffix] = match;
    const target = Number(digits);
    if (target >= 1900 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    el.textContent = `${prefix}0${suffix}`;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // easeOutExpo
          el.textContent = `${prefix}${Math.round(target * eased)}${suffix}`;
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = value;
    };
  }, [value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
    </span>
  );
}
