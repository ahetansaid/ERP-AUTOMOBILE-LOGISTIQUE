"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useComptaHybrid } from "@/lib/compta-internal/useComptaHybrid";
import { vehiclesApi, receiptsApi, reportingComptaApi } from "@/lib/services/api";
import type { Vehicle, Receipt } from "@/types";
import { CHARGE_CATEGORIES, PAYMENT_METHODS, CURRENCIES } from "@/lib/compta-internal/constants";
import {
  exportChargesCsv,
  exportFacturesDevisCsv,
  exportPaiementsCsv,
  exportRapportTresorerieCsv,
} from "@/lib/compta-internal/export-utils";
import type { StatutFactureDevis, TypeFactureDevis, FactureDevisInterne } from "@/lib/compta-internal/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CHART_COLORS = ["#64748b", "#0d9488", "#ef4444", "#14b8a6", "#0f766e", "#f59e0b", "#8b5cf6"];

const tabs = [
  { id: "charges", label: "Charges" },
  { id: "devis", label: "Devis" },
  { id: "factures", label: "Factures" },
  { id: "recus", label: "Reçus prestataires" },
  { id: "paiements", label: "Paiements" },
  { id: "tresorerie", label: "Trésorerie" },
  { id: "rapports", label: "Rapports" },
] as const;

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Ouvre une fenêtre d’impression pour facture/devis (PDF via « Enregistrer en PDF »). */
function printFactureDevis(f: FactureDevisInterne) {
  const w = window.open("", "_blank", "width=700,height=700");
  if (!w) return;
  const title = f.type === "devis" ? "Devis" : "Facture";
  const nature = f.type === "facture" && f.factureNature ? ` (${f.factureNature === "temporaire" ? "Avance" : "À solder"})` : "";
  const devisExtra = f.type === "devis" && (f.prestataire || f.vehicleVin || f.service)
    ? `<p><strong>Prestataire :</strong> ${escapeHtml(f.prestataire ?? f.clientName)}</p><p><strong>Véhicule :</strong> ${escapeHtml(f.vehicleVin ?? "—")} &nbsp; <strong>Service :</strong> ${escapeHtml(f.service ?? "—")}</p>`
    : "";
  w.document.write(`
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title} - ERP Auto</title>
<style>body{font-family:system-ui,sans-serif;padding:32px;color:#1e293b;} .header{text-align:center;margin-bottom:24px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #e2e8f0;padding:8px 12px;} th{background:#f1f5f9;} .total{font-weight:700;font-size:1.1em;}</style></head>
<body>
<div class="header"><h1>${title}${nature}</h1><p>ERP Automobile & Logistique</p></div>
<p><strong>${f.type === "devis" ? "Prestataire" : "Client"} :</strong> ${escapeHtml(f.prestataire ?? f.clientName)}</p>
${devisExtra}
<p><strong>Date :</strong> ${new Date(f.date).toLocaleDateString("fr-FR")} &nbsp; <strong>Statut :</strong> ${f.status}</p>
<table><thead><tr><th>Désignation</th><th>Montant</th></tr></thead>
<tbody><tr><td>Montant total</td><td class="total">${f.amount.toLocaleString()} ${f.currency}</td></tr></tbody></table>
</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); w.onafterprint = () => w.close(); }, 300);
}
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const RECEIPT_DEVIS_LINKS_KEY = "erp-receipt-devis-links";

function loadReceiptToDevisId(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(RECEIPT_DEVIS_LINKS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveReceiptToDevisId(map: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RECEIPT_DEVIS_LINKS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/** Génère une fenêtre d'impression pour un reçu (PDF via « Enregistrer en PDF »). */
function printReceipt(r: Receipt, devisRef?: FactureDevisInterne) {
  const w = window.open("", "_blank", "width=700,height=700");
  if (!w) return;
  w.document.write(`
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Reçu - ERP Auto</title>
<style>body{font-family:system-ui,sans-serif;padding:32px;color:#1e293b;} .header{text-align:center;margin-bottom:24px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #e2e8f0;padding:8px 12px;} th{background:#f1f5f9;} .total{font-weight:700;}</style></head>
<body>
<div class="header"><h1>Reçu prestataire</h1><p>ERP Automobile & Logistique</p></div>
<p><strong>Prestataire :</strong> ${escapeHtml(r.prestataireName)}</p>
<p><strong>Date reçu :</strong> ${r.receivedAt ? new Date(r.receivedAt).toLocaleDateString("fr-FR") : "—"} &nbsp; <strong>Réf. opération :</strong> ${escapeHtml(r.operationReference ?? "—")}</p>
${devisRef ? `<p><strong>Devis :</strong> ${escapeHtml(devisRef.prestataire ?? devisRef.clientName)} — ${new Date(devisRef.date).toLocaleDateString("fr-FR")} — ${devisRef.service ?? "—"}</p>` : ""}
<table><thead><tr><th>Désignation</th><th>Montant</th></tr></thead>
<tbody><tr><td>Montant</td><td class="total">${r.amount.toLocaleString("fr-FR")} ${r.currency}</td></tr></tbody></table>
${r.notes ? `<p class="mt-4"><strong>Notes :</strong> ${escapeHtml(r.notes)}</p>` : ""}
</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); w.onafterprint = () => w.close(); }, 300);
}

export default function ComptabilitePage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("charges");
  const [filterFactureNature, setFilterFactureNature] = useState<"toutes" | "temporaire" | "complet">("toutes");
  const [showFormCharge, setShowFormCharge] = useState(false);
  const [showFormFacture, setShowFormFacture] = useState(false);
  const [showFormPaiement, setShowFormPaiement] = useState(false);
  const [receiptToDevisId, setReceiptToDevisId] = useState<Record<string, string>>({});
  const [showFormRecuFromDevis, setShowFormRecuFromDevis] = useState<FactureDevisInterne | null>(null);
  const [situationDevisId, setSituationDevisId] = useState<string | null>(null);

  const [filterChargeDateFrom, setFilterChargeDateFrom] = useState("");
  const [filterChargeDateTo, setFilterChargeDateTo] = useState("");
  const [filterChargeCategory, setFilterChargeCategory] = useState("");
  const [filterChargeSearch, setFilterChargeSearch] = useState("");

  const [filterFactureDateFrom, setFilterFactureDateFrom] = useState("");
  const [filterFactureDateTo, setFilterFactureDateTo] = useState("");
  const [filterFactureType, setFilterFactureType] = useState("");
  const [filterFactureStatus, setFilterFactureStatus] = useState("");
  const [filterFactureClient, setFilterFactureClient] = useState("");

  const [filterPaiementDateFrom, setFilterPaiementDateFrom] = useState("");
  const [filterPaiementDateTo, setFilterPaiementDateTo] = useState("");
  const [filterPaiementMethod, setFilterPaiementMethod] = useState("");

  const [rapportDateFrom, setRapportDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    return d.toISOString().slice(0, 10);
  });
  const [rapportDateTo, setRapportDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [showFormRecu, setShowFormRecu] = useState(false);
  const [comptaReport, setComptaReport] = useState<{ summary?: unknown; notes?: { id: string; content: string; createdAt: string }[] } | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");

  useEffect(() => {
    setReceiptToDevisId(loadReceiptToDevisId());
  }, []);
  const persistReceiptToDevis = (receiptId: string, devisId: string) => {
    setReceiptToDevisId((prev) => {
      const next = { ...prev, [receiptId]: devisId };
      saveReceiptToDevisId(next);
      return next;
    });
  };
  const removeReceiptDevisLink = (receiptId: string) => {
    setReceiptToDevisId((prev) => {
      const next = { ...prev };
      delete next[receiptId];
      saveReceiptToDevisId(next);
      return next;
    });
  };

  const {
    source,
    loading: comptaLoading,
    error: comptaError,
    charges,
    facturesDevis,
    paiements,
    hydrated,
    addCharge,
    deleteCharge,
    addFactureDevis,
    updateFactureDevisStatus,
    deleteFactureDevis,
    addPaiement,
    deletePaiement,
    totalCharges,
    totalPaiements,
    solde,
    treasurySummary,
  } = useComptaHybrid();

  const chargesFiltered = useMemo(() => {
    return charges.filter((c) => {
      if (filterChargeDateFrom && c.date < filterChargeDateFrom) return false;
      if (filterChargeDateTo && c.date > filterChargeDateTo) return false;
      if (filterChargeCategory && c.category !== filterChargeCategory) return false;
      if (filterChargeSearch) {
        const q = filterChargeSearch.toLowerCase();
        if (!c.label.toLowerCase().includes(q) && !(c.vehicleVin ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [charges, filterChargeDateFrom, filterChargeDateTo, filterChargeCategory, filterChargeSearch]);

  const facturesFiltered = useMemo(() => {
    return facturesDevis.filter((f) => {
      if (filterFactureDateFrom && f.date < filterFactureDateFrom) return false;
      if (filterFactureDateTo && f.date > filterFactureDateTo) return false;
      if (filterFactureType && f.type !== filterFactureType) return false;
      if (filterFactureStatus && f.status !== filterFactureStatus) return false;
      if (filterFactureClient && !f.clientName.toLowerCase().includes(filterFactureClient.toLowerCase())) return false;
      return true;
    });
  }, [facturesDevis, filterFactureDateFrom, filterFactureDateTo, filterFactureType, filterFactureStatus, filterFactureClient]);

  const devisFiltered = useMemo(() => facturesFiltered.filter((f) => f.type === "devis"), [facturesFiltered]);

  /** Pour chaque devis : total des reçus liés et montant restant */
  const devisTotaux = useMemo(() => {
    const map: Record<string, { totalRecu: number; montantRestant: number }> = {};
    devisFiltered.forEach((d) => {
      const totalRecu = receipts
        .filter((r) => receiptToDevisId[r.id] === d.id)
        .reduce((s, r) => s + r.amount, 0);
      map[d.id] = { totalRecu, montantRestant: Math.max(0, d.amount - totalRecu) };
    });
    return map;
  }, [devisFiltered, receipts, receiptToDevisId]);
  const facturesOnlyFiltered = useMemo(() => {
    let list = facturesFiltered.filter((f) => f.type === "facture");
    if (filterFactureNature === "temporaire") list = list.filter((f) => f.factureNature === "temporaire");
    if (filterFactureNature === "complet") list = list.filter((f) => f.factureNature === "complet");
    return list;
  }, [facturesFiltered, filterFactureNature]);

  const paiementsFiltered = useMemo(() => {
    return paiements.filter((p) => {
      if (filterPaiementDateFrom && p.date < filterPaiementDateFrom) return false;
      if (filterPaiementDateTo && p.date > filterPaiementDateTo) return false;
      if (filterPaiementMethod && p.method !== filterPaiementMethod) return false;
      return true;
    });
  }, [paiements, filterPaiementDateFrom, filterPaiementDateTo, filterPaiementMethod]);

  const rapportCharges = useMemo(
    () => charges.filter((c) => c.date >= rapportDateFrom && c.date <= rapportDateTo),
    [charges, rapportDateFrom, rapportDateTo]
  );
  const rapportPaiements = useMemo(
    () => paiements.filter((p) => p.date >= rapportDateFrom && p.date <= rapportDateTo),
    [paiements, rapportDateFrom, rapportDateTo]
  );
  const rapportTotalCharges = useMemo(() => rapportCharges.reduce((s, c) => s + c.amount, 0), [rapportCharges]);
  const rapportTotalPaiements = useMemo(() => rapportPaiements.reduce((s, p) => s + p.amount, 0), [rapportPaiements]);

  const rapportChargesByCategory = useMemo(() => {
    const byCat: Record<string, number> = {};
    rapportCharges.forEach((c) => {
      byCat[c.category] = (byCat[c.category] ?? 0) + c.amount;
    });
    return Object.entries(byCat).map(([name, montant]) => ({ name, montant, fill: CHART_COLORS[Object.keys(byCat).indexOf(name) % CHART_COLORS.length] }));
  }, [rapportCharges]);

  const rapportFacturesByStatus = useMemo(() => {
    const fdInPeriod = facturesDevis.filter((f) => f.date >= rapportDateFrom && f.date <= rapportDateTo);
    const byStatus: Record<string, number> = {};
    fdInPeriod.forEach((f) => {
      byStatus[f.status] = (byStatus[f.status] ?? 0) + 1;
    });
    const labels: Record<string, string> = { brouillon: "Brouillon", envoye: "Envoyé", paye: "Payé" };
    return Object.entries(byStatus).map(([key, count], i) => ({
      name: labels[key] ?? key,
      count,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [facturesDevis, rapportDateFrom, rapportDateTo]);

  const rapportMonthly = useMemo(() => {
    const byMonth: Record<string, { charges: number; paiements: number }> = {};
    rapportCharges.forEach((c) => {
      const m = getMonthKey(c.date);
      if (!byMonth[m]) byMonth[m] = { charges: 0, paiements: 0 };
      byMonth[m].charges += c.amount;
    });
    rapportPaiements.forEach((p) => {
      const m = getMonthKey(p.date);
      if (!byMonth[m]) byMonth[m] = { charges: 0, paiements: 0 };
      byMonth[m].paiements += p.amount;
    });
    const months = Object.keys(byMonth).sort();
    return months.map((m) => ({
      month: m,
      charges: byMonth[m].charges,
      paiements: byMonth[m].paiements,
    }));
  }, [rapportCharges, rapportPaiements]);

  useEffect(() => {
    if (source !== "api") return;
    const load = () => {
      Promise.all([
        vehiclesApi.stockNonRegularise(),
        vehiclesApi.list({ limit: 300 }),
      ])
        .then(([nonReg, all]) => {
          const nonRegList = nonReg.data ?? [];
          const allList = all.data ?? [];
          const nonRegIds = new Set(nonRegList.map((v) => v.id));
          const inMaintenance = allList.filter((v) => (v as Vehicle & { inMaintenance?: boolean }).inMaintenance === true);
          const maintenanceOnly = inMaintenance.filter((v) => !nonRegIds.has(v.id));
          const merged = [...nonRegList, ...maintenanceOnly];
          setVehiclesList(merged);
        })
        .catch(() => setVehiclesList([]));
    };
    if (showFormCharge || activeTab === "devis" || showFormFacture) load();
  }, [source, showFormCharge, activeTab, showFormFacture]);

  useEffect(() => {
    if (activeTab !== "recus") return;
    setReceiptsLoading(true);
    receiptsApi.list().then((r) => setReceipts(r.data ?? [])).catch(() => setReceipts([])).finally(() => setReceiptsLoading(false));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "rapports") return;
    reportingComptaApi.get().then(setComptaReport).catch(() => setComptaReport(null));
  }, [activeTab]);

  if (!hydrated || comptaLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-200 border-t-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          Comptabilité & Finance
        </h1>
        <p className="mt-1 text-slate-500">
          {source === "api"
            ? "Données synchronisées."
            : "Données locales (non connecté)."}
        </p>
      </div>

      {source === "local" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
          <strong>Mode local.</strong> Les données sont enregistrées dans votre navigateur. Connectez l’application pour les synchroniser.
        </div>
      )}
      {comptaError && source === "local" && (
        <p className="text-sm text-slate-500">{comptaError}</p>
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-1 shadow-card">
        <nav className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? "bg-accent-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "charges" && (
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="mb-0">Charges (décaissements)</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => exportChargesCsv(chargesFiltered)} disabled={chargesFiltered.length === 0}>
                Exporter CSV
              </Button>
              <Button onClick={() => setShowFormCharge(!showFormCharge)}>
                {showFormCharge ? "Annuler" : "+ Nouvelle charge"}
              </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <span className="text-sm font-medium text-slate-600">Filtres :</span>
            <input
              type="date"
              value={filterChargeDateFrom}
              onChange={(e) => setFilterChargeDateFrom(e.target.value)}
              className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={filterChargeDateTo}
              onChange={(e) => setFilterChargeDateTo(e.target.value)}
              className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <select
              value={filterChargeCategory}
              onChange={(e) => setFilterChargeCategory(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Toutes catégories</option>
              {CHARGE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Libellé ou VIN..."
              value={filterChargeSearch}
              onChange={(e) => setFilterChargeSearch(e.target.value)}
              className="w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            {(filterChargeDateFrom || filterChargeDateTo || filterChargeCategory || filterChargeSearch) && (
              <button
                type="button"
                onClick={() => {
                  setFilterChargeDateFrom("");
                  setFilterChargeDateTo("");
                  setFilterChargeCategory("");
                  setFilterChargeSearch("");
                }}
                className="text-sm text-accent-600 hover:underline"
              >
                Réinitialiser
              </button>
            )}
          </div>
          {showFormCharge && (
            <FormCharge
              source={source}
              vehiclesList={vehiclesList}
              onAdd={addCharge}
              onClose={() => setShowFormCharge(false)}
            />
          )}
          <div className="table-container mt-6 rounded-xl border-0 shadow-none">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Libellé</th>
                  <th>Catégorie</th>
                  <th>Véhicule (VIN)</th>
                  <th className="text-right">Montant</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {chargesFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      {charges.length === 0 ? "Aucune charge. Ajoutez une charge pour commencer." : "Aucun résultat pour ces filtres."}
                    </td>
                  </tr>
                ) : (
                  chargesFiltered
                    .slice()
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((c) => (
                      <tr key={c.id}>
                        <td>{new Date(c.date).toLocaleDateString("fr-FR")}</td>
                        <td className="font-medium">{c.label}</td>
                        <td>{c.category}</td>
                        <td className="text-slate-500">{c.vehicleVin ?? "—"}</td>
                        <td className="text-right font-medium text-red-600">
                          -{c.amount.toLocaleString()} {c.currency}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => deleteCharge(c.id)}
                            className="text-slate-400 hover:text-red-600"
                          >
                            Suppr.
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "devis" && (
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="mb-0">Devis (prestataire, véhicule, service — FCFA)</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => exportFacturesDevisCsv(devisFiltered)} disabled={devisFiltered.length === 0}>
                Exporter CSV
              </Button>
              <Button onClick={() => { setShowFormFacture(true); }}>+ Nouveau devis</Button>
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-500">Devis liés à un véhicule. Créez un reçu depuis un devis pour suivre les encaissements ; consultez la situation pour le montant restant à solder.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <span className="text-sm font-medium text-slate-600">Filtres :</span>
            <input type="date" value={filterFactureDateFrom} onChange={(e) => setFilterFactureDateFrom(e.target.value)} className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <input type="date" value={filterFactureDateTo} onChange={(e) => setFilterFactureDateTo(e.target.value)} className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <select value={filterFactureStatus} onChange={(e) => setFilterFactureStatus(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="">Tous statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="envoye">Envoyé</option>
              <option value="paye">Payé</option>
            </select>
            <input type="text" placeholder="Prestataire…" value={filterFactureClient} onChange={(e) => setFilterFactureClient(e.target.value)} className="w-44 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          {showFormFacture && <FormFactureDevis initialType="devis" vehiclesList={vehiclesList} onAdd={addFactureDevis} onClose={() => setShowFormFacture(false)} />}
          {situationDevisId && (() => {
            const devis = devisFiltered.find((d) => d.id === situationDevisId);
            if (!devis) return null;
            return (
              <ModalSituationDevis
                devis={devis}
                receipts={receipts.filter((r) => receiptToDevisId[r.id] === situationDevisId)}
                devisTotaux={devisTotaux[situationDevisId]}
                onClose={() => setSituationDevisId(null)}
                onPrintReceipt={(r) => printReceipt(r, devisFiltered.find((d) => d.id === receiptToDevisId[r.id]))}
              />
            );
          })()}
          <div className="table-container mt-6 rounded-xl border-0 shadow-none overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Prestataire</th>
                  <th>Véhicule</th>
                  <th>Service</th>
                  <th className="text-right">Montant</th>
                  <th className="text-right">Restant</th>
                  <th>Statut</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {devisFiltered.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-slate-500">Aucun devis. Créez un devis avec prestataire, véhicule et montant en FCFA.</td></tr>
                ) : (
                  devisFiltered.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((f) => {
                    const tot = devisTotaux[f.id];
                    const restant = tot?.montantRestant ?? f.amount;
                    const soldé = restant <= 0;
                    return (
                      <tr key={f.id}>
                        <td>{new Date(f.date).toLocaleDateString("fr-FR")}</td>
                        <td className="font-medium">{f.prestataire ?? f.clientName}</td>
                        <td className="text-slate-600">{f.vehicleVin ?? "—"}</td>
                        <td className="max-w-[200px] truncate text-slate-600" title={f.service}>{f.service ?? "—"}</td>
                        <td className="text-right text-green-700">+{f.amount.toLocaleString()} {f.currency}</td>
                        <td className="text-right">{soldé ? "0" : `${restant.toLocaleString()} ${f.currency}`}</td>
                        <td>
                          <select value={f.status} onChange={(e) => updateFactureDevisStatus(f.id, e.target.value as StatutFactureDevis)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
                            <option value="brouillon">Brouillon</option><option value="envoye">Envoyé</option><option value="paye">Payé</option>
                          </select>
                        </td>
                        <td className="whitespace-nowrap">
                          <Button variant="outline" className="mr-1 text-xs" onClick={() => setShowFormRecuFromDevis(f)}>Créer un reçu</Button>
                          <Button variant="outline" className="mr-1 text-xs" onClick={() => setSituationDevisId(f.id)}>Situation</Button>
                          <Button variant="outline" className="mr-1 text-xs" onClick={() => printFactureDevis(f)}>PDF</Button>
                          <button type="button" onClick={() => deleteFactureDevis(f.id)} className="text-slate-400 hover:text-red-600">Suppr.</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "factures" && (
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="mb-0">Factures (temporaire = avance, complète = à solder)</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => exportFacturesDevisCsv(facturesOnlyFiltered)} disabled={facturesOnlyFiltered.length === 0}>Exporter CSV</Button>
              <Button onClick={() => { setShowFormFacture(true); }}>+ Nouvelle facture</Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <span className="text-sm font-medium text-slate-600">Filtres :</span>
            <select value={filterFactureNature} onChange={(e) => setFilterFactureNature(e.target.value as "toutes" | "temporaire" | "complet")} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="toutes">Toutes</option>
              <option value="temporaire">Temporaire (avance)</option>
              <option value="complet">Complète (à solder)</option>
            </select>
            <input type="date" value={filterFactureDateFrom} onChange={(e) => setFilterFactureDateFrom(e.target.value)} className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <input type="date" value={filterFactureDateTo} onChange={(e) => setFilterFactureDateTo(e.target.value)} className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <select value={filterFactureStatus} onChange={(e) => setFilterFactureStatus(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="">Tous statuts</option>
              <option value="brouillon">Brouillon</option><option value="envoye">Envoyé</option><option value="paye">Payé</option>
            </select>
            <input type="text" placeholder="Nom client…" value={filterFactureClient} onChange={(e) => setFilterFactureClient(e.target.value)} className="w-44 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          {showFormFacture && <FormFactureDevis initialType="facture" onAdd={addFactureDevis} onClose={() => setShowFormFacture(false)} />}
          <div className="table-container mt-6 rounded-xl border-0 shadow-none">
            <table>
              <thead>
                <tr><th>Date</th><th>Nature</th><th>Client</th><th className="text-right">Montant</th><th>Statut</th><th>PDF</th><th className="w-20"></th></tr>
              </thead>
              <tbody>
                {facturesOnlyFiltered.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-500">Aucune facture.</td></tr>
                ) : (
                  facturesOnlyFiltered.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((f) => (
                    <tr key={f.id}>
                      <td>{new Date(f.date).toLocaleDateString("fr-FR")}</td>
                      <td>{f.factureNature === "temporaire" ? "Avance" : f.factureNature === "complet" ? "À solder" : "—"}</td>
                      <td className="font-medium">{f.clientName}</td>
                      <td className="text-right text-green-700">+{f.amount.toLocaleString()} {f.currency}</td>
                      <td>
                        <select value={f.status} onChange={(e) => updateFactureDevisStatus(f.id, e.target.value as StatutFactureDevis)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
                          <option value="brouillon">Brouillon</option><option value="envoye">Envoyé</option><option value="paye">Payé</option>
                        </select>
                      </td>
                      <td><Button variant="outline" className="text-xs" onClick={() => printFactureDevis(f)}>Générer PDF</Button></td>
                      <td><button type="button" onClick={() => deleteFactureDevis(f.id)} className="text-slate-400 hover:text-red-600">Suppr.</button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "recus" && (
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="mb-0">Reçus prestataires externes</CardTitle>
            <Button onClick={() => setShowFormRecu(!showFormRecu)}>{showFormRecu ? "Annuler" : "+ Nouveau reçu"}</Button>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Prestataires externes (hors clients CRM). PDF avec logo et infos société.
          </p>
          {(showFormRecu || showFormRecuFromDevis) && (
            <FormRecu
              initialDevis={showFormRecuFromDevis ?? undefined}
              montantRestantDevis={showFormRecuFromDevis ? (devisTotaux[showFormRecuFromDevis.id]?.montantRestant ?? showFormRecuFromDevis.amount) : undefined}
              onAdd={async (body) => {
                const r = await receiptsApi.create(body);
                setReceipts((prev) => [...prev, r]);
                if (showFormRecuFromDevis) {
                  persistReceiptToDevis(r.id, showFormRecuFromDevis.id);
                }
                setShowFormRecu(false);
                setShowFormRecuFromDevis(null);
              }}
              onClose={() => { setShowFormRecu(false); setShowFormRecuFromDevis(null); }}
            />
          )}
          {receiptsLoading && <div className="mt-4 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-200 border-t-accent-600" /></div>}
          {!receiptsLoading && (
            <div className="table-container mt-6 rounded-xl border-0 shadow-none">
              <table>
                <thead>
                  <tr><th>Prestataire</th><th>Montant</th><th>Devise</th><th>Date</th><th>Réf. op.</th><th>Devis</th><th className="w-20"></th></tr>
                </thead>
                <tbody>
                  {receipts.length === 0 ? (
                    <tr><td colSpan={7} className="py-8 text-center text-slate-500">Aucun reçu. Créez un reçu depuis un devis (onglet Devis → Créer un reçu).</td></tr>
                  ) : (
                    receipts.map((r) => {
                      const devisId = receiptToDevisId[r.id];
                      const devisRef = devisId ? facturesDevis.find((f) => f.type === "devis" && f.id === devisId) : null;
                      return (
                        <tr key={r.id}>
                          <td className="font-medium">{r.prestataireName}</td>
                          <td>{r.amount.toLocaleString()}</td>
                          <td>{r.currency}</td>
                          <td>{r.receivedAt ? new Date(r.receivedAt).toLocaleDateString("fr-FR") : "—"}</td>
                          <td className="text-slate-500">{r.operationReference ?? "—"}</td>
                          <td className="text-slate-500">{devisRef ? `${devisRef.prestataire ?? devisRef.clientName} — ${new Date(devisRef.date).toLocaleDateString("fr-FR")}` : "—"}</td>
                          <td>
                            <Button variant="outline" className="mr-1 text-xs" onClick={() => printReceipt(r, devisRef ?? undefined)}>PDF</Button>
                            <button type="button" onClick={() => { receiptsApi.delete(r.id).then(() => { setReceipts((prev) => prev.filter((x) => x.id !== r.id)); removeReceiptDevisLink(r.id); }); }} className="text-slate-400 hover:text-red-600">Suppr.</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === "paiements" && (
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="mb-0">Paiements (encaissements)</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => exportPaiementsCsv(paiementsFiltered)} disabled={paiementsFiltered.length === 0}>
                Exporter CSV
              </Button>
              <Button onClick={() => setShowFormPaiement(!showFormPaiement)}>
                {showFormPaiement ? "Annuler" : "+ Nouveau paiement"}
              </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <span className="text-sm font-medium text-slate-600">Filtres :</span>
            <input
              type="date"
              value={filterPaiementDateFrom}
              onChange={(e) => setFilterPaiementDateFrom(e.target.value)}
              className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={filterPaiementDateTo}
              onChange={(e) => setFilterPaiementDateTo(e.target.value)}
              className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <select
              value={filterPaiementMethod}
              onChange={(e) => setFilterPaiementMethod(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Toutes méthodes</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            {(filterPaiementDateFrom || filterPaiementDateTo || filterPaiementMethod) && (
              <button
                type="button"
                onClick={() => {
                  setFilterPaiementDateFrom("");
                  setFilterPaiementDateTo("");
                  setFilterPaiementMethod("");
                }}
                className="text-sm text-accent-600 hover:underline"
              >
                Réinitialiser
              </button>
            )}
          </div>
          {showFormPaiement && (
            <FormPaiement
              onAdd={addPaiement}
              onClose={() => setShowFormPaiement(false)}
              factureIds={facturesDevis.filter((f) => f.status !== "paye").map((f) => f.id)}
            />
          )}
          <div className="table-container mt-6 rounded-xl border-0 shadow-none">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Méthode</th>
                  <th>Référence</th>
                  <th className="text-right">Montant</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {paiementsFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      {paiements.length === 0 ? "Aucun paiement enregistré." : "Aucun résultat pour ces filtres."}
                    </td>
                  </tr>
                ) : (
                  paiementsFiltered
                    .slice()
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((p) => (
                      <tr key={p.id}>
                        <td>{new Date(p.date).toLocaleDateString("fr-FR")}</td>
                        <td>{PAYMENT_METHODS.find((m) => m.value === p.method)?.label ?? p.method}</td>
                        <td className="text-slate-500">{p.reference ?? "—"}</td>
                        <td className="text-right font-medium text-green-700">
                          +{p.amount.toLocaleString()} {p.currency}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => deletePaiement(p.id)}
                            className="text-slate-400 hover:text-red-600"
                          >
                            Suppr.
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "tresorerie" && (
        <>
          {treasurySummary?.multipleCurrencies && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
              <strong>Plusieurs devises.</strong> Les totaux globaux sont indicatifs. Consultez le détail par devise ci-dessous.
            </div>
          )}
          {!treasurySummary && (
            <p className="text-sm text-slate-500">
              Solde = encaissements − décaissements. Si vous utilisez plusieurs devises, les totaux sont indicatifs (addition des montants bruts).
            </p>
          )}
          <div className="grid gap-6 sm:grid-cols-3">
            <Card className="border-l-4 border-l-red-400">
              <p className="text-sm font-medium text-slate-500">Total décaissements (charges)</p>
              <p className="mt-2 text-2xl font-bold text-red-600">
                {totalCharges.toLocaleString()}
              </p>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <p className="text-sm font-medium text-slate-500">Total encaissements (paiements)</p>
              <p className="mt-2 text-2xl font-bold text-green-700">
                {totalPaiements.toLocaleString()}
              </p>
            </Card>
            <Card className={`border-l-4 ${solde >= 0 ? "border-l-accent-500" : "border-l-amber-500"}`}>
              <p className="text-sm font-medium text-slate-500">Solde trésorerie</p>
              <p className={`mt-2 text-2xl font-bold ${solde >= 0 ? "text-accent-700" : "text-amber-700"}`}>
                {solde.toLocaleString()}
              </p>
            </Card>
          </div>
          {treasurySummary?.byCurrency && treasurySummary.byCurrency.length > 0 && (
            <Card>
              <CardTitle>Détail par devise</CardTitle>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="pb-2 font-medium">Devise</th>
                      <th className="pb-2 text-right font-medium">Encaissements</th>
                      <th className="pb-2 text-right font-medium">Décaissements</th>
                      <th className="pb-2 text-right font-medium">Solde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {treasurySummary.byCurrency.map((row) => (
                      <tr key={row.currency} className="border-b border-slate-100">
                        <td className="py-2 font-medium">{row.currency}</td>
                        <td className="py-2 text-right text-green-700">{row.encaissements.toLocaleString()}</td>
                        <td className="py-2 text-right text-red-600">{row.decaissements.toLocaleString()}</td>
                        <td className={`py-2 text-right font-medium ${row.solde >= 0 ? "text-accent-700" : "text-amber-700"}`}>
                          {row.solde.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {activeTab === "rapports" && (
        <div className="space-y-8">
          {comptaReport && (
            <Card>
              <CardTitle>Synthèse et notes</CardTitle>
              {comptaReport.summary && (
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <span className="text-slate-600">Synthèse : factures par statut, total facturé, total paiements</span>
                </div>
              )}
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-700">Notes / commentaires</p>
                <textarea
                  placeholder="Nouvelle note…"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                  rows={2}
                />
                <Button className="mt-2" onClick={() => {
                  if (!newNoteContent.trim()) return;
                  reportingComptaApi.addNote({ content: newNoteContent.trim() }).then(() => {
                    setNewNoteContent("");
                    reportingComptaApi.get().then(setComptaReport);
                  });
                }} disabled={!newNoteContent.trim()}>
                  Ajouter note
                </Button>
                <ul className="mt-4 space-y-2">
                  {comptaReport.notes?.map((n) => (
                    <li key={n.id} className="rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-2 text-sm text-slate-700">
                      {n.content}
                      <span className="ml-2 text-xs text-slate-400">{n.createdAt ? new Date(n.createdAt).toLocaleDateString("fr-FR") : ""}</span>
                    </li>
                  ))}
                  {(!comptaReport.notes || comptaReport.notes.length === 0) && <li className="text-slate-500 text-sm">Aucune note.</li>}
                </ul>
              </div>
            </Card>
          )}
          <Card>
            <CardTitle>Période du rapport</CardTitle>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Du</label>
                <input
                  type="date"
                  value={rapportDateFrom}
                  onChange={(e) => setRapportDateFrom(e.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Au</label>
                <input
                  type="date"
                  value={rapportDateTo}
                  onChange={(e) => setRapportDateTo(e.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    exportRapportTresorerieCsv({
                      dateDebut: rapportDateFrom,
                      dateFin: rapportDateTo,
                      totalCharges: rapportTotalCharges,
                      totalPaiements: rapportTotalPaiements,
                      solde: rapportTotalPaiements - rapportTotalCharges,
                      nbCharges: rapportCharges.length,
                      nbPaiements: rapportPaiements.length,
                    })
                  }
                >
                  Exporter CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const w = window.open("", "_blank", "width=800,height=700");
                    if (!w) return;
                    w.document.write(`
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Rapport comptabilité - ERP Auto</title>
<style>body{font-family:system-ui,sans-serif;padding:24px;color:#1e293b;} h1{font-size:1.25rem;} table{width:100%;border-collapse:collapse;margin-top:16px;} th,td{border:1px solid #e2e8f0;padding:8px 12px;} th{background:#f1f5f9;}</style></head>
<body>
<h1>Rapport comptabilité</h1>
<p>Période : ${rapportDateFrom} → ${rapportDateTo}</p>
<table>
<tr><th>Décaissements</th><td>${rapportTotalCharges.toLocaleString()}</td></tr>
<tr><th>Encaissements</th><td>${rapportTotalPaiements.toLocaleString()}</td></tr>
<tr><th>Solde</th><td>${(rapportTotalPaiements - rapportTotalCharges).toLocaleString()}</td></tr>
<tr><th>Nb charges</th><td>${rapportCharges.length}</td></tr>
<tr><th>Nb paiements</th><td>${rapportPaiements.length}</td></tr>
</table>
<p style="margin-top:24px;font-size:12px;color:#64748b;">ERP Automobile & Logistique</p>
</body></html>`);
                    w.document.close();
                    w.focus();
                    setTimeout(() => { w.print(); w.onafterprint = () => w.close(); }, 300);
                  }}
                >
                  Générer PDF
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardTitle>Charges par catégorie (période)</CardTitle>
              <div className="mt-5 h-72">
                {rapportChargesByCategory.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-500">
                    Aucune charge sur la période
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rapportChargesByCategory} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => v.toLocaleString()} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => v.toLocaleString()} contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                      <Bar dataKey="montant" name="Montant" radius={[0, 4, 4, 0]}>
                        {rapportChargesByCategory.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card>
              <CardTitle>Factures & devis par statut (période)</CardTitle>
              <div className="mt-5 h-72">
                {rapportFacturesByStatus.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-500">
                    Aucune facture ni devis sur la période
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={rapportFacturesByStatus}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, count }) => `${name}: ${count}`}
                      >
                        {rapportFacturesByStatus.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          <Card>
            <CardTitle>Encaissements vs décaissements par mois</CardTitle>
            <div className="mt-5 h-72">
              {rapportMonthly.length === 0 ? (
                <div className="flex h-full items-center justify-center text-slate-500">
                  Aucune donnée sur la période
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rapportMonthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v.toLocaleString()} />
                    <Tooltip formatter={(v: number) => v.toLocaleString()} contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                    <Legend />
                    <Bar dataKey="paiements" fill="#0d9488" name="Encaissements" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="charges" fill="#ef4444" name="Décaissements" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <div className="grid gap-6 sm:grid-cols-3">
            <Card className="border-l-4 border-l-red-400">
              <p className="text-sm font-medium text-slate-500">Décaissements (période)</p>
              <p className="mt-2 text-2xl font-bold text-red-600">{rapportTotalCharges.toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-500">{rapportCharges.length} écriture(s)</p>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <p className="text-sm font-medium text-slate-500">Encaissements (période)</p>
              <p className="mt-2 text-2xl font-bold text-green-700">{rapportTotalPaiements.toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-500">{rapportPaiements.length} écriture(s)</p>
            </Card>
            <Card className={`border-l-4 ${rapportTotalPaiements - rapportTotalCharges >= 0 ? "border-l-accent-500" : "border-l-amber-500"}`}>
              <p className="text-sm font-medium text-slate-500">Solde période</p>
              <p className={`mt-2 text-2xl font-bold ${rapportTotalPaiements - rapportTotalCharges >= 0 ? "text-accent-700" : "text-amber-700"}`}>
                {(rapportTotalPaiements - rapportTotalCharges).toLocaleString()}
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function FormCharge({
  source,
  vehiclesList,
  onAdd,
  onClose,
}: {
  source: "api" | "local";
  vehiclesList: Vehicle[];
  onAdd: (c: Omit<import("@/lib/compta-internal/types").ChargeInterne, "id" | "createdAt"> & { vehicleId?: string }) => void | Promise<void>;
  onClose: () => void;
}) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState(CHARGE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("FCFA");
  const [vehicleVin, setVehicleVin] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(/\s/g, "").replace(",", "."));
    if (!label || isNaN(num) || num <= 0) return;
    if (source === "api" && !vehicleId) return;
    await Promise.resolve(
      onAdd({
        label,
        category,
        amount: num,
        currency,
        date,
        vehicleVin: source === "local" ? (vehicleVin.trim() || undefined) : undefined,
        vehicleId: source === "api" ? vehicleId : undefined,
      })
    );
    setLabel("");
    setAmount("");
    setVehicleVin("");
    setVehicleId("");
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <Input label="Libellé" value={label} onChange={(e) => setLabel(e.target.value)} required />
      {source === "api" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Véhicule (obligatoire)</label>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
          >
            <option value="">— Choisir —</option>
            {vehiclesList.map((v) => (
              <option key={v.id} value={v.id}>{v.vin ?? v.chassisNumber ?? v.id}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Catégorie</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
        >
          {CHARGE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <Input
        label="Montant"
        type="text"
        placeholder="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Devise</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      {source === "local" && <Input label="VIN véhicule (optionnel)" value={vehicleVin} onChange={(e) => setVehicleVin(e.target.value)} placeholder="JTEBU5JR..." />}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit">Enregistrer la charge</Button>
        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
      </div>
    </form>
  );
}

function ModalSituationDevis({
  devis,
  receipts,
  devisTotaux,
  onClose,
  onPrintReceipt,
}: {
  devis: FactureDevisInterne;
  receipts: Receipt[];
  devisTotaux?: { totalRecu: number; montantRestant: number };
  onClose: () => void;
  onPrintReceipt: (r: Receipt) => void;
}) {
  const totalRecu = devisTotaux?.totalRecu ?? receipts.reduce((s, r) => s + r.amount, 0);
  const montantRestant = devisTotaux?.montantRestant ?? Math.max(0, devis.amount - totalRecu);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-lg font-semibold text-slate-800">Situation du devis</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
        <p className="mt-3 text-sm text-slate-600"><strong>Prestataire :</strong> {devis.prestataire ?? devis.clientName} &nbsp; <strong>Véhicule :</strong> {devis.vehicleVin ?? "—"} &nbsp; <strong>Service :</strong> {devis.service ?? "—"}</p>
        <p className="mt-1 text-sm text-slate-600"><strong>Montant devis :</strong> {devis.amount.toLocaleString("fr-FR")} {devis.currency} &nbsp; <strong>Total reçus :</strong> {totalRecu.toLocaleString("fr-FR")} &nbsp; <strong>Restant à solder :</strong> {montantRestant.toLocaleString("fr-FR")} {devis.currency}</p>
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-700">Reçus enregistrés pour ce devis</p>
          {receipts.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Aucun reçu pour l&apos;instant.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {receipts.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 text-sm">
                  <span>{r.receivedAt ? new Date(r.receivedAt).toLocaleDateString("fr-FR") : "—"} — {r.amount.toLocaleString("fr-FR")} {r.currency} {r.operationReference ? `(${r.operationReference})` : ""}</span>
                  <Button variant="outline" className="text-xs" onClick={() => onPrintReceipt(r)}>PDF</Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </div>
  );
}

function FormFactureDevis({
  initialType = "devis",
  vehiclesList = [],
  onAdd,
  onClose,
}: {
  initialType?: TypeFactureDevis;
  vehiclesList?: Vehicle[];
  onAdd: (f: Omit<import("@/lib/compta-internal/types").FactureDevisInterne, "id" | "createdAt">) => void | Promise<void>;
  onClose: () => void;
}) {
  const [type, setType] = useState<TypeFactureDevis>(initialType);
  const [factureNature, setFactureNature] = useState<"temporaire" | "complet">("complet");
  const [clientName, setClientName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("FCFA");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<StatutFactureDevis>("brouillon");
  const [vehicleId, setVehicleId] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false);
  const [prestataire, setPrestataire] = useState("");
  const [service, setService] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(/\s/g, "").replace(",", "."));
    if (type === "devis") {
      if (!prestataire.trim() || !vehicleId || isNaN(num) || num <= 0) return;
      const vehicle = vehiclesList.find((v) => v.id === vehicleId);
      await Promise.resolve(onAdd({
        type: "devis",
        clientName: prestataire.trim(),
        amount: num,
        currency,
        date,
        status,
        vehicleId,
        vehicleVin: vehicle?.vin,
        prestataire: prestataire.trim(),
        service: service.trim() || undefined,
      }));
    } else {
      if (!clientName || isNaN(num) || num <= 0) return;
      await Promise.resolve(onAdd({
        type: "facture",
        factureNature,
        clientName,
        amount: num,
        currency,
        date,
        status,
      }));
    }
    setClientName("");
    setPrestataire("");
    setService("");
    setAmount("");
    setVehicleId("");
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TypeFactureDevis)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800"
        >
          <option value="devis">Devis</option>
          <option value="facture">Facture</option>
        </select>
      </div>
      {type === "facture" && (
        <>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nature</label>
            <select
              value={factureNature}
              onChange={(e) => setFactureNature(e.target.value as "temporaire" | "complet")}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800"
            >
              <option value="temporaire">Temporaire (avance client)</option>
              <option value="complet">Complète (à solder)</option>
            </select>
          </div>
          <Input label="Client" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
        </>
      )}
      {type === "devis" && (
        <>
          <div className="relative">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Véhicule * (non régularisés et véhicules en maintenance — rechercher par VIN)</label>
            {vehicleId ? (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                <span className="font-mono text-slate-800">
                  {vehiclesList.find((v) => v.id === vehicleId)?.vin ?? ""} — {vehiclesList.find((v) => v.id === vehicleId)?.brand} {vehiclesList.find((v) => v.id === vehicleId)?.model}
                </span>
                <button
                  type="button"
                  onClick={() => { setVehicleId(""); setVehicleSearch(""); setVehicleDropdownOpen(true); }}
                  className="text-slate-500 hover:text-accent-600"
                  title="Changer"
                >
                  ×
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={vehicleSearch}
                  onChange={(e) => { setVehicleSearch(e.target.value); setVehicleDropdownOpen(true); }}
                  onFocus={() => setVehicleDropdownOpen(true)}
                  placeholder="Rechercher par VIN, marque, modèle…"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                />
                {vehicleDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[100]" aria-hidden onClick={() => setVehicleDropdownOpen(false)} />
                    <div className="absolute z-[101] mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg" role="listbox">
                      {vehiclesList
                        .filter((v) => {
                          const q = vehicleSearch.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            (v.vin ?? "").toLowerCase().includes(q) ||
                            (v.brand ?? "").toLowerCase().includes(q) ||
                            (v.model ?? "").toLowerCase().includes(q)
                          );
                        })
                        .slice(0, 50)
                        .map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            role="option"
                            onClick={() => {
                              setVehicleId(v.id);
                              setVehicleSearch("");
                              setVehicleDropdownOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-accent-50 focus:bg-accent-50 focus:outline-none"
                          >
                            <span className="font-mono text-slate-800">{v.vin}</span>
                            <span className="ml-2 text-slate-600">— {v.brand} {v.model}</span>
                          </button>
                        ))}
                      {vehiclesList.filter((v) => {
                        const q = vehicleSearch.trim().toLowerCase();
                        if (!q) return true;
                        return (v.vin ?? "").toLowerCase().includes(q) || (v.brand ?? "").toLowerCase().includes(q) || (v.model ?? "").toLowerCase().includes(q);
                      }).length === 0 && (
                        <p className="px-4 py-3 text-sm text-slate-500">Aucun véhicule trouvé (non régularisés et en maintenance).</p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <Input label="Prestataire *" value={prestataire} onChange={(e) => setPrestataire(e.target.value)} placeholder="Nom du prestataire" required />
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Précision du service</label>
            <textarea value={service} onChange={(e) => setService(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" rows={2} placeholder="Description de la prestation" />
          </div>
        </>
      )}
      <Input label="Montant" type="text" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Devise</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Statut</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatutFactureDevis)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800"
        >
          <option value="brouillon">Brouillon</option>
          <option value="envoye">Envoyé</option>
          <option value="paye">Payé</option>
        </select>
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit">Enregistrer</Button>
        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
      </div>
    </form>
  );
}

function FormPaiement({
  onAdd,
  onClose,
  factureIds,
}: {
  onAdd: (p: Omit<import("@/lib/compta-internal/types").PaiementInterne, "id" | "createdAt">) => void | Promise<void>;
  onClose: () => void;
  factureIds: string[];
}) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("FCFA");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("virement");
  const [reference, setReference] = useState("");
  const [factureId, setFactureId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(/\s/g, "").replace(",", "."));
    if (isNaN(num) || num <= 0) return;
    await Promise.resolve(
      onAdd({
        amount: num,
        currency,
        date,
        method: method as import("@/lib/compta-internal/types").MethodePaiement,
        reference: reference.trim() || undefined,
        factureId: factureId || undefined,
      })
    );
    setAmount("");
    setReference("");
    setFactureId("");
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <Input label="Montant" type="text" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Devise</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Méthode</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800"
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>
      <Input label="Référence" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="N° virement, etc." />
      {factureIds.length > 0 && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Facture liée (optionnel)</label>
          <select
            value={factureId}
            onChange={(e) => setFactureId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800"
          >
            <option value="">—</option>
            {factureIds.map((id) => (
              <option key={id} value={id}>{id.slice(0, 12)}…</option>
            ))}
          </select>
        </div>
      )}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit">Enregistrer le paiement</Button>
        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
      </div>
    </form>
  );
}

function FormRecu({
  initialDevis,
  montantRestantDevis,
  onAdd,
  onClose,
}: {
  initialDevis?: FactureDevisInterne;
  montantRestantDevis?: number;
  onAdd: (body: { prestataireName: string; amount: number; currency?: string; receivedAt?: string; operationReference?: string; notes?: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [prestataireName, setPrestataireName] = useState(initialDevis?.prestataire ?? initialDevis?.clientName ?? "");
  const [amount, setAmount] = useState(initialDevis ? String(initialDevis.amount) : "");
  const [currency, setCurrency] = useState(initialDevis?.currency ?? "FCFA");
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().slice(0, 10));
  const [operationReference, setOperationReference] = useState("");
  const [notes, setNotes] = useState("");
  const numAmount = amount.trim() ? parseFloat(amount.replace(/\s/g, "").replace(",", ".")) : NaN;
  const newRestant = !isNaN(numAmount) && montantRestantDevis != null ? Math.max(0, montantRestantDevis - numAmount) : montantRestantDevis;
  const isSolde = newRestant != null && newRestant <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prestataireName.trim() || isNaN(numAmount) || numAmount <= 0) return;
    await onAdd({
      prestataireName: prestataireName.trim(),
      amount: numAmount,
      currency,
      receivedAt,
      operationReference: operationReference.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setPrestataireName("");
    setAmount("");
    setOperationReference("");
    setNotes("");
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
      {initialDevis && (
        <p className="sm:col-span-2 text-sm text-slate-600">
          Reçu lié au devis : <strong>{initialDevis.prestataire ?? initialDevis.clientName}</strong> — {initialDevis.amount.toLocaleString("fr-FR")} {initialDevis.currency} — {initialDevis.service ?? "—"}
        </p>
      )}
      <Input label="Prestataire" value={prestataireName} onChange={(e) => setPrestataireName(e.target.value)} required />
      <Input label="Montant" type="text" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Devise</label>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800">
          {CURRENCIES.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
      </div>
      <Input label="Date reçu" type="date" value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} />
      <Input label="Réf. opération" value={operationReference} onChange={(e) => setOperationReference(e.target.value)} placeholder="Référence opération" className="sm:col-span-2" />
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" rows={2} />
      </div>
      {initialDevis && montantRestantDevis != null && (
        <>
          <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">
            <span className="text-slate-600">Après ce reçu : </span>
            <strong>{isSolde ? "Devis soldé" : `Montant restant à solder : ${newRestant.toLocaleString("fr-FR")} ${currency}`}</strong>
          </div>
        </>
      )}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit">Enregistrer le reçu</Button>
        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
      </div>
    </form>
  );
}
