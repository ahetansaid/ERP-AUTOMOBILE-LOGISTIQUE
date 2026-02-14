"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { vehiclesApi } from "@/lib/services/api";
import type { Vehicle } from "@/types";

export default function AtelierPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // TODO: remplacer par GET /vehicles?maintenance=1 ou GET /atelier/vehicles quand le backend exposera les véhicules en maintenance
    vehiclesApi
      .list({ limit: 100 })
      .then((res) => {
        if (!cancelled) {
          const inMaintenance = (res.data ?? []).filter((v) => (v as Vehicle & { inMaintenance?: boolean }).inMaintenance === true);
          setVehicles(inMaintenance.length > 0 ? inMaintenance : []);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur chargement");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-accent-600">← Parc Automobile</Link>
        <div className="h-4 w-px bg-slate-200" />
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Atelier</h1>
      </div>
      <p className="text-slate-600">
        Véhicules en maintenance. Affichage du prestataire si la maintenance est gérée en externe, des devis émis (prestation et prestataire). Vous pouvez marquer un véhicule comme « sorti de maintenance » pour le faire repasser en stock disponible.
      </p>

      <Card>
        <CardTitle>Véhicules en maintenance</CardTitle>
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-200 border-t-accent-600" />
          </div>
        )}
        {error && <p className="py-6 text-red-600">{error}</p>}
        {!loading && !error && (
          <>
            {vehicles.length === 0 ? (
              <p className="py-12 text-center text-slate-500">
                Aucun véhicule en maintenance pour l&apos;instant. Le backend pourra exposer une liste dédiée (champ maintenance / prestataire / devis).
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="py-3 pr-4">VIN</th>
                      <th className="py-3 pr-4">Marque / Modèle</th>
                      <th className="py-3 pr-4">Prestataire</th>
                      <th className="py-3 pr-4">Devis</th>
                      <th className="py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((v) => (
                      <tr key={v.id} className="border-b border-slate-100">
                        <td className="py-3 font-mono text-slate-800">{v.vin}</td>
                        <td className="py-3">{v.brand} {v.model}</td>
                        <td className="py-3 text-slate-600">—</td>
                        <td className="py-3 text-slate-600">—</td>
                        <td className="py-3 text-right">
                          <Link href={`/parc-auto/${v.vin}`} className="font-medium text-accent-600 hover:underline">Fiche</Link>
                          <span className="mx-2 text-slate-300">|</span>
                          <button type="button" className="font-medium text-slate-600 hover:text-accent-600">
                            Quitter la maintenance
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
