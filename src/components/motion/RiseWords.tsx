import { Fragment, type CSSProperties } from "react";

/**
 * Titre dont les mots montent l'un après l'autre depuis une ligne de masque.
 * Animation CSS jouée au chargement, sans JavaScript.
 */
export function RiseWords({ text, accent, start = 0, step = 70 }: { text: string; accent?: string; start?: number; step?: number }) {
  const words = text.split(" ");
  return (
    <>
      <span className="sr-only">
        {text}
        {accent}
      </span>
      <span aria-hidden>
        {words.map((w, i) => (
          <Fragment key={i}>
            <span className="rise-mask">
              <span className="rise-word" style={{ "--rise-delay": `${start + i * step}ms` } as CSSProperties}>
                {w}
                {i === words.length - 1 && accent && <span className="text-cyan">{accent}</span>}
              </span>
            </span>
            {/* L'espace doit rester hors du bloc masqué, sinon il est absorbé. */}
            {i < words.length - 1 && " "}
          </Fragment>
        ))}
      </span>
    </>
  );
}
