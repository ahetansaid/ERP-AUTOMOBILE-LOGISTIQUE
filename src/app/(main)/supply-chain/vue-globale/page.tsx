"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { VehicleListItem } from "@/types/vehicle";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHero } from "@/components/layout/PageHero";

function pickVehicle(r: Record<string, unknown>): VehicleListItem {
  const purchasePrice = (r.purchase_price as number) ?? (r.purchasePrice as number);
  const purchasePriceFcfa =
    (r.purchase_price_fcfa as number) ??
    (r.purchasePriceFcfa as number) ??
    (r.prix_fcfa as number) ??
    (r.amount_fcfa as number) ??
    (r.montant_fcfa as number);
  return {
    id: (r.id as number) ?? 0,
    vin: (r.vin as string) ?? "",
    brand: (r.brand as string) ?? (r.marque as string),
    model: (r.model as string) ?? (r.modele as string),
    year: (r.year as number) ?? (r.annee as number),
    status: (r.status as string) ?? "",
    purchase_price: purchasePrice,
    purchase_price_fcfa: purchasePriceFcfa ?? undefined,
    price_sale: (r.price_sale as number) ?? (r.priceSale as number),
  };
}

export default function VueGlobalePage() {
  const [list, setList] = useState<VehicleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchList = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      const res = await apiGet<{ data?: unknown[] }>(`/vehicles?${params.toString()}`);
      const raw = Array.isArray(res) ? res : (res as { data?: unknown[] })?.data ?? [];
      setList((raw as Record<string, unknown>[]).map(pickVehicle));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const filtered = list
    .filter((v) => v.status !== "EN_TRANSIT")
    .filter(
      (v) =>
        !search ||
        (v.vin ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (v.brand ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (v.model ?? "").toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Supply chain"
        title="Vue globale du parc"
        subtitle="Tous les véhicules, filtres et recherche."
      />
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      <div className="flex flex-wrap gap-4">
        <Input placeholder="Rechercher par VIN, marque, modèle..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <select className="rounded border border-slate-300 px-2 py-2 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Tous statuts</option>
          <option value="DISPONIBLE">Disponible</option>
          <option value="EN_VENTE">En vente</option>
          <option value="VENDU">Vendu</option>
          <option value="EN_MAINTENANCE">En maintenance</option>
        </select>
      </div>
      <Card title="Parc">
        {loading ? <p className="py-8 text-center text-slate-500">Chargement…</p> : filtered.length === 0 ? <p className="py-8 text-center text-slate-500">Aucun véhicule.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-600">
                  <th className="p-3 font-medium">VIN</th>
                  <th className="p-3 font-medium">Marque / Modèle</th>
                  <th className="p-3 font-medium">Année</th>
                  <th className="p-3 font-medium">Statut</th>
                  <th className="p-3 font-medium">Prix achat</th>
                  <th className="p-3 font-medium">Prix vente</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const prixAchat = v.purchase_price_fcfa ?? v.purchase_price;
                  return (
                    <tr key={v.id} className="border-b border-slate-100">
                      <td className="p-3 font-mono">{v.vin ?? "—"}</td>
                      <td className="p-3">{v.brand ?? "—"} {v.model ?? ""}</td>
                      <td className="p-3">{v.year ?? "—"}</td>
                      <td className="p-3">{v.status ?? "—"}</td>
                      <td className="p-3">
                        {prixAchat != null
                          ? `${prixAchat.toLocaleString("fr-FR")} FCFA`
                          : "—"}
                      </td>
                      <td className="p-3">{v.price_sale != null ? v.price_sale.toLocaleString("fr-FR") : "—"}</td>
                      <td className="p-3"><Link href={`/vehicules/${v.id}`} className="text-sm text-primary-600 hover:underline">Fiche</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
