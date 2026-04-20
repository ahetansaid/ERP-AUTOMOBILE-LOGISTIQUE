"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/Card";

interface ClientDetail {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  status?: string;
  type?: string;
  nif?: string;
  rccm?: string;
}

interface PurchaseHistoryItem {
  id: number;
  vin?: string;
  brand?: string;
  model?: string;
  status?: string;
  price_sale?: number;
}

interface PaymentHistoryItem {
  id: number;
  payment_date?: string;
  amount?: number;
  reference?: string;
  invoice_number?: string;
  source_type?: string;
}

interface TransitHistoryItem {
  id: number;
  vin?: string;
  brand?: string;
  model?: string;
  step_name?: string;
  date_arrival?: string;
  date_departure?: string;
}

/** Normalise l'objet client renvoyé par l'API (snake_case / camelCase / aliases). */
function normalizeClient(raw: Record<string, unknown> | null): ClientDetail | null {
  if (!raw) return null;
  const name =
    (raw.name as string) ?? (raw.nom as string) ??
    ([raw.first_name, raw.last_name].filter(Boolean).join(" ").trim() || (raw.raison_sociale as string));
  return {
    id: (raw.id as number) ?? 0,
    name: name || undefined,
    email: (raw.email as string) ?? undefined,
    phone: (raw.phone as string) ?? (raw.telephone as string) ?? undefined,
    address: (raw.address as string) ?? (raw.adresse as string) ?? undefined,
    city: (raw.city as string) ?? (raw.ville as string) ?? undefined,
    country: (raw.country as string) ?? (raw.pays as string) ?? undefined,
    notes: (raw.notes as string) ?? undefined,
    status: (raw.status as string) ?? undefined,
    type: (raw.type as string) ?? (raw.client_type as string) ?? undefined,
    nif: (raw.nif as string) ?? undefined,
    rccm: (raw.rccm as string) ?? undefined,
  };
}

export default function ClientDetailPage() {
  const params = useParams();
  const id = params?.id ? String(params.id) : null;
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [transitHistory, setTransitHistory] = useState<TransitHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const res = await apiGet<{
        client?: Record<string, unknown>;
        purchaseHistory?: unknown[];
        paymentHistory?: unknown[];
        transitHistory?: unknown[];
      }>(`/clients/${id}`);
      const raw = (res as { client?: Record<string, unknown> }).client ?? (res as Record<string, unknown>);
      setClient(normalizeClient(raw && typeof raw === "object" ? raw : null));

      const ph = (res as { purchaseHistory?: unknown[] }).purchaseHistory ?? [];
      setPurchaseHistory((ph as Record<string, unknown>[]).map((r) => ({
        id: (r.id as number) ?? 0,
        vin: (r.vin as string) ?? undefined,
        brand: (r.brand as string) ?? undefined,
        model: (r.model as string) ?? undefined,
        status: (r.status as string) ?? undefined,
        price_sale: (r.price_sale as number) ?? (r.priceSale as number) ?? undefined,
      })));

      const pay = (res as { paymentHistory?: unknown[] }).paymentHistory ?? [];
      setPaymentHistory((pay as Record<string, unknown>[]).map((r) => ({
        id: (r.id as number) ?? 0,
        payment_date: (r.payment_date as string) ?? (r.paymentDate as string) ?? undefined,
        amount: (r.amount as number) ?? (r.montant as number) ?? undefined,
        reference: (r.reference as string) ?? undefined,
        invoice_number: (r.invoice_number as string) ?? (r.invoiceNumber as string) ?? undefined,
        source_type: (r.source_type as string) ?? (r.sourceType as string) ?? undefined,
      })));

      const tr = (res as { transitHistory?: unknown[] }).transitHistory ?? [];
      setTransitHistory((tr as Record<string, unknown>[]).map((r) => ({
        id: (r.id as number) ?? 0,
        vin: (r.vin as string) ?? undefined,
        brand: (r.brand as string) ?? undefined,
        model: (r.model as string) ?? undefined,
        step_name: (r.step_name as string) ?? (r.stepName as string) ?? undefined,
        date_arrival: (r.date_arrival as string) ?? (r.dateArrival as string) ?? undefined,
        date_departure: (r.date_departure as string) ?? (r.dateDeparture as string) ?? undefined,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement");
      setClient(null);
      setPurchaseHistory([]);
      setPaymentHistory([]);
      setTransitHistory([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (!id) return <p className="text-slate-500">Identifiant manquant.</p>;
  if (loading && !client) return <p className="py-8 text-slate-500">Chargement…</p>;
  if (error && !client) return <div><p className="text-red-600 dark:text-red-400">{error}</p><Link href="/crm" className="text-primary-600 hover:underline dark:text-primary-400">Retour</Link></div>;

  const c = client!;
  return (
    <div className="space-y-6">
      <div>
        <Link href="/crm" className="text-sm text-primary-600 hover:underline dark:text-primary-400">← Liste clients</Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Fiche client — {c.name ?? id}</h1>
      </div>
      <Card title="Coordonnées">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div><dt className="text-sm text-slate-500 dark:text-slate-400">Nom</dt><dd className="font-medium text-slate-900 dark:text-slate-100">{c.name ?? "—"}</dd></div>
          <div><dt className="text-sm text-slate-500 dark:text-slate-400">Email</dt><dd className="text-slate-800 dark:text-slate-200">{c.email ?? "—"}</dd></div>
          <div><dt className="text-sm text-slate-500 dark:text-slate-400">Téléphone</dt><dd className="text-slate-800 dark:text-slate-200">{c.phone ?? "—"}</dd></div>
          <div><dt className="text-sm text-slate-500 dark:text-slate-400">Adresse</dt><dd className="text-slate-800 dark:text-slate-200">{c.address ?? "—"}</dd></div>
          <div><dt className="text-sm text-slate-500 dark:text-slate-400">Ville / Pays</dt><dd className="text-slate-800 dark:text-slate-200">{c.city ?? "—"}{c.country ? ` / ${c.country}` : ""}</dd></div>
          <div><dt className="text-sm text-slate-500 dark:text-slate-400">Statut</dt><dd className="text-slate-800 dark:text-slate-200">{c.status ?? "—"}</dd></div>
          {(c.type || c.nif || c.rccm) && (
            <>
              {c.type && <div><dt className="text-sm text-slate-500 dark:text-slate-400">Type</dt><dd className="text-slate-800 dark:text-slate-200">{c.type}</dd></div>}
              {c.nif && <div><dt className="text-sm text-slate-500 dark:text-slate-400">NIF</dt><dd className="text-slate-800 dark:text-slate-200">{c.nif}</dd></div>}
              {c.rccm && <div><dt className="text-sm text-slate-500 dark:text-slate-400">RCCM</dt><dd className="text-slate-800 dark:text-slate-200">{c.rccm}</dd></div>}
            </>
          )}
        </dl>
        {c.notes && <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{c.notes}</p>}
      </Card>

      <Card title="Véhicules achetés / en cours">
        {purchaseHistory.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">Aucun véhicule.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-400">
                  <th className="p-2 font-medium">VIN</th>
                  <th className="p-2 font-medium">Véhicule</th>
                  <th className="p-2 font-medium">Statut</th>
                  <th className="p-2 font-medium">Prix</th>
                </tr>
              </thead>
              <tbody>
                {purchaseHistory.map((v) => (
                  <tr key={v.id} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="p-2 font-mono text-slate-800 dark:text-slate-200">{v.vin ?? "—"}</td>
                    <td className="p-2 text-slate-800 dark:text-slate-200">{v.brand ?? "—"} {v.model ?? ""}</td>
                    <td className="p-2 text-slate-800 dark:text-slate-200">{v.status ?? "—"}</td>
                    <td className="p-2 text-slate-800 dark:text-slate-200">{v.price_sale != null ? v.price_sale.toLocaleString("fr-FR") + " FCFA" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Historique des paiements">
        {paymentHistory.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">Aucun paiement enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-400">
                  <th className="p-2 font-medium">Date</th>
                  <th className="p-2 font-medium">Référence</th>
                  <th className="p-2 font-medium">Source</th>
                  <th className="p-2 font-medium text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="p-2 text-slate-800 dark:text-slate-200">
                      {p.payment_date ? new Date(p.payment_date).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="p-2 text-slate-800 dark:text-slate-200">{p.reference ?? "—"}</td>
                    <td className="p-2 text-slate-800 dark:text-slate-200">{p.source_type ?? p.invoice_number ?? "—"}</td>
                    <td className="p-2 text-right font-medium text-green-700 dark:text-green-400">
                      {p.amount != null ? p.amount.toLocaleString("fr-FR") + " FCFA" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Reçus liés aux factures ou devis. <Link href="/comptabilite/recus" className="text-primary-600 hover:underline dark:text-primary-400">Voir les reçus</Link>
        </p>
      </Card>

      <Card title="Transit">
        {transitHistory.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">Aucun véhicule en transit pour ce client.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-400">
                  <th className="p-2 font-medium">VIN</th>
                  <th className="p-2 font-medium">Véhicule</th>
                  <th className="p-2 font-medium">Étape</th>
                  <th className="p-2 font-medium">Arrivée</th>
                  <th className="p-2 font-medium">Départ</th>
                </tr>
              </thead>
              <tbody>
                {transitHistory.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="p-2 font-mono text-slate-800 dark:text-slate-200">{t.vin ?? "—"}</td>
                    <td className="p-2 text-slate-800 dark:text-slate-200">{t.brand ?? "—"} {t.model ?? ""}</td>
                    <td className="p-2 text-slate-800 dark:text-slate-200">{t.step_name ?? "—"}</td>
                    <td className="p-2 text-slate-800 dark:text-slate-200">{t.date_arrival ? new Date(t.date_arrival).toLocaleDateString("fr-FR") : "—"}</td>
                    <td className="p-2 text-slate-800 dark:text-slate-200">{t.date_departure ? new Date(t.date_departure).toLocaleDateString("fr-FR") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/transit" className="text-primary-600 hover:underline dark:text-primary-400">Voir le transit</Link>
        </p>
      </Card>
    </div>
  );
}
