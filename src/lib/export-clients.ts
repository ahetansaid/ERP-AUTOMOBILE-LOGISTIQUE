"use client";

import type { Client } from "@/types";

function csvEscape(value: string | number | undefined): string {
  const s = String(value ?? "");
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

/** Export liste clients en CSV (ouvert dans Excel) */
export function exportClientsCsv(clients: Client[]) {
  const headers = ["Nom", "Email", "Téléphone", "Adresse", "ID"];
  const rows = clients.map((c) => [
    c.name,
    c.email ?? "",
    c.phone ?? "",
    c.address ?? "",
    c.id,
  ]);
  const csv = [headers.map(csvEscape).join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, "clients_" + new Date().toISOString().slice(0, 10) + ".csv");
}

/** Ouvre une fenêtre d'impression pour la liste clients (PDF via "Enregistrer en PDF") */
export function printClientsAsPdf(clients: Client[]) {
  const w = window.open("", "_blank", "width=800,height=600");
  if (!w) {
    alert("Autorisez les pop-ups pour générer le PDF.");
    return;
  }
  w.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Liste des clients - ERP Auto</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #1e293b; }
    h1 { font-size: 1.25rem; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; }
    tr:nth-child(even) { background: #f8fafc; }
  </style>
</head>
<body>
  <h1>Liste des clients – ${new Date().toLocaleDateString("fr-FR")}</h1>
  <table>
    <thead><tr><th>Nom</th><th>Email</th><th>Téléphone</th><th>Adresse</th></tr></thead>
    <tbody>
      ${clients
        .map(
          (c) =>
            `<tr><td>${escapeHtml(c.name)}</td><td>${escapeHtml(c.email ?? "")}</td><td>${escapeHtml(c.phone ?? "")}</td><td>${escapeHtml(c.address ?? "")}</td></tr>`
        )
        .join("")}
    </tbody>
  </table>
</body>
</html>`);
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
    w.onafterprint = () => w.close();
  }, 300);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
