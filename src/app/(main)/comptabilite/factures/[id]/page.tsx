"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface InvoiceDetail {
  id: number;
  vehicle_id?: number;
  client_id?: number;
  price_sale?: number;
  amount?: number;
  total_amount?: number;
  due_date?: string;
  status?: string;
  invoice_number?: string;
  client_name?: string;
  vin?: string;
  paid_amount?: number;
  remaining_amount?: number;
}

interface ReceiptRow {
  id: number;
  invoice_id?: number;
  amount?: number;
  payment_date?: string;
  payment_method?: string;
  reference?: string;
  /** Solde restant (facture) après ce paiement */
  remaining_amount?: number | null;
}

function formatFcfa(value: number | undefined | null): string {
  if (value == null) return "—";
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

function openFactureDefinitivePrint(inv: InvoiceDetail, receipts: ReceiptRow[]) {
  const prixVente = inv.price_sale ?? inv.amount ?? inv.total_amount ?? 0;
  const paid = inv.paid_amount ?? receipts.reduce((s, r) => s + (r.amount ?? 0), 0);
  const rows = receipts
    .map(
      (r) =>
        `<tr>
          <td>${r.payment_date ? new Date(r.payment_date).toLocaleDateString("fr-FR") : "—"}</td>
          <td>${r.payment_method ?? "—"}</td>
          <td style="text-align:right">${formatFcfa(r.amount)}</td>
          <td>${r.reference ?? "—"}</td>
          <td style="text-align:right">${r.remaining_amount != null && r.remaining_amount > 0 ? formatFcfa(r.remaining_amount) : (r.remaining_amount === 0 ? "0 FCFA" : "—")}</td>
        </tr>`
    )
    .join("");
  const tableSection =
    receipts.length > 0
      ? `<h2>Détail des reçus (paiements)</h2>
<table><thead><tr><th>Date</th><th>Méthode</th><th>Montant</th><th>Référence</th><th>Solde restant après</th></tr></thead><tbody>${rows}</tbody></table>`
      : "<p>Aucun reçu pour cette facture.</p>";
  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Facture ${inv.invoice_number ?? inv.id}</title>
<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:2rem auto;padding:1rem;}
h1{font-size:1.25rem;border-bottom:1px solid #ccc;} h2{font-size:1rem;margin-top:1.5rem;}
table{width:100%;border-collapse:collapse;margin-top:0.5rem;}
th,td{padding:0.5rem;text-align:left;border-bottom:1px solid #eee;} th{background:#f5f5f5;}
td:nth-child(3),td:nth-child(5){text-align:right;}
</style></head><body>
<h1>Facture — ParcAuto Manager</h1>
<p><strong>N° facture :</strong> ${inv.invoice_number ?? inv.id}</p>
<p><strong>Client :</strong> ${inv.client_name ?? "—"}</p>
<p><strong>VIN :</strong> ${inv.vin ?? "—"}</p>
<p><strong>Prix de vente (véhicule) :</strong> ${formatFcfa(prixVente)}</p>
<p><strong>Total payé :</strong> ${formatFcfa(paid)}</p>
<p><strong>Solde restant :</strong> ${formatFcfa(Math.max(0, prixVente - paid))}</p>
${tableSection}
<p style="margin-top:2rem;font-size:0.875rem;color:#666;">Document généré le ${new Date().toLocaleString("fr-FR")}</p>
</body></html>`;
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
  }
}

export default function FactureFichePage() {
  const params = useParams();
  const id = params?.id ? String(params.id) : null;
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const [invListRes, receiptsRes] = await Promise.all([
        apiGet<{ invoices?: unknown[] }>("/invoices"),
        apiGet<{ receipts?: unknown[] }>("/receipts"),
      ]);
      const list = (invListRes as { invoices?: unknown[] })?.invoices ?? [];
      const found = (list as Record<string, unknown>[]).find((x) => Number(x.id) === Number(id));
      if (found) {
        const r = found as Record<string, unknown>;
        const priceSale = (r.price_sale as number) ?? (r.prix_vente as number) ?? (r.priceSale as number);
        const amount = (r.amount as number) ?? (r.montant as number);
        const totalAmount = (r.total_amount as number) ?? (r.totalAmount as number) ?? amount;
        const paidFromApi = (r.paid_amount as number) ?? (r.paidAmount as number);
        setInvoice({
          ...(found as InvoiceDetail),
          price_sale: priceSale ?? totalAmount ?? amount,
          amount: amount,
          total_amount: totalAmount ?? amount,
          paid_amount: paidFromApi ?? undefined,
        });
      } else {
        setInvoice(null);
      }

      const raw = (receiptsRes as { receipts?: unknown[] })?.receipts ?? [];
      const all = (raw as Record<string, unknown>[]) as ReceiptRow[];
      const forInv = all.filter((r) => {
        const iid = r.invoice_id ?? (r as Record<string, unknown>).invoiceId;
        return iid != null && Number(iid) === Number(id);
      });
      const sorted = [...forInv].sort((a, b) => {
        const da = (a.payment_date as string) ?? (a as Record<string, unknown>).paymentDate as string ?? "";
        const db = (b.payment_date as string) ?? (b as Record<string, unknown>).paymentDate as string ?? "";
        if (da !== db) return da.localeCompare(db);
        return ((a.id as number) ?? 0) - ((b.id as number) ?? 0);
      });
      const invForPrice = found as Record<string, unknown> | undefined;
      const prixVenteForRemaining =
        (invForPrice?.price_sale as number) ??
        (invForPrice?.prix_vente as number) ??
        (invForPrice?.total_amount as number) ??
        (invForPrice?.amount as number) ??
        0;
      let paidSoFar = 0;
      setReceipts(sorted.map((x) => {
        const amt = (x.amount as number) ?? (x as Record<string, unknown>).montant as number ?? 0;
        paidSoFar += amt;
        const remaining = Math.max(0, prixVenteForRemaining - paidSoFar);
        return {
          id: (x.id as number) ?? 0,
          invoice_id: (x.invoice_id as number) ?? (x as Record<string, unknown>).invoiceId as number,
          amount: amt,
          payment_date: (x.payment_date as string) ?? (x as Record<string, unknown>).paymentDate as string,
          payment_method: (x.payment_method as string) ?? (x as Record<string, unknown>).paymentMethod as string,
          reference: (x.reference as string) ?? (x as Record<string, unknown>).reference as string,
          remaining_amount: remaining,
        };
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement");
      setInvoice(null);
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
        <Link href="/comptabilite/factures" className="text-primary-600 hover:underline">← Liste des factures</Link>
      </div>
    );
  }

  if (loading) return <p className="py-8 text-slate-500">Chargement…</p>;
  if (error && !invoice) {
    return (
      <div>
        <p className="text-red-600">{error}</p>
        <Link href="/comptabilite/factures" className="text-primary-600 hover:underline">← Liste des factures</Link>
      </div>
    );
  }

  const inv = invoice!;
  const prixVente = inv.price_sale ?? inv.amount ?? inv.total_amount ?? 0;
  const paidFromReceipts = receipts.reduce((s, r) => s + (r.amount ?? 0), 0);
  const paid = inv.paid_amount ?? paidFromReceipts;
  const remainingFromApi = inv.remaining_amount;
  const remaining = remainingFromApi ?? Math.max(0, prixVente - paid);
  const isCloturee = remaining <= 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/comptabilite/factures" className="text-sm text-primary-600 hover:underline">← Liste des factures</Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            Fiche facture {inv.invoice_number ?? inv.id}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {inv.client_name ?? "—"} · {inv.vin ?? "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => {
              const base =
                process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
              const token =
                typeof window !== "undefined"
                  ? localStorage.getItem("parcauto_access_token")
                  : null;
              // Ouvre le PDF inline dans un nouvel onglet.
              // Le token est passé en query string car <a target=_blank> ne peut pas porter d'en-têtes.
              const url = `${base}/invoices/${inv.id}/pdf${token ? `?token=${encodeURIComponent(token)}` : ""}`;
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          >
            Télécharger PDF moderne
          </Button>
          <Button
            variant="secondary"
            onClick={() => openFactureDefinitivePrint(inv, receipts)}
          >
            Imprimer (classique)
          </Button>
          <Link
            href={`/comptabilite/recus?invoiceId=${inv.id}`}
            className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            Émettre un reçu
          </Link>
        </div>
      </div>

      <Card title="Récapitulatif">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">N° facture</dt>
            <dd className="font-medium">{inv.invoice_number ?? inv.id}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Client</dt>
            <dd>{inv.client_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">VIN</dt>
            <dd>{inv.vin ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Échéance</dt>
            <dd>{inv.due_date ? new Date(inv.due_date).toLocaleDateString("fr-FR") : "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Statut</dt>
            <dd><Badge>{inv.status ?? (isCloturee ? "Clôturée" : "Non clôturée")}</Badge></dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Prix de vente (véhicule)</dt>
            <dd className="font-semibold text-lg">{formatFcfa(prixVente)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Montant payé (reçus)</dt>
            <dd className="font-medium text-green-600 dark:text-green-400">{formatFcfa(paid)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Solde restant (prix de vente − montant payé)</dt>
            <dd className={`font-medium ${remaining > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-300"}`}>
              {formatFcfa(remaining)}
            </dd>
          </div>
        </dl>
      </Card>

      <Card title="Liste des reçus (paiements)">
        {receipts.length === 0 ? (
          <p className="py-6 text-slate-500">Aucun reçu pour cette facture.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-400">
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Méthode</th>
                  <th className="p-3 font-medium text-right">Montant</th>
                  <th className="p-3 font-medium">Référence</th>
                  <th className="p-3 font-medium text-right">Solde restant après</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="p-3">{r.payment_date ? new Date(r.payment_date).toLocaleDateString("fr-FR") : "—"}</td>
                    <td className="p-3">{r.payment_method ?? "—"}</td>
                    <td className="p-3 text-right font-medium">{formatFcfa(r.amount)}</td>
                    <td className="p-3">{r.reference ?? "—"}</td>
                    <td className="p-3 text-right">{r.remaining_amount != null ? formatFcfa(r.remaining_amount) : "—"}</td>
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
