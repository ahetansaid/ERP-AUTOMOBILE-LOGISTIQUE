"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { dashboardApi } from "@/lib/services/api";
import { IconParc, IconTransit } from "@/components/icons/NavIcons";

const CHART_COLORS = ["#64748b", "#0d9488", "#06b6d4", "#14b8a6", "#0f766e"];

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    vehiclesInStock: number;
    vehiclesInTransit: number;
    vehiclesSoldThisMonth: number;
    revenueThisMonth: number;
    currency?: string;
  } | null>(null);
  const [statusData, setStatusData] = useState<{ name: string; count: number; fill: string }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; achats: number; ventes: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [statsRes, statusRes, monthlyRes] = await Promise.all([
          dashboardApi.stats(),
          dashboardApi.chartStatus(),
          dashboardApi.chartMonthly(),
        ]);
        if (cancelled) return;
        setStats(statsRes);
        setStatusData(
          (statusRes.data ?? []).map((d, i) => ({
            name: d.name,
            count: d.count,
            fill: CHART_COLORS[i % CHART_COLORS.length],
          }))
        );
        setMonthlyData(monthlyRes.data ?? []);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Erreur chargement dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-200 border-t-accent-600" />
          <p className="text-sm text-slate-500">Chargement du tableau de bord…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-red-800">
        <p className="font-semibold">Erreur</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  const quickActions = [
    { href: "/supply-chain/achats", label: "Gestion des achats", desc: "Achats véhicules (Europe, USA…)" },
    { href: "/parc-auto/stock-disponible", label: "Stock disponible", desc: "Véhicules sur le parc (disponibles à la vente / livraison)" },
    { href: "/parc-auto/stock-non-regularise", label: "Stock non régularisé", desc: "Situation comptable à suivre" },
    { href: "/parc-auto/stock-regularise", label: "Véhicules régularisés", desc: "Liste des véhicules régularisés" },
    { href: "/parc-auto", label: "Vue globale véhicules", desc: "Tous les véhicules" },
    { href: "/supply-chain/atelier", label: "Atelier", desc: "Véhicules en maintenance" },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          Parc Automobile
        </h1>
        <p className="mt-1 text-slate-500">
          Statistiques pour la gestion des achats, des véhicules (disponible, non régularisé, régularisé) et indicateurs clés
        </p>
      </div>

      <Card>
        <CardTitle>Actions rapides</CardTitle>
        <p className="mt-1 text-sm text-slate-500">Accéder rapidement aux listes et formulaires</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map(({ href, label, desc }) => (
            <Link key={href} href={href}>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-accent-300 hover:bg-accent-50/50">
                <p className="font-medium text-slate-800">{label}</p>
                <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-accent-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Véhicules en stock</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-800">
                {stats?.vehiclesInStock ?? "—"}
              </p>
            </div>
            <div className="rounded-xl bg-accent-50 p-2.5 text-accent-600">
              <IconParc />
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">En transit</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-blue-600">
                {stats?.vehiclesInTransit ?? "—"}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <IconTransit />
            </div>
          </div>
        </Card>
        <Card>
          <p className="text-sm font-medium text-slate-500">Vendus ce mois</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600">
            {stats?.vehiclesSoldThisMonth ?? "—"}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-slate-500">
            CA du mois ({stats?.currency ?? "FCFA"})
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-800">
            {stats?.revenueThisMonth != null
              ? (stats.revenueThisMonth / 1_000_000).toFixed(1) + "M"
              : "—"}
          </p>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardTitle>Véhicules par statut</CardTitle>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Bar dataKey="count" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardTitle>Répartition du parc</CardTitle>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Achats vs ventes (mensuel)</CardTitle>
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                }}
              />
              <Legend />
              <Bar dataKey="achats" fill="#64748b" name="Achats" radius={[6, 6, 0, 0]} />
              <Bar dataKey="ventes" fill="#0d9488" name="Ventes" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
