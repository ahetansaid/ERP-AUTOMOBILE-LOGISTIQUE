"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPatch } from "@/lib/api";
import type { PurchaseDetail, PurchaseVehicleInDetail } from "@/types/purchase";
import { asRecord, asRecords, pickNumber, pickString } from "@/lib/records";
import { ContainerCosts } from "@/components/purchases/ContainerCosts";
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
      const res = asRecord(await apiGet(`/purchases/${id}`));
      // Le backend renvoie soit { purchase, vehicles }, soit l'achat à plat.
      const raw = res.purchase !== undefined ? asRecord(res.purchase) : res;
      const vehList = asRecords(
        res.vehicles !== undefined ? res.vehicles : raw.vehicles
      );

      const vehicles: PurchaseVehicleInDetail[] = vehList.map((v) => ({
        id: pickNumber(v, "id") ?? 0,
        vin: pickString(v, "vin") ?? "",
        brand: pickString(v, "brand", "marque"),
        model: pickString(v, "model", "modele"),
        year: pickNumber(v, "year", "annee"),
        color: pickString(v, "color", "couleur"),
        purchase_id: pickNumber(v, "purchase_id", "purchaseId"),
        status: pickString(v, "status"),
        purchase_price_fcfa: pickNumber(
          v,
          "purchase_price_fcfa",
          "purchasePriceFcfa",
          "montant_fcfa",
          "montantFCFA"
        ),
      }));

      // Montant total : fourni par l'API, sinon reconstitué depuis les véhicules.
      const amountFromApi = pickNumber(
        raw,
        "amount_fcfa",
        "montant_fcfa",
        "montantFCFA",
        "total_fcfa",
        "total_amount"
      );
      const amountFromVehicles = vehicles.reduce(
        (sum, v) => sum + (v.purchase_price_fcfa ?? 0),
        0
      );

      setPurchase({
        id: pickNumber(raw, "id") ?? Number(id),
        supplier_name: pickString(raw, "supplier_name", "fournisseurNom"),
        purchase_date: pickString(raw, "purchase_date", "dateAchat"),
        // Date d'arrivée = passage au statut Arrivé ; le backend l'expose sous
        // plusieurs noms selon la route.
        arrival_date: pickString(
          raw,
          "arrival_date",
          "date_arrivee",
          "arrived_at",
          "status_updated_at",
          "updated_at"
        ),
        container_reference: pickString(raw, "container_reference", "conteneur"),
        vessel: pickString(raw, "vessel", "navire"),
        purchase_price: pickNumber(raw, "purchase_price"),
        currency: pickString(raw, "currency"),
        amount_fcfa:
          amountFromApi ?? (amountFromVehicles > 0 ? amountFromVehicles : undefined),
        type_achat: pickString(raw, "type_achat", "typeAchat"),
        status: pickString(raw, "status") as PurchaseDetail["status"],
        vehicles,
      });
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
  const supplierName = p.supplier_name ?? "—";
  const purchaseDateRaw = p.purchase_date;
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
            <dd>{p.container_reference ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Navire</dt>
            <dd>{p.vessel ?? "—"}</dd>
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

      <ContainerCosts purchaseId={p.id} />

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
                  const prixFcfa = v.purchase_price_fcfa;
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
