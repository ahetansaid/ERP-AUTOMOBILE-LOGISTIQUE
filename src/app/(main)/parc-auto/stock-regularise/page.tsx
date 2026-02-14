"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { VEHICLE_STATUSES } from "@/lib/constants";
import { vehiclesApi } from "@/lib/services/api";
import type { Vehicle } from "@/types";

const statusColor: Record<string, string> = {
  ACHETE: "slate", EN_TRANSIT: "blue", ARRIVE_PORT: "cyan", EN_DOUANE: "amber",
  DEDOUANE: "emerald", LIVRE: "green", VENDU: "violet",
};

const STOCK_NATURE_LABELS: Record<string, string> = {
  DEPOT: "Dépôt", TRANSIT: "Transit", CONSOMMATION: "Consommation", AUTRES: "Autres",
};

function getJoursSurParc(v: Vehicle): number | null {
  if (v.joursSurParc != null) return v.joursSurParc;
  const dateParc = v.dateEntreeParc ?? v.dateEntryParc;
  if (!dateParc) return null;
  const entry = new Date(dateParc);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  entry.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : null;
}

export default function StockRegularisePage() {
  const [natureFilter, setNatureFilter] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const natureParam = natureFilter === "depot" ? "DEPOT" : natureFilter === "transit" ? "TRANSIT" : natureFilter === "autres" ? "AUTRES" : undefined;
    vehiclesApi
      .stockDisponible(natureParam ? { nature: natureParam } : undefined)
      .then((res) => {
        if (!cancelled) setVehicles(res.data ?? []);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Erreur chargement véhicules régularisés");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [natureFilter]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          Véhicules régularisés
        </h1>
        <p className="mt-1 text-slate-500">
          Liste des véhicules dont la situation comptable est clôturée (régularisés).
        </p>
      </div>
      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50 p-5 sm:flex-row sm:items-center">
          <select
            value={natureFilter}
            onChange={(e) => setNatureFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
          >
            <option value="">Toutes natures</option>
            <option value="depot">Dépôt</option>
            <option value="transit">Transit</option>
            <option value="autres">Autres</option>
          </select>
        </div>
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-200 border-t-accent-600" />
          </div>
        )}
        {error && <p className="py-8 text-center text-red-600">{error}</p>}
        {!loading && !error && (
          <>
            <div className="table-container rounded-none border-0 shadow-none overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>VIN</th>
                    <th>Marque / Modèle</th>
                    <th>N° BL</th>
                    <th>Date entrée Port</th>
                    <th>Date entrée Parc</th>
                    <th>Jours sur parc</th>
                    <th>Nature</th>
                    <th>Statut</th>
                    <th>Client</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => {
                    const jours = getJoursSurParc(v);
                    const datePort = v.dateEntreePort ?? v.dateEntryPort;
                    const dateParc = v.dateEntreeParc ?? v.dateEntryParc;
                    const bl = v.numeroBl ?? v.blNumber;
                    const nature = v.natureStock ?? v.stockNature;
                    return (
                      <tr key={v.id}>
                        <td className="font-mono text-sm text-slate-700">{v.vin}</td>
                        <td className="font-medium">{v.brand} {v.model}</td>
                        <td className="text-slate-600">{bl ?? "—"}</td>
                        <td className="text-slate-600">{datePort ? new Date(datePort).toLocaleDateString("fr-FR") : "—"}</td>
                        <td className="text-slate-600">{dateParc ? new Date(dateParc).toLocaleDateString("fr-FR") : "—"}</td>
                        <td>{jours != null ? `${jours} j` : "—"}</td>
                        <td>{nature ? STOCK_NATURE_LABELS[nature] ?? nature : "—"}</td>
                        <td>
                          <Badge color={statusColor[v.status] ?? "slate"}>
                            {VEHICLE_STATUSES.find((s) => s.id === v.status)?.label ?? v.status}
                          </Badge>
                        </td>
                        <td>{v.clientName ?? "—"}</td>
                        <td className="text-right">
                          <Link href={`/parc-auto/${v.vin}`} className="inline-flex font-medium text-accent-600 hover:text-accent-700 hover:underline">
                            VIN 360°
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {vehicles.length === 0 && (
              <p className="py-12 text-center text-slate-500">Aucun véhicule régularisé.</p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
