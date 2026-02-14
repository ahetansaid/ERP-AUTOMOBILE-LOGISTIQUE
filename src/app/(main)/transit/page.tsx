"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { transitApi, transitOperationsApi } from "@/lib/services/api";
import type { Vehicle, TransitOperation } from "@/types";
import type { TransitOperationType } from "@/types";

const transitTabs = [
  { id: "vue", label: "Vue d'ensemble" },
  { id: "operations", label: "Opérations" },
  { id: "maritime", label: "Transit maritime" },
  { id: "vehicules", label: "Véhicules" },
  { id: "dedouanement", label: "Dédouanement" },
  { id: "achats", label: "Achats" },
  { id: "import_export", label: "Import / Export" },
] as const;

const OPERATION_TYPES: { value: TransitOperationType; label: string }[] = [
  { value: "MARITIME", label: "Maritime" },
  { value: "VEHICULE", label: "Véhicule" },
  { value: "DEDOUANEMENT", label: "Dédouanement" },
  { value: "ACHAT", label: "Achat" },
  { value: "IMPORT", label: "Import" },
  { value: "EXPORT", label: "Export" },
];

export default function TransitPage() {
  const [activeTab, setActiveTab] = useState<(typeof transitTabs)[number]["id"]>("vue");
  const [steps, setSteps] = useState<{ step: string; count: number }[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [operations, setOperations] = useState<TransitOperation[]>([]);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [operationTypeFilter, setOperationTypeFilter] = useState<string>("");
  const [showOpForm, setShowOpForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([transitApi.steps(), transitApi.vehicles()])
      .then(([stepsRes, vehiclesRes]) => {
        if (cancelled) return;
        setSteps(stepsRes.steps ?? []);
        setVehicles(vehiclesRes.data ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur chargement transit");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "operations") return;
    setOperationsLoading(true);
    transitOperationsApi
      .list(operationTypeFilter ? { operationType: operationTypeFilter } : undefined)
      .then((r) => setOperations(r.data ?? []))
      .catch(() => setOperations([]))
      .finally(() => setOperationsLoading(false));
  }, [activeTab, operationTypeFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-200 border-t-accent-600" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-red-800">
        <p className="font-semibold">Erreur</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Transit & Douane</h1>
        <p className="mt-1 text-slate-500">Gestion complète des opérations de douane et de transit</p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-1 shadow-card">
        <nav className="flex flex-wrap gap-1">
          {transitTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === t.id ? "bg-accent-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "vue" && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((s, i) => (
              <Card key={s.step} className={i === 0 ? "border-l-4 border-l-accent-500" : ""}>
                <CardTitle className="text-sm font-medium text-slate-500">{s.step}</CardTitle>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-800">{s.count}</p>
              </Card>
            ))}
          </div>
          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <CardTitle className="mb-0">Véhicules en transit</CardTitle>
            </div>
            <div className="table-container rounded-none border-0 shadow-none">
              <table>
                <thead>
                  <tr><th>VIN</th><th>Marque / Modèle</th><th>Statut</th><th className="text-right">Action</th></tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v.id}>
                      <td className="font-mono text-sm">{v.vin}</td>
                      <td className="font-medium">{v.brand} {v.model}</td>
                      <td><Badge color="blue">{v.status}</Badge></td>
                      <td className="text-right">
                        <Link href={`/parc-auto/${v.vin}`} className="text-accent-600 hover:underline font-medium">VIN 360°</Link>
                      </td>
                    </tr>
                  ))}
                  {vehicles.length === 0 && (
                    <tr><td colSpan={4} className="py-12 text-center text-slate-500">Aucun véhicule en transit</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {activeTab === "operations" && (
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="mb-0">Opérations transit & douane</CardTitle>
            <Button onClick={() => setShowOpForm(!showOpForm)}>{showOpForm ? "Annuler" : "+ Nouvelle opération"}</Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Type :</span>
            <select
              value={operationTypeFilter}
              onChange={(e) => setOperationTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
            >
              <option value="">Tous</option>
              {OPERATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          {showOpForm && (
            <form
              className="mt-6 grid gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-2 lg:grid-cols-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const operationType = (form.querySelector('[name="operationType"]') as HTMLSelectElement)?.value as TransitOperationType;
                const reference = (form.querySelector('[name="reference"]') as HTMLInputElement)?.value?.trim();
                const blNumber = (form.querySelector('[name="blNumber"]') as HTMLInputElement)?.value?.trim();
                const vesselName = (form.querySelector('[name="vesselName"]') as HTMLInputElement)?.value?.trim();
                const details = (form.querySelector('[name="details"]') as HTMLTextAreaElement)?.value?.trim();
                if (!operationType) return;
                try {
                  const created = await transitOperationsApi.create({
                    operationType,
                    reference: reference || undefined,
                    blNumber: blNumber || undefined,
                    vesselName: vesselName || undefined,
                    details: details || undefined,
                  });
                  setOperations((prev) => [created, ...prev]);
                  setShowOpForm(false);
                  form.reset();
                } catch (err) {
                  console.error(err);
                }
              }}
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Type *</label>
                <select name="operationType" required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
                  {OPERATION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <input name="reference" placeholder="Référence" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="blNumber" placeholder="N° BL" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="vesselName" placeholder="Navire" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <textarea name="details" placeholder="Détails" rows={2} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm sm:col-span-2" />
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit">Créer</Button>
                <Button type="button" variant="outline" onClick={() => setShowOpForm(false)}>Annuler</Button>
              </div>
            </form>
          )}
          {operationsLoading && <div className="mt-4 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-200 border-t-accent-600" /></div>}
          {!operationsLoading && (
            <div className="table-container mt-6 rounded-xl border border-slate-100 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-slate-600">
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Référence</th>
                    <th className="px-4 py-3 font-medium">N° BL</th>
                    <th className="px-4 py-3 font-medium">Navire</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {operations.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Aucune opération.</td></tr>
                  ) : (
                    operations.map((op) => (
                      <tr key={op.id} className="border-b border-slate-100">
                        <td className="px-4 py-3">{op.operationType}</td>
                        <td className="px-4 py-3">{op.reference ?? "—"}</td>
                        <td className="px-4 py-3 font-mono">{op.blNumber ?? "—"}</td>
                        <td className="px-4 py-3">{op.vesselName ?? "—"}</td>
                        <td className="px-4 py-3">{op.createdAt ? new Date(op.createdAt).toLocaleDateString("fr-FR") : "—"}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => transitOperationsApi.delete(op.id).then(() => setOperations((prev) => prev.filter((x) => x.id !== op.id)))}
                            className="text-slate-400 hover:text-red-600 text-xs"
                          >
                            Suppr.
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === "maritime" && (
        <Card>
          <CardTitle>Transit maritime — Infos navires & conteneurs</CardTitle>
          <p className="mt-2 text-slate-500">
            Gestion des informations navires, numéros de BL, conteneurs. Données disponibles dans la fiche VIN 360° (étapes transit, BL).
          </p>
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center text-slate-500">
            Données disponibles dans la fiche VIN 360° (étapes transit, BL).
          </div>
        </Card>
      )}

      {activeTab === "vehicules" && (
        <Card>
          <CardTitle>Transit véhicules</CardTitle>
          <p className="mt-2 text-slate-500">Suivi des véhicules par étape.</p>
          <div className="mt-4">
            <Link href="/parc-auto"><Button variant="outline">Voir le parc automobile</Button></Link>
          </div>
          <div className="mt-6 table-container rounded-xl border border-slate-100">
            <table>
              <thead>
                <tr><th>VIN</th><th>Marque / Modèle</th><th>Statut</th><th className="text-right">Action</th></tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td className="font-mono text-sm">{v.vin}</td>
                    <td>{v.brand} {v.model}</td>
                    <td><Badge color="blue">{v.status}</Badge></td>
                    <td className="text-right"><Link href={`/parc-auto/${v.vin}`} className="text-accent-600 hover:underline">VIN 360°</Link></td>
                  </tr>
                ))}
                {vehicles.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-500">Aucun véhicule</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "dedouanement" && (
        <Card>
          <CardTitle>Dédouanement client</CardTitle>
          <p className="mt-2 text-slate-500">
            Procédures de dédouanement, déclarations, quittances. Données dans la fiche véhicule (étapes transit, documents).
          </p>
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center text-slate-500">
            Module dédouanement — données dans fiche véhicule (VIN 360°).
          </div>
        </Card>
      )}

      {activeTab === "achats" && (
        <Card>
          <CardTitle>Achats véhicules — Lieu d'expédition</CardTitle>
          <p className="mt-2 text-slate-500">
            Gestion des achats : lieu d'expédition, fournisseur, informations à déclarer pour la compta.
          </p>
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center text-slate-500">
            Renseigner port d’embarquement, fournisseur et prix d’achat dans la fiche véhicule.
          </div>
        </Card>
      )}

      {activeTab === "import_export" && (
        <Card>
          <CardTitle>Import / Export amont & aval</CardTitle>
          <p className="mt-2 text-slate-500">
            Gestion des flux d'import et d'export en amont et aval.
          </p>
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center text-slate-500">
            Module Import / Export.
          </div>
        </Card>
      )}
    </div>
  );
}
