"use client";

/**
 * Primitives de graphiques.
 *
 * Règles héritées de la maquette validée :
 *
 * · La profondeur habille les surfaces, jamais les données. Aucune marque n'est
 *   extrudée — une barre en volume fausse la lecture des longueurs.
 * · L'accent de marque ne code jamais une donnée. Les couleurs sémantiques
 *   (succès, alerte, danger) sont réservées aux états.
 * · Les compositions utilisent une rampe séquentielle mono-teinte, validée
 *   pour le daltonisme en clair comme en sombre.
 * · L'identité ne dépend jamais de la couleur seule : chaque part porte son
 *   libellé et sa valeur en légende.
 */

import { useEffect, useRef, useState } from "react";

/* Rampe ordinale indigo, dérivée des tokens de marque. Les paliers sont
   suffisamment écartés en clarté pour rester distinguables. */
export const RAMP = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export const fmtFcfa = (n: number) =>
  `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
export const fmtCompact = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(Math.round(n));
};

/** Compteur qui défile vers sa valeur. Neutralisé si l'utilisateur le demande. */
export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

/* ── Aire avec curseur ────────────────────────────────────────────────────── */

export interface AreaPoint {
  label: string;
  value: number;
}

export function AreaChart({
  data,
  color = "var(--chart-3)",
  height = 200,
  emphasizeLast = false,
}: {
  data: AreaPoint[];
  color?: string;
  height?: number;
  emphasizeLast?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);

  if (data.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-neutral-500">
        Pas assez de points pour tracer une courbe.
      </p>
    );
  }

  const W = 620;
  const H = 216;
  const PL = 52;
  const PR = 12;
  const PT = 14;
  const PB = 26;
  const iw = W - PL - PR;
  const ih = H - PT - PB;

  const max = Math.max(...data.map((d) => d.value), 0);
  const min = Math.min(...data.map((d) => d.value), 0);
  const span = max - min || 1;

  const x = (i: number) => PL + (i / (data.length - 1)) * iw;
  const y = (v: number) => PT + ih - ((v - min) / span) * ih;

  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)} ${y(min).toFixed(1)} L${x(0).toFixed(1)} ${y(min).toFixed(1)} Z`;

  const ticks = [min, min + span / 2, max];
  const labelStep = Math.max(1, Math.floor(data.length / 5));
  const gradId = `area-${color.replace(/[^a-z0-9]/gi, "")}`;

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - PL) / iw) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };

  return (
    <div className="relative">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        style={{ height }}
        className="w-full overflow-visible"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t, i) => (
          <g key={i}>
            {/* Grille en trait plein : le pointillé ajoute du bruit. */}
            <line x1={PL} y1={y(t)} x2={W - PR} y2={y(t)} stroke="var(--chart-grid)" strokeWidth="1" />
            <text
              x={PL - 8}
              y={y(t) + 3.5}
              textAnchor="end"
              fontSize="9.5"
              fill="var(--chart-muted)"
              className="font-mono"
            >
              {fmtCompact(t)}
            </text>
          </g>
        ))}

        <path d={area} fill={`url(#${gradId})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {emphasizeLast && (
          <circle
            cx={x(data.length - 1)}
            cy={y(data[data.length - 1].value)}
            r="4"
            fill={color}
            stroke="var(--chart-surface)"
            strokeWidth="2"
          />
        )}

        {data.map((d, i) =>
          i % labelStep === 0 || i === data.length - 1 ? (
            <text
              key={i}
              x={x(i)}
              y={H - 8}
              textAnchor="middle"
              fontSize="9.5"
              fill="var(--chart-muted)"
              className="font-mono"
            >
              {d.label}
            </text>
          ) : null
        )}

        {hover != null && (
          <>
            <line
              x1={x(hover)}
              y1={PT}
              x2={x(hover)}
              y2={PT + ih}
              stroke="var(--chart-line)"
              strokeWidth="1"
            />
            <circle
              cx={x(hover)}
              cy={y(data[hover].value)}
              r="4.5"
              fill={color}
              stroke="var(--chart-surface)"
              strokeWidth="2"
            />
          </>
        )}

        <rect
          x={PL}
          y={PT}
          width={iw}
          height={ih}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>

      {hover != null && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs shadow-soft dark:border-neutral-700 dark:bg-neutral-900"
          style={{
            left: `${Math.min(Math.max((x(hover) / W) * 100 - 8, 0), 78)}%`,
            top: `${(y(data[hover].value) / H) * 100 - 22}%`,
          }}
        >
          <span className="block text-neutral-500">{data[hover].label}</span>
          <span className="block font-mono font-semibold tabular-nums">
            {fmtFcfa(data[hover].value)}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Anneau ───────────────────────────────────────────────────────────────── */

export interface Slice {
  label: string;
  value: number;
}

/**
 * Composition d'un tout. Légitime jusqu'à six parts et à condition que les
 * valeurs soient contrastées — sinon une barre est plus lisible.
 */
export function DonutChart({
  data,
  centerValue,
  centerLabel,
  size = 200,
}: {
  data: Slice[];
  centerValue: string;
  centerLabel: string;
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total <= 0) {
    return <p className="py-8 text-center text-sm text-neutral-500">Aucune donnée.</p>;
  }

  const R = 72;
  const SW = 26;
  const C = 2 * Math.PI * R;
  const GAP = 1.6;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <svg viewBox="0 0 200 200" style={{ width: size, height: size }} className="shrink-0">
        <g transform="translate(100,100) rotate(-90)">
          {data.map((d, i) => {
            const frac = d.value / total;
            const len = Math.max(C * frac - GAP, 0.5);
            const dash = `${len.toFixed(2)} ${(C - len).toFixed(2)}`;
            const el = (
              <circle
                key={d.label}
                r={R}
                fill="none"
                stroke={RAMP[i % RAMP.length]}
                strokeWidth={SW}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
              />
            );
            offset += C * frac;
            return el;
          })}
        </g>
        <text
          x="100"
          y="96"
          textAnchor="middle"
          fontSize="19"
          fontWeight="670"
          fill="var(--chart-ink)"
          className="tabular-nums"
        >
          {centerValue}
        </text>
        <text
          x="100"
          y="114"
          textAnchor="middle"
          fontSize="9.5"
          fill="var(--chart-muted)"
          className="font-mono"
        >
          {centerLabel}
        </text>
      </svg>

      {/* La légende porte le libellé ET la valeur : l'identité ne repose
          jamais sur la seule couleur. */}
      <ul className="min-w-[150px] flex-1 space-y-1.5">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: RAMP[i % RAMP.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-neutral-600 dark:text-neutral-400">
              {d.label}
            </span>
            <span className="font-mono text-xs font-semibold tabular-nums">
              {fmtCompact(d.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Barres horizontales ──────────────────────────────────────────────────── */

export interface Band {
  label: string;
  value: number;
  hint?: string;
  danger?: boolean;
}

/**
 * Catégories nominales : une seule teinte pour toutes les barres. Une rampe de
 * valeur double-encoderait la longueur, qui porte déjà l'information.
 */
export function BandChart({ data, unit = "" }: { data: Band[]; unit?: string }) {
  if (!data.length) {
    return <p className="py-6 text-center text-sm text-neutral-500">Aucune donnée.</p>;
  }
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 1);

  return (
    <ul className="space-y-2.5">
      {data.map((d, i) => (
        <li key={d.label} className="grid grid-cols-[1fr_auto] items-baseline gap-x-3 gap-y-1">
          <span className="truncate text-sm text-neutral-600 dark:text-neutral-400">
            {d.label}
          </span>
          <span
            className={`font-mono text-sm font-semibold tabular-nums ${
              d.danger ? "text-danger-600 dark:text-danger-400" : ""
            }`}
          >
            {fmtCompact(d.value)}
            {unit}
          </span>
          <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <span
              className="block h-full origin-left rounded-full transition-transform duration-700 ease-out"
              style={{
                width: `${(Math.abs(d.value) / max) * 100}%`,
                background: d.danger
                  ? "var(--chart-danger)"
                  : i === 0
                    ? "var(--chart-3)"
                    : "var(--chart-2)",
              }}
            />
          </span>
          {d.hint && (
            <span className="col-span-2 font-mono text-[11px] text-neutral-400">
              {d.hint}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ── Jauge radiale ────────────────────────────────────────────────────────── */

/** Un seul ratio, comparé à son objectif. La couleur encode ici un état. */
export function Gauge({
  value,
  total,
  label,
  sublabel,
}: {
  value: number;
  total: number;
  label: string;
  sublabel?: string;
}) {
  const ratio = total > 0 ? value / total : 0;
  const R = 30;
  const C = 2 * Math.PI * R;
  const color =
    ratio >= 0.9 ? "var(--chart-ok)" : ratio >= 0.5 ? "var(--chart-warn)" : "var(--chart-danger)";

  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <svg viewBox="0 0 80 80" className="h-20 w-20">
        <circle cx="40" cy="40" r={R} fill="none" stroke="var(--chart-track)" strokeWidth="9" />
        <g transform="rotate(-90 40 40)">
          <circle
            cx="40"
            cy="40"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${(C * ratio).toFixed(2)} ${C}`}
            className="transition-all duration-700 ease-out"
          />
        </g>
        <text x="40" y="44" textAnchor="middle" fontSize="15" fontWeight="670" fill={color}>
          {Math.round(ratio * 100)}%
        </text>
      </svg>
      <span className="text-sm font-medium leading-tight">{label}</span>
      {sublabel && <span className="font-mono text-xs text-neutral-500">{sublabel}</span>}
    </div>
  );
}
