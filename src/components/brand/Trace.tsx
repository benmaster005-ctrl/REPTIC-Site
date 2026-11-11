/**
 * Motif de marque : la trace de circuit du nuage « .cm » (nœud annulaire),
 * utilisé comme puce et repère de section.
 */

export function Node({ className = "size-2.5", tone = "cyan" }: { className?: string; tone?: "cyan" | "navy" | "white" }) {
  const color = tone === "cyan" ? "border-cyan" : tone === "navy" ? "border-navy" : "border-white";
  return <span aria-hidden className={`inline-block shrink-0 rounded-full border-2 bg-transparent ${color} ${className}`} />;
}

/** Libellé de section : nœud + texte mono. */
export function SectionLabel({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "inverse" }) {
  return (
    <p className={`flex items-center gap-2.5 ${tone === "inverse" ? "text-white/70" : ""}`}>
      <Node className="size-2" tone={tone === "inverse" ? "white" : "cyan"} />
      <span className={`label ${tone === "inverse" ? "text-white/70" : ""}`}>{children}</span>
    </p>
  );
}
