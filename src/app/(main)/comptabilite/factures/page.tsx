"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { escapeHtml } from "@/lib/records";
import type { InvoiceListItem } from "@/types/compta";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

/**
 * Solde restant = prix de vente − montant payé (montant total de la facture = montant payé).
 * Si l'API ne renvoie pas remaining_amount, on le calcule côté front.
 */
function pickInv(r: Record<string, unknown>): InvoiceListItem {
  const priceSale = (r.price_sale as number) ?? (r.prix_vente as number) ?? (r.priceSale as number);
  const amount = (r.amount as number) ?? (r.montant as number);
  const totalAmount = (r.total_amount as number) ?? (r.totalAmount as number) ?? amount;
  const paid = (r.paid_amount as number) ?? (r.paidAmount as number) ?? (r.montant_paye as number);
  const prixVente = priceSale ?? totalAmount ?? amount ?? 0;
  const remainingFromApi =
    (r.remaining_amount as number) ??
    (r.remainingAmount as number) ??
    (r.solde_restant as number) ??
    (r.remaining_balance as number);
  const remaining_amount =
    remainingFromApi ??
    (typeof prixVente === "number" ? Math.max(0, prixVente - (paid ?? 0)) : undefined);
  return {
    id: (r.id as number) ?? 0,
    vehicle_id: (r.vehicle_id as number) ?? (r.vehicleId as number),
    client_id: (r.client_id as number) ?? (r.clientId as number),
    price_sale: priceSale ?? totalAmount ?? amount,
    amount: amount,
    total_amount: totalAmount ?? amount,
    due_date: (r.due_date as string) ?? (r.dueDate as string),
    status: (r.status as string) ?? "",
    invoice_number: (r.invoice_number as string) ?? (r.invoiceNumber as string),
    client_name: (r.client_name as string) ?? (r.clientName as string),
    vin: (r.vin as string) ?? "",
    paid_amount: paid ?? undefined,
    remaining_amount: remaining_amount,
  };
}

/** Facture sans reçu émis : aucun montant payé (paid_amount === 0 ou null). */
function canEditOrDelete(i: InvoiceListItem): boolean {
  return (i.paid_amount ?? 0) === 0;
}

/** Statut facture : "Payé" si au moins un reçu existe pour cette facture, sinon "Émise". */
function invoiceStatusLabel(status: string | undefined): string {
  const s = (status ?? "").toUpperCase();
  if (s === "PAYE" || s === "PAID" || s === "PAYÉ") return "Payé";
  return "Émise";
}

interface ReceiptPrintRow {
  id: number;
  amount?: number;
  payment_date?: string;
  payment_method?: string;
  reference?: string;
  remaining_amount?: number | null;
}

function formatFcfaPrint(value: number | undefined | null): string {
  if (value == null) return "—";
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

function openInvoicePrint(i: InvoiceListItem, receipts?: ReceiptPrintRow[]) {
  const dueStr = i.due_date ? new Date(i.due_date).toLocaleDateString("fr-FR") : "—";
  const prixVente = i.price_sale ?? i.amount ?? i.total_amount ?? 0;
  const paid = i.paid_amount ?? (receipts?.reduce((s, r) => s + (r.amount ?? 0), 0) ?? 0);
  const rows =
    receipts && receipts.length > 0
      ? receipts
          .map(
            (r) =>
              `<tr>
                <td>${r.payment_date ? new Date(r.payment_date).toLocaleDateString("fr-FR") : "—"}</td>
                <td>${escapeHtml(r.payment_method ?? "—")}</td>
                <td style="text-align:right">${formatFcfaPrint(r.amount)}</td>
                <td>${escapeHtml(r.reference ?? "—")}</td>
                <td style="text-align:right">${r.remaining_amount != null && r.remaining_amount > 0 ? formatFcfaPrint(r.remaining_amount) : r.remaining_amount === 0 ? "0 FCFA" : "—"}</td>
              </tr>`
          )
          .join("")
      : "";
  const tableSection =
    receipts && receipts.length > 0
      ? `<h2 style="font-size:1rem;margin-top:1.5rem;">Détail des reçus (paiements)</h2>
<table style="width:100%;border-collapse:collapse;margin-top:0.5rem;">
<thead><tr style="background:#f5f5f5;"><th style="padding:0.5rem;text-align:left;border-bottom:1px solid #eee;">Date</th><th style="padding:0.5rem;text-align:left;border-bottom:1px solid #eee;">Méthode</th><th style="padding:0.5rem;text-align:right;border-bottom:1px solid #eee;">Montant</th><th style="padding:0.5rem;text-align:left;border-bottom:1px solid #eee;">Référence</th><th style="padding:0.5rem;text-align:right;border-bottom:1px solid #eee;">Solde restant après</th></tr></thead>
<tbody>${rows}</tbody></table>`
      : "<p>Aucun reçu pour cette facture.</p>";
  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Facture ${escapeHtml(i.invoice_number ?? i.id)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:2rem auto;padding:1rem;}
h1{font-size:1.25rem;border-bottom:1px solid #ccc;} h2{font-size:1rem;margin-top:1.5rem;}
p{margin:0.35rem 0;} strong{display:inline-block;min-width:10rem;}
table{width:100%;border-collapse:collapse;} th,td{padding:0.5rem;text-align:left;border-bottom:1px solid #eee;} td:nth-child(3),td:nth-child(5){text-align:right;}
</style></head><body>
<h1>Facture — ParcAuto Manager</h1>
<p><strong>N° facture :</strong> ${escapeHtml(i.invoice_number ?? i.id)}</p>
<p><strong>Client :</strong> ${escapeHtml(i.client_name ?? "—")}</p>
<p><strong>VIN :</strong> ${escapeHtml(i.vin ?? "—")}</p>
<p><strong>Prix de vente (véhicule) :</strong> ${formatFcfaPrint(prixVente)}</p>
<p><strong>Montant payé :</strong> ${formatFcfaPrint(paid)}</p>
<p><strong>Solde restant :</strong> ${formatFcfaPrint(i.remaining_amount ?? Math.max(0, prixVente - paid))}</p>
<p><strong>Échéance :</strong> ${dueStr}</p>
<p><strong>Statut :</strong> ${escapeHtml(i.status ?? "—")}</p>
${tableSection}
<p style="margin-top:2rem;font-size:0.875rem;color:#666;">Document généré le ${new Date().toLocaleString("fr-FR")}</p>
</body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); w.focus(); }
}

const actionsSelectClass =
  "w-full min-w-[140px] rounded-xl border border-slate-300 bg-white px-3 py-2 pr-8 text-sm text-slate-700 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";

export default function FacturesPage() {
  const router = useRouter();
  const [list, setList] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<InvoiceListItem | null>(null);
  const [deleteInvoice, setDeleteInvoice] = useState<{ invoice: InvoiceListItem; reason: string } | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const fetchReceiptsAndPrint = useCallback(async (inv: InvoiceListItem) => {
    setDownloadingId(inv.id);
    try {
      const res = await apiGet<{ receipts?: unknown[] }>("/receipts");
      const raw = (res as { receipts?: unknown[] })?.receipts ?? [];
      const all = raw as Record<string, unknown>[];
      const forInv = all.filter((r) => {
        const iid = r.invoice_id ?? r.invoiceId;
        return iid != null && Number(iid) === inv.id;
      });
      const sorted = [...forInv].sort((a, b) => {
        const da = (a.payment_date as string) ?? (a.paymentDate as string) ?? "";
        const db = (b.payment_date as string) ?? (b.paymentDate as string) ?? "";
        if (da !== db) return da.localeCompare(db);
        return ((a.id as number) ?? 0) - ((b.id as number) ?? 0);
      });
      const prixVente = inv.price_sale ?? inv.amount ?? inv.total_amount ?? 0;
      let paidSoFar = 0;
      const receiptsForPrint: ReceiptPrintRow[] = sorted.map((x) => {
        const amt = (x.amount as number) ?? (x.montant as number) ?? 0;
        paidSoFar += amt;
        return {
          id: (x.id as number) ?? 0,
          amount: amt,
          payment_date: (x.payment_date as string) ?? (x.paymentDate as string),
          payment_method: (x.payment_method as string) ?? (x.paymentMethod as string),
          reference: (x.reference as string) ?? undefined,
          remaining_amount: Math.max(0, prixVente - paidSoFar),
        };
      });
      openInvoicePrint(inv, receiptsForPrint);
    } catch {
      openInvoicePrint(inv);
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const fetchList = useCallback(async () => {
    try {
      setError(null);
      const res = await apiGet<{ invoices?: unknown[] }>("/invoices");
      const raw = (res as { invoices?: unknown[] })?.invoices ?? [];
      setList((raw as Record<string, unknown>[]).map(pickInv));
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Factures</h1>
          <p className="mt-1 text-slate-600">Une facture par véhicule vendu ; les paiements se font via des reçus sur la facture.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Nouvelle facture</Button>
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      <Card title="Liste des factures">
        {loading ? (
          <p className="py-8 text-center text-slate-500">Chargement…</p>
        ) : list.length === 0 ? (
          <p className="py-8 text-center text-slate-500">Aucune facture.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-600">
                  <th className="p-3 font-medium">N°</th>
                  <th className="p-3 font-medium">Client</th>
                  <th className="p-3 font-medium">VIN</th>
                  <th className="p-3 font-medium">Montant</th>
                  <th className="p-3 font-medium">Solde restant</th>
                  <th className="p-3 font-medium">Échéance</th>
                  <th className="p-3 font-medium">Statut</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((i) => (
                  <tr key={i.id} className="border-b border-slate-100">
                    <td className="p-3 font-mono">{i.invoice_number ?? "—"}</td>
                    <td className="p-3">{i.client_name ?? "—"}</td>
                    <td className="p-3">{i.vin ?? "—"}</td>
                    <td className="p-3">{i.amount != null ? i.amount.toLocaleString("fr-FR") + " FCFA" : "—"}</td>
                    <td className="p-3">{i.remaining_amount != null ? i.remaining_amount.toLocaleString("fr-FR") + " FCFA" : "—"}</td>
                    <td className="p-3">{i.due_date ? new Date(i.due_date).toLocaleDateString("fr-FR") : "—"}</td>
                    <td className="p-3"><Badge variant={i.status?.toUpperCase() === "PAYE" || (i.paid_amount ?? 0) > 0 ? "success" : undefined}>{invoiceStatusLabel(i.status)}</Badge></td>
                    <td className="p-3">
                      <select
                        className={actionsSelectClass}
                        value=""
                        onChange={(e) => {
                          const v = e.target.value;
                          e.target.value = "";
                          if (v === "fiche") router.push(`/comptabilite/factures/${i.id}`);
                          else if (v === "receipt") router.push(`/comptabilite/recus?invoiceId=${i.id}`);
                          else if (v === "download") fetchReceiptsAndPrint(i);
                          else if (v === "edit") setEditInvoice(i);
                          else if (v === "delete") setDeleteInvoice({ invoice: i, reason: "" });
                        }}
                        title={!canEditOrDelete(i) ? "Un reçu a déjà été émis pour cette facture" : undefined}
                        disabled={downloadingId === i.id}
                      >
                        <option value="" disabled>Actions</option>
                        <option value="fiche">Voir fiche</option>
                        <option value="receipt">Émettre un reçu</option>
                        <option value="download">Télécharger</option>
                        <option value="edit" disabled={!canEditOrDelete(i)}>Modifier</option>
                        <option value="delete" disabled={!canEditOrDelete(i)}>Supprimer</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {modalOpen && (
        <ModalFacture onClose={() => setModalOpen(false)} onSuccess={() => { setModalOpen(false); fetchList(); }} />
      )}

      {editInvoice && (
        <ModalModifierFacture
          invoice={editInvoice}
          onClose={() => setEditInvoice(null)}
          onSuccess={() => { setEditInvoice(null); fetchList(); }}
        />
      )}

      {deleteInvoice && (
        <ModalSupprimerFacture
          invoice={deleteInvoice.invoice}
          reason={deleteInvoice.reason}
          onReasonChange={(reason) => setDeleteInvoice((prev) => (prev ? { ...prev, reason } : null))}
          onClose={() => setDeleteInvoice(null)}
          onConfirm={async () => {
            if (!deleteInvoice.reason.trim()) return;
            await apiDelete(`/invoices/${deleteInvoice.invoice.id}`, {
              body: JSON.stringify({ reason: deleteInvoice.reason.trim() }),
            } as RequestInit & { skipAuth?: boolean });
            setDeleteInvoice(null);
            fetchList();
          }}
        />
      )}
    </div>
  );
}

/**
 * Nouvelle facture :
 * - Règle métier : 1 véhicule = 1 facture. Les paiements suivants se font via des reçus sur cette facture.
 * - Seuls les véhicules qui n'ont encore aucune facture sont proposés.
 * - Solde = prix de vente − somme(reçus). Pour régler une facture existante, créer des reçus (Reçus).
 */
function ModalFacture({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [vehicles, setVehicles] = useState<{ id: number; vin?: string; brand?: string; model?: string; price_sale?: number }[]>([]);
  const [clients, setClients] = useState<{ id: number; name?: string }[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [vRes, cRes, invRes] = await Promise.all([
          apiGet<{ data?: unknown[] }>("/vehicles?status=EN_VENTE"),
          apiGet<{ clients?: unknown[] }>("/clients"),
          apiGet<{ invoices?: unknown[] }>("/invoices"),
        ]);
        const vRaw = Array.isArray(vRes) ? vRes : (vRes as { data?: unknown[] })?.data ?? [];
        const cRaw = (cRes as { clients?: unknown[] })?.clients ?? [];
        const invRaw = (invRes as { invoices?: unknown[] })?.invoices ?? [];
        const invoices = (invRaw as Record<string, unknown>[]).map(pickInv);
        // Un véhicule ne peut avoir qu'une seule facture : exclure tous les véhicules qui ont déjà une facture
        const vehicleIdsWithInvoice = new Set(
          invoices.map((i) => i.vehicle_id).filter((id): id is number => id != null)
        );
        const allVehicles = (vRaw as Record<string, unknown>[]).map((r) => ({
          id: (r.id as number) ?? 0,
          vin: r.vin as string,
          brand: r.brand as string,
          model: r.model as string,
          price_sale: (r.price_sale as number) ?? (r.priceSale as number),
        }));
        const vehiclesFiltered = allVehicles.filter((v) => !vehicleIdsWithInvoice.has(v.id));
        setVehicles(vehiclesFiltered);
        setClients((cRaw as Record<string, unknown>[]).map((r) => ({ id: (r.id as number) ?? 0, name: (r.name as string) ?? "" })));
        if (vehiclesFiltered.length && !vehicleId) {
          const first = vehiclesFiltered[0];
          setVehicleId(String(first.id));
          if (typeof first.price_sale === "number" && first.price_sale > 0) setAmount(String(first.price_sale));
        }
      } catch {
        setVehicles([]);
        setClients([]);
      }
    })();
  }, []);

  const selectedVehicle = vehicles.find((v) => String(v.id) === vehicleId);
  const priceVente = selectedVehicle?.price_sale;

  const handleVehicleChange = (newVehicleId: string) => {
    setVehicleId(newVehicleId);
    const v = vehicles.find((x) => String(x.id) === newVehicleId);
    if (v?.price_sale != null && v.price_sale > 0) setAmount(String(v.price_sale));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Montant facture = prix de vente (auto, non modifiable)
    const val = priceVente ?? Number(amount) ?? 0;
    if (Number.isNaN(val) || val <= 0 || !vehicleId || !clientId) return;
    setSaving(true);
    try {
      await apiPost("/invoices", { vehicleId: Number(vehicleId), clientId: Number(clientId), amount: val, dueDate: dueDate || undefined });
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-semibold">Nouvelle facture</h2>
        <p className="mt-1 text-sm text-slate-500">
          Un véhicule ne peut avoir qu’une seule facture. Seuls les véhicules sans facture sont proposés. Pour régler une facture existante, émettez des reçus depuis la page Reçus.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {vehicles.length === 0 ? (
            <>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                Aucun véhicule éligible : tous les véhicules en vente ont déjà une facture. Pour ajouter un paiement, créez un reçu lié à la facture existante (page Reçus).
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="secondary" onClick={onClose}>Fermer</Button>
              </div>
            </>
          ) : (
          <>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Véhicule (EN_VENTE) *</label>
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={vehicleId} onChange={(e) => handleVehicleChange(e.target.value)} required>
              <option value="">—</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.vin} — {v.brand} {v.model}</option>)}
            </select>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:bg-slate-800/50 dark:border-slate-600">
            <label className="text-sm font-medium text-slate-700">Montant de la facture (prix de vente)</label>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {priceVente != null && priceVente > 0 ? `${priceVente.toLocaleString("fr-FR")} FCFA` : "— Sélectionnez un véhicule"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Auto-rempli, non modifiable (1 facture = 1 véhicule = prix de vente).</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Client *</label>
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={clientId} onChange={(e) => setClientId(e.target.value)} required>
              <option value="">—</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name ?? c.id}</option>)}
            </select>
          </div>
          <Input label="Date échéance" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Créer"}</Button>
          </div>
          </>
          )}
        </form>
      </Card>
    </div>
  );
}

function ModalModifierFacture({
  invoice,
  onClose,
  onSuccess,
}: {
  invoice: InvoiceListItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [vehicles, setVehicles] = useState<{ id: number; vin?: string; brand?: string; model?: string }[]>([]);
  const [clients, setClients] = useState<{ id: number; name?: string }[]>([]);
  const [vehicleId, setVehicleId] = useState(String(invoice.vehicle_id ?? ""));
  const [clientId, setClientId] = useState(String(invoice.client_id ?? ""));
  const [amount, setAmount] = useState(String(invoice.amount ?? ""));
  const [dueDate, setDueDate] = useState(
    invoice.due_date && invoice.due_date.length >= 10 ? invoice.due_date.slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [vRes, cRes] = await Promise.all([
          apiGet<{ data?: unknown[] }>("/vehicles?status=EN_VENTE"),
          apiGet<{ clients?: unknown[] }>("/clients"),
        ]);
        const vRaw = Array.isArray(vRes) ? vRes : (vRes as { data?: unknown[] })?.data ?? [];
        const cRaw = (cRes as { clients?: unknown[] })?.clients ?? [];
        setVehicles((vRaw as Record<string, unknown>[]).map((r) => ({ id: (r.id as number) ?? 0, vin: r.vin as string, brand: r.brand as string, model: r.model as string })));
        setClients((cRaw as Record<string, unknown>[]).map((r) => ({ id: (r.id as number) ?? 0, name: (r.name as string) ?? "" })));
      } catch {
        setVehicles([]);
        setClients([]);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const val = Number(amount);
    if (Number.isNaN(val) || val < 0) {
      setSubmitError("Montant invalide.");
      return;
    }
    setSaving(true);
    try {
      await apiPatch(`/invoices/${invoice.id}`, {
        vehicleId: Number(vehicleId) || invoice.vehicle_id,
        clientId: Number(clientId) || invoice.client_id,
        amount: val,
        dueDate: dueDate || undefined,
      });
      onSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erreur modification");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-semibold">Modifier la facture {invoice.invoice_number ?? invoice.id}</h2>
        <p className="mt-1 text-sm text-slate-600">VIN : {invoice.vin ?? "—"}</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{submitError}</div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Véhicule (EN_VENTE) *</label>
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required>
              <option value="">—</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.vin} — {v.brand} {v.model}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Client *</label>
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={clientId} onChange={(e) => setClientId(e.target.value)} required>
              <option value="">—</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name ?? c.id}</option>)}
            </select>
          </div>
          <Input label="Montant (FCFA) *" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <Input label="Date échéance" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function ModalSupprimerFacture({
  invoice,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
}: {
  invoice: InvoiceListItem;
  reason: string;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setErr("Le motif de suppression est obligatoire.");
      return;
    }
    setErr(null);
    setSubmitting(true);
    try {
      await onConfirm();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur lors de la suppression");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-semibold text-red-700">Supprimer la facture {invoice.invoice_number ?? invoice.id}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {invoice.client_name ?? "—"} — {invoice.vin ?? "—"} — {invoice.amount != null ? invoice.amount.toLocaleString("fr-FR") + " FCFA" : "—"}
        </p>
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Motif de suppression *</label>
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={3}
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Ex : erreur de saisie, doublon..."
            required
          />
        </div>
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button variant="danger" onClick={handleConfirm} disabled={submitting || !reason.trim()}>
            {submitting ? "Suppression…" : "Confirmer la suppression"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
