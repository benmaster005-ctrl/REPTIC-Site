"use client";

import { useEffect, useRef, useState } from "react";
import { CountUp } from "@/components/motion/CountUp";

/**
 * Chiffre clé animé : la valeur monte quand le bloc entre dans l'écran, et une
 * frise de 2017 à l'année en cours se remplit segment par segment.
 * `since` : année de départ de la frise (création du réseau).
 */
export function AnimatedFigure({ value, since = 2017 }: { value: string; since?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    // Année du visiteur, connue seulement dans le navigateur.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setYear(new Date().getFullYear());
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const steps = 5;
  return (
    <div ref={ref}>
      <span className="text-[4.2rem] leading-[0.9] font-bold tracking-[-0.05em] text-heading sm:text-[5rem]">
        <CountUp value={value} />
      </span>
      <div aria-hidden className="mt-5 flex gap-1">
        {Array.from({ length: steps }, (_, i) => (
          <span
            key={i}
            className="h-1.5 flex-1 origin-left rounded-full transition-transform duration-500 ease-[var(--ease-out)]"
            style={{
              background: `color-mix(in srgb, var(--color-navy) ${35 + i * 16}%, var(--color-cyan))`,
              transform: shown ? "scaleX(1)" : "scaleX(0)",
              transitionDelay: `${300 + i * 110}ms`,
            }}
          />
        ))}
      </div>
      <div aria-hidden className="mt-1.5 flex justify-between text-[0.75rem] text-muted">
        <span>{since}</span>
        <span>{year ?? ""}</span>
      </div>
    </div>
  );
}
