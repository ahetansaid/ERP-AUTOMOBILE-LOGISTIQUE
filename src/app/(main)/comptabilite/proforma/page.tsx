"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import type { ProformaListItem } from "@/types/compta";
import { Card } from "@/components/ui/Card";

function pickProforma(r: Record<string, unknown>): ProformaListItem {
  return {
    id: (r.id as number) ?? 0,
    vehicle_id: (r.vehicle_id as number) ?? (r.vehicleId as number),
    client_id: (r.client_id as number) ?? (r.clientId as number),
    amount: (r.amount as number) ?? (r.montant as number),
    total_amount: (r.total_amount as number) ?? (r.totalAmount as number),
    proforma_number: (r.proforma_number as string) ?? (r.proformaNumber as string),
    status: (r.status as string) ?? "",
    client_name: (r.client_name as string) ?? (r.clientName as string),
    vin: (r.vin as string) ?? "",
    brand: (r.brand as string) ?? "",
    model: (r.model as number) ?? 0,
  };
}

export default function ProformaPage() {
  const [list, setList] = useState<ProformaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    try {
      setError(null);
      const res = await apiGet<{ proformas?: unknown[] }>("/proformas");
      const raw = (res as { proformas?: unknown[] })?.proformas ?? [];
      setList((raw as Record<string, unknown>[]).map(pickProforma));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Factures pro forma</h1>
        <p className="mt-1 text-slate-600">Pro forma pour opérations de transit.</p>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      <Card title="Liste">
        {loading ? <p className="py-8 text-center text-slate-500">Chargement…</p> : list.length === 0 ? <p className="py-8 text-center text-slate-500">Aucune pro forma.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-600">
                  <th className="p-3 font-medium">N°</th>
                  <th className="p-3 font-medium">Client</th>
                  <th className="p-3 font-medium">VIN</th>
                  <th className="p-3 font-medium">Montant</th>
                  <th className="p-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="p-3 font-mono">{p.proforma_number ?? "—"}</td>
                    <td className="p-3">{p.client_name ?? "—"}</td>
                    <td className="p-3">{p.vin ?? "—"}</td>
                    <td className="p-3">{p.amount != null ? p.amount.toLocaleString("fr-FR") + " FCFA" : "—"}</td>
                    <td className="p-3">{p.status ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
