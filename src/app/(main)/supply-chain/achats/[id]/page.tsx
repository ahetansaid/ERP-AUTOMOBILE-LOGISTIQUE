"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPatch } from "@/lib/api";
import type { PurchaseDetail } from "@/types/purchase";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function AchatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id ? String(params.id) : null;
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const res = await apiGet<{ purchase?: PurchaseDetail; vehicles?: PurchaseDetail["vehicles"] }>(
        `/purchases/${id}`
      );
      const raw = (res as { purchase?: PurchaseDetail }).purchase ?? (res as PurchaseDetail);
      const vehicles = (res as { vehicles?: PurchaseDetail["vehicles"] }).vehicles ?? raw?.vehicles;
      const r = raw as Record<string, unknown>;
      // Date arrivée = date du passage au statut Arrivé (backend peut renvoyer arrival_date, date_arrivee, arrived_at, etc.)
      const arrivalDateRaw =
        (raw?.arrival_date as string) ??
        (r.date_arrivee as string) ??
        (r.arrived_at as string) ??
        (r.status_updated_at as string) ??
        (r.updated_at as string);
      // Montant total (FCFA) : backend peut renvoyer amount_fcfa, montant_fcfa, montantFCFA, total_fcfa, etc.
      const vehList = vehicles ?? raw?.vehicles ?? [];
      const amountFromApi =
        (raw?.amount_fcfa as number) ??
        (r.montant_fcfa as number) ??
        (r.montantFCFA as number) ??
        (r.total_fcfa as number) ??
        (r.total_amount as number);
      const amountFromVehicles = Array.isArray(vehList)
        ? (vehList as Array<Record<string, unknown>>).reduce((sum, v) => {
            const prix =
              (v.purchase_price_fcfa as number) ??
              (v.purchasePriceFcfa as number) ??
              (v.montant_fcfa as number) ??
              (v.montantFCFA as number) ??
              0;
            return sum + (typeof prix === "number" ? prix : 0);
          }, 0)
        : 0;
      const amountFcfa = amountFromApi ?? (amountFromVehicles > 0 ? amountFromVehicles : undefined);
      const p = raw
        ? {
            ...raw,
            arrival_date: arrivalDateRaw || undefined,
            amount_fcfa: amountFcfa,
            vehicles: vehList,
          }
        : null;
      setPurchase(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement");
      setPurchase(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleValidateArrival = async () => {
    if (!id || purchase?.status !== "EN_COURS") return;
    try {
      setValidating(true);
      await apiPatch(`/purchases/${id}/arrive`, {});
      await fetchDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur validation");
    } finally {
      setValidating(false);
    }
  };

  if (!id) {
    return (
      <div>
        <p className="text-slate-500">Identifiant manquant.</p>
        <Link href="/supply-chain/achats" className="text-primary-600 hover:underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  if (loading && !purchase) {
    return <p className="py-8 text-slate-500">Chargement…</p>;
  }

  if (error && !purchase) {
    return (
      <div>
        <p className="text-red-600">{error}</p>
        <Link href="/supply-chain/achats" className="text-primary-600 hover:underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const p = purchase!;
  const supplierName =
    p.supplier_name ?? (p as Record<string, string>).fournisseurNom ?? "—";
  const purchaseDateRaw = p.purchase_date ?? (p as Record<string, string>).dateAchat;
  const purchaseDate = purchaseDateRaw
    ? new Date(purchaseDateRaw).toLocaleDateString("fr-FR")
    : "—";
  // Date arrivée = date du passage au statut Arrivé ; n'afficher qu'en statut ARRIVE
  const arrivalDate =
    p.status === "ARRIVE" && p.arrival_date
      ? new Date(p.arrival_date).toLocaleDateString("fr-FR")
      : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/supply-chain/achats"
            className="text-sm text-primary-600 hover:underline"
          >
            ← Liste des achats
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Fiche achat #{p.id}
          </h1>
        </div>
        {p.status === "EN_COURS" && (
          <Button
            onClick={handleValidateArrival}
            disabled={validating}
          >
            {validating ? "Validation…" : "Valider arrivée"}
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <Card title="Récapitulatif">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Fournisseur</dt>
            <dd className="font-medium">{supplierName}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Date achat</dt>
            <dd>{purchaseDate}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Date arrivée</dt>
            <dd>{arrivalDate}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Conteneur</dt>
            <dd>{p.container_reference ?? (p as Record<string, string>).conteneur ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Navire</dt>
            <dd>{p.vessel ?? (p as Record<string, string>).navire ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Statut</dt>
            <dd>
              <Badge variant={p.status === "ARRIVE" ? "success" : "warning"}>
                {p.status === "ARRIVE" ? "Arrivé" : "En cours"}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Montant (FCFA)</dt>
            <dd>
              {p.amount_fcfa != null
                ? p.amount_fcfa.toLocaleString("fr-FR")
                : "—"}
            </dd>
          </div>
        </dl>
      </Card>

      <Card title="Véhicules">
        {!p.vehicles?.length ? (
          <p className="text-slate-500">Aucun véhicule.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="p-2 font-medium">VIN</th>
                  <th className="p-2 font-medium">Marque</th>
                  <th className="p-2 font-medium">Modèle</th>
                  <th className="p-2 font-medium">Année</th>
                  <th className="p-2 font-medium">Couleur</th>
                  <th className="p-2 font-medium">Prix achat (FCFA)</th>
                </tr>
              </thead>
              <tbody>
                {p.vehicles.map((v) => {
                  const raw = v as Record<string, unknown>;
                  const prixFcfa = (raw.purchase_price_fcfa as number) ?? (raw.purchasePriceFcfa as number) ?? (raw.montant_fcfa as number) ?? (raw.montantFCFA as number);
                  return (
                    <tr key={v.id} className="border-b border-slate-100">
                      <td className="p-2 font-mono">{v.vin}</td>
                      <td className="p-2">{v.brand ?? "—"}</td>
                      <td className="p-2">{v.model ?? "—"}</td>
                      <td className="p-2">{v.year ?? "—"}</td>
                      <td className="p-2">{v.color ?? "—"}</td>
                      <td className="p-2">{prixFcfa != null ? prixFcfa.toLocaleString("fr-FR") + " FCFA" : "—"}</td>
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
