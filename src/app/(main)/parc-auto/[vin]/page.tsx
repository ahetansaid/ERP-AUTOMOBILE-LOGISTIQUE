"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { VEHICLE_STATUSES, TRANSIT_STEPS } from "@/lib/constants";
import { vehiclesApi } from "@/lib/services/api";
import type { Vehicle } from "@/types";

const statusColor: Record<string, string> = {
  ACHETE: "slate", EN_TRANSIT: "blue", ARRIVE_PORT: "cyan", EN_DOUANE: "amber",
  DEDOUANE: "emerald", LIVRE: "green", VENDU: "violet",
};

export default function Vin360Page() {
  const params = useParams();
  const router = useRouter();
  const vin = decodeURIComponent((params.vin as string) ?? "");
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"infos" | "transit" | "documents" | "compta" | "historique">("infos");

  useEffect(() => {
    if (!vin) return;
    let cancelled = false;
    vehiclesApi
      .getByVin(vin)
      .then((v) => {
        if (!cancelled) setVehicle(v);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Véhicule non trouvé");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vin]);

  const tabs = [
    { id: "infos" as const, label: "Infos véhicule" },
    { id: "transit" as const, label: "Transit" },
    { id: "documents" as const, label: "Documents" },
    { id: "compta" as const, label: "Compta & rentabilité" },
    { id: "historique" as const, label: "Historique" },
  ];

  if (loading) {
    return <p className="text-slate-500">Chargement...</p>;
  }

  if (error || !vehicle) {
    return (
      <div className="space-y-4">
        <p className="text-slate-600">{error ?? "Véhicule non trouvé."}</p>
        <Button onClick={() => router.push("/parc-auto")}>Retour au parc</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/parc-auto" className="text-slate-500 hover:text-slate-800">← Parc</Link>
        <h1 className="text-2xl font-bold text-slate-800">
          VIN 360° — {vehicle.brand} {vehicle.model} ({vehicle.year})
        </h1>
        <Badge color={statusColor[vehicle.status] ?? "slate"}>
          {VEHICLE_STATUSES.find((s) => s.id === vehicle.status)?.label ?? vehicle.status}
        </Badge>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex gap-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`border-b-2 py-2 text-sm font-medium ${
                activeTab === t.id ? "border-slate-800 text-slate-800" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "infos" && (
        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardTitle>Identification</CardTitle>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-slate-500">VIN</dt><dd className="font-mono font-medium">{vehicle.vin}</dd></div>
              <div><dt className="text-slate-500">Marque / Modèle</dt><dd>{vehicle.brand} {vehicle.model}</dd></div>
              <div><dt className="text-slate-500">Année</dt><dd>{vehicle.year}</dd></div>
              <div><dt className="text-slate-500">Client</dt><dd>{vehicle.clientName ?? "—"}</dd></div>
            </dl>
          </Card>
          <Card>
            <CardTitle>Financier</CardTitle>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-slate-500">Prix d&apos;achat</dt><dd>{vehicle.purchasePrice != null ? `${vehicle.purchasePrice.toLocaleString()} ${vehicle.currency ?? "USD"}` : "—"}</dd></div>
              <div><dt className="text-slate-500">Prix de vente</dt><dd>{vehicle.salePrice != null ? `${vehicle.salePrice.toLocaleString()} ${vehicle.currency ?? "USD"}` : "—"}</dd></div>
            </dl>
          </Card>
        </div>
      )}

      {activeTab === "transit" && (
        <Card>
          <CardTitle>Étapes transit</CardTitle>
          <ul className="mt-4 space-y-3">
            {TRANSIT_STEPS.map((step, i) => (
              <li key={step} className="flex items-center gap-3 text-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600">{i + 1}</span>
                <span className="text-slate-800">{step}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {activeTab === "documents" && (
        <Card>
          <CardTitle>Documents liés</CardTitle>
          <p className="mt-4 text-sm text-slate-500">Données fournies par le backend (GET /vehicles/:id/documents).</p>
        </Card>
      )}

      {activeTab === "compta" && (
        <Card>
          <CardTitle>Rentabilité</CardTitle>
          <p className="mt-4 text-sm text-slate-500">Données fournies par le backend (charges, marge).</p>
        </Card>
      )}

      {activeTab === "historique" && (
        <Card>
          <CardTitle>Historique</CardTitle>
          <p className="mt-4 text-sm text-slate-500">Données fournies par le backend (GET /vehicles/:id/history).</p>
        </Card>
      )}
    </div>
  );
}
