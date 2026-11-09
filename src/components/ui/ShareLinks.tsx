export function ShareLinks({ url, title }: { url: string; title: string }) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: "X", href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { label: "E-mail", href: `mailto:?subject=${t}&body=${u}` },
  ];
  return (
    <div>
      <p className="label">Partager</p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 lg:flex-col">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              aria-label={`Partager sur ${l.label}`}
              {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="text-[0.92rem] font-semibold text-navy hover:text-cyan-dark"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
