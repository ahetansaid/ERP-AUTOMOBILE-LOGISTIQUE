"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { vehiclesApi, documentsApi } from "@/lib/services/api";
import type { Vehicle } from "@/types";
import type { VehicleDocument } from "@/types";

export default function DocumentsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    vehiclesApi
      .list({ limit: 500 })
      .then((r) => { if (!cancelled) setVehicles(r.data ?? []); })
      .catch(() => { if (!cancelled) setVehicles([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedVehicleId) {
      setDocuments([]);
      setError(null);
      return;
    }
    setError(null);
    documentsApi
      .listByVehicle(selectedVehicleId)
      .then((r) => setDocuments(r.data ?? []))
      .catch((e) => {
        setDocuments([]);
        setError(e instanceof Error ? e.message : "Erreur chargement documents");
      });
  }, [selectedVehicleId]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedVehicleId) return;
    setUploading(true);
    setError(null);
    documentsApi
      .upload(selectedVehicleId, file)
      .then((doc) => setDocuments((prev) => [...prev, doc]))
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur upload"))
      .finally(() => {
        setUploading(false);
        e.target.value = "";
      });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          Gestion des documents
        </h1>
        <p className="mt-1 text-slate-500">
          Importer et consulter les documents liés aux véhicules (BL, factures, quittances, etc.).
        </p>
      </div>

      <Card>
        <CardTitle>Documents par véhicule</CardTitle>
        <p className="mt-2 text-sm text-slate-500">
          Sélectionnez un véhicule pour afficher ses documents ou en importer de nouveaux.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="min-w-[280px]">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Véhicule</label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
            >
              <option value="">— Choisir un véhicule —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vin ?? v.chassisNumber ?? v.id} — {v.brand} {v.model}
                </option>
              ))}
            </select>
          </div>
          {selectedVehicleId && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                onChange={handleFileChange}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Import…" : "Importer un document"}
              </Button>
              <Link href={`/parc-auto/${selectedVehicle?.vin}`}>
                <Button variant="outline">VIN 360°</Button>
              </Link>
            </>
          )}
        </div>
      </Card>

      {selectedVehicleId && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
            <CardTitle className="mb-0">
              Documents du véhicule {selectedVehicle?.vin ?? selectedVehicleId}
            </CardTitle>
          </div>
          {error && (
            <div className="px-5 py-3 text-sm text-amber-700 bg-amber-50 border-b border-amber-100">
              {error}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-slate-600">
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Nom</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Lien</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 && !error && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                      Aucun document. Utilisez « Importer un document » ou ajoutez des documents depuis la fiche VIN 360°.
                    </td>
                  </tr>
                )}
                {documents.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100">
                    <td className="px-5 py-3">{d.type || "—"}</td>
                    <td className="px-5 py-3 font-medium">{d.name || "Sans nom"}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {d.createdAt ? new Date(d.createdAt).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-5 py-3">
                      {d.url ? (
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent-600 hover:underline"
                        >
                          Ouvrir
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!selectedVehicleId && !loading && (
        <Card className="border-dashed border-slate-200 bg-slate-50/50">
          <p className="text-center text-slate-500">
            Sélectionnez un véhicule ci-dessus pour gérer ses documents.
          </p>
        </Card>
      )}
    </div>
  );
}
