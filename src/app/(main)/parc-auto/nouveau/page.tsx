"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { vehiclesApi, clientsApi } from "@/lib/services/api";
import { VEHICLE_STATUSES, VEHICLE_TYPES, STOCK_NATURES } from "@/lib/constants";
import type { Client } from "@/types";

export default function NouveauVehiculePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);

  const [vin, setVin] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [status, setStatus] = useState("ACHETE");
  const [clientId, setClientId] = useState("");
  const [numeroBl, setNumeroBl] = useState("");
  const [dateEntreePort, setDateEntreePort] = useState("");
  const [dateEntreeParc, setDateEntreeParc] = useState("");
  const [natureStock, setNatureStock] = useState("");
  const [regularise, setRegularise] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [currency, setCurrency] = useState("USD");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clientsApi.list({ limit: 500 }).then((r) => setClients(r.data ?? [])).catch(() => setClients([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const created = await vehiclesApi.create({
        vin: vin.trim(),
        chassisNumber: chassisNumber.trim() || undefined,
        brand: brand.trim(),
        model: model.trim(),
        year: parseInt(year, 10) || new Date().getFullYear(),
        vehicleType: vehicleType || undefined,
      });
      const updates: Record<string, unknown> = {};
      if (status) updates.status = status;
      if (clientId) updates.clientId = clientId;
      if (numeroBl.trim()) updates.numeroBl = numeroBl.trim();
      if (dateEntreePort) updates.dateEntreePort = dateEntreePort;
      if (dateEntreeParc) updates.dateEntreeParc = dateEntreeParc;
      if (natureStock) updates.natureStock = natureStock;
      updates.regularise = regularise;
      const priceNum = purchasePrice.trim() ? parseFloat(purchasePrice.replace(/\s/g, "").replace(",", ".")) : NaN;
      if (!isNaN(priceNum)) updates.purchasePrice = priceNum;
      if (currency) updates.currency = currency;
      if (Object.keys(updates).length > 0) {
        await vehiclesApi.update(created.id, updates as Parameters<typeof vehiclesApi.update>[1]);
      }
      router.push("/parc-auto");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/parc-auto" className="text-sm font-medium text-slate-500 hover:text-accent-600">← Parc automobile</Link>
        <div className="h-4 w-px bg-slate-200" />
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Nouveau véhicule</h1>
      </div>

      <Card>
        <CardTitle>Identification et parc</CardTitle>
        <p className="mt-1 text-sm text-slate-500">Champs alignés sur la liste du parc automobile (VIN, BL, dates, nature, statut, client).</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="VIN *" placeholder="Ex: JTEBU5JR6D5136791" value={vin} onChange={(e) => setVin(e.target.value)} required />
            <Input label="Numéro châssis" placeholder="Optionnel si VIN renseigné" value={chassisNumber} onChange={(e) => setChassisNumber(e.target.value)} />
            <Input label="Marque *" placeholder="Ex: Toyota" value={brand} onChange={(e) => setBrand(e.target.value)} required />
            <Input label="Modèle *" placeholder="Ex: 4Runner" value={model} onChange={(e) => setModel(e.target.value)} required />
            <Input label="Année *" type="number" placeholder="2020" value={year} onChange={(e) => setYear(e.target.value)} required />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Type véhicule</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800"
              >
                <option value="">—</option>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800"
              >
                {VEHICLE_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Client</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800"
              >
                <option value="">— Aucun —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <Input
              label="Prix d'achat"
              type="text"
              inputMode="decimal"
              placeholder="Ex: 15000"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Devise</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="FCFA">FCFA</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold text-slate-700">Stock (numéro BL, dates, nature)</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input label="Numéro BL" placeholder="Connaissement" value={numeroBl} onChange={(e) => setNumeroBl(e.target.value)} />
              <Input label="Date entrée au Port" type="date" value={dateEntreePort} onChange={(e) => setDateEntreePort(e.target.value)} />
              <Input label="Date entrée au Parc" type="date" value={dateEntreeParc} onChange={(e) => setDateEntreeParc(e.target.value)} />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nature du stock</label>
                <select
                  value={natureStock}
                  onChange={(e) => setNatureStock(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800"
                >
                  <option value="">—</option>
                  {STOCK_NATURES.map((n) => (
                    <option key={n.id} value={n.id}>{n.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={regularise}
                onChange={(e) => setRegularise(e.target.checked)}
                className="rounded border-slate-300 text-accent-600 focus:ring-accent-500"
              />
              Régularisé (situation compta clôturée)
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>{loading ? "Enregistrement…" : "Enregistrer"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
