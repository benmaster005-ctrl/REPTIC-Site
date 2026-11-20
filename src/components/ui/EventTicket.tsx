import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { EventItem } from "@/lib/types";
import { Countdown } from "./Countdown";

/**
 * Billet d'événement : talon marine (jour, mois), perforation en pointillés
 * avec deux encoches rondes, intitulé, lieu et compte à rebours.
 * `notch` : couleur du fond derrière le billet (les encoches la reprennent).
 */
export function EventTicket({ item, notch = "var(--color-canvas)", className = "", headingLevel = "h3" }: {
  item: EventItem;
  notch?: string;
  className?: string;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const start = new Date(item.startsAt);
  const end = item.endsAt ? new Date(item.endsAt) : null;
  const multi = end && end.toDateString() !== start.toDateString();
  const days = multi ? `${formatDate(item.startsAt, { day: "numeric" })}–${formatDate(item.endsAt!, { day: "numeric" })}` : formatDate(item.startsAt, { day: "numeric" });
  const month = formatDate(item.startsAt, { month: "short", year: "numeric" });
  const place = [item.locationName, item.city].filter(Boolean).join(", ");

  return (
    <div className={`lift group relative grid grid-cols-[5.5rem_1fr] overflow-hidden rounded-2xl bg-surface ring-1 ring-line transition-shadow hover:ring-navy/30 sm:grid-cols-[7rem_1fr] ${className}`}>
      <div className="grid place-content-center bg-navy px-2 py-5 text-center text-white transition-colors duration-300 group-hover:bg-cyan-dark">
        <span className="text-[1.7rem] leading-none font-bold tracking-[-0.04em] tabular-nums sm:text-[2.1rem]">{days}</span>
        <span className="mt-1.5 text-[0.78rem] text-white/75">{month}</span>
      </div>
      <div className="min-w-0 border-l-2 border-dashed border-line-strong px-5 py-4 sm:px-6 sm:py-5">
        <Countdown startsAt={item.startsAt} className="text-[0.82rem] font-semibold text-cyan-dark" />
        <Heading className="mt-1 text-[1.08rem] leading-snug font-bold tracking-[-0.01em] text-heading sm:text-[1.2rem]">
          <Link href={`/evenements/${item.slug}`} className="title-sweep after:absolute after:inset-0">
            {item.title}
          </Link>
        </Heading>
        {place && <p className="mt-1 truncate text-[0.88rem] text-muted">{place}</p>}
      </div>
      {/* Encoches de la perforation */}
      <span aria-hidden className="absolute -top-2 left-[calc(5.5rem-0.5rem)] size-4 rounded-full sm:left-[calc(7rem-0.5rem)]" style={{ background: notch }} />
      <span aria-hidden className="absolute -bottom-2 left-[calc(5.5rem-0.5rem)] size-4 rounded-full sm:left-[calc(7rem-0.5rem)]" style={{ background: notch }} />
    </div>
  );
}
