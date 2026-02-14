"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { reportingApi } from "@/lib/services/api";

export default function ReportingPage() {
  const [data, setData] = useState<{ month: string; ca: number; marge: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    reportingApi
      .evolution()
      .then((res) => {
        if (!cancelled) setData(res.data ?? []);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Erreur chargement reporting");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-200 border-t-accent-600" />
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          Reporting & Analytics
        </h1>
        <p className="mt-1 text-slate-500">
          Indicateurs et exports
        </p>
      </div>
      <Card>
        <CardTitle>Évolution CA et marge (M FCFA)</CardTitle>
        <div className="mt-5 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
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
              <Line
                type="monotone"
                dataKey="ca"
                stroke="#0d9488"
                name="CA"
                strokeWidth={2}
                dot={{ fill: "#0d9488" }}
              />
              <Line
                type="monotone"
                dataKey="marge"
                stroke="#14b8a6"
                name="Marge"
                strokeWidth={2}
                dot={{ fill: "#14b8a6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <CardTitle>Exports</CardTitle>
        <p className="mt-4 text-sm text-slate-500">
          Export Excel / CSV / PDF disponible depuis l’application.
        </p>
      </Card>
    </div>
  );
}
