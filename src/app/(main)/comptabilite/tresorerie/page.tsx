"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Period = "week" | "month" | "year" | "all";

interface TreasuryFlows {
  /** Encaissements : reçus liés aux factures (paiements clients) */
  encaissements: number;
  /** Achats véhicules (décaissement) */
  achatsVehicules: number;
  /** Transport (décaissement) */
  transport: number;
  /** Réparations / devis atelier (décaissement) */
  reparations: number;
  /** Charges diverses (décaissement) */
  chargesDiverses: number;
  /** Lignes encaissements pour détail */
  lignesEncaissements: { date: string; reference: string; montant: number }[];
  /** Lignes décaissements par catégorie pour détail */
  lignesAchats: { date: string; libelle: string; montant: number }[];
  lignesTransport: { date: string; libelle: string; montant: number }[];
  lignesReparations: { date: string; devis: string; montant: number }[];
  lignesCharges: { date: string; libelle: string; montant: number }[];
}

/** Retourne le début de période pour filtrer par date (ISO string). */
function periodStart(period: Period): string | null {
  if (period === "all") return null;
  const d = new Date();
  if (period === "year") {
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
  } else {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
  }
  return d.toISOString().slice(0, 10);
}

function formatFcfa(value: number | undefined | null): string {
  if (value == null) return "—";
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

function inPeriod(dateStr: string | undefined | null, start: string | null): boolean {
  if (!start || !dateStr) return true;
  return dateStr >= start;
}

export default function TresoreriePage() {
  const [period, setPeriod] = useState<Period>("all");
  const [flows, setFlows] = useState<TreasuryFlows | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalTransportAchat, setModalTransportAchat] = useState(false);

  const fetchFlows = useCallback(async () => {
    setError(null);
    setLoading(true);
    const start = periodStart(period);

    try {
      const [receiptsRes, devisRes, chargesRes, purchasesRes, vehiclesRes] = await Promise.all([
        apiGet<{ receipts?: unknown[] }>("/receipts"),
        apiGet<{ workshopQuotes?: unknown[] }>("/devis"),
        apiGet<{ charges?: unknown[] }>("/charges"),
        apiGet<{ purchases?: unknown[] }>("/purchases").catch(() => ({ purchases: [] })),
        apiGet<{ data?: unknown[] }>("/vehicles").catch(() => ({ data: [] })),
      ]);

      const receipts = (receiptsRes as { receipts?: unknown[] })?.receipts ?? [];
      const devis = (devisRes as { workshopQuotes?: unknown[] })?.workshopQuotes ?? [];
      const charges = (chargesRes as { charges?: unknown[] })?.charges ?? [];
      const purchases = (purchasesRes as { purchases?: unknown[] })?.purchases ?? [];
      const vehicles = Array.isArray(vehiclesRes) ? vehiclesRes : (vehiclesRes as { data?: unknown[] })?.data ?? [];

      const recList = receipts as Record<string, unknown>[];
      const devList = devis as Record<string, unknown>[];
      const chargeList = charges as Record<string, unknown>[];
      const purchList = purchases as Record<string, unknown>[];
      const vehList = vehicles as Record<string, unknown>[];

      const encaissementsLines: { date: string; reference: string; montant: number }[] = [];
      let encaissementsTotal = 0;
      recList.forEach((r) => {
        const source = (r.source_type as string) ?? (r.sourceType as string) ?? "";
        if (source.toUpperCase() !== "FACTURE") return;
        const date = (r.payment_date as string) ?? (r.paymentDate as string) ?? "";
        if (!inPeriod(date, start)) return;
        const amt = Number(r.amount ?? r.montant ?? 0) || 0;
        encaissementsTotal += amt;
        encaissementsLines.push({
          date,
          reference: `RC-${String(r.id ?? "").padStart(3, "0")}`,
          montant: amt,
        });
      });
      encaissementsLines.sort((a, b) => a.date.localeCompare(b.date));

      const achatsLines: { date: string; libelle: string; montant: number }[] = [];
      let achatsTotal = 0;
      purchList.forEach((p) => {
        const date = (p.purchase_date as string) ?? (p.purchaseDate as string) ?? "";
        if (!inPeriod(date, start)) return;
        const amt = Number(p.amount_fcfa ?? p.montant_fcfa ?? p.amountFcfa ?? 0) || 0;
        if (amt > 0) {
          achatsTotal += amt;
          achatsLines.push({ date, libelle: (p.supplier_name as string) ?? `Achat #${p.id}`, montant: amt });
        }
      });
      if (achatsLines.length === 0 && vehList.length > 0) {
        vehList.forEach((v) => {
          const prix = Number(v.purchase_price_fcfa ?? v.purchasePriceFcfa ?? v.montant_fcfa ?? v.purchase_price ?? 0) || 0;
          if (prix > 0) {
            achatsTotal += prix;
            const date = (v.purchase_date as string) ?? (v.created_at as string) ?? "";
            if (inPeriod(date, start)) achatsLines.push({ date, libelle: `${v.brand ?? ""} ${v.model ?? ""} ${v.vin ?? ""}`.trim() || `Véhicule #${v.id}`, montant: prix });
          }
        });
      }

      const transportLines: { date: string; libelle: string; montant: number }[] = [];
      let transportTotal = 0;
      vehList.forEach((v) => {
        const amt = Number(v.transport_fees ?? v.transportFees ?? v.frais_transport ?? 0) || 0;
        if (amt > 0 && inPeriod((v.purchase_date as string) ?? (v.created_at as string), start)) {
          transportTotal += amt;
          transportLines.push({ date: (v.purchase_date as string) ?? "", libelle: `Transport — ${v.vin ?? v.id}`, montant: amt });
        }
      });
      // Charges catégorie TRANSPORT (ex. transport lié aux achats) → décaissement Transport
      chargeList.forEach((c) => {
        const cat = String((c.category as string) ?? "").toUpperCase();
        if (cat !== "TRANSPORT") return;
        const date = (c.charge_date as string) ?? (c.date as string) ?? "";
        if (!inPeriod(date, start)) return;
        const amt = Number(c.amount ?? c.montant ?? 0) || 0;
        if (amt > 0) {
          transportTotal += amt;
          transportLines.push({ date, libelle: (c.label as string) ?? "Transport achat", montant: amt });
        }
      });
      transportLines.sort((a, b) => a.date.localeCompare(b.date));

      const reparationsLines: { date: string; devis: string; montant: number }[] = [];
      let reparationsTotal = 0;
      devList.forEach((d) => {
        const date = (d.valid_until as string) ?? (d.created_at as string) ?? "";
        if (!inPeriod(date, start)) return;
        const amt = Number(d.amount ?? d.montant ?? 0) || 0;
        if (amt > 0) {
          reparationsTotal += amt;
          reparationsLines.push({ date, devis: `DEV-${String(d.id ?? "").padStart(3, "0")} — ${d.prestataire ?? ""}`, montant: amt });
        }
      });

      const chargesLines: { date: string; libelle: string; montant: number }[] = [];
      let chargesTotal = 0;
      chargeList.forEach((c) => {
        const cat = String((c.category as string) ?? "").toUpperCase();
        if (cat === "TRANSPORT") return; // déjà dans transport
        const date = (c.charge_date as string) ?? (c.date as string) ?? "";
        if (!inPeriod(date, start)) return;
        const amt = Number(c.amount ?? c.montant ?? 0) || 0;
        if (amt > 0) {
          chargesTotal += amt;
          chargesLines.push({ date, libelle: (c.label as string) ?? (c.category as string) ?? "Charge", montant: amt });
        }
      });

      setFlows({
        encaissements: encaissementsTotal,
        achatsVehicules: achatsTotal,
        transport: transportTotal,
        reparations: reparationsTotal,
        chargesDiverses: chargesTotal,
        lignesEncaissements: encaissementsLines,
        lignesAchats: achatsLines,
        lignesTransport: transportLines,
        lignesReparations: reparationsLines,
        lignesCharges: chargesLines,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement trésorerie");
      setFlows(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  const totalDecaissements = flows
    ? flows.achatsVehicules + flows.transport + flows.reparations + flows.chargesDiverses
    : 0;
  const benefice = flows ? flows.encaissements - totalDecaissements : 0;

  const moisMap = new Map<string, { enc: number; dec: number }>();
  if (flows && period === "all") {
    flows.lignesEncaissements.forEach((l) => {
      const key = l.date ? l.date.slice(0, 7) : "";
      if (!key) return;
      const cur = moisMap.get(key) ?? { enc: 0, dec: 0 };
      cur.enc += l.montant;
      moisMap.set(key, cur);
    });
    [...flows.lignesAchats, ...flows.lignesTransport, ...flows.lignesReparations, ...flows.lignesCharges].forEach((l) => {
      const key = l.date ? l.date.slice(0, 7) : "";
      if (!key) return;
      const cur = moisMap.get(key) ?? { enc: 0, dec: 0 };
      cur.dec += l.montant;
      moisMap.set(key, cur);
    });
  }
  const moisList = Array.from(moisMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 12);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Trésorerie</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Flux d&apos;argent réel : encaissements (paiements clients) et décaissements (achats, transport, réparations, charges).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {(["all", "month", "year"] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? "primary" : "secondary"}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p === "all" ? "Tout" : p === "month" ? "Mensuel" : "Annuel"}
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={() => fetchFlows()}>
            Rafraîchir
          </Button>
          <div className="border-l border-slate-200 pl-3 dark:border-slate-600">
            <Button variant="primary" size="sm" onClick={() => setModalTransportAchat(true)}>
              + Transport (achat)
            </Button>
          </div>
        </div>
      </div>

      {modalTransportAchat && (
        <ModalTransportAchat
          onClose={() => setModalTransportAchat(false)}
          onSuccess={() => {
            setModalTransportAchat(false);
            fetchFlows();
          }}
        />
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <p className="py-12 text-center text-slate-500">Chargement…</p>
        </Card>
      ) : flows ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden p-0">
              <div className="bg-green-500/10 px-4 py-3 font-medium text-green-700 dark:text-green-300">
                Encaissements
              </div>
              <div className="p-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatFcfa(flows.encaissements)}
              </div>
              <p className="px-4 pb-4 text-xs text-slate-500">Paiements clients (reçus factures)</p>
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="bg-amber-500/10 px-4 py-3 font-medium text-amber-700 dark:text-amber-300">
                Décaissements
              </div>
              <div className="p-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatFcfa(totalDecaissements)}
              </div>
              <p className="px-4 pb-4 text-xs text-slate-500">Achats, transport, réparations, charges</p>
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="bg-slate-100 px-4 py-3 font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                Bénéfice
              </div>
              <div className={`p-4 text-2xl font-bold ${benefice >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                {formatFcfa(benefice)}
              </div>
              <p className="px-4 pb-4 text-xs text-slate-500">
                Encaissements − Décaissements {period !== "all" ? `(${period === "month" ? "mois" : "année"})` : ""}
              </p>
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="bg-slate-100 px-4 py-3 font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                Période
              </div>
              <div className="p-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {period === "all" ? "Tout" : period === "month" ? "Ce mois" : "Cette année"}
              </div>
            </Card>
          </div>

          <Card title="Tableau global des flux">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-400">
                    <th className="p-3 font-medium">Catégorie</th>
                    <th className="p-3 font-medium text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 bg-green-50/50 dark:border-slate-700 dark:bg-green-900/10">
                    <td className="p-3 font-medium">Encaissements</td>
                    <td className="p-3 text-right font-semibold text-green-700 dark:text-green-400">{formatFcfa(flows.encaissements)}</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <td className="p-3">Achats véhicules</td>
                    <td className="p-3 text-right">{formatFcfa(flows.achatsVehicules)}</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <td className="p-3">Transport</td>
                    <td className="p-3 text-right">{formatFcfa(flows.transport)}</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <td className="p-3">Réparations</td>
                    <td className="p-3 text-right">{formatFcfa(flows.reparations)}</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <td className="p-3">Charges diverses</td>
                    <td className="p-3 text-right">{formatFcfa(flows.chargesDiverses)}</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <td className="p-3 font-medium">Total décaissements</td>
                    <td className="p-3 text-right font-medium">{formatFcfa(totalDecaissements)}</td>
                  </tr>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <td className="p-3 font-semibold">Résultat (bénéfice)</td>
                    <td className={`p-3 text-right font-semibold ${benefice >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>{formatFcfa(benefice)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Encaissements (paiements clients)">
              {flows.lignesEncaissements.length === 0 ? (
                <p className="py-4 text-slate-500">Aucun encaissement sur la période.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-600">
                        <th className="p-2 font-medium">Date</th>
                        <th className="p-2 font-medium">Référence</th>
                        <th className="p-2 font-medium text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flows.lignesEncaissements.slice(-20).reverse().map((l, i) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                          <td className="p-2">{l.date ? new Date(l.date).toLocaleDateString("fr-FR") : "—"}</td>
                          <td className="p-2">{l.reference}</td>
                          <td className="p-2 text-right font-medium text-green-700 dark:text-green-400">{formatFcfa(l.montant)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Source : reçus liés aux factures. <Link href="/comptabilite/recus" className="text-primary-600 hover:underline">Voir les reçus</Link>
              </p>
            </Card>

            <Card title="Décaissements par catégorie">
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>Achats véhicules</span>
                  <span>{formatFcfa(flows.achatsVehicules)}</span>
                </li>
                <li className="flex flex-wrap items-center justify-between gap-2">
                  <span>Transport</span>
                  <span className="flex items-center gap-2">
                    <span>{formatFcfa(flows.transport)}</span>
                    <Button variant="secondary" size="sm" onClick={() => setModalTransportAchat(true)} className="shrink-0">
                      + Ajouter
                    </Button>
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Réparations (devis atelier)</span>
                  <span>{formatFcfa(flows.reparations)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Charges diverses</span>
                  <span>{formatFcfa(flows.chargesDiverses)}</span>
                </li>
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/supply-chain/achats" className="text-xs text-primary-600 hover:underline dark:text-primary-400">Achats</Link>
                <Link href="/comptabilite/devis" className="text-xs text-primary-600 hover:underline dark:text-primary-400">Devis</Link>
                <Link href="/comptabilite/charges" className="text-xs text-primary-600 hover:underline dark:text-primary-400">Charges</Link>
              </div>
            </Card>
          </div>

          {period === "all" && moisList.length > 0 && (
            <Card title="Analyse par mois">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-400">
                      <th className="p-3 font-medium">Mois</th>
                      <th className="p-3 font-medium text-right">Encaissements</th>
                      <th className="p-3 font-medium text-right">Décaissements</th>
                      <th className="p-3 font-medium text-right">Résultat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moisList.map(([mois, v]) => {
                      const res = v.enc - v.dec;
                      return (
                        <tr key={mois} className="border-b border-slate-100 dark:border-slate-700">
                          <td className="p-3">{new Date(mois + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</td>
                          <td className="p-3 text-right text-green-700 dark:text-green-400">{formatFcfa(v.enc)}</td>
                          <td className="p-3 text-right text-amber-700 dark:text-amber-400">{formatFcfa(v.dec)}</td>
                          <td className={`p-3 text-right font-medium ${res >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>{formatFcfa(res)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <Card title="Rappel du calcul">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <strong>Encaissements</strong> = Paiements des clients (reçus liés aux factures).
              <br />
              <strong>Décaissements</strong> = Achats véhicules + Transport + Réparations (devis atelier) + Charges diverses.
              <br />
              <strong>Bénéfice</strong> = Total encaissements − Total décaissements.
            </p>
          </Card>
        </>
      ) : (
        <Card>
          <p className="py-8 text-center text-slate-500">Aucune donnée trésorerie disponible.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/comptabilite/recus" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium dark:border-slate-600">Reçus</Link>
            <Link href="/supply-chain/achats" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium dark:border-slate-600">Achats</Link>
            <Link href="/comptabilite/charges" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium dark:border-slate-600">Charges</Link>
          </div>
        </Card>
      )}
    </div>
  );
}

interface PurchaseOption {
  id: number;
  supplier_name?: string;
  purchase_date?: string;
  container_reference?: string;
}

function ModalTransportAchat({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [purchases, setPurchases] = useState<PurchaseOption[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [purchaseId, setPurchaseId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [chargeDate, setChargeDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingPurchases(true);
    apiGet<{ purchases?: unknown[] }>("/purchases")
      .then((res) => {
        if (cancelled) return;
        const raw = (res as { purchases?: unknown[] })?.purchases ?? [];
        const list = (raw as Record<string, unknown>[]).map((p) => ({
          id: p.id as number,
          supplier_name: (p.supplier_name as string) ?? (p.fournisseurNom as string),
          purchase_date: (p.purchase_date as string) ?? (p.dateAchat as string),
          container_reference: (p.container_reference as string) ?? (p.conteneur as string),
        }));
        setPurchases(list);
      })
      .catch(() => {
        if (!cancelled) setPurchases([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingPurchases(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPurchase = purchaseId ? purchases.find((p) => p.id === Number(purchaseId)) : null;
  const label =
    selectedPurchase
      ? `Transport — Achat #${selectedPurchase.id}${selectedPurchase.container_reference ? ` — ${selectedPurchase.container_reference}` : selectedPurchase.supplier_name ? ` — ${selectedPurchase.supplier_name}` : ""}`
      : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const val = Number(amount);
    if (Number.isNaN(val) || val <= 0) {
      setSubmitError("Montant invalide.");
      return;
    }
    if (!purchaseId) {
      setSubmitError("Veuillez sélectionner un achat.");
      return;
    }
    setSaving(true);
    try {
      await apiPost("/charges", {
        label: label || "Transport — achat",
        category: "TRANSPORT",
        amount: val,
        chargeDate,
      });
      onSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Ajouter un transport (achat)
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Enregistre une charge de type Transport liée à un achat. Elle apparaîtra dans la trésorerie.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Achat
            </label>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              value={purchaseId}
              onChange={(e) => setPurchaseId(e.target.value)}
              required
              disabled={loadingPurchases}
            >
              <option value="">— Choisir un achat —</option>
              {purchases.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  Achat #{p.id}
                  {p.container_reference ? ` — ${p.container_reference}` : ""}
                  {p.supplier_name ? ` — ${p.supplier_name}` : ""}
                  {p.purchase_date ? ` (${p.purchase_date.slice(0, 10)})` : ""}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Montant (FCFA)"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Input
            label="Date"
            type="date"
            value={chargeDate}
            onChange={(e) => setChargeDate(e.target.value)}
            required
          />
          {submitError && (
            <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving || loadingPurchases}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
