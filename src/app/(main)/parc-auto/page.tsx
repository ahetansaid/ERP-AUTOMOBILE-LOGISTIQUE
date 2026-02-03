"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { VEHICLE_STATUSES } from "@/lib/constants";
import { vehiclesApi } from "@/lib/services/api";
import type { Vehicle } from "@/types";

const statusColor: Record<string, string> = {
  ACHETE: "slate", EN_TRANSIT: "blue", ARRIVE_PORT: "cyan", EN_DOUANE: "amber",
  DEDOUANE: "emerald", LIVRE: "green", VENDU: "violet",
};

export default function ParcAutoPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    vehiclesApi
      .list({ search: search || undefined, status: statusFilter || undefined })
      .then((res) => {
        if (!cancelled) setVehicles(res.data ?? []);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Erreur chargement véhicules");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, statusFilter]);

  const filtered = vehicles;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Parc automobile</h1>
          <p className="mt-1 text-slate-600">Gestion des véhicules par VIN</p>
        </div>
        <Link href="/parc-auto/nouveau"><Button>+ Nouveau véhicule</Button></Link>
      </div>
      <Card>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row">
          <Input placeholder="Rechercher (VIN, marque, modèle, client)..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800">
            <option value="">Tous les statuts</option>
            {VEHICLE_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        {loading && <p className="py-8 text-center text-slate-500">Chargement...</p>}
        {error && <p className="py-4 text-center text-red-600">{error}</p>}
        {!loading && !error && (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>VIN</th><th>Marque / Modèle</th><th>Année</th><th>Statut</th><th>Client</th><th>Prix achat</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v) => (
                    <tr key={v.id}>
                      <td className="font-mono text-slate-700">{v.vin}</td>
                      <td>{v.brand} {v.model}</td>
                      <td>{v.year}</td>
                      <td><Badge color={statusColor[v.status] ?? "slate"}>{VEHICLE_STATUSES.find((s) => s.id === v.status)?.label ?? v.status}</Badge></td>
                      <td>{v.clientName ?? "—"}</td>
                      <td>{v.purchasePrice != null ? `${v.purchasePrice.toLocaleString()} ${v.currency ?? "USD"}` : "—"}</td>
                      <td><Link href={`/parc-auto/${v.vin}`} className="text-slate-600 underline hover:text-slate-900">VIN 360°</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && <p className="py-8 text-center text-slate-500">Aucun véhicule trouvé</p>}
          </>
        )}
      </Card>
    </div>
  );
}
