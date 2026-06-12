"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPatch } from "@/lib/api";
import type { VehicleListItem } from "@/types/vehicle";
import { Button } from "@/components/ui/Button";
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
  const arrivalDate =
    (r.arrival_date as string) ??
    (r.date_arrivee as string) ??
    (r.arrived_at as string) ??
    (r.available_since as string);
  return {
    id: (r.id as number) ?? 0,
    vin: (r.vin as string) ?? "",
    brand: (r.brand as string) ?? (r.marque as string),
    model: (r.model as string) ?? (r.modele as string),
    year: (r.year as number) ?? (r.annee as number),
    color: (r.color as string) ?? (r.couleur as string),
    status: (r.status as string) ?? "",
    purchase_price: purchasePrice,
    purchase_price_fcfa: purchasePriceFcfa,
    price_sale: (r.price_sale as number) ?? (r.priceSale as number),
    arrival_date: arrivalDate || undefined,
  };
}

/** Nombre de jours entre la date d'arrivée et aujourd'hui (date de référence = début de journée locale). */
function daysSinceArrival(arrivalDate: string | null | undefined): number | null {
  if (!arrivalDate) return null;
  const d = new Date(arrivalDate);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - d.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

export default function StockDisponiblePage() {
  const [list, setList] = useState<VehicleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<string>("");
  const [actionDropdown, setActionDropdown] = useState<number | null>(null);
  const [venteModal, setVenteModal] = useState<VehicleListItem | null>(null);
  const [clientId, setClientId] = useState("");
  const [clients, setClients] = useState<{ id: number; name?: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      setError(null);
      const res = await apiGet<{ data?: VehicleListItem[] }>("/vehicles?status=DISPONIBLE");
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

  const handleSendToAtelier = async (id: number) => {
    try {
      await apiPatch(`/vehicles/${id}`, { status: "EN_MAINTENANCE" });
      await fetchList();
      setActionDropdown(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleSavePrice = async (id: number) => {
    const val = Number(editPriceValue);
    if (Number.isNaN(val) || val < 0) return;
    try {
      await apiPatch(`/vehicles/${id}`, { price_sale: val });
      setEditingPriceId(null);
      setEditPriceValue("");
      await fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const loadClients = useCallback(async () => {
    try {
      const res = await apiGet<{ clients?: { id: number; name?: string }[] }>("/clients");
      const arr = (res as { clients?: { id: number; name?: string }[] })?.clients ?? [];
      setClients(arr);
    } catch {
      setClients([]);
    }
  }, []);

  useEffect(() => {
    if (venteModal) loadClients();
  }, [venteModal, loadClients]);

  const handleDebuterVente = async () => {
    if (!venteModal || !clientId) return;
    setSubmitting(true);
    try {
      await apiPatch(`/vehicles/${venteModal.id}`, {
        status: "EN_VENTE",
        client_id: Number(clientId),
      });
      setVenteModal(null);
      setClientId("");
      await fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
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
      <PageHero
        eyebrow="Supply chain"
        title="Stock disponible"
        subtitle="Véhicules au parc non encore mis en vente."
      />

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

      <Card title="Liste">
        {loading ? (
          <p className="py-8 text-center text-slate-500">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-slate-500">Aucun véhicule disponible.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-600">
                  <th className="p-3 font-medium">VIN</th>
                  <th className="p-3 font-medium">Marque</th>
                  <th className="p-3 font-medium">Modèle</th>
                  <th className="p-3 font-medium">Année</th>
                  <th className="p-3 font-medium" title="Nombre de jours sur le parc depuis l'arrivée">
                    Nbre de jours
                  </th>
                  <th className="p-3 font-medium">Prix achat</th>
                  <th className="p-3 font-medium">
                    <span title="Cliquez sur le prix ou utilisez Actions pour ajouter ou modifier">
                      Prix de vente
                    </span>
                  </th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-3 font-mono">{v.vin}</td>
                    <td className="p-3">{v.brand ?? "—"}</td>
                    <td className="p-3">{v.model ?? "—"}</td>
                    <td className="p-3">{v.year ?? "—"}</td>
                    <td className="p-3">
                      {(() => {
                        const days = daysSinceArrival(v.arrival_date);
                        return days != null ? days : "—";
                      })()}
                    </td>
                    <td className="p-3">
                      {(v.purchase_price_fcfa ?? v.purchase_price) != null
                        ? `${(v.purchase_price_fcfa ?? v.purchase_price).toLocaleString("fr-FR")} FCFA`
                        : "—"}
                    </td>
                    <td className="p-3">
                      {editingPriceId === v.id ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            placeholder="Prix (FCFA)"
                            value={editPriceValue}
                            onChange={(e) => setEditPriceValue(e.target.value)}
                            className="w-32"
                          />
                          <Button size="sm" onClick={() => handleSavePrice(v.id)}>
                            Enregistrer
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingPriceId(null);
                              setEditPriceValue("");
                            }}
                          >
                            Annuler
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>
                            {v.price_sale != null && v.price_sale > 0
                              ? `${v.price_sale.toLocaleString("fr-FR")} FCFA`
                              : "—"}
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditingPriceId(v.id);
                              setEditPriceValue(String(v.price_sale ?? ""));
                            }}
                          >
                            {v.price_sale != null && v.price_sale > 0
                              ? "Modifier"
                              : "Ajouter prix"}
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setActionDropdown(actionDropdown === v.id ? null : v.id)
                          }
                        >
                          Actions ▾
                        </Button>
                        {actionDropdown === v.id && (
                          <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                            <Link
                              href={`/vehicules/${v.id}`}
                              className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                              onClick={() => setActionDropdown(null)}
                            >
                              Voir fiche
                            </Link>
                            <button
                              type="button"
                              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                              onClick={() => {
                                setEditingPriceId(v.id);
                                setEditPriceValue(String(v.price_sale ?? ""));
                                setActionDropdown(null);
                              }}
                            >
                              {v.price_sale != null && v.price_sale > 0
                                ? "Modifier le prix de vente"
                                : "Ajouter le prix de vente"}
                            </button>
                            <button
                              type="button"
                              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                              onClick={() => {
                                handleSendToAtelier(v.id);
                              }}
                            >
                              Envoyer vers atelier
                            </button>
                            <button
                              type="button"
                              title={
                                v.price_sale != null && v.price_sale > 0
                                  ? undefined
                                  : "Définir d'abord le prix de vente"
                              }
                              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-200 dark:hover:bg-slate-700"
                              disabled={!(v.price_sale != null && v.price_sale > 0)}
                              onClick={() => {
                                if (v.price_sale != null && v.price_sale > 0) {
                                  setVenteModal(v);
                                  setActionDropdown(null);
                                }
                              }}
                            >
                              Débuter la vente
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {venteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <h3 className="text-lg font-semibold">Débuter la vente</h3>
            <p className="mt-1 text-sm text-slate-600">
              {venteModal.vin} — {venteModal.brand} {venteModal.model}
            </p>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Client *
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              >
                <option value="">—</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name ?? `Client #${c.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setVenteModal(null)}>
                Annuler
              </Button>
              <Button
                onClick={handleDebuterVente}
                disabled={!clientId || submitting}
              >
                {submitting ? "En cours…" : "Débuter la vente"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
