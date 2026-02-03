"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { vehiclesApi } from "@/lib/services/api";

export default function NouveauVehiculePage() {
  const router = useRouter();
  const [vin, setVin] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await vehiclesApi.create({
        vin,
        brand,
        model,
        year: parseInt(year, 10) || 0,
      });
      router.push("/parc-auto");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/parc-auto" className="text-slate-500 hover:text-slate-800">← Parc</Link>
        <h1 className="text-2xl font-bold text-slate-800">Nouveau véhicule</h1>
      </div>

      <Card>
        <CardTitle>Identification</CardTitle>
        <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
          <Input label="VIN" placeholder="Ex: JTEBU5JR6D5136791" value={vin} onChange={(e) => setVin(e.target.value)} required />
          <Input label="Marque" placeholder="Ex: Toyota" value={brand} onChange={(e) => setBrand(e.target.value)} />
          <Input label="Modèle" placeholder="Ex: 4Runner" value={model} onChange={(e) => setModel(e.target.value)} />
          <Input label="Année" type="number" placeholder="2020" value={year} onChange={(e) => setYear(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : "Enregistrer"}</Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Annuler</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
