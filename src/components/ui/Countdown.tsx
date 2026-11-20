"use client";

import { useEffect, useState } from "react";

/**
 * « Dans 12 jours », « Demain », « Aujourd'hui » : calculé dans le navigateur
 * (date du visiteur), rien n'est affiché côté serveur ni pour un événement passé.
 */
export function Countdown({ startsAt, className = "" }: { startsAt: string; className?: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const day = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = Math.round((day(new Date(startsAt)) - day(new Date())) / 86_400_000);
    // Mise à jour unique au montage : la date du visiteur n'est connue qu'ici.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLabel(diff < 0 ? null : diff === 0 ? "Aujourd'hui" : diff === 1 ? "Demain" : `Dans ${diff} jours`);
  }, [startsAt]);

  if (!label) return null;
  return <span className={className}>{label}</span>;
}
