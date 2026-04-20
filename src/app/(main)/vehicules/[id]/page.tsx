"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPatch } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface VehicleDetail {
  id: number;
  vin?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  status?: string;
  /** Immatriculation */
  registration?: string;
  mileage?: number;
  purchase_price?: number;
  purchase_price_fcfa?: number;
  /** Date d'achat */
  purchase_date?: string;
  /** Frais transport FCFA */
  transport_fees?: number;
  /** Fournisseur */
  supplier_name?: string;
  price_sale?: number;
  client_name?: string;
}

/** Normalise la réponse API (plusieurs champs possibles côté backend). */
function normalizeVehicleDetail(r: Record<string, unknown>): VehicleDetail {
  const purchasePrice = (r.purchase_price as number) ?? (r.purchasePrice as number);
  const purchasePriceFcfa =
    (r.purchase_price_fcfa as number) ??
    (r.purchasePriceFcfa as number) ??
    (r.prix_fcfa as number) ??
    (r.amount_fcfa as number) ??
    (r.montant_fcfa as number) ??
    (r.montantFCFA as number);
  return {
    id: (r.id as number) ?? 0,
    vin: (r.vin as string) ?? "",
    brand: (r.brand as string) ?? (r.marque as string),
    model: (r.model as string) ?? (r.modele as string),
    year: (r.year as number) ?? (r.annee as number),
    color: (r.color as string) ?? (r.couleur as string),
    status: (r.status as string) ?? "",
    registration: (r.registration as string) ?? (r.immatriculation as string) ?? (r.license_plate as string),
    mileage: (r.mileage as number) ?? (r.kilometrage as number),
    purchase_price: purchasePrice ?? purchasePriceFcfa,
    purchase_price_fcfa: purchasePriceFcfa ?? purchasePrice,
    purchase_date: (r.purchase_date as string) ?? (r.purchaseDate as string) ?? (r.date_achat as string),
    transport_fees: (r.transport_fees as number) ?? (r.transportFees as number) ?? (r.frais_transport as number),
    supplier_name: (r.supplier_name as string) ?? (r.supplierName as string) ?? (r.fournisseur as string),
    price_sale: (r.price_sale as number) ?? (r.priceSale as number) ?? (r.prix_vente as number),
    client_name: (r.client_name as string) ?? (r.clientName as string),
  };
}

function formatFcfa(value: number | undefined | null): string {
  if (value == null) return "—";
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

export default function VehiculeDetailPage() {
  const params = useParams();
  const id = params?.id ? String(params.id) : null;
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingExit, setMarkingExit] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const res = await apiGet<Record<string, unknown>>(`/vehicles/${id}`);
      setVehicle(res ? normalizeVehicleDetail(res as Record<string, unknown>) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement");
      setVehicle(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleMarquerSortieParc = async () => {
    if (!id) return;
    setMarkingExit(true);
    try {
      await apiPatch(`/vehicles/${id}`, { status: "LIVRE" } as Record<string, string>);
      await fetchDetail();
    } catch {
      setError("Impossible de marquer la sortie du parc");
    } finally {
      setMarkingExit(false);
    }
  };

  if (!id) {
    return (
      <div>
        <p className="text-slate-500">Identifiant manquant.</p>
        <Link href="/supply-chain/stock-disponible" className="text-primary-600 hover:underline">
          Retour
        </Link>
      </div>
    );
  }

  if (loading && !vehicle) {
    return <p className="py-8 text-slate-500">Chargement…</p>;
  }

  if (error && !vehicle) {
    return (
      <div>
        <p className="text-red-600">{error}</p>
        <Link href="/supply-chain/vue-globale" className="text-primary-600 hover:underline">
          Retour
        </Link>
      </div>
    );
  }

  const v = vehicle!;

  const isVendu = (v.status ?? "").toUpperCase() === "VENDU";

  const prixAchat = (v.purchase_price_fcfa ?? v.purchase_price) != null ? (v.purchase_price_fcfa ?? v.purchase_price)! : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-3">
            <Link href="/supply-chain/vue-globale" className="text-sm text-primary-600 hover:underline">← Vue parc</Link>
            <Link href={`/vehicules/${id}/historique`} className="text-sm text-primary-600 hover:underline">Historique</Link>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            Véhicule : {[v.brand, v.model].filter(Boolean).join(" ") || v.vin || id}
          </h1>
        </div>
        {isVendu && (
          <Button
            variant="secondary"
            onClick={handleMarquerSortieParc}
            disabled={markingExit}
          >
            {markingExit ? "En cours…" : "Marquer sortie du parc"}
          </Button>
        )}
      </div>

      <Card title="Identité du véhicule">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div><dt className="text-sm text-slate-500">Marque</dt><dd>{v.brand ?? "—"}</dd></div>
          <div><dt className="text-sm text-slate-500">Modèle</dt><dd>{v.model ?? "—"}</dd></div>
          <div><dt className="text-sm text-slate-500">Année</dt><dd>{v.year ?? "—"}</dd></div>
          <div><dt className="text-sm text-slate-500">VIN / Châssis</dt><dd className="font-mono font-medium">{v.vin ?? "—"}</dd></div>
          <div><dt className="text-sm text-slate-500">Immatriculation</dt><dd>{v.registration ?? "—"}</dd></div>
          <div><dt className="text-sm text-slate-500">Couleur</dt><dd>{v.color ?? "—"}</dd></div>
          <div><dt className="text-sm text-slate-500">Kilométrage</dt><dd>{v.mileage != null ? `${v.mileage.toLocaleString("fr-FR")} km` : "—"}</dd></div>
        </dl>
      </Card>

      <Card title="Informations d'achat">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div><dt className="text-sm text-slate-500">Date d'achat</dt><dd>{v.purchase_date ? new Date(v.purchase_date).toLocaleDateString("fr-FR") : "—"}</dd></div>
          <div><dt className="text-sm text-slate-500">Prix d'achat</dt><dd>{prixAchat != null ? formatFcfa(prixAchat) : "—"}</dd></div>
          <div><dt className="text-sm text-slate-500">Frais transport</dt><dd>{v.transport_fees != null ? formatFcfa(v.transport_fees) : "—"}</dd></div>
          <div><dt className="text-sm text-slate-500">Fournisseur</dt><dd>{v.supplier_name ?? "—"}</dd></div>
          <div><dt className="text-sm text-slate-500">Statut</dt><dd><Badge>{v.status ?? "—"}</Badge></dd></div>
          <div><dt className="text-sm text-slate-500">Prix de vente</dt><dd>{v.price_sale != null ? formatFcfa(v.price_sale) : "—"}</dd></div>
          <div><dt className="text-sm text-slate-500">Client</dt><dd>{v.client_name ?? "—"}</dd></div>
        </dl>
      </Card>

      <Card title="Navigation">
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
          Réparations, devis, facture et paiements pour ce véhicule.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/supply-chain/atelier" className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">Réparations</Link>
          <Link href={`/comptabilite/devis?vehicleId=${id}`} className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">Devis</Link>
          <Link href="/comptabilite/factures" className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">Facture</Link>
          <Link href="/comptabilite/recus" className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">Paiements</Link>
          <Link href={`/vehicules/${id}/historique`} className="inline-flex items-center rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-800 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-200">Historique complet</Link>
        </div>
      </Card>
    </div>
  );
}
