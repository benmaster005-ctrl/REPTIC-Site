/**
 * Mention exigée par Google quand le badge reCAPTCHA est masqué (voir
 * globals.css) : elle doit figurer sur chaque formulaire protégé.
 * N'apparaît que si reCAPTCHA est configuré.
 */
export function RecaptchaNotice({ className = "", tone = "default" }: { className?: string; tone?: "default" | "inverse" }) {
  if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) return null;
  const text = tone === "inverse" ? "text-white/55" : "text-muted/80";
  const link = tone === "inverse" ? "underline underline-offset-2 hover:text-white" : "underline underline-offset-2 hover:text-navy";
  return (
    <p className={`text-[0.72rem] leading-snug ${text} ${className}`}>
      Ce site est protégé par reCAPTCHA. Les{" "}
      <a href="https://policies.google.com/privacy?hl=fr" target="_blank" rel="noopener noreferrer" className={link}>
        règles de confidentialité
      </a>{" "}
      et les{" "}
      <a href="https://policies.google.com/terms?hl=fr" target="_blank" rel="noopener noreferrer" className={link}>
        conditions d&apos;utilisation
      </a>{" "}
      de Google s&apos;appliquent.
    </p>
  );
}
