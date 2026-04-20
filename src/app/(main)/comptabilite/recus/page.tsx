"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { ReceiptListItem, ReceiptSourceType } from "@/types/compta";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const PAYMENT_METHODS = ["ESPECES", "VIREMENT", "CHEQUE", "MOBILE"];

function pickReceipt(r: Record<string, unknown>): ReceiptListItem {
  const invoiceId = (r.invoice_id as number) ?? (r.invoiceId as number);
  const devisId = (r.devis_id as number) ?? (r.devisId as number);
  const sourceType = (r.source_type as ReceiptSourceType) ?? (r.sourceType as ReceiptSourceType) ?? (devisId ? "DEVIS" : "FACTURE");
  const clientName =
    (r.client_name as string) ??
    (r.clientName as string) ??
    (r.client as string) ??
    "";
  const prestataire =
    (r.devis_prestataire as string) ??
    (r.devisPrestataire as string) ??
    (r.prestataire as string) ??
    (r.workshop_prestataire as string) ??
    "";
  const remaining =
    (r.remaining_amount as number) ??
    (r.remainingAmount as number) ??
    (r.solde_restant as number);
  return {
    id: (r.id as number) ?? 0,
    invoice_id: invoiceId,
    devis_id: devisId,
    source_type: sourceType,
    amount: (r.amount as number) ?? (r.montant as number),
    payment_method: (r.payment_method as string) ?? (r.paymentMethod as string),
    payment_date: (r.payment_date as string) ?? (r.paymentDate as string),
    reference: (r.reference as string) ?? "",
    invoice_number: (r.invoice_number as string) ?? (r.invoiceNumber as string),
    client_name: clientName || undefined,
    devis_prestataire: prestataire || undefined,
    devis_vin: (r.devis_vin as string) ?? (r.vin as string),
    remaining_amount: remaining ?? undefined,
  };
}

function getClientPrestataire(r: ReceiptListItem): string {
  if (r.source_type === "DEVIS") return r.devis_prestataire ?? "—";
  return r.client_name ?? "—";
}

/**
 * Calcule le solde restant APRÈS chaque reçu (logique cumulative) :
 * - Premier reçu : solde = prix de vente − montant du reçu
 * - Reçus suivants : solde = solde précédent − montant du reçu
 * Enrichit chaque reçu facture avec remaining_amount = solde après ce reçu.
 */
function enrichReceiptsWithRemaining(
  receipts: ReceiptListItem[],
  priceByInvoiceId: Record<number, number>
): ReceiptListItem[] {
  const byInvoice = new Map<number, ReceiptListItem[]>();
  receipts.forEach((r) => {
    if (r.source_type !== "FACTURE" || r.invoice_id == null) return;
    const list = byInvoice.get(r.invoice_id) ?? [];
    list.push(r);
    byInvoice.set(r.invoice_id, list);
  });
  const remainingByReceiptId = new Map<number, number>();
  byInvoice.forEach((list, invoiceId) => {
    const prixVente = priceByInvoiceId[invoiceId] ?? 0;
    const sorted = [...list].sort((a, b) => {
      const da = a.payment_date ?? "";
      const db = b.payment_date ?? "";
      if (da !== db) return da.localeCompare(db);
      return (a.id ?? 0) - (b.id ?? 0);
    });
    let paidSoFar = 0;
    sorted.forEach((r) => {
      paidSoFar += Number(r.amount) || 0;
      const remaining = Math.max(0, prixVente - paidSoFar);
      remainingByReceiptId.set(r.id, remaining);
    });
  });
  return receipts.map((r) => {
    if (r.source_type !== "FACTURE") return r;
    const computed = remainingByReceiptId.get(r.id);
    if (computed === undefined) return r;
    return { ...r, remaining_amount: computed };
  });
}

function openReceiptPrint(r: ReceiptListItem) {
  const titre = r.source_type === "DEVIS" ? "Reçu devis" : "Reçu facture";
  const origine = r.source_type === "DEVIS"
    ? `Devis ${r.devis_vin ? r.devis_vin + " — " : ""}${r.devis_prestataire ?? `#${r.devis_id}`}`
    : (r.invoice_number ?? `Facture #${r.invoice_id}`);
  const clientPrestataire = getClientPrestataire(r);
  const dateStr = r.payment_date ? new Date(r.payment_date).toLocaleDateString("fr-FR") : "—";
  const soldeRestantLine =
    r.remaining_amount != null && Number(r.remaining_amount) > 0
      ? `<p><strong>Solde restant :</strong> ${Number(r.remaining_amount).toLocaleString("fr-FR")} FCFA</p>`
      : "";
  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Reçu #${r.id}</title>
<style>body{font-family:system-ui,sans-serif;max-width:480px;margin:2rem auto;padding:1rem;}
h1{font-size:1.25rem;border-bottom:1px solid #ccc;padding-bottom:0.5rem;}
p{margin:0.35rem 0;}
strong{display:inline-block;min-width:10rem;}
</style></head><body>
<h1>${titre} — ParcAuto Manager</h1>
<p><strong>N° reçu :</strong> ${r.id}</p>
<p><strong>Origine :</strong> ${origine}</p>
<p><strong>Client / Prestataire :</strong> ${clientPrestataire}</p>
<p><strong>Montant :</strong> ${r.amount != null ? r.amount.toLocaleString("fr-FR") : "—"} FCFA</p>
<p><strong>Méthode :</strong> ${r.payment_method ?? "—"}</p>
<p><strong>Date :</strong> ${dateStr}</p>
<p><strong>Référence :</strong> ${r.reference ?? "—"}</p>
${soldeRestantLine}
<p style="margin-top:2rem;font-size:0.875rem;color:#666;">Document généré le ${new Date().toLocaleString("fr-FR")}</p>
</body></html>`;
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
  }
}

const actionsSelectClass =
  "w-full min-w-[140px] rounded-xl border border-slate-300 bg-white px-3 py-2 pr-8 text-sm text-slate-700 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";

export default function RecusPage() {
  const searchParams = useSearchParams();
  const invoiceIdFromUrl = searchParams.get("invoiceId");
  const devisIdFromUrl = searchParams.get("devisId");
  const [list, setList] = useState<ReceiptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(!!invoiceIdFromUrl || !!devisIdFromUrl);
  const [previewReceipt, setPreviewReceipt] = useState<ReceiptListItem | null>(null);
  const [editReceipt, setEditReceipt] = useState<ReceiptListItem | null>(null);
  const [deleteReceipt, setDeleteReceipt] = useState<{ receipt: ReceiptListItem; reason: string } | null>(null);

  const fetchList = useCallback(async () => {
    try {
      setError(null);
      const [receiptsRes, invoicesRes] = await Promise.all([
        apiGet<{ receipts?: unknown[] }>("/receipts"),
        apiGet<{ invoices?: unknown[] }>("/invoices"),
      ]);
      const raw = (receiptsRes as { receipts?: unknown[] })?.receipts ?? [];
      const receipts = (raw as Record<string, unknown>[]).map(pickReceipt);
      const invRaw = (invoicesRes as { invoices?: unknown[] })?.invoices ?? [];
      const priceByInvoiceId: Record<number, number> = {};
      (invRaw as Record<string, unknown>[]).forEach((r) => {
        const id = (r.id as number) ?? 0;
        const priceSale = (r.price_sale as number) ?? (r.prix_vente as number) ?? (r.priceSale as number);
        const amount = (r.amount as number) ?? (r.montant as number);
        const total = (r.total_amount as number) ?? (r.totalAmount as number) ?? amount;
        priceByInvoiceId[id] = Number(priceSale ?? total ?? amount) || 0;
      });
      const enriched = enrichReceiptsWithRemaining(receipts, priceByInvoiceId);
      setList(enriched);
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
          <h1 className="text-2xl font-bold text-slate-900">Reçus</h1>
          <p className="mt-1 text-slate-600">Paiements reçus (factures ou devis).</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Nouveau reçu</Button>
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      <Card title="Liste des reçus">
        {loading ? (
          <p className="py-8 text-center text-slate-500">Chargement…</p>
        ) : list.length === 0 ? (
          <p className="py-8 text-center text-slate-500">Aucun reçu.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-600">
                  <th className="p-3 font-medium">Origine</th>
                  <th className="p-3 font-medium">Facture / Devis</th>
                  <th className="p-3 font-medium">Client / Prestataire</th>
                  <th className="p-3 font-medium">Montant</th>
                  <th className="p-3 font-medium">Méthode</th>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Réf.</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="p-3">
                      <span className={r.source_type === "DEVIS" ? "text-violet-600" : "text-slate-700"}>
                        {r.source_type === "DEVIS" ? "Devis" : "Facture"}
                      </span>
                    </td>
                    <td className="p-3">
                      {r.source_type === "DEVIS"
                        ? (r.devis_vin ? `${r.devis_vin} — ` : "") + (r.devis_prestataire ?? `Devis #${r.devis_id}`)
                        : (r.invoice_number ?? "—")}
                    </td>
                    <td className="p-3">{getClientPrestataire(r)}</td>
                    <td className="p-3">{r.amount != null ? r.amount.toLocaleString("fr-FR") + " FCFA" : "—"}</td>
                    <td className="p-3">{r.payment_method ?? "—"}</td>
                    <td className="p-3">{r.payment_date ? new Date(r.payment_date).toLocaleDateString("fr-FR") : "—"}</td>
                    <td className="p-3">{r.reference ?? "—"}</td>
                    <td className="p-3">
                      <select
                        className={actionsSelectClass}
                        value=""
                        onChange={(e) => {
                          const v = e.target.value;
                          e.target.value = "";
                          if (v === "preview") setPreviewReceipt(r);
                          else if (v === "download") openReceiptPrint(r);
                          else if (v === "edit") setEditReceipt(r);
                          else if (v === "delete") setDeleteReceipt({ receipt: r, reason: "" });
                        }}
                      >
                        <option value="" disabled>Actions</option>
                        <option value="preview">Aperçu</option>
                        <option value="download">Télécharger</option>
                        <option value="edit">Modifier</option>
                        <option value="delete">Supprimer</option>
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
        <ModalReçu
          initialInvoiceId={invoiceIdFromUrl ? Number(invoiceIdFromUrl) : undefined}
          initialDevisId={devisIdFromUrl ? Number(devisIdFromUrl) : undefined}
          onClose={() => setModalOpen(false)}
          onSuccess={() => { setModalOpen(false); fetchList(); }}
        />
      )}

      {previewReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPreviewReceipt(null)}>
          <Card
            className="w-full max-w-md shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">
              Aperçu reçu #{previewReceipt.id}
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-slate-500">Origine</dt><dd>{previewReceipt.source_type === "DEVIS" ? "Devis" : "Facture"}</dd></div>
              <div><dt className="text-slate-500">Facture / Devis</dt><dd>{previewReceipt.source_type === "DEVIS" ? (previewReceipt.devis_vin ? `${previewReceipt.devis_vin} — ` : "") + (previewReceipt.devis_prestataire ?? `#${previewReceipt.devis_id}`) : (previewReceipt.invoice_number ?? "—")}</dd></div>
              <div><dt className="text-slate-500">Client / Prestataire</dt><dd>{getClientPrestataire(previewReceipt)}</dd></div>
              <div><dt className="text-slate-500">Montant</dt><dd>{previewReceipt.amount != null ? previewReceipt.amount.toLocaleString("fr-FR") + " FCFA" : "—"}</dd></div>
              {previewReceipt.remaining_amount != null && Number(previewReceipt.remaining_amount) > 0 && (
                <div><dt className="text-slate-500">Solde restant</dt><dd className="font-medium text-amber-600">{Number(previewReceipt.remaining_amount).toLocaleString("fr-FR")} FCFA</dd></div>
              )}
              <div><dt className="text-slate-500">Méthode</dt><dd>{previewReceipt.payment_method ?? "—"}</dd></div>
              <div><dt className="text-slate-500">Date</dt><dd>{previewReceipt.payment_date ? new Date(previewReceipt.payment_date).toLocaleDateString("fr-FR") : "—"}</dd></div>
              <div><dt className="text-slate-500">Référence</dt><dd>{previewReceipt.reference ?? "—"}</dd></div>
            </dl>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPreviewReceipt(null)}>Fermer</Button>
              <Button onClick={() => { openReceiptPrint(previewReceipt); setPreviewReceipt(null); }}>Télécharger / Imprimer</Button>
            </div>
          </Card>
        </div>
      )}

      {editReceipt && (
        <ModalModifierReçu
          receipt={editReceipt}
          onClose={() => setEditReceipt(null)}
          onSuccess={() => { setEditReceipt(null); fetchList(); }}
        />
      )}

      {deleteReceipt && (
        <ModalSupprimerReçu
          receipt={deleteReceipt.receipt}
          reason={deleteReceipt.reason}
          onReasonChange={(reason) => setDeleteReceipt((d) => (d ? { ...d, reason } : null))}
          onClose={() => setDeleteReceipt(null)}
          onConfirm={async () => {
            if (!deleteReceipt.reason.trim()) return;
            await apiDelete(`/receipts/${deleteReceipt.receipt.id}`, {
              body: JSON.stringify({ reason: deleteReceipt.reason.trim() }),
            } as RequestInit & { skipAuth?: boolean });
            setDeleteReceipt(null);
            fetchList();
          }}
        />
      )}
    </div>
  );
}

/**
 * Nouveau reçu : en sélectionnant une facture ou un devis, les informations sont récupérées ;
 * le montant est pré-rempli avec le montant de la facture ou du devis. Il reste à saisir uniquement
 * la méthode et la référence de paiement.
 */
function ModalReçu({
  initialInvoiceId,
  initialDevisId,
  onClose,
  onSuccess,
}: { initialInvoiceId?: number; initialDevisId?: number; onClose: () => void; onSuccess: () => void }) {
  const [sourceType, setSourceType] = useState<"FACTURE" | "DEVIS">(initialDevisId ? "DEVIS" : "FACTURE");
  const [invoiceId, setInvoiceId] = useState(initialInvoiceId ? String(initialInvoiceId) : "");
  const [devisId, setDevisId] = useState(initialDevisId ? String(initialDevisId) : "");
  const [invoices, setInvoices] = useState<{ id: number; invoice_number?: string; client_name?: string; amount?: number; total_amount?: number; remaining_amount?: number }[]>([]);
  const [devisList, setDevisList] = useState<{ id: number; prestataire?: string; vin?: string; amount?: number; remaining_amount?: number }[]>([]);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("VIREMENT");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [invoiceSoldeZero, setInvoiceSoldeZero] = useState(false);

  const [devisSoldeZero, setDevisSoldeZero] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [invRes, devRes, receiptsRes] = await Promise.all([
          apiGet<{ invoices?: unknown[] }>("/invoices"),
          apiGet<{ workshopQuotes?: unknown[] }>("/devis"),
          apiGet<{ receipts?: unknown[] }>("/receipts"),
        ]);
        const invRaw = (invRes as { invoices?: unknown[] })?.invoices ?? [];
        const devRaw = (devRes as { workshopQuotes?: unknown[] })?.workshopQuotes ?? [];
        const receiptsRaw = (receiptsRes as { receipts?: unknown[] })?.receipts ?? [];
        const receiptsByDevisId: Record<number, number> = {};
        (receiptsRaw as Record<string, unknown>[]).forEach((r) => {
          const devisId = (r.devis_id as number) ?? (r.devisId as number);
          if (devisId == null) return;
          const amt = (r.amount as number) ?? (r.montant as number) ?? 0;
          receiptsByDevisId[devisId] = (receiptsByDevisId[devisId] ?? 0) + amt;
        });
        const mapped = (invRaw as Record<string, unknown>[]).map((r) => {
          const priceSale = (r.price_sale as number) ?? (r.prix_vente as number) ?? (r.priceSale as number);
          const amount = (r.amount as number) ?? (r.montant as number);
          const totalAmount = (r.total_amount as number) ?? (r.totalAmount as number) ?? amount;
          const paid = (r.paid_amount as number) ?? (r.paidAmount as number) ?? (r.montant_paye as number);
          const prixVente = Number(priceSale ?? totalAmount ?? amount) || 0;
          const montantPaye = Number(paid) || 0;
          const remaining_amount = Math.max(0, prixVente - montantPaye);
          return {
            id: (r.id as number) ?? 0,
            invoice_number: (r.invoice_number as string) ?? (r.invoiceNumber as string),
            client_name: (r.client_name as string) ?? (r.clientName as string),
            amount: (r.amount as number) ?? (r.montant as number),
            total_amount: (r.total_amount as number) ?? (r.totalAmount as number),
            remaining_amount,
          };
        });
        const invoicesEligibles = mapped.filter((i) => (i.remaining_amount ?? 0) > 0);
        setInvoices(invoicesEligibles);
        const devisMapped = (devRaw as Record<string, unknown>[]).map((r) => {
          const id = (r.id as number) ?? 0;
          const amount = Number((r.amount as number) ?? (r.montant as number)) || 0;
          const paid = receiptsByDevisId[id] ?? 0;
          const remaining_amount = Math.max(0, amount - paid);
          return {
            id,
            prestataire: (r.prestataire as string) ?? "",
            vin: (r.vin as string) ?? "",
            amount,
            remaining_amount,
          };
        });
        const devisEligibles = devisMapped.filter((d) => (d.remaining_amount ?? 0) > 0);
        setDevisList(devisEligibles);
        if (initialDevisId && devRaw.length) {
          const devEligible = devisEligibles.find((d) => d.id === initialDevisId);
          if (devEligible) {
            setDevisSoldeZero(false);
            setSourceType("DEVIS");
            setDevisId(String(initialDevisId));
            if (typeof devEligible.amount === "number" && devEligible.amount > 0) {
              const total = devEligible.amount;
              const restant = devEligible.remaining_amount ?? total;
              setAmount(String(Math.min(total, restant)));
            }
          } else {
            setDevisSoldeZero(true);
            setSourceType("DEVIS");
            setDevisId(devisEligibles.length ? String(devisEligibles[0].id) : "");
            setAmount("");
          }
        } else if (initialInvoiceId && invRaw.length) {
          const invEligible = invoicesEligibles.find((i) => i.id === initialInvoiceId);
          if (invEligible) {
            setInvoiceSoldeZero(false);
            setInvoiceId(String(initialInvoiceId));
            setSourceType("FACTURE");
            const amt = invEligible.amount ?? invEligible.total_amount;
            if (typeof amt === "number" && amt > 0) {
              const restant = invEligible.remaining_amount ?? amt;
              setAmount(String(Math.min(amt, restant)));
            }
          } else {
            setInvoiceSoldeZero(true);
            setInvoiceId(invoicesEligibles.length ? String(invoicesEligibles[0].id) : "");
            setAmount("");
          }
        } else {
          setInvoiceSoldeZero(false);
          if (invoicesEligibles.length && !invoiceId) {
            const first = invoicesEligibles[0];
            setInvoiceId(String(first.id));
            const amt = first.amount ?? first.total_amount;
            if (typeof amt === "number" && amt > 0) {
              const restant = first.remaining_amount ?? amt;
              setAmount(String(Math.min(amt, restant)));
            }
          }
          if (devisEligibles.length && !devisId) {
            const first = devisEligibles[0];
            setDevisId(String(first.id));
            if (typeof first.amount === "number" && first.amount > 0) {
              const restant = first.remaining_amount ?? first.amount;
              setAmount(String(Math.min(first.amount, restant)));
            }
          }
          setDevisSoldeZero(false);
        }
      } catch {
        setInvoices([]);
        setDevisList([]);
      }
    })();
  }, []);

  const selectedInvoice = invoices.find((i) => String(i.id) === invoiceId);
  const selectedDevis = devisList.find((d) => String(d.id) === devisId);

  useEffect(() => {
    if (sourceType === "FACTURE" && selectedInvoice) {
      const amt = selectedInvoice.amount ?? selectedInvoice.total_amount;
      if (typeof amt === "number" && amt > 0) {
        const restant = selectedInvoice.remaining_amount ?? amt;
        setAmount(String(Math.min(amt, restant)));
      }
    }
  }, [sourceType, invoiceId, selectedInvoice?.id, selectedInvoice?.amount, selectedInvoice?.total_amount, selectedInvoice?.remaining_amount]);

  useEffect(() => {
    if (sourceType === "DEVIS" && selectedDevis?.amount != null && selectedDevis.amount > 0) {
      const restant = selectedDevis.remaining_amount ?? selectedDevis.amount;
      setAmount(String(Math.min(selectedDevis.amount, restant)));
    }
  }, [sourceType, devisId, selectedDevis?.id, selectedDevis?.amount, selectedDevis?.remaining_amount]);

  const handleInvoiceChange = (id: string) => {
    setInvoiceId(id);
    const inv = invoices.find((i) => String(i.id) === id);
    const amt = inv?.amount ?? inv?.total_amount;
    if (typeof amt === "number" && amt > 0) {
      const restant = inv?.remaining_amount ?? amt;
      setAmount(String(Math.min(amt, restant)));
    }
  };

  const handleDevisChange = (id: string) => {
    setDevisId(id);
    const dev = devisList.find((d) => String(d.id) === id);
    if (dev?.amount != null && dev.amount > 0) {
      const restant = dev.remaining_amount ?? dev.amount;
      setAmount(String(Math.min(dev.amount, restant)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const val = Number(amount);
    if (Number.isNaN(val) || val < 0) return;
    if (sourceType === "FACTURE" && !invoiceId) return;
    if (sourceType === "FACTURE") {
      const inv = invoices.find((i) => String(i.id) === invoiceId);
      if (inv && (inv.remaining_amount ?? 0) <= 0) {
        setSubmitError("La facture de ce véhicule est entièrement réglée. Aucun nouveau reçu ne peut être émis.");
        return;
      }
    }
    if (sourceType === "DEVIS" && !devisId) return;
    if (sourceType === "DEVIS") {
      const dev = devisList.find((d) => String(d.id) === devisId);
      if (dev && (dev.remaining_amount ?? 0) <= 0) {
        setSubmitError("Ce devis est entièrement réglé. Aucun nouveau reçu ne peut être émis.");
        return;
      }
    }
    // Vérifier que le montant ne dépasse pas le solde restant (sinon le calcul donnerait un solde négatif)
    if (sourceType === "FACTURE" && selectedInvoice) {
      const soldeRestant = Number(selectedInvoice.remaining_amount) || 0;
      if (val > soldeRestant) {
        setSubmitError(
          `Le montant du reçu (${val.toLocaleString("fr-FR")} FCFA) ne peut pas dépasser le solde restant (${soldeRestant.toLocaleString("fr-FR")} FCFA).`
        );
        return;
      }
    }
    if (sourceType === "DEVIS" && selectedDevis) {
      const soldeRestant = Number(selectedDevis.remaining_amount) || 0;
      if (val > soldeRestant) {
        setSubmitError(
          `Le montant du reçu (${val.toLocaleString("fr-FR")} FCFA) ne peut pas dépasser le solde restant (${soldeRestant.toLocaleString("fr-FR")} FCFA).`
        );
        return;
      }
    }
    const dateStr =
      paymentDate && paymentDate.length >= 10
        ? paymentDate.slice(0, 10)
        : new Date().toISOString().slice(0, 10);
    if (!dateStr || !paymentMethod?.trim()) {
      setSubmitError("Date de paiement et méthode sont requis.");
      return;
    }
    setSaving(true);
    try {
      // Format attendu : docs/FORMAT_RECETTES_FRONTEND.md — un seul type (invoiceId OU devisId)
      const body: Record<string, unknown> = {
        amount: val,
        paymentMethod: (paymentMethod?.trim() || "ESPECES") as string,
        paymentDate: dateStr,
      };
      if (reference?.trim()) body.reference = reference.trim();
      if (sourceType === "FACTURE") {
        body.invoiceId = Number(invoiceId);
      } else {
        body.devisId = Number(devisId);
      }
      await apiPost("/receipts", body);
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur enregistrement";
      if (msg.includes("devis non supporté") || msg.includes("Reçu devis")) {
        setSubmitError(
          "Le reçu lié à un devis n'est pas pris en charge par l'API pour le moment. Utilisez un reçu lié à une facture, ou contactez l'administrateur."
        );
      } else {
        setSubmitError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-semibold">Nouveau reçu</h2>
        <p className="mt-1 text-sm text-slate-600">
          Sélectionnez une facture ou un devis, puis saisissez le <strong>montant du paiement</strong>, la méthode et la référence. Le montant ne doit pas dépasser le solde restant. Les factures et devis entièrement réglés (solde = 0) ne sont pas proposés.
        </p>
        {invoiceSoldeZero && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            La facture de ce véhicule est entièrement réglée. Aucun nouveau reçu ne peut être émis pour celle-ci.
          </div>
        )}
        {devisSoldeZero && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Ce devis est entièrement réglé. Aucun nouveau reçu ne peut être émis.
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {submitError && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              {submitError}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Lier à *</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as "FACTURE" | "DEVIS")}
            >
              <option value="FACTURE">Facture (vente)</option>
              <option value="DEVIS">Devis (maintenance)</option>
            </select>
          </div>
          {sourceType === "FACTURE" ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Facture *</label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={invoiceId}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                required
              >
                <option value="">—</option>
                {invoices.map((i) => (
                  <option key={i.id} value={i.id}>{i.invoice_number} — {i.client_name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Devis *</label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={devisId}
                onChange={(e) => handleDevisChange(e.target.value)}
                required
              >
                <option value="">—</option>
                {devisList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.vin ?? ""} — {d.prestataire ?? `Devis #${d.id}`} ({d.amount != null ? d.amount.toLocaleString("fr-FR") : ""} FCFA)
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <Input
              label="Montant du paiement (FCFA) *"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Saisir le montant payé"
              required
            />
            {sourceType === "FACTURE" && selectedInvoice && (selectedInvoice.remaining_amount ?? 0) > 0 && (
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Solde restant : <strong>{Number(selectedInvoice.remaining_amount).toLocaleString("fr-FR")} FCFA</strong> (montant max. autorisé).
              </p>
            )}
            {sourceType === "DEVIS" && selectedDevis && (selectedDevis.remaining_amount ?? 0) > 0 && (
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Solde restant : <strong>{Number(selectedDevis.remaining_amount).toLocaleString("fr-FR")} FCFA</strong> (montant max. autorisé).
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Méthode de paiement *</label>
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <Input label="Date paiement" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
          <Input label="Référence de paiement" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ex. numéro de chèque, virement..." />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Créer"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function ModalModifierReçu({
  receipt,
  onClose,
  onSuccess,
}: {
  receipt: ReceiptListItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState(String(receipt.amount ?? ""));
  const [paymentMethod, setPaymentMethod] = useState(receipt.payment_method ?? "ESPECES");
  const [paymentDate, setPaymentDate] = useState(
    receipt.payment_date && receipt.payment_date.length >= 10
      ? receipt.payment_date.slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [reference, setReference] = useState(receipt.reference ?? "");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const val = Number(amount);
    if (Number.isNaN(val) || val < 0) {
      setSubmitError("Montant invalide.");
      return;
    }
    const dateStr = paymentDate && paymentDate.length >= 10 ? paymentDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
    setSaving(true);
    try {
      await apiPatch(`/receipts/${receipt.id}`, {
        amount: val,
        paymentMethod: paymentMethod.trim() || "ESPECES",
        paymentDate: dateStr,
        reference: reference.trim() || undefined,
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
        <h2 className="text-xl font-semibold">Modifier le reçu #{receipt.id}</h2>
        <p className="mt-1 text-sm text-slate-600">Origine : {receipt.source_type === "DEVIS" ? "Devis" : "Facture"}</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{submitError}</div>
          )}
          <Input label="Montant (FCFA) *" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Méthode</label>
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <Input label="Date paiement" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
          <Input label="Référence" value={reference} onChange={(e) => setReference(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function ModalSupprimerReçu({
  receipt,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
}: {
  receipt: ReceiptListItem;
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
        <h2 className="text-xl font-semibold text-red-700">Supprimer le reçu #{receipt.id}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Montant : {receipt.amount != null ? receipt.amount.toLocaleString("fr-FR") + " FCFA" : "—"} — {receipt.source_type === "DEVIS" ? "Devis" : "Facture"}
        </p>
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Motif de suppression *</label>
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={3}
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Ex : erreur de saisie, annulation..."
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
