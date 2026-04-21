"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPut } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { TwoFactorPanel } from "@/components/settings/TwoFactorPanel";

export default function ParametresPage() {
  const [tauxUsd, setTauxUsd] = useState(600);
  const [tauxEur, setTauxEur] = useState(655);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await apiGet<{ rates?: { USD?: number; EUR?: number } }>("/settings/rates");
      const r = (res as { rates?: { USD?: number; EUR?: number } })?.rates;
      if (r?.USD) setTauxUsd(r.USD);
      if (r?.EUR) setTauxEur(r.EUR);
    } catch {
      // keep defaults
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPut("/settings/rates", { USD: tauxUsd, EUR: tauxEur });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        <p className="mt-1 text-slate-600">Configuration système, devises, numérotation.</p>
      </div>
      <Card title="Taux de change (FCFA)">
        <p className="mb-4 text-sm text-slate-600">Taux indicatifs pour les achats en devises.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="1 USD = (FCFA)"
            type="number"
            min={1}
            value={tauxUsd}
            onChange={(e) => setTauxUsd(Number(e.target.value) || 600)}
          />
          <Input
            label="1 EUR = (FCFA)"
            type="number"
            min={1}
            value={tauxEur}
            onChange={(e) => setTauxEur(Number(e.target.value) || 655)}
          />
        </div>
        <Button className="mt-4" onClick={handleSave} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </Card>

      <TwoFactorPanel />

      <Card title="Numérotation documents">
        <p className="text-sm text-slate-600">
          Factures, reçus, devis, pro forma : format et compteur gérés côté backend.
        </p>
      </Card>
    </div>
  );
}
