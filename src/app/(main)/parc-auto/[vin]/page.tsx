"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { VEHICLE_STATUSES, VEHICLE_TYPES, STOCK_NATURES } from "@/lib/constants";
import { vehiclesApi } from "@/lib/services/api";
import type { Vehicle } from "@/types";

const statusColor: Record<string, string> = {
  ACHETE: "slate", EN_TRANSIT: "blue", ARRIVE_PORT: "cyan", EN_DOUANE: "amber",
  DEDOUANE: "emerald", LIVRE: "green", VENDU: "violet",
};

function formatHistoryDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

const HISTORY_FIELD_LABELS: Record<string, string> = {
  vin: "VIN",
  brand: "Marque",
  model: "Modèle",
  year: "Année",
  vehicleType: "Type véhicule",
  status: "Statut",
  clientId: "Client",
  numeroBl: "N° BL",
  dateEntreePort: "Date entrée port",
  dateEntreeParc: "Date entrée parc",
  natureStock: "Nature stock",
  regularise: "Régularisé",
  purchasePrice: "Prix d'achat",
  salePrice: "Prix de vente",
  currency: "Devise",
};

function formatHistoryDetails(action: string, details: string | undefined): string {
  if (!details) return "";
  let obj: Record<string, unknown>;
  try {
    obj = typeof details === "string" ? JSON.parse(details) : details;
  } catch {
    return details;
  }
  if (action === "CREATION") {
    const vin = obj.vin != null ? String(obj.vin) : null;
    return vin ? `VIN : ${vin}` : "Véhicule créé";
  }
  if (action === "MODIFICATION" && obj && typeof obj === "object") {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null || value === "") continue;
      const label = HISTORY_FIELD_LABELS[key] ?? key;
      let display: string;
      if (key === "status") {
        display = VEHICLE_STATUSES.find((s) => s.id === value)?.label ?? String(value);
      } else if (key === "vehicleType") {
        display = VEHICLE_TYPES.find((t) => t.id === value)?.label ?? String(value);
      } else if (key === "natureStock") {
        display = STOCK_NATURES.find((n) => n.id === value)?.label ?? String(value);
      } else if (key === "regularise") {
        display = value ? "Oui" : "Non";
      } else if (key === "dateEntreePort" || key === "dateEntreeParc" || key === "dateEntryPort" || key === "dateEntryParc") {
        try {
          display = new Date(String(value)).toLocaleDateString("fr-FR");
        } catch {
          display = String(value);
        }
      } else if (key === "clientId") {
        display = `#${value}`;
      } else if (typeof value === "number" && (key === "purchasePrice" || key === "salePrice" || key === "year")) {
        display = key === "year" ? String(value) : value.toLocaleString("fr-FR");
      } else {
        display = String(value);
      }
      parts.push(`${label} : ${display}`);
    }
    return parts.join(" · ");
  }
  return "";
}

export default function Vin360Page() {
  const params = useParams();
  const router = useRouter();
  const vin = decodeURIComponent((params.vin as string) ?? "");
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"infos" | "transit" | "documents" | "compta" | "historique">("infos");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-200 border-t-accent-600" />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <Card className="text-center">
        <p className="text-slate-600">{error ?? "Véhicule non trouvé."}</p>
        <Button className="mt-4" onClick={() => router.push("/parc-auto")}>
          Retour au parc
        </Button>
      </Card>
    );
  }

  async function handleConfirmDelete() {
    if (!vehicle) return;
    setDeleteError(null);
    setDeleteSubmitting(true);
    try {
      await vehiclesApi.delete(vehicle.id);
      router.push("/parc-auto");
      router.refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Erreur lors de la suppression");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/parc-auto"
          className="text-sm font-medium text-slate-500 hover:text-accent-600"
        >
          ← Parc automobile
        </Link>
        <div className="h-4 w-px bg-slate-200" />
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          {vehicle.brand} {vehicle.model} ({vehicle.year})
        </h1>
        <Badge color={statusColor[vehicle.status] ?? "slate"}>
          {VEHICLE_STATUSES.find((s) => s.id === vehicle.status)?.label ?? vehicle.status}
        </Badge>
        <span className="font-mono text-sm text-slate-500">{vehicle.vin}</span>
        <div className="ml-auto flex gap-2">
          <Link href={`/parc-auto/${encodeURIComponent(vehicle.vin)}/modifier`}>
            <Button variant="outline">Modifier</Button>
          </Link>
          <Button
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
            onClick={() => setShowDeleteModal(true)}
          >
            Supprimer
          </Button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !deleteSubmitting && setShowDeleteModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800">Confirmer la suppression</h3>
            <p className="mt-2 text-sm text-slate-500">
              Ce véhicule sera définitivement supprimé. Cette action est irréversible.
            </p>
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Raison (optionnelle)</label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Ex : doublon, erreur de saisie…"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400"
                rows={3}
              />
            </div>
            {deleteError && <p className="mt-3 text-sm text-red-600">{deleteError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={deleteSubmitting}>
                Annuler
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleConfirmDelete}
                disabled={deleteSubmitting}
              >
                {deleteSubmitting ? "Suppression…" : "Supprimer"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-1 shadow-card">
        <nav className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? "bg-accent-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
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
          {vehicle.transitSteps && vehicle.transitSteps.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {vehicle.transitSteps.map((s, i) => (
                <li key={s.id} className="flex items-center gap-3 text-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600">{i + 1}</span>
                  <span className="font-medium text-slate-800">{s.step}</span>
                  {s.date && <span className="text-slate-500">{s.date}</span>}
                  {s.details && <span className="text-slate-500">— {s.details}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Aucune étape enregistrée.</p>
          )}
        </Card>
      )}

      {activeTab === "documents" && (
        <Card>
          <CardTitle>Documents liés</CardTitle>
          {vehicle.documents && vehicle.documents.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {vehicle.documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between text-sm">
                  <span>{d.type}{d.name ? ` — ${d.name}` : ""}</span>
                  {d.url && <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-slate-600 underline">Ouvrir</a>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Aucun document.</p>
          )}
        </Card>
      )}

      {activeTab === "compta" && (
        <Card>
          <CardTitle>Rentabilité</CardTitle>
          {(vehicle.totalCost != null || vehicle.margin != null || (vehicle.charges && vehicle.charges.length > 0)) ? (
            <div className="mt-4 space-y-4">
              {vehicle.totalCost != null && <p><span className="text-slate-500">Coût total :</span> <strong>{vehicle.totalCost.toLocaleString()} {vehicle.currency ?? "USD"}</strong></p>}
              {vehicle.margin != null && <p><span className="text-slate-500">Marge :</span> <strong className={vehicle.margin >= 0 ? "text-green-600" : "text-red-600"}>{vehicle.margin.toLocaleString()}</strong></p>}
              {vehicle.marginRate != null && <p><span className="text-slate-500">Taux marge :</span> <strong>{vehicle.marginRate.toFixed(1)} %</strong></p>}
              {vehicle.charges && vehicle.charges.length > 0 && (
                <ul className="mt-2 border-t border-slate-200 pt-2 text-sm">
                  {vehicle.charges.map((c) => (
                    <li key={c.id}>{c.category} : {c.amount.toLocaleString()} {c.currency ?? ""}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Données à renseigner (charges, coût total, marge).</p>
          )}
        </Card>
      )}

      {activeTab === "historique" && (
        <Card>
          <CardTitle>Historique</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Chronologie des créations et modifications du véhicule.</p>
          {vehicle.history && vehicle.history.length > 0 ? (
            <ul className="mt-4 space-y-4">
              {vehicle.history.map((h) => {
                const actionLabel = h.action === "CREATION" ? "Création" : h.action === "MODIFICATION" ? "Modification" : h.action;
                const detailsText = formatHistoryDetails(h.action, h.details);
                return (
                  <li key={h.id} className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-800">{actionLabel}</span>
                      <span className="text-slate-400">—</span>
                      <time dateTime={h.createdAt} className="text-slate-500">
                        {formatHistoryDate(h.createdAt)}
                      </time>
                    </div>
                    {detailsText && (
                      <p className="text-slate-600 leading-snug">{detailsText}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Aucun historique.</p>
          )}
        </Card>
      )}
    </div>
  );
}
