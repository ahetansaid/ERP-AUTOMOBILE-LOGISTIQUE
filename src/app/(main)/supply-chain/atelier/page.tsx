"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPatch } from "@/lib/api";
import type { VehicleListItem } from "@/types/vehicle";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

function pickVehicle(r: Record<string, unknown>): VehicleListItem & { devis_cloture?: boolean } {
  return {
    id: (r.id as number) ?? 0,
    vin: (r.vin as string) ?? "",
    brand: (r.brand as string) ?? (r.marque as string),
    model: (r.model as string) ?? (r.modele as string),
    year: (r.year as number) ?? (r.annee as number),
    color: (r.color as string) ?? (r.couleur as string),
    status: (r.status as string) ?? "",
    devis_cloture: (r.devis_cloture as boolean) ?? (r.devisCloture as boolean),
  };
}

export default function AtelierPage() {
  const [list, setList] = useState<(VehicleListItem & { devis_cloture?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [closingId, setClosingId] = useState<number | null>(null);

  const fetchList = useCallback(async () => {
    try {
      setError(null);
      const res = await apiGet<{ data?: unknown[] }>("/vehicles?status=EN_MAINTENANCE");
      const raw = Array.isArray(res) ? res : (res as { data?: unknown[] })?.data ?? [];
      setList((raw as Record<string, unknown>[]).map(pickVehicle));
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

  const handleCloturerMaintenance = async (id: number) => {
    try {
      setClosingId(id);
      await apiPatch(`/vehicles/${id}`, { status: "DISPONIBLE" });
      await fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur clôture");
    } finally {
      setClosingId(null);
    }
  };

  const filtered = list.filter(
    (v) =>
      !search ||
      (v.vin ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (v.brand ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (v.model ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Atelier / Maintenance</h1>
        <p className="mt-1 text-slate-600">
          Véhicules en maintenance. Clôture possible après émission du reçu du devis.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <Input
        placeholder="Rechercher par VIN, marque, modèle..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <Card title="Véhicules en maintenance">
        {loading ? (
          <p className="py-8 text-center text-slate-500">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-slate-500">Aucun véhicule en maintenance.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-600">
                  <th className="p-3 font-medium">VIN</th>
                  <th className="p-3 font-medium">Marque / Modèle</th>
                  <th className="p-3 font-medium">Année</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-3 font-mono">{v.vin}</td>
                    <td className="p-3">
                      {v.brand ?? "—"} {v.model ? ` / ${v.model}` : ""}
                    </td>
                    <td className="p-3">{v.year ?? "—"}</td>
                    <td className="p-3">
                      <Link
                        href={`/vehicules/${v.id}`}
                        className="mr-2 text-sm text-primary-600 hover:underline"
                      >
                        Voir fiche
                      </Link>
                      <Link
                        href={`/comptabilite/devis?vehicleId=${v.id}`}
                        className="mr-2 text-sm text-primary-600 hover:underline"
                      >
                        Devis
                      </Link>
                      <Button
                        size="sm"
                        disabled={closingId === v.id}
                        title="Clôturer la maintenance (véhicule retourne en stock disponible). Le backend refuse si aucun reçu devis émis."
                        onClick={() => handleCloturerMaintenance(v.id)}
                      >
                        {closingId === v.id ? "Clôture…" : "Clôturer la maintenance"}
                      </Button>
                    </td>
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
