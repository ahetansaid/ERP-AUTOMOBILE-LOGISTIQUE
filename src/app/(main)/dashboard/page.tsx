"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { DashboardStats } from "@/types/dashboard";
import { Card } from "@/components/ui/Card";

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
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="font-medium text-primary-600">Chargement des indicateurs…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          Parc automobile
        </h1>
        <p className="mt-1 text-slate-500">
          Vue d'ensemble de l'état du parc et actions rapides.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm font-medium text-amber-800">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
