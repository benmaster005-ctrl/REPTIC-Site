import { locale } from "@/i18n/fr";

const TZ = "Africa/Douala";

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  return new Intl.DateTimeFormat(locale, { timeZone: TZ, ...opts }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return formatDate(iso, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?";
}
