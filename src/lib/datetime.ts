/** Conversion ISO → valeur d'un champ « datetime-local », à l'heure du Cameroun (UTC+1, sans heure d'été). */
export function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
}
