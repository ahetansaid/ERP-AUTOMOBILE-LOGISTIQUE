"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { DashboardStats } from "@/types/dashboard";
import { Card } from "@/components/ui/Card";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";

const DASH_HERO =
  "https://images.pexels.com/photos/395537/pexels-photo-395537.jpeg?auto=compress&cs=tinysrgb&w=1200";

function formatFcfa(value: number | undefined): string {
  if (value == null) return "—";
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

const statCards = [
  {
    key: "stockDisponible",
    label: "Stocks disponible",
    href: "/supply-chain/stock-disponible",
    linkLabel: "Voir la liste",
    accent: "from-emerald-500 to-primary-600",
    icon: "📦",
  },
  {
    key: "stockNonRegulier",
    label: "Stocks non régulier",
    href: "/supply-chain/stock-non-regulier",
    linkLabel: "Voir la liste",
    accent: "from-amber-500 to-orange-500",
    icon: "⏳",
  },
  {
    key: "stockRegularise",
    label: "Stocks régulier",
    href: "/supply-chain/stock-regulier",
    linkLabel: "Voir la liste",
    accent: "from-green-500 to-emerald-600",
    icon: "✓",
  },
  {
    key: "vehiclesEnMaintenance",
    label: "Véhicules en maintenance",
    href: "/supply-chain/atelier",
    linkLabel: "Voir l'atelier",
    accent: "from-violet-500 to-purple-600",
    icon: "🔧",
  },
];

const statCards2 = [
  { key: "nombreClients", label: "Clients actifs", icon: "👥" },
  { key: "caSemaine", label: "CA Semaine", format: formatFcfa, icon: "📈" },
  { key: "caMois", label: "CA Mois", format: formatFcfa, icon: "💰" },
  {
    key: "vehiclesEnTransit",
    label: "Véhicules en transit",
    href: "/transit/suivi",
    linkLabel: "Voir le suivi",
    icon: "🚚",
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const data = await apiGet<DashboardStats>("/dashboard/stats");
      setStats(data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const onFocus = () => fetchStats();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <div className="space-y-8">
        <div className="h-36 animate-pulse rounded-3xl bg-neutral-200/70 dark:bg-neutral-800/60" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/60" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/60" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Bannière héro */}
      <div className="relative animate-fade-up overflow-hidden rounded-3xl ring-1 ring-black/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={DASH_HERO} alt="" className="absolute inset-0 h-full w-full animate-ken-burns object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950/95 via-brand-900/85 to-brand-700/50" />
        <div className="absolute inset-0 bg-mesh-brand opacity-20" aria-hidden />
        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-200/80">
              Tableau de bord
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Bonjour 👋
            </h1>
            <p className="mt-1.5 max-w-md text-sm text-white/70">
              Vue d&apos;ensemble de votre parc — du stock disponible au transit
              au Port de Cotonou.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/supply-chain/achats"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-brand-700 shadow-sm transition-transform hover:-translate-y-0.5"
            >
              + Nouvel achat
            </Link>
            <Link
              href="/supply-chain/vue-globale"
              className="inline-flex h-10 items-center rounded-xl border border-white/30 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              Vue globale
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm font-medium text-amber-800">
          {error}
        </div>
      )}

      <AlertsPanel />

      <div className="grid animate-fade-up gap-4 [animation-delay:80ms] sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ key, label, href, linkLabel, accent, icon }) => (
          <Card key={key} className="overflow-hidden">
            <div className={`-mx-6 -mt-6 mb-4 flex h-14 items-center justify-center rounded-t-2xl bg-gradient-to-br ${accent} text-2xl text-white`}>
              {icon}
            </div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {(stats as Record<string, unknown>)?.[key] ?? "—"}
            </p>
            {href && (
              <Link
                href={href}
                className="mt-3 inline-block text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline"
              >
                {linkLabel}
              </Link>
            )}
          </Card>
        ))}
      </div>

      <div className="grid animate-fade-up gap-4 [animation-delay:140ms] sm:grid-cols-2 lg:grid-cols-4">
        {statCards2.map(({ key, label, format, href, linkLabel, icon }) => {
          const value = (stats as Record<string, unknown>)?.[key];
          const display = format ? (format as (v: number) => string)(value as number) : value;
          return (
            <Card key={key}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{label}</p>
                  <p className="mt-1 text-xl font-bold text-slate-800">
                    {display ?? "—"}
                  </p>
                  {href && linkLabel && (
                    <Link
                      href={href}
                      className="mt-2 inline-block text-sm font-semibold text-primary-600 hover:underline"
                    >
                      {linkLabel}
                    </Link>
                  )}
                </div>
                <span className="text-2xl opacity-80">{icon}</span>
              </div>
            </Card>
          );
        })}
      </div>

      <Card title="Actions rapides">
        <ul className="flex flex-wrap gap-4">
          <li>
            <Link
              href="/supply-chain/achats"
              className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
            >
              Gestion des achats
            </Link>
          </li>
          <li>
            <Link
              href="/supply-chain/vue-globale"
              className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
            >
              Vue globale du parc
            </Link>
          </li>
          <li>
            <Link
              href="/transit"
              className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
            >
              Transit
            </Link>
          </li>
        </ul>
      </Card>
    </div>
  );
}
