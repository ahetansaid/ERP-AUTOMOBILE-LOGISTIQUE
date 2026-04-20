"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPatch } from "@/lib/api";
import type { VehicleListItem } from "@/types/vehicle";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

/**
 * Règle métier : solde restant = prix de vente − montant payé (montant total de la facture = montant payé).
 * Bouton « Clôturer la vente » : actif uniquement si solde restant = 0.
 */
function pickVehicle(r: Record<string, unknown>): VehicleListItem {
  const priceSale = (r.price_sale as number) ?? (r.priceSale as number);
  const totalAmount =
    (r.total_amount as number) ?? (r.invoice_total as number) ?? priceSale;
  const paid =
    (r.paid_amount as number) ?? (r.paidAmount as number) ?? (r.montant_paye as number);
  const remainingFromApi =
    (r.remaining_amount as number) ??
    (r.remainingAmount as number) ??
    (r.solde_restant as number) ??
    (r.remaining_balance as number);
  const remaining_amount =
    remainingFromApi ??
    (typeof priceSale === "number" ? Math.max(0, priceSale - (paid ?? 0)) : undefined);
  return {
    id: (r.id as number) ?? 0,
    vin: (r.vin as string) ?? "",
    brand: (r.brand as string) ?? (r.marque as string),
    model: (r.model as string) ?? (r.modele as string),
    year: (r.year as number) ?? (r.annee as number),
    color: (r.color as string) ?? (r.couleur as string),
    status: (r.status as string) ?? "",
    purchase_price: (r.purchase_price as number) ?? (r.purchasePrice as number),
    price_sale: priceSale,
    total_amount: totalAmount ?? undefined,
    client_name: (r.client_name as string) ?? (r.clientName as string),
    remaining_amount: remaining_amount,
    paid_amount: paid ?? undefined,
  };
}

function formatFcfa(value: number | undefined | null): string {
  if (value == null) return "—";
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

export default function StockNonRegulierPage() {
  const [list, setList] = useState<VehicleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [closingId, setClosingId] = useState<number | null>(null);

  const fetchList = useCallback(async () => {
    try {
      setError(null);
      const res = await apiGet<{ data?: VehicleListItem[] }>("/vehicles?status=EN_VENTE");
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

  /** Clôturer la vente : autorisé uniquement si solde restant = 0 (facture intégralement payée). */
  const handleCloturerVente = async (id: number) => {
    const v = list.find((x) => x.id === id);
    if (v == null || v.remaining_amount !== 0) return;
    try {
      setClosingId(id);
      await apiPatch(`/vehicles/${id}`, { status: "VENDU" });
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
      (v.client_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Stock non régulier</h1>
        <p className="mt-1 text-slate-600">
          Véhicules en vente dont le paiement n&apos;est pas encore totalement soldé.
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
          <p className="py-8 text-center text-slate-500">Aucun véhicule en vente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-600">
                  <th className="p-3 font-medium">VIN</th>
                  <th className="p-3 font-medium">Marque / Modèle</th>
                  <th className="p-3 font-medium">Client</th>
                  <th className="p-3 font-medium" title="Montant total de la facture">Montant facture</th>
                  <th className="p-3 font-medium" title="Somme des reçus liés à la facture">Montant payé</th>
                  <th className="p-3 font-medium" title="Montant facture − Montant payé">Solde restant</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const solde = v.remaining_amount;
                  const soldeKnown = solde !== undefined && solde !== null;
                  const canClose = soldeKnown && solde === 0;
                  return (
                    <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-3 font-mono">{v.vin}</td>
                      <td className="p-3">
                        {v.brand ?? "—"} {v.model ? ` / ${v.model}` : ""}
                      </td>
                      <td className="p-3">{v.client_name ?? "—"}</td>
                      <td className="p-3">{formatFcfa(v.total_amount ?? v.price_sale)}</td>
                      <td className="p-3">{formatFcfa(v.paid_amount)}</td>
                      <td className="p-3">
                        <span className={soldeKnown && solde > 0 ? "text-amber-600" : soldeKnown && solde === 0 ? "text-green-600" : ""}>
                          {formatFcfa(v.remaining_amount)}
                        </span>
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/vehicules/${v.id}`}
                          className="mr-2 text-sm text-primary-600 hover:underline"
                        >
                          Voir
                        </Link>
                        <Button
                          size="sm"
                          disabled={!canClose || closingId === v.id}
                          title={
                            !soldeKnown
                              ? "La facture doit indiquer un solde restant (0 pour clôturer)"
                              : !canClose
                                ? "Clôture possible uniquement lorsque le solde restant est à 0"
                                : ""
                          }
                          onClick={() => handleCloturerVente(v.id)}
                        >
                          {closingId === v.id ? "Clôture…" : "Clôturer la vente"}
                        </Button>
                      </td>
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
