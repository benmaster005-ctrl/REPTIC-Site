/**
 * Motif de marque : la trace de circuit du nuage « .cm » (nœud annulaire),
 * utilisé comme puce et repère de section.
 */

export function Node({ className = "size-2.5", tone = "cyan" }: { className?: string; tone?: "cyan" | "navy" | "white" }) {
  const color = tone === "cyan" ? "border-cyan" : tone === "navy" ? "border-navy" : "border-white";
  return <span aria-hidden className={`inline-block shrink-0 rounded-full border-2 bg-transparent ${color} ${className}`} />;
}

/**
 * Libellé de section (au-dessus d'un titre) : texte court dans la couleur
 * d'accent, sans majuscules ni ornement. Sur fond marine, un cyan éclairci
 * garde un contraste suffisant.
 */
export function SectionLabel({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "inverse" }) {
  return (
    <p className={`text-[0.95rem] font-semibold tracking-[-0.005em] ${tone === "inverse" ? "text-[#7cc4ea]" : "text-cyan-dark"}`}>{children}</p>
  );
}
