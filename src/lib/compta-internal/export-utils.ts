"use client";

import type { ChargeInterne, FactureDevisInterne, PaiementInterne } from "./types";

function csvEscape(value: string | number): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const BOM = "\uFEFF";

export function exportChargesCsv(charges: ChargeInterne[]) {
  const headers = ["Date", "Libellé", "Catégorie", "Montant", "Devise", "VIN véhicule"];
  const rows = charges
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((c) => [c.date, c.label, c.category, c.amount, c.currency, c.vehicleVin ?? ""]);
  const csv = [headers.map(csvEscape).join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, "charges_" + new Date().toISOString().slice(0, 10) + ".csv");
}

export function exportFacturesDevisCsv(factures: FactureDevisInterne[]) {
  const headers = ["Date", "Type", "Client", "Montant", "Devise", "Statut"];
  const rows = factures
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((f) => [f.date, f.type, f.clientName, f.amount, f.currency, f.status]);
  const csv = [headers.map(csvEscape).join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, "factures-devis_" + new Date().toISOString().slice(0, 10) + ".csv");
}

export function exportPaiementsCsv(paiements: PaiementInterne[]) {
  const headers = ["Date", "Méthode", "Référence", "Montant", "Devise", "Facture liée"];
  const rows = paiements
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((p) => [p.date, p.method, p.reference ?? "", p.amount, p.currency, p.factureId ?? ""]);
  const csv = [headers.map(csvEscape).join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, "paiements_" + new Date().toISOString().slice(0, 10) + ".csv");
}

export interface RapportTresorerieData {
  dateDebut: string;
  dateFin: string;
  totalCharges: number;
  totalPaiements: number;
  solde: number;
  nbCharges: number;
  nbPaiements: number;
}

export function exportRapportTresorerieCsv(data: RapportTresorerieData) {
  const rows = [
    ["Rapport trésorerie", ""],
    ["Période", data.dateDebut + " -> " + data.dateFin],
    ["", ""],
    ["Total décaissements (charges)", data.totalCharges],
    ["Total encaissements (paiements)", data.totalPaiements],
    ["Solde", data.solde],
    ["Nombre de charges", data.nbCharges],
    ["Nombre de paiements", data.nbPaiements],
  ];
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, "rapport-tresorerie_" + data.dateDebut + "_" + data.dateFin + ".csv");
}
