"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { vehiclesApi, clientsApi } from "@/lib/services/api";
import { VEHICLE_STATUSES, VEHICLE_TYPES, STOCK_NATURES } from "@/lib/constants";
import type { Client } from "@/types";
import type { Vehicle } from "@/types";

export default function ModifierVehiculePage() {
  const params = useParams();
  const router = useRouter();
  const vin = decodeURIComponent((params.vin as string) ?? "");

  const [clients, setClients] = useState<Client[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vinVal, setVinVal] = useState("");
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

  useEffect(() => {
    if (!vin) return;
    let cancelled = false;
    Promise.all([
      vehiclesApi.getByVin(vin),
      clientsApi.list({ limit: 500 }),
    ])
      .then(([v, clientsRes]) => {
        if (cancelled) return;
        setVehicle(v);
        setVinVal(v.vin ?? "");
        setChassisNumber(v.chassisNumber ?? "");
        setBrand(v.brand ?? "");
        setModel(v.model ?? "");
        setYear(String(v.year ?? ""));
        setVehicleType(v.vehicleType ?? "");
        setStatus(v.status ?? "ACHETE");
        setClientId(v.clientId ?? "");
        setNumeroBl(v.numeroBl ?? v.blNumber ?? "");
        setDateEntreePort(v.dateEntreePort ?? v.dateEntryPort ?? "");
        setDateEntreeParc(v.dateEntreeParc ?? v.dateEntryParc ?? "");
        setNatureStock(v.natureStock ?? v.stockNature ?? "");
        setRegularise(v.regularise ?? false);
        setPurchasePrice(v.purchasePrice != null ? String(v.purchasePrice) : "");
        setCurrency(v.currency ?? "USD");
        setClients(clientsRes.data ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Véhicule non trouvé");
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });
    return () => { cancelled = true; };
  }, [vin]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicle) return;
    setError(null);
    setLoading(true);
    try {
      const priceNum = purchasePrice.trim() ? parseFloat(purchasePrice.replace(/\s/g, "").replace(",", ".")) : NaN;
      await vehiclesApi.update(vehicle.id, {
        vin: vinVal.trim(),
        chassisNumber: chassisNumber.trim() || undefined,
        brand: brand.trim(),
        model: model.trim(),
        year: parseInt(year, 10) || vehicle.year,
        vehicleType: vehicleType || undefined,
        status: status || undefined,
        clientId: clientId || undefined,
        numeroBl: numeroBl.trim() || undefined,
        dateEntreePort: dateEntreePort || undefined,
        dateEntreeParc: dateEntreeParc || undefined,
        natureStock: natureStock || undefined,
        regularise,
        ...(isNaN(priceNum) ? {} : { purchasePrice: priceNum }),
        currency: currency || undefined,
      });
      router.push(`/parc-auto/${encodeURIComponent(vehicle.vin ?? vin)}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-200 border-t-accent-600" />
      </div>
    );
  }

  if (error && !vehicle) {
    return (
      <Card className="text-center">
        <p className="text-slate-600">{error}</p>
        <Button className="mt-4" onClick={() => router.push("/parc-auto")}>Retour au parc</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link href={`/parc-auto/${encodeURIComponent(vin)}`} className="text-sm font-medium text-slate-500 hover:text-accent-600">← VIN 360°</Link>
        <div className="h-4 w-px bg-slate-200" />
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Modifier le véhicule</h1>
      </div>

      <Card>
        <CardTitle>Identification et parc</CardTitle>
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="VIN *" placeholder="Ex: JTEBU5JR6D5136791" value={vinVal} onChange={(e) => setVinVal(e.target.value)} required />
            <Input label="Numéro châssis" value={chassisNumber} onChange={(e) => setChassisNumber(e.target.value)} />
            <Input label="Marque *" value={brand} onChange={(e) => setBrand(e.target.value)} required />
            <Input label="Modèle *" value={model} onChange={(e) => setModel(e.target.value)} required />
            <Input label="Année *" type="number" value={year} onChange={(e) => setYear(e.target.value)} required />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Type véhicule</label>
              <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800">
                <option value="">—</option>
                {VEHICLE_TYPES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Statut</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800">
                {VEHICLE_STATUSES.map((s) => (<option key={s.id} value={s.id}>{s.label}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Client</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800">
                <option value="">— Aucun —</option>
                {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
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
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="FCFA">FCFA</option>
              </select>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold text-slate-700">Stock (numéro BL, dates, nature)</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input label="Numéro BL" value={numeroBl} onChange={(e) => setNumeroBl(e.target.value)} />
              <Input label="Date entrée au Port" type="date" value={dateEntreePort} onChange={(e) => setDateEntreePort(e.target.value)} />
              <Input label="Date entrée au Parc" type="date" value={dateEntreeParc} onChange={(e) => setDateEntreeParc(e.target.value)} />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nature du stock</label>
                <select value={natureStock} onChange={(e) => setNatureStock(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800">
                  <option value="">—</option>
                  {STOCK_NATURES.map((n) => (<option key={n.id} value={n.id}>{n.label}</option>))}
                </select>
              </div>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={regularise} onChange={(e) => setRegularise(e.target.checked)} className="rounded border-slate-300 text-accent-600 focus:ring-accent-500" />
              Régularisé (situation compta clôturée)
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>{loading ? "Enregistrement…" : "Enregistrer"}</Button>
            <Link href={`/parc-auto/${encodeURIComponent(vin)}`}><Button type="button" variant="outline">Annuler</Button></Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
