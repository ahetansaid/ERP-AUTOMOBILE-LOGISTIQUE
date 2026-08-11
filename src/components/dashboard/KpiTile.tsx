"use client";

/**
 * Tuile KPI.
 *
 * Trois informations en un coup d'œil : la valeur, sa variation, et un repère
 * visuel — micro-courbe ou barre de proportion. C'est le motif le plus
 * réutilisable de la maquette validée.
 *
 * La profondeur (élévation, arête éclairée, légère inclinaison au survol)
 * habille la surface. Elle ne touche jamais la donnée.
 */

import { useRef } from "react";
import { useCountUp, fmtCompact } from "@/components/charts/primitives";

type Ton = "brand" | "ok" | "warn" | "danger";

const TONS: Record<Ton, { icon: string; text: string }> = {
  brand: {
    icon: "bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300",
    text: "text-brand-600 dark:text-brand-400",
  },
  ok: {
    icon: "bg-accent-50 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300",
    text: "text-accent-600 dark:text-accent-400",
  },
  warn: {
    icon: "bg-warning-50 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300",
    text: "text-warning-600 dark:text-warning-400",
  },
  danger: {
    icon: "bg-danger-50 text-danger-700 dark:bg-danger-900/40 dark:text-danger-300",
    text: "text-danger-600 dark:text-danger-400",
  },
};

export interface KpiTileProps {
  label: string;
  value: number;
  unit?: string;
  ton?: Ton;
  icon?: React.ReactNode;
  /** Texte sous la valeur : contexte, effectif, précision. */
  foot?: React.ReactNode;
  /** Variation en pourcentage. Le signe décide de la couleur. */
  delta?: { pct: number; label: string; favorable?: boolean };
  /** Barre de proportion : segments cumulés à 100 %. */
  proportion?: { pct: number; tone: Ton }[];
  /** Micro-courbe : série brute. */
  spark?: number[];
  hero?: boolean;
  /** Valeur brute non formatée (ratio, effectif) plutôt qu'un montant. */
  raw?: boolean;
}

const BAR: Record<Ton, string> = {
  brand: "bg-brand-500",
  ok: "bg-accent-500",
  warn: "bg-warning-500",
  danger: "bg-danger-500",
};

export function KpiTile({
  label,
  value,
  unit,
  ton = "brand",
  icon,
  foot,
  delta,
  proportion,
  spark,
  hero = false,
  raw = false,
}: KpiTileProps) {
  const animated = useCountUp(value);
  const ref = useRef<HTMLDivElement>(null);

  // Inclinaison légère (3,5°) au survol : assez pour donner du relief, trop
  // faible pour gêner la lecture.
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-dy * 3.5).toFixed(2)}deg) rotateY(${(dx * 3.5).toFixed(2)}deg) translateY(-2px)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  const display = raw
    ? Math.round(animated).toLocaleString("fr-FR")
    : Math.round(animated).toLocaleString("fr-FR");

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`group relative flex min-w-0 flex-col gap-2.5 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft transition-[transform,box-shadow] duration-300 hover:shadow-soft-lg dark:border-neutral-800 dark:bg-neutral-900 ${
        hero ? "sm:col-span-2" : ""
      }`}
    >
      {/* Arête supérieure éclairée : la lumière tombe sur le bord de la carte. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent dark:via-white/10"
      />

      <div className="flex items-center gap-2.5">
        {icon && (
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${TONS[ton].icon}`}
          >
            {icon}
          </span>
        )}
        <span className="text-sm font-medium text-neutral-500">{label}</span>
      </div>

      <p
        className={`font-mono font-bold tabular-nums tracking-tight ${
          hero ? "text-3xl" : "text-2xl"
        }`}
      >
        {display}
        {unit && (
          <span className="ml-1.5 font-sans text-xs font-medium text-neutral-500">
            {unit}
          </span>
        )}
      </p>

      {spark && spark.length > 1 && <Spark data={spark} ton={ton} />}

      {proportion && (
        <span className="flex h-1 gap-0.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          {proportion.map((p, i) => (
            <span
              key={i}
              className={`block h-full rounded-full ${BAR[p.tone]}`}
              style={{ width: `${p.pct}%` }}
            />
          ))}
        </span>
      )}

      <p className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
        {delta && (
          <span
            className={`font-mono font-semibold ${
              delta.favorable === false || delta.pct < 0
                ? "text-danger-600 dark:text-danger-400"
                : "text-accent-600 dark:text-accent-400"
            }`}
          >
            {delta.pct < 0 ? "▼" : "▲"} {Math.abs(delta.pct).toFixed(1)} %
          </span>
        )}
        {delta?.label}
        {foot}
      </p>
    </div>
  );
}

/** Micro-courbe : silhouette d'évolution, sans axe ni graduation. */
function Spark({ data, ton }: { data: number[]; ton: Ton }) {
  const W = 220;
  const H = 30;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const x = (i: number) => (i / (data.length - 1)) * W;
  const y = (v: number) => H - 2 - ((v - min) / span) * (H - 6);
  const line = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const stroke =
    ton === "danger"
      ? "var(--chart-danger)"
      : ton === "warn"
        ? "var(--chart-warn)"
        : ton === "ok"
          ? "var(--chart-ok)"
          : "var(--chart-3)";
  const id = `spark-${ton}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-7 w-full">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${W} ${H} L0 ${H} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx={W} cy={y(data[data.length - 1])} r="2.6" fill={stroke} />
    </svg>
  );
}
