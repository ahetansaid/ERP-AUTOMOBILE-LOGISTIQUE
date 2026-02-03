"use client";

import { Card, CardTitle } from "@/components/ui/Card";

export default function ComptabilitePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Comptabilité & Finance</h1>
      <p className="text-slate-600">Charges, facturation, paiements, trésorerie</p>
      <Card>
        <CardTitle>Contenu</CardTitle>
        <p className="mt-4 text-sm text-slate-500">À brancher sur votre API.</p>
      </Card>
    </div>
  );
}
