import type { CSSProperties } from "react";
import type { Category } from "@/lib/types";

/**
 * Schéma du réseau : le REPTIC au centre, relié par des traces de circuit
 * (motif du logo) aux sept familles d'acteurs. Les traces sont orthogonales,
 * à angles arrondis, et un « signal » cyan les parcourt.
 */

type Pt = [number, number];

/** Polyligne orthogonale à coins arrondis. */
function orthPath(points: Pt[], r = 10) {
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1];
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    const inLen = Math.hypot(x - px, y - py);
    const outLen = Math.hypot(nx - x, ny - y);
    const rr = Math.min(r, inLen / 2, outLen / 2);
    const ax = x - ((x - px) / inLen) * rr;
    const ay = y - ((y - py) / inLen) * rr;
    const bx = x + ((nx - x) / outLen) * rr;
    const by = y + ((ny - y) / outLen) * rr;
    d += ` L${ax},${ay} Q${x},${y} ${bx},${by}`;
  }
  const last = points[points.length - 1];
  return `${d} L${last[0]},${last[1]}`;
}

// Géométrie (viewBox 720 × 520) — le tracé est calculé pour ne jamais se croiser.
const HUB = { x: 290, y: 228, w: 140, h: 64 };
const LEFT_NODE_X = 202;
const RIGHT_NODE_X = 518;

const slots: { side: "left" | "right"; port: number; elbow: number; y: number }[] = [
  { side: "left", port: 244, elbow: 250, y: 112 },
  { side: "left", port: 260, elbow: 250, y: 260 },
  { side: "left", port: 276, elbow: 250, y: 408 },
  { side: "right", port: 240, elbow: 465, y: 84 },
  { side: "right", port: 253, elbow: 490, y: 204 },
  { side: "right", port: 267, elbow: 490, y: 316 },
  { side: "right", port: 280, elbow: 465, y: 436 },
];

function splitLabel(label: string) {
  if (label.length <= 24) return [label];
  const mid = label.length / 2;
  let best = -1;
  for (let i = 0; i < label.length; i++) {
    if (label[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  }
  return best < 0 ? [label] : [label.slice(0, best), label.slice(best + 1)];
}

export function NetworkDiagram({ categories }: { categories: Category[] }) {
  const items = categories.slice(0, slots.length).map((c, i) => ({ ...c, ...slots[i] }));

  return (
    <svg viewBox="0 0 720 520" className="h-auto w-full" role="img" aria-labelledby="schema-titre schema-desc">
      <title id="schema-titre">Le réseau REPTIC.CM</title>
      <desc id="schema-desc">
        Le REPTIC relie les familles d&apos;acteurs du numérique : {items.map((i) => i.name).join(", ")}.
      </desc>

      {items.map((it, i) => {
        const hubX = it.side === "left" ? HUB.x : HUB.x + HUB.w;
        const nodeX = it.side === "left" ? LEFT_NODE_X : RIGHT_NODE_X;
        const pts: Pt[] =
          it.port === it.y
            ? [[hubX, it.port], [nodeX, it.y]]
            : [[hubX, it.port], [it.elbow, it.port], [it.elbow, it.y], [nodeX, it.y]];
        const d = orthPath(pts);
        return (
          <g key={`t-${it.slug}`} style={{ "--i": i } as CSSProperties}>
            <path d={d} fill="none" stroke="#c3c8d5" strokeWidth="1.5" pathLength={1} className="trace-draw" />
            <path
              d={d}
              fill="none"
              stroke="#209ad7"
              strokeWidth="2"
              strokeLinecap="round"
              pathLength={240}
              className="trace-signal"
            />
            <circle cx={hubX} cy={it.port} r="2.5" fill="#232d57" className="node-pop" />
          </g>
        );
      })}

      {/* Nœud central */}
      <g className="hub-in">
      <rect x={HUB.x} y={HUB.y} width={HUB.w} height={HUB.h} rx="2" fill="#232d57" />
      <text x={HUB.x + HUB.w / 2} y={HUB.y + HUB.h / 2 + 7} textAnchor="middle" className="font-display" fontSize="21" fontWeight="800" letterSpacing="-0.5">
        <tspan fill="#ffffff">REPTIC</tspan>
        <tspan fill="#209ad7">.cm</tspan>
      </text>
      </g>

      {items.map((it, i) => {
        const left = it.side === "left";
        const nodeX = left ? LEFT_NODE_X : RIGHT_NODE_X;
        const lines = splitLabel(it.name);
        const textX = left ? nodeX - 14 : nodeX + 14;
        const firstY = it.y + 5 - (lines.length - 1) * 8.5;
        return (
          <a key={`n-${it.slug}`} href={`/acteurs#${it.slug}`} className="group" style={{ "--i": i } as CSSProperties}>
            <g className="node-pop">
              <circle cx={nodeX} cy={it.y} r="6" fill="#ffffff" stroke="#209ad7" strokeWidth="2.5" className="transition-[r] duration-300 group-hover:[r:8]" />
            </g>
            <text x={textX} textAnchor={left ? "end" : "start"} fontSize="14" fontWeight="600" fill="#232d57" className="label-in transition-colors group-hover:fill-[#157bb0]">
              {lines.map((l, k) => (
                <tspan key={k} x={textX} y={firstY + k * 17}>
                  {l}
                </tspan>
              ))}
            </text>
          </a>
        );
      })}
    </svg>
  );
}
