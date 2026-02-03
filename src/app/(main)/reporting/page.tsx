"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
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

  if (loading) return <p className="text-slate-500">Chargement...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reporting & Analytics</h1>
        <p className="mt-1 text-slate-600">Indicateurs et exports</p>
      </div>
      <Card>
        <CardTitle>Évolution CA et marge (M FCFA)</CardTitle>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="ca" stroke="#3b82f6" name="CA" strokeWidth={2} />
              <Line type="monotone" dataKey="marge" stroke="#10b981" name="Marge" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <CardTitle>Exports</CardTitle>
        <p className="mt-4 text-sm text-slate-500">Export Excel / CSV / PDF — à exposer par le backend.</p>
      </Card>
    </div>
  );
}
