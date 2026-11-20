/**
 * Schéma du réseau numérique camerounais (ouverture de l'accueil).
 * Carte en trame de points, dorsale reliant les grandes villes, câbles
 * sous-marins atterrissant à Kribi et Limbe. Le siège (Yaoundé) porte le nœud
 * annulaire du logo. Schéma indicatif : tracé simplifié, pas une carte exacte.
 * Une seule animation : les liaisons se dessinent au chargement (classes
 * trace-draw / node-pop / label-in de globals.css, neutralisées si mouvement réduit).
 */

const K = 38;
const MIN_LON = 6.6;
const MAX_LAT = 13.3;
const p = (lon: number, lat: number) => [+((lon - MIN_LON) * K).toFixed(1), +((MAX_LAT - lat) * K).toFixed(1)] as const;

// Frontière simplifiée (longitude, latitude), sens horaire depuis le lac Tchad.
const border: [number, number][] = [
  [14.18, 13.08], [14.45, 12.85], [14.6, 12.2], [14.9, 12.15], [15.05, 11.9], [15.1, 11.5], [15.0, 11.0], [15.15, 10.7],
  [15.4, 10.25], [15.68, 10.0], [15.0, 9.95], [14.2, 9.98], [13.95, 9.6], [14.35, 9.2], [14.8, 8.8], [15.2, 8.4],
  [15.5, 7.6], [15.2, 7.3], [14.8, 6.4], [14.45, 5.9], [14.55, 5.25], [14.65, 4.6], [15.1, 3.95], [15.25, 3.2],
  [16.0, 2.7], [16.2, 2.2], [16.05, 1.68], [15.3, 2.0], [14.6, 2.2], [13.3, 2.18], [12.3, 2.27], [11.33, 2.17],
  [10.0, 2.17], [9.82, 2.35], [9.9, 3.0], [9.75, 3.6], [9.55, 3.85], [9.4, 3.95], [9.0, 4.05], [8.85, 4.4],
  [8.55, 4.6], [8.85, 5.3], [9.3, 5.8], [9.8, 6.4], [10.2, 6.9], [10.6, 7.05], [11.1, 6.5], [11.55, 6.6],
  [11.85, 7.05], [12.05, 7.6], [12.3, 8.3], [12.85, 8.75], [13.25, 9.6], [13.6, 10.2], [13.85, 10.95], [14.0, 11.4],
  [14.15, 11.9], [14.1, 12.5],
];
const outline = "M" + border.map(([lon, lat]) => p(lon, lat).join(" ")).join("L") + "Z";

const city = {
  yaounde: p(11.52, 3.87),
  douala: p(9.7, 4.05),
  kribi: p(9.91, 2.94),
  limbe: p(9.21, 4.02),
  bafoussam: p(10.42, 5.48),
  bamenda: p(10.15, 5.96),
  bertoua: p(13.68, 4.58),
  ebolowa: p(11.15, 2.92),
  ngaoundere: p(13.58, 7.32),
  garoua: p(13.4, 9.3),
  maroua: p(14.32, 10.59),
};
type City = keyof typeof city;

const line = (...stops: City[]) => "M" + stops.map((c) => city[c].join(" ")).join("L");

// Liaisons terrestres, tracées depuis le siège vers l'extérieur.
const backbone = [
  line("yaounde", "douala", "kribi"),
  line("douala", "bafoussam", "bamenda"),
  line("yaounde", "bertoua"),
  line("yaounde", "ngaoundere", "garoua", "maroua"),
  line("yaounde", "ebolowa"),
  line("yaounde", "bafoussam"),
];

// Câbles sous-marins : depuis le large jusqu'au point d'atterrissage.
const cables = [
  `M0 ${city.kribi[1] + 26} C 60 ${city.kribi[1] + 24}, 100 ${city.kribi[1] + 6}, ${city.kribi.join(" ")}`,
  `M0 ${city.limbe[1] - 30} C 44 ${city.limbe[1] - 28}, 80 ${city.limbe[1] - 8}, ${city.limbe.join(" ")}`,
];

const labels: { at: City; text: string; dx: number; dy: number; anchor?: "start" | "end" }[] = [
  { at: "maroua", text: "Maroua", dx: 9, dy: 4 },
  { at: "garoua", text: "Garoua", dx: -9, dy: 4, anchor: "end" },
  { at: "ngaoundere", text: "Ngaoundéré", dx: 9, dy: 4 },
  { at: "bamenda", text: "Bamenda", dx: -9, dy: 0, anchor: "end" },
  { at: "bertoua", text: "Bertoua", dx: 9, dy: 4 },
  { at: "limbe", text: "Limbe", dx: -9, dy: -6, anchor: "end" },
  { at: "douala", text: "Douala", dx: 2, dy: 18 },
  { at: "kribi", text: "Kribi", dx: -9, dy: 12, anchor: "end" },
];

const nodes: City[] = ["douala", "kribi", "limbe", "bafoussam", "bamenda", "bertoua", "ebolowa", "ngaoundere", "garoua", "maroua"];

export function NetworkMap({ className = "" }: { className?: string }) {
  const [hx, hy] = city.yaounde;
  return (
    <figure className={className}>
      <svg viewBox="0 0 380 450" role="img" aria-labelledby="carte-titre" className="h-auto w-full overflow-visible">
        <title id="carte-titre">
          Schéma du réseau numérique camerounais : liaisons entre Yaoundé, siège du REPTIC.CM, et les grandes villes du pays, câbles sous-marins à Kribi et Limbe.
        </title>
        <defs>
          <pattern id="trame" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="3.5" cy="3.5" r="1.25" fill="var(--color-navy)" opacity="0.3" />
          </pattern>
        </defs>

        <path d={outline} fill="url(#trame)" />
        <path d={outline} fill="none" stroke="var(--color-navy)" strokeOpacity="0.14" strokeWidth="1" strokeLinejoin="round" />

        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {cables.map((d, i) => (
            <path key={d} d={d} pathLength={1} stroke="var(--color-cyan)" strokeWidth="1.75" className="trace-draw" style={{ "--i": i } as React.CSSProperties} />
          ))}
          {backbone.map((d, i) => (
            <path key={d} d={d} pathLength={1} stroke="var(--color-navy)" strokeWidth="2.25" className="trace-draw" style={{ "--i": i + 2 } as React.CSSProperties} />
          ))}
        </g>

        {nodes.map((c, i) => (
          <circle key={c} cx={city[c][0]} cy={city[c][1]} r="3.25" fill="#fff" stroke="var(--color-navy)" strokeWidth="1.5" className="node-pop" style={{ "--i": i } as React.CSSProperties} />
        ))}

        <g fontSize="11" fill="var(--color-muted)" fontWeight="500">
          {labels.map((l, i) => (
            <text key={l.at} x={city[l.at][0] + l.dx} y={city[l.at][1] + l.dy} textAnchor={l.anchor ?? "start"} className="label-in" style={{ "--i": i } as React.CSSProperties}>
              {l.text}
            </text>
          ))}
        </g>

        {/* Siège : nœud annulaire du logo */}
        <g className="hub-in">
          <circle cx={hx} cy={hy} r="13" fill="var(--color-cyan)" opacity="0.14" />
          <circle cx={hx} cy={hy} r="7.5" fill="#fff" stroke="var(--color-cyan)" strokeWidth="2.5" />
          <circle cx={hx} cy={hy} r="3" fill="var(--color-navy)" />
        </g>
        <g className="label-in" style={{ "--i": 9 } as React.CSSProperties}>
          <text x={hx + 18} y={hy - 2} fontSize="13" fontWeight="700" fill="var(--color-navy)">
            Yaoundé
          </text>
          <text x={hx + 18} y={hy + 13} fontSize="11" fill="var(--color-muted)">
            siège du réseau
          </text>
        </g>
      </svg>
      <figcaption className="mt-3 text-[0.8rem] text-muted">Schéma indicatif des liaisons du pays et des câbles sous-marins de Kribi et Limbe.</figcaption>
    </figure>
  );
}
