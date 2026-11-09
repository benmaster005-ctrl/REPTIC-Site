"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

/**
 * Apparition au défilement. L'élément est masqué uniquement si JavaScript est
 * actif (classe `js` posée sur <html>) : sans JS, le contenu reste visible.
 * Les styles sont dans globals.css ([data-reveal]).
 */

type Variant = "up" | "fade" | "line" | "group";

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => {
      el.dataset.shown = "";
    };
    // Déjà visible ou dépassé au chargement (retour arrière, ancre) : afficher sans attendre.
    if (!("IntersectionObserver" in window) || el.getBoundingClientRect().top < window.innerHeight * 0.92) {
      // Petit délai pour laisser la transition se jouer après le premier rendu.
      const t = window.setTimeout(show, 40);
      return () => window.clearTimeout(t);
    }
    window.addEventListener("beforeprint", show, { once: true });
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.shown = "";
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.removeEventListener("beforeprint", show);
    };
  }, []);
  return ref;
}

type RevealProps = {
  children?: ReactNode;
  as?: ElementType;
  variant?: Variant;
  delay?: number;
  className?: string;
  id?: string;
};

export function Reveal({ children, as: Tag = "div", variant = "up", delay = 0, className, id }: RevealProps) {
  const ref = useReveal<HTMLElement>();
  return (
    <Tag ref={ref} id={id} data-reveal={variant} className={className} style={delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined}>
      {children}
    </Tag>
  );
}

/** Conteneur dont les enfants directs apparaissent l'un après l'autre. */
export function RevealGroup(props: Omit<RevealProps, "variant">) {
  return <Reveal {...props} variant="group" />;
}
