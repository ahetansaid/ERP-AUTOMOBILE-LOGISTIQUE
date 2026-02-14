"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { clientsApi } from "@/lib/services/api";
import type { ClientWithVehicles } from "@/types";

export default function ClientFichePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [client, setClient] = useState<ClientWithVehicles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    clientsApi
      .getById(id)
      .then((c) => {
        if (!cancelled) setClient(c);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Client non trouvé");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-200 border-t-accent-600" />
      </div>
    );
  }
  if (error || !client) {
    return (
      <Card className="text-center">
        <p className="text-slate-600">{error ?? "Client non trouvé."}</p>
        <Button className="mt-4" onClick={() => router.push("/crm")}>Retour CRM</Button>
      </Card>
    );
  }

  const vehicles = client?.vehicles ?? [];
  const invoices = client?.invoices ?? [];
  const payments = client?.payments ?? [];
  const transitOps = client?.transitOperations ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/crm" className="text-sm font-medium text-slate-500 hover:text-accent-600">← CRM Clients</Link>
        <div className="h-4 w-px bg-slate-200" />
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">{client.name}</h1>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardTitle>Coordonnées</CardTitle>
          <dl className="mt-4 space-y-2 text-sm">
            <div><dt className="text-slate-500">Email</dt><dd>{client.email ?? "—"}</dd></div>
            <div><dt className="text-slate-500">Téléphone</dt><dd>{client.phone ?? "—"}</dd></div>
            <div><dt className="text-slate-500">Adresse</dt><dd>{client.address ?? "—"}</dd></div>
          </dl>
        </Card>
        <Card>
          <CardTitle>Véhicules liés</CardTitle>
          <ul className="mt-4 space-y-2 text-sm">
            {vehicles.length === 0 ? (
              <li className="text-slate-500">Aucun véhicule associé</li>
            ) : (
              vehicles.map((v) => (
                <li key={v.id}>
                  <Link href={`/parc-auto/${v.vin}`} className="font-medium text-accent-600 hover:text-accent-700 hover:underline">{v.vin} — {v.brand} {v.model}</Link>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      <Card>
        <CardTitle>Factures</CardTitle>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-slate-600">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Montant</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">Aucune facture</td></tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100">
                    <td className="font-mono px-4 py-3">{inv.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3">{inv.amount?.toLocaleString() ?? "—"}</td>
                    <td className="px-4 py-3">{inv.status ?? "—"}</td>
                    <td className="px-4 py-3">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("fr-FR") : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardTitle>Paiements</CardTitle>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-slate-600">
                <th className="px-4 py-3 font-medium">Montant</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-500">Aucun paiement</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium">{p.amount?.toLocaleString() ?? "—"}</td>
                    <td className="px-4 py-3">{p.paymentType ?? "—"}</td>
                    <td className="px-4 py-3">{p.paidAt ? new Date(p.paidAt).toLocaleDateString("fr-FR") : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardTitle>Opérations transit</CardTitle>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-slate-600">
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Référence</th>
                <th className="px-4 py-3 font-medium">N° BL</th>
                <th className="px-4 py-3 font-medium">Arrivée port</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {transitOps.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Aucune opération transit</td></tr>
              ) : (
                transitOps.map((op) => (
                  <tr key={op.id} className="border-b border-slate-100">
                    <td className="px-4 py-3">{op.operationType ?? "—"}</td>
                    <td className="px-4 py-3">{op.reference ?? "—"}</td>
                    <td className="px-4 py-3 font-mono">{op.blNumber ?? "—"}</td>
                    <td className="px-4 py-3">{op.dateArriveePort ? new Date(op.dateArriveePort).toLocaleDateString("fr-FR") : "—"}</td>
                    <td className="px-4 py-3">{op.createdAt ? new Date(op.createdAt).toLocaleDateString("fr-FR") : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
