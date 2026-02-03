"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { transitApi } from "@/lib/services/api";
import type { Vehicle } from "@/types";

export default function TransitPage() {
  const [steps, setSteps] = useState<{ step: string; count: number }[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([transitApi.steps(), transitApi.vehicles()])
      .then(([stepsRes, vehiclesRes]) => {
        if (cancelled) return;
        setSteps(stepsRes.steps ?? []);
        setVehicles(vehiclesRes.data ?? []);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Erreur chargement transit");
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
        <h1 className="text-2xl font-bold text-slate-800">Transit & Douane</h1>
        <p className="mt-1 text-slate-600">Suivi des véhicules en transit</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s) => (
          <Card key={s.step}>
            <CardTitle>{s.step}</CardTitle>
            <p className="mt-2 text-2xl font-bold text-slate-800">{s.count}</p>
          </Card>
        ))}
      </div>
      <Card>
        <CardTitle>Véhicules en transit</CardTitle>
        <div className="table-container mt-4">
          <table>
            <thead>
              <tr><th>VIN</th><th>Marque / Modèle</th><th>Statut</th></tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td className="font-mono">{v.vin}</td>
                  <td>{v.brand} {v.model}</td>
                  <td><Badge color="blue">{v.status}</Badge></td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr><td colSpan={3} className="py-8 text-center text-slate-500">Aucun véhicule en transit</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
