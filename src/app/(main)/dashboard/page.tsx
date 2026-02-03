"use client";

import { useEffect, useState } from "react";
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

const CHART_COLORS = ["#64748b", "#3b82f6", "#06b6d4", "#10b981", "#8b5cf6"];

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
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="font-medium">Erreur</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tableau de bord</h1>
        <p className="mt-1 text-slate-600">Vue d&apos;ensemble du parc et des indicateurs clés</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm font-medium text-slate-500">Véhicules en stock</p>
          <p className="mt-1 text-3xl font-bold text-slate-800">
            {stats?.vehiclesInStock ?? "—"}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-slate-500">En transit</p>
          <p className="mt-1 text-3xl font-bold text-blue-600">
            {stats?.vehiclesInTransit ?? "—"}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-slate-500">Vendus ce mois</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600">
            {stats?.vehiclesSoldThisMonth ?? "—"}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-slate-500">
            CA du mois ({stats?.currency ?? "FCFA"})
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-800">
            {stats?.revenueThisMonth != null
              ? (stats.revenueThisMonth / 1_000_000).toFixed(1) + "M"
              : "—"}
          </p>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardTitle>Véhicules par statut</CardTitle>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardTitle>Répartition du parc</CardTitle>
          <div className="mt-4 h-80">
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
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Achats vs ventes (mensuel)</CardTitle>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="achats" fill="#64748b" name="Achats" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ventes" fill="#10b981" name="Ventes" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
