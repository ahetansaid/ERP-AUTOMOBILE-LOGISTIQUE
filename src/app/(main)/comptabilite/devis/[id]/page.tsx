"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface DevisDetail {
  id: number;
  vehicle_id?: number;
  prestataire?: string;
  amount?: number;
  currency?: string;
  description?: string;
  valid_until?: string;
  status?: string;
  closed_at?: string;
  vin?: string;
  brand?: string;
  model?: string;
  receipts?: Array<{ id: number; amount?: number; payment_date?: string; payment_method?: string }>;
  paid_amount?: number;
  remaining_amount?: number;
}

interface ReceiptRow {
  id: number;
  devis_id?: number;
  amount?: number;
  payment_date?: string;
  payment_method?: string;
}

function formatFcfa(value: number | undefined | null): string {
  if (value == null) return "—";
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

export default function DevisFichePage() {
  const params = useParams();
  const id = params?.id ? String(params.id) : null;
  const [devis, setDevis] = useState<DevisDetail | null>(null);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const [devisListRes, receiptsRes] = await Promise.all([
        apiGet<{ workshopQuotes?: unknown[] }>("/devis"),
        apiGet<{ receipts?: unknown[] }>("/receipts"),
      ]);
      const list = (devisListRes as { workshopQuotes?: unknown[] })?.workshopQuotes ?? [];
      const found = (list as Record<string, unknown>[]).find((x) => Number(x.id) === Number(id));
      const raw = (receiptsRes as { receipts?: unknown[] })?.receipts ?? [];
      const all = (raw as Record<string, unknown>[]) as ReceiptRow[];
      const forDevis = all.filter((r) => {
        const did = r.devis_id ?? (r as Record<string, unknown>).devisId;
        return did != null && Number(did) === Number(id);
      });
      const receiptRows = forDevis.map((x) => {
        const r = x as Record<string, unknown>;
        return {
          id: (r.id as number) ?? 0,
          devis_id: (r.devis_id as number) ?? (r.devisId as number),
          amount: (r.amount as number) ?? (r.montant as number) ?? 0,
          payment_date: (r.payment_date as string) ?? (r.paymentDate as string) ?? "",
          payment_method: (r.payment_method as string) ?? (r.paymentMethod as string) ?? "",
        };
      });
      setReceipts(receiptRows);
      if (found) {
        const r = found as Record<string, unknown>;
        setDevis({
          ...(found as DevisDetail),
          amount: (r.amount as number) ?? (r.montant as number),
          closed_at: (r.closed_at as string) ?? (r.closedAt as string),
        });
      } else {
        setDevis(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement");
      setDevis(null);
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!id) {
    return (
      <div>
        <p className="text-slate-500">Identifiant manquant.</p>
        <Link href="/comptabilite/devis" className="text-primary-600 hover:underline">← Liste des devis</Link>
      </div>
    );
  }

  if (loading) return <p className="py-8 text-slate-500">Chargement…</p>;
  if (error && !devis) {
    return (
      <div>
        <p className="text-red-600">{error}</p>
        <Link href="/comptabilite/devis" className="text-primary-600 hover:underline">← Liste des devis</Link>
      </div>
    );
  }

  const d = devis!;
  const total = Number(d.amount) || 0;
  const paidFromReceipts = receipts.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const paid = d.paid_amount ?? paidFromReceipts;
  const remaining = Math.max(0, total - paid);
  const isCloture = remaining <= 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/comptabilite/devis" className="text-sm text-primary-600 hover:underline">← Liste des devis</Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Fiche devis #{d.id}</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {d.vin ?? "—"} · {d.brand ?? ""} {d.model ?? ""}
          </p>
        </div>
        {!isCloture ? (
          <Link
            href={`/comptabilite/recus?devisId=${d.id}`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Émettre un reçu
          </Link>
        ) : (
          <span className="inline-flex items-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
            Ce devis est entièrement réglé. Aucun nouveau reçu.
          </span>
        )}
      </div>

      <Card title="Récapitulatif">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Véhicule</dt>
            <dd className="font-medium">{d.vin ?? "—"} {d.brand ?? ""} {d.model ?? ""}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Prestataire(s)</dt>
            <dd>{d.prestataire ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Description des travaux</dt>
            <dd>{d.description ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Valide jusqu&apos;au</dt>
            <dd>{d.valid_until ? new Date(d.valid_until).toLocaleDateString("fr-FR") : "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Statut</dt>
            <dd><Badge variant={isCloture ? "success" : undefined}>{d.status ?? (isCloture ? "Clôturé" : "Non clôturé")}</Badge></dd>
          </div>
          {isCloture && (
            <div>
              <dt className="text-sm text-slate-500">Date de clôture</dt>
              <dd>{d.closed_at ? new Date(d.closed_at).toLocaleDateString("fr-FR") : "—"}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm text-slate-500">Montant total du devis</dt>
            <dd className="font-semibold text-lg">{formatFcfa(total)} {(d as Record<string, string>).currency ?? "FCFA"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Montants payés</dt>
            <dd className="font-medium text-green-600 dark:text-green-400">{formatFcfa(paid)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Montant restant</dt>
            <dd className={`font-medium ${remaining > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-300"}`}>
              {formatFcfa(remaining)}
            </dd>
          </div>
        </dl>
      </Card>

      <Card title="Liste des reçus">
        {receipts.length === 0 ? (
          <p className="py-6 text-slate-500">Aucun reçu émis pour ce devis.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-400">
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Méthode</th>
                  <th className="p-3 font-medium text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="p-3">{r.payment_date ? new Date(r.payment_date).toLocaleDateString("fr-FR") : "—"}</td>
                    <td className="p-3">{r.payment_method ?? "—"}</td>
                    <td className="p-3 text-right font-medium">{formatFcfa(r.amount)}</td>
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
