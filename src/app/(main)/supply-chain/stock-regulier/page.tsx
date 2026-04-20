"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPatch } from "@/lib/api";
import type { VehicleListItem } from "@/types/vehicle";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const actionsSelectClass =
  "w-full min-w-[140px] rounded-xl border border-slate-300 bg-white px-3 py-2 pr-8 text-sm text-slate-700 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";

function pickVehicle(r: Record<string, unknown>): VehicleListItem {
  return {
    id: (r.id as number) ?? 0,
    vin: (r.vin as string) ?? "",
    brand: (r.brand as string) ?? (r.marque as string),
    model: (r.model as string) ?? (r.modele as string),
    year: (r.year as number) ?? (r.annee as number),
    color: (r.color as string) ?? (r.couleur as string),
    status: (r.status as string) ?? "",
    price_sale: (r.price_sale as number) ?? (r.priceSale as number),
    client_name: (r.client_name as string) ?? (r.clientName as string),
  };
}

export default function StockRegulierPage() {
  const router = useRouter();
  const [list, setList] = useState<VehicleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [exitingId, setExitingId] = useState<number | null>(null);

  const fetchList = useCallback(async () => {
    try {
      setError(null);
      const res = await apiGet<{ data?: VehicleListItem[] }>("/vehicles?status=VENDU");
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

  const handleMarquerSortieParc = async (vehicleId: number) => {
    setExitingId(vehicleId);
    try {
      await apiPatch(`/vehicles/${vehicleId}`, { status: "LIVRE" } as Record<string, string>);
      await fetchList();
    } catch {
      setError("Impossible de marquer la sortie du parc");
    } finally {
      setExitingId(null);
    }
  };

  const filtered = list.filter(
    (v) =>
      !search ||
      (v.vin ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (v.brand ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (v.client_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Stock régulier</h1>
        <p className="mt-1 text-slate-600">
          Véhicules vendus et comptabilité totalement soldée.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <Input
        placeholder="Rechercher par VIN, marque, client..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <Card title="Liste">
        {loading ? (
          <p className="py-8 text-center text-slate-500">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-slate-500">Aucun véhicule régularisé.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-600">
                  <th className="p-3 font-medium">VIN</th>
                  <th className="p-3 font-medium">Marque / Modèle</th>
                  <th className="p-3 font-medium">Année</th>
                  <th className="p-3 font-medium">Client</th>
                  <th className="p-3 font-medium">Prix vente</th>
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
                    <td className="p-3">{v.client_name ?? "—"}</td>
                    <td className="p-3">
                      {v.price_sale != null
                        ? v.price_sale.toLocaleString("fr-FR") + " FCFA"
                        : "—"}
                    </td>
                    <td className="p-3">
                      <select
                        className={actionsSelectClass}
                        value=""
                        onChange={(e) => {
                          const val = e.target.value;
                          e.target.value = "";
                          if (val === "fiche") router.push(`/vehicules/${v.id}`);
                          else if (val === "sortie") handleMarquerSortieParc(v.id);
                        }}
                      >
                        <option value="" disabled>Actions</option>
                        <option value="fiche">Voir fiche</option>
                        <option value="sortie" disabled={exitingId === v.id}>
                          {exitingId === v.id ? "En cours…" : "Marquer sortie du parc"}
                        </option>
                      </select>
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
