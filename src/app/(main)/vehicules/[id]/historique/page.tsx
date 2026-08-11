"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPatch } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface VehicleInfo {
  id: number;
  vin?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  status?: string;
  registration?: string;
  mileage?: number;
  purchase_price?: number;
  purchase_price_fcfa?: number;
  purchase_date?: string;
  transport_fees?: number;
  supplier_name?: string;
  price_sale?: number;
  client_name?: string;
}

interface DevisRow {
  id: number;
  vehicle_id?: number;
  prestataire?: string;
  amount?: number;
  status?: string;
  valid_until?: string;
  vin?: string;
}

interface InvoiceRow {
  id: number;
  vehicle_id?: number;
  invoice_number?: string;
  client_name?: string;
  price_sale?: number;
  amount?: number;
  status?: string;
  due_date?: string;
  remaining_amount?: number;
}

interface ReceiptRow {
  id: number;
  invoice_id?: number;
  amount?: number;
  payment_date?: string;
  payment_method?: string;
  reference?: string;
  remaining_amount?: number | null;
}

interface TimelineItem {
  date: string;
  label: string;
  detail?: string;
  sortKey: string;
}

function formatFcfa(value: number | undefined | null): string {
  if (value == null) return "—";
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

function devisStatutLabel(s: string | undefined): string {
  const u = (s ?? "").toUpperCase();
  if (u === "TERMINE" || u === "CLOTURE") return "Clôturé";
  if (u === "ACCEPTE") return "Non clôturé";
  if (u === "REFUSE") return "Refusé";
  return "En cours";
}

export default function VehiculeHistoriquePage() {
  const params = useParams();
  const id = params?.id ? String(params.id) : null;
  const vehicleId = id ? Number(id) : NaN;

  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);
  const [devisList, setDevisList] = useState<DevisRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingExit, setMarkingExit] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [vRes, invRes, recRes, devisRes] = await Promise.all([
        apiGet<Record<string, unknown>>(`/vehicles/${id}`),
        apiGet<{ invoices?: unknown[] }>("/invoices"),
        apiGet<{ receipts?: unknown[] }>("/receipts"),
        apiGet<{ workshopQuotes?: unknown[] }>("/devis"),
      ]);

      const v = vRes as Record<string, unknown>;
      if (v && (v.id != null || v.vin != null)) {
        setVehicle({
          id: (v.id as number) ?? 0,
          vin: (v.vin as string) ?? "",
          brand: (v.brand as string) ?? (v.marque as string),
          model: (v.model as string) ?? (v.modele as string),
          year: (v.year as number) ?? (v.annee as number),
          color: (v.color as string) ?? (v.couleur as string),
          status: (v.status as string) ?? "",
          registration: (v.registration as string) ?? (v.immatriculation as string),
          mileage: (v.mileage as number) ?? (v.kilometrage as number),
          purchase_price: (v.purchase_price as number) ?? (v.purchasePrice as number),
          purchase_price_fcfa: (v.purchase_price_fcfa as number) ?? (v.purchasePriceFcfa as number) ?? (v.montant_fcfa as number),
          purchase_date: (v.purchase_date as string) ?? (v.purchaseDate as string),
          transport_fees: (v.transport_fees as number) ?? (v.frais_transport as number),
          supplier_name: (v.supplier_name as string) ?? (v.fournisseur as string),
          price_sale: (v.price_sale as number) ?? (v.priceSale as number),
          client_name: (v.client_name as string) ?? (v.clientName as string),
        });
      } else {
        setVehicle(null);
      }

      const invRaw = (invRes as { invoices?: unknown[] })?.invoices ?? [];
      const invList = (invRaw as Record<string, unknown>[]).filter(
        (x) => Number(x.vehicle_id ?? x.vehicleId) === vehicleId
      );
      setInvoices(
        invList.map((x) => ({
          id: (x.id as number) ?? 0,
          vehicle_id: (x.vehicle_id as number) ?? (x.vehicleId as number),
          invoice_number: (x.invoice_number as string) ?? (x.invoiceNumber as string),
          client_name: (x.client_name as string) ?? (x.clientName as string),
          price_sale: (x.price_sale as number) ?? (x.priceSale as number) ?? (x.amount as number),
          amount: (x.amount as number) ?? (x.montant as number),
          status: (x.status as string) ?? "",
          due_date: (x.due_date as string) ?? (x.dueDate as string),
          remaining_amount: (x.remaining_amount as number) ?? (x.remainingAmount as number),
        }))
      );

      const invoiceIds = new Set(invList.map((x) => Number(x.id)));
      const recRaw = (recRes as { receipts?: unknown[] })?.receipts ?? [];
      const recList = (recRaw as Record<string, unknown>[]).filter((x) => {
        const iid = x.invoice_id ?? x.invoiceId;
        return iid != null && invoiceIds.has(Number(iid));
      });
      const sortedRec = [...recList].sort((a, b) => {
        const da = (a.payment_date as string) ?? (a.paymentDate as string) ?? "";
        const db = (b.payment_date as string) ?? (b.paymentDate as string) ?? "";
        if (da !== db) return da.localeCompare(db);
        return ((a.id as number) ?? 0) - ((b.id as number) ?? 0);
      });
      const inv = invList[0] as Record<string, unknown> | undefined;
      const prixVente = (inv?.price_sale as number) ?? (inv?.priceSale as number) ?? (inv?.amount as number) ?? 0;
      let paidSoFar = 0;
      setReceipts(
        sortedRec.map((x) => {
          const amt = (x.amount as number) ?? (x.montant as number) ?? 0;
          paidSoFar += amt;
          return {
            id: (x.id as number) ?? 0,
            invoice_id: (x.invoice_id as number) ?? (x.invoiceId as number),
            amount: amt,
            payment_date: (x.payment_date as string) ?? (x.paymentDate as string),
            payment_method: (x.payment_method as string) ?? (x.paymentMethod as string),
            reference: (x.reference as string) ?? undefined,
            remaining_amount: Math.max(0, prixVente - paidSoFar),
          };
        })
      );

      const devRaw = (devisRes as { workshopQuotes?: unknown[] })?.workshopQuotes ?? [];
      const devList = (devRaw as Record<string, unknown>[]).filter(
        (x) => Number(x.vehicle_id ?? x.vehicleId) === vehicleId
      );
      setDevisList(
        devList.map((x) => ({
          id: (x.id as number) ?? 0,
          vehicle_id: (x.vehicle_id as number) ?? (x.vehicleId as number),
          prestataire: (x.prestataire as string) ?? "",
          amount: (x.amount as number) ?? (x.montant as number),
          status: (x.status as string) ?? "",
          valid_until: (x.valid_until as string) ?? (x.validUntil as string),
          vin: (x.vin as string) ?? "",
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement");
      setVehicle(null);
      setDevisList([]);
      setInvoices([]);
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  }, [id, vehicleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMarquerSortieParc = async () => {
    if (!id) return;
    setMarkingExit(true);
    try {
      await apiPatch(`/vehicles/${id}`, { status: "LIVRE" } as Record<string, string>);
      await fetchData();
    } finally {
      setMarkingExit(false);
    }
  };

  if (!id) return <p className="text-slate-500">Identifiant manquant.</p>;
  if (loading) return <p className="py-8 text-slate-500">Chargement…</p>;
  if (error && !vehicle) {
    return (
      <div>
        <p className="text-red-600">{error}</p>
        <Link href={`/vehicules/${id}`} className="text-primary-600 hover:underline">← Retour fiche</Link>
      </div>
    );
  }

  const v = vehicle!;
  const prixAchat = (v.purchase_price_fcfa ?? v.purchase_price) ?? 0;
  const transport = v.transport_fees ?? 0;
  const totalReparations = devisList.reduce((s, d) => s + (d.amount ?? 0), 0);
  const coutTotal = prixAchat + transport + totalReparations;
  const prixVente = v.price_sale ?? invoices[0]?.price_sale ?? invoices[0]?.amount ?? 0;
  const benefice = prixVente > 0 ? Math.max(0, prixVente - coutTotal) : null;
  const isVendu = (v.status ?? "").toUpperCase() === "VENDU";
  const invoice = invoices[0];

  const timeline: TimelineItem[] = [];
  if (v.purchase_date) timeline.push({ date: v.purchase_date, label: "Achat du véhicule", detail: formatFcfa(prixAchat), sortKey: v.purchase_date });
  devisList.forEach((d) => {
    const dStr = d.valid_until ?? "";
    if (dStr) timeline.push({ date: dStr, label: `Devis ${d.prestataire ?? ""}`, detail: formatFcfa(d.amount), sortKey: dStr });
  });
  if (invoice?.due_date) timeline.push({ date: invoice.due_date, label: "Facture créée", detail: `${invoice.invoice_number ?? ""} — ${formatFcfa(prixVente)}`, sortKey: invoice.due_date });
  receipts.forEach((r) => {
    const d = r.payment_date ?? "";
    if (d) timeline.push({ date: d, label: "Paiement reçu", detail: `${formatFcfa(r.amount)}${(r.remaining_amount ?? 0) === 0 ? " — Facture clôturée" : ""}`, sortKey: d });
  });
  timeline.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={`/vehicules/${id}`} className="text-sm text-primary-600 hover:underline">← Fiche véhicule</Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            Historique — {[v.brand, v.model].filter(Boolean).join(" ") || v.vin || id}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice && (
            <>
              <Link href={`/comptabilite/factures/${invoice.id}`} className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium dark:border-slate-600 dark:bg-slate-800">Voir facture</Link>
              <Link href={`/comptabilite/recus?invoiceId=${invoice.id}`} className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium dark:border-slate-600 dark:bg-slate-800">Voir reçus</Link>
            </>
          )}
          {devisList.length > 0 && (
            <Link href={`/comptabilite/devis`} className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium dark:border-slate-600 dark:bg-slate-800">Voir devis</Link>
          )}
          {isVendu && (
            <Button variant="secondary" onClick={handleMarquerSortieParc} disabled={markingExit}>
              {markingExit ? "En cours…" : "Marquer sortie du parc"}
            </Button>
          )}
        </div>
      </div>

      <Card title="Informations générales">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 font-medium text-slate-700 dark:text-slate-300">Identité du véhicule</h3>
            <dl className="space-y-1 text-sm">
              <div><dt className="text-slate-500">Marque / Modèle</dt><dd>{v.brand} {v.model}</dd></div>
              <div><dt className="text-slate-500">Année</dt><dd>{v.year ?? "—"}</dd></div>
              <div><dt className="text-slate-500">VIN</dt><dd className="font-mono">{v.vin ?? "—"}</dd></div>
              <div><dt className="text-slate-500">Immatriculation</dt><dd>{v.registration ?? "—"}</dd></div>
              <div><dt className="text-slate-500">Couleur / Kilométrage</dt><dd>{v.color ?? "—"} {v.mileage != null ? `· ${v.mileage.toLocaleString("fr-FR")} km` : ""}</dd></div>
            </dl>
          </div>
          <div>
            <h3 className="mb-2 font-medium text-slate-700 dark:text-slate-300">Informations d&apos;achat</h3>
            <dl className="space-y-1 text-sm">
              <div><dt className="text-slate-500">Date d&apos;achat</dt><dd>{v.purchase_date ? new Date(v.purchase_date).toLocaleDateString("fr-FR") : "—"}</dd></div>
              <div><dt className="text-slate-500">Prix d&apos;achat</dt><dd>{formatFcfa(prixAchat)}</dd></div>
              <div><dt className="text-slate-500">Frais transport</dt><dd>{formatFcfa(transport)}</dd></div>
              <div><dt className="text-slate-500">Fournisseur</dt><dd>{v.supplier_name ?? "—"}</dd></div>
              <div><dt className="text-slate-500">Statut</dt><dd><Badge>{v.status ?? "—"}</Badge></dd></div>
            </dl>
          </div>
        </div>
      </Card>

      <Card title="Historique des devis (atelier)">
        {devisList.length === 0 ? (
          <p className="py-4 text-slate-500">Aucun devis pour ce véhicule.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-600">
                  <th className="p-2 font-medium">Devis</th>
                  <th className="p-2 font-medium">Prestataire</th>
                  <th className="p-2 font-medium text-right">Montant</th>
                  <th className="p-2 font-medium">Statut</th>
                  <th className="p-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {devisList.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="p-2"><Link href={`/comptabilite/devis/${d.id}`} className="text-primary-600 hover:underline">DEV-{String(d.id).padStart(3, "0")}</Link></td>
                    <td className="p-2">{d.prestataire ?? "—"}</td>
                    <td className="p-2 text-right">{formatFcfa(d.amount)}</td>
                    <td className="p-2"><Badge variant={devisStatutLabel(d.status) === "Clôturé" ? "success" : undefined}>{devisStatutLabel(d.status)}</Badge></td>
                    <td className="p-2">{d.valid_until ? new Date(d.valid_until).toLocaleDateString("fr-FR") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Historique des factures (vente)">
        <p className="mb-2 text-xs text-slate-500">Une seule facture par véhicule.</p>
        {invoices.length === 0 ? (
          <p className="py-4 text-slate-500">Aucune facture pour ce véhicule.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-600">
                  <th className="p-2 font-medium">Facture</th>
                  <th className="p-2 font-medium">Client</th>
                  <th className="p-2 font-medium text-right">Prix vente</th>
                  <th className="p-2 font-medium">Statut</th>
                  <th className="p-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="p-2"><Link href={`/comptabilite/factures/${inv.id}`} className="text-primary-600 hover:underline">{inv.invoice_number ?? `FAV-${inv.id}`}</Link></td>
                    <td className="p-2">{inv.client_name ?? "—"}</td>
                    <td className="p-2 text-right">{formatFcfa(inv.price_sale ?? inv.amount)}</td>
                    <td className="p-2"><Badge variant={(inv.remaining_amount ?? 0) <= 0 ? "success" : undefined}>{(inv.remaining_amount ?? 0) <= 0 ? "Clôturée" : "Non clôturée"}</Badge></td>
                    <td className="p-2">{inv.due_date ? new Date(inv.due_date).toLocaleDateString("fr-FR") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Historique des paiements (reçus)">
        {receipts.length === 0 ? (
          <p className="py-4 text-slate-500">Aucun reçu pour ce véhicule.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-600">
                  <th className="p-2 font-medium">Reçu</th>
                  <th className="p-2 font-medium">Date</th>
                  <th className="p-2 font-medium text-right">Montant</th>
                  <th className="p-2 font-medium">Méthode</th>
                  <th className="p-2 font-medium text-right">Solde restant</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="p-2">RC-{String(r.id).padStart(3, "0")}</td>
                    <td className="p-2">{r.payment_date ? new Date(r.payment_date).toLocaleDateString("fr-FR") : "—"}</td>
                    <td className="p-2 text-right font-medium">{formatFcfa(r.amount)}</td>
                    <td className="p-2">{r.payment_method ?? "—"}</td>
                    <td className="p-2 text-right">{r.remaining_amount != null ? formatFcfa(r.remaining_amount) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Coût total du véhicule">
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between"><dt>Prix achat</dt><dd>{formatFcfa(prixAchat)}</dd></div>
          <div className="flex justify-between"><dt>+ Transport</dt><dd>{formatFcfa(transport)}</dd></div>
          <div className="flex justify-between"><dt>+ Réparations</dt><dd>{formatFcfa(totalReparations)}</dd></div>
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-semibold dark:border-slate-600"><dt>Coût total</dt><dd>{formatFcfa(coutTotal)}</dd></div>
        </dl>
      </Card>

      {prixVente > 0 && (
        <Card title="Résultat de la vente">
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt>Prix vente</dt><dd>{formatFcfa(prixVente)}</dd></div>
            <div className="flex justify-between"><dt>Coût total</dt><dd>{formatFcfa(coutTotal)}</dd></div>
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-semibold text-green-600 dark:border-slate-600 dark:text-green-400"><dt>Bénéfice</dt><dd>{benefice != null ? formatFcfa(benefice) : "—"}</dd></div>
          </dl>
        </Card>
      )}

      <Card title="Timeline">
        {timeline.length === 0 ? (
          <p className="py-4 text-slate-500">Aucun événement à afficher.</p>
        ) : (
          <ul className="space-y-3">
            {timeline.map((e, i) => (
              <li key={i} className="flex gap-3 border-l-2 border-primary-200 pl-4 dark:border-primary-800">
                <span className="shrink-0 text-sm text-slate-500">
                  {e.date ? new Date(e.date).toLocaleDateString("fr-FR") : "—"}
                </span>
                <div>
                  <span className="font-medium">{e.label}</span>
                  {e.detail && <span className="ml-2 text-slate-600 dark:text-slate-400">{e.detail}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
