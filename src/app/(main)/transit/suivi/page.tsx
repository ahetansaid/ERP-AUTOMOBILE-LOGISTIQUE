"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/Card";

interface TransitStepRow {
  id: number;
  vehicle_id?: number;
  step_name?: string;
  label?: string;
  date_arrival?: string;
  solde_gele?: number | string | null;
  motif?: string | null;
  vin?: string;
  brand?: string;
  model?: string;
}

function pickStep(r: Record<string, unknown>): TransitStepRow {
  return {
    id: (r.id as number) ?? 0,
    vehicle_id: (r.vehicle_id as number) ?? (r.vehicleId as number),
    step_name: (r.step_name as string) ?? (r.stepName as string),
    // Libelle fourni par l'API. Le repli sur le code brut evite une colonne
    // vide si un jalon arrive avant que le serveur ne le nomme.
    label: (r.label as string) ?? (r.step_name as string) ?? (r.stepName as string),
    solde_gele: (r.solde_gele as number) ?? (r.soldeGele as number) ?? null,
    motif: (r.motif as string) ?? null,
    date_arrival: (r.date_arrival as string) ?? (r.dateArrival as string),
    vin: (r.vin as string) ?? "",
    brand: (r.brand as string) ?? "",
    model: (r.model as string) ?? "",
  };
}

export default function SuiviTransitPage() {
  const [list, setList] = useState<TransitStepRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    try {
      setError(null);
      const res = await apiGet<{ transitSteps?: unknown[] }>("/transit/steps");
      const raw = (res as { transitSteps?: unknown[] })?.transitSteps ?? [];
      setList((raw as Record<string, unknown>[]).map(pickStep));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Suivi transit</h1>
        <p className="mt-1 text-slate-600">Véhicules par étape, documents.</p>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      <Card title="Étapes transit">
        {loading ? <p className="py-8 text-center text-slate-500">Chargement…</p> : list.length === 0 ? <p className="py-8 text-center text-slate-500">Aucun enregistrement.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-600">
                  <th className="p-3 font-medium">VIN</th>
                  <th className="p-3 font-medium">Véhicule</th>
                  <th className="p-3 font-medium">Étape</th>
                  <th className="p-3 font-medium">Date arrivée</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="p-3 font-mono">{r.vin ?? "—"}</td>
                    <td className="p-3">{r.brand ?? "—"} {r.model ?? ""}</td>
                    <td className="p-3">
                      {r.label ?? r.step_name ?? "—"}
                      {/* Le solde fige n'existe que sur les deux sorties. Le
                          montrer ici evite d'ouvrir la fiche pour savoir si un
                          vehicule est parti en laissant une ardoise. */}
                      {Number(r.solde_gele) > 0 && (
                        <span
                          className="ml-2 rounded px-1.5 py-0.5 text-xs font-semibold text-amber-800 bg-amber-100 dark:bg-amber-950/50 dark:text-amber-200"
                          title={r.motif ?? undefined}
                        >
                          {Math.round(Number(r.solde_gele)).toLocaleString("fr-FR")} F dus
                        </span>
                      )}
                    </td>
                    <td className="p-3">{r.date_arrival ? new Date(r.date_arrival).toLocaleDateString("fr-FR") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
