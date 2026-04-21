"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type PnlResponse = {
  period: { from: string; to: string };
  revenue: { total: number; invoices: number; workshop: number };
  cogs: { total: number; count: number };
  charges: { total: number; byCategory: Record<string, number> };
  grossMargin: number;
  netResult: number;
  currency: string;
};

type AgingResponse = {
  buckets: {
    upcoming: number;
    b0_30: number;
    b31_60: number;
    b61_90: number;
    b90plus: number;
  };
  total: number;
  clients: {
    clientId: number;
    clientName: string;
    total: number;
    upcoming: number;
    b0_30: number;
    b31_60: number;
    b61_90: number;
    b90plus: number;
  }[];
  currency: string;
};

type StockValueResponse = {
  total: number;
  totalCost: number;
  totalSale: number;
  unrealizedMargin: number;
  byStatus: Record<string, { count: number; cost: number; sale: number }>;
  currency: string;
};

function fmt(n: number | null | undefined, currency = "FCFA") {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.round(n).toLocaleString("fr-FR")} ${currency}`;
}

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function RapportsPage() {
  const [range, setRange] = useState(defaultRange);
  const [pnl, setPnl] = useState<PnlResponse | null>(null);
  const [aging, setAging] = useState<AgingResponse | null>(null);
  const [stock, setStock] = useState<StockValueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, a, s] = await Promise.all([
        apiGet<PnlResponse>(`/reports/pnl?from=${range.from}&to=${range.to}`),
        apiGet<AgingResponse>(`/reports/aging`),
        apiGet<StockValueResponse>(`/reports/stock-value`),
      ]);
      setPnl(p ?? null);
      setAging(a ?? null);
      setStock(s ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Rapports
          </h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">
            Compte de résultat, balance âgée clients et valeur du stock.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-600 dark:text-neutral-400">Du</label>
          <input
            type="date"
            value={range.from}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <label className="text-sm text-neutral-600 dark:text-neutral-400">Au</label>
          <input
            type="date"
            value={range.to}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <Button variant="secondary" size="sm" onClick={load} loading={loading}>
            Actualiser
          </Button>
        </div>
      </div>

      {error && (
        <Card variant="outline" className="border-danger-200 bg-danger-50/60">
          <p className="text-sm text-danger-700">{error}</p>
        </Card>
      )}

      {/* P&L */}
      <Card title="Compte de résultat" description={pnl ? `${pnl.period.from} → ${pnl.period.to}` : undefined}>
        {pnl ? (
          <div className="grid gap-4 md:grid-cols-4">
            <Metric label="Recettes" value={fmt(pnl.revenue.total)} tone="accent" />
            <Metric label="Coût d'achat (COGS)" value={fmt(pnl.cogs.total)} tone="neutral" sub={`${pnl.cogs.count} achats`} />
            <Metric label="Charges" value={fmt(pnl.charges.total)} tone="neutral" />
            <Metric
              label="Résultat net"
              value={fmt(pnl.netResult)}
              tone={pnl.netResult >= 0 ? "accent" : "danger"}
            />
            <div className="md:col-span-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Détail recettes
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Row label="Factures véhicules" value={fmt(pnl.revenue.invoices)} />
                <Row label="Atelier / devis" value={fmt(pnl.revenue.workshop)} />
              </div>
            </div>
            {Object.keys(pnl.charges.byCategory).length > 0 && (
              <div className="md:col-span-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Charges par catégorie
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(pnl.charges.byCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, amt]) => (
                      <Row key={cat} label={cat} value={fmt(amt)} />
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : loading ? (
          <p className="py-6 text-center text-sm text-neutral-500">Chargement…</p>
        ) : null}
      </Card>

      {/* Aging */}
      <Card
        title="Balance âgée clients"
        description={aging ? `Total non soldé : ${fmt(aging.total)}` : undefined}
      >
        {aging ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-5">
              <BucketCell label="À venir" value={aging.buckets.upcoming} tone="info" />
              <BucketCell label="0–30 j" value={aging.buckets.b0_30} tone="neutral" />
              <BucketCell label="31–60 j" value={aging.buckets.b31_60} tone="warning" />
              <BucketCell label="61–90 j" value={aging.buckets.b61_90} tone="warning" />
              <BucketCell label="> 90 j" value={aging.buckets.b90plus} tone="danger" />
            </div>

            {aging.clients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-700">
                      <th className="py-2 pr-4 font-medium">Client</th>
                      <th className="py-2 pr-4 text-right font-medium">Total</th>
                      <th className="py-2 pr-4 text-right font-medium">À venir</th>
                      <th className="py-2 pr-4 text-right font-medium">0-30</th>
                      <th className="py-2 pr-4 text-right font-medium">31-60</th>
                      <th className="py-2 pr-4 text-right font-medium">61-90</th>
                      <th className="py-2 pr-4 text-right font-medium">&gt; 90</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aging.clients.slice(0, 20).map((c) => (
                      <tr
                        key={c.clientId}
                        className="border-b border-neutral-100 dark:border-neutral-800"
                      >
                        <td className="py-2 pr-4 font-medium">{c.clientName}</td>
                        <td className="py-2 pr-4 text-right tabular-nums font-semibold">
                          {fmt(c.total)}
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums text-neutral-500">
                          {c.upcoming ? fmt(c.upcoming) : "—"}
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">
                          {c.b0_30 ? fmt(c.b0_30) : "—"}
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums text-warning-700">
                          {c.b31_60 ? fmt(c.b31_60) : "—"}
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums text-warning-800">
                          {c.b61_90 ? fmt(c.b61_90) : "—"}
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums font-semibold text-danger-700">
                          {c.b90plus ? fmt(c.b90plus) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">Aucune facture non soldée.</p>
            )}
          </div>
        ) : loading ? (
          <p className="py-6 text-center text-sm text-neutral-500">Chargement…</p>
        ) : null}
      </Card>

      {/* Stock value */}
      <Card
        title="Valeur du stock"
        description={stock ? `${stock.total} véhicules en stock` : undefined}
      >
        {stock ? (
          <div className="grid gap-4 md:grid-cols-4">
            <Metric label="Coût d'achat total" value={fmt(stock.totalCost)} />
            <Metric label="Valeur de vente potentielle" value={fmt(stock.totalSale)} tone="info" />
            <Metric
              label="Marge latente"
              value={fmt(stock.unrealizedMargin)}
              tone={stock.unrealizedMargin >= 0 ? "accent" : "danger"}
            />
            <Metric label="Nombre de véhicules" value={String(stock.total)} />
            {Object.keys(stock.byStatus).length > 0 && (
              <div className="md:col-span-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Par statut
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(stock.byStatus).map(([status, v]) => (
                    <div
                      key={status}
                      className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <div>
                        <Badge variant="brand" dot>
                          {status}
                        </Badge>
                        <p className="mt-1 text-xs text-neutral-500">{v.count} véhicule(s)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">{fmt(v.cost)}</p>
                        <p className="text-[11px] text-neutral-500">coût</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : loading ? (
          <p className="py-6 text-center text-sm text-neutral-500">Chargement…</p>
        ) : null}
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "accent" | "danger" | "info";
}) {
  const toneClass = {
    neutral: "text-neutral-900 dark:text-neutral-100",
    accent: "text-accent-700 dark:text-accent-400",
    danger: "text-danger-700 dark:text-danger-400",
    info: "text-brand-700 dark:text-brand-400",
  }[tone];
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </p>
      <p className={`mt-2 text-xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-neutral-400">{sub}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2 text-sm dark:border-neutral-800">
      <span className="text-neutral-600 dark:text-neutral-400">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function BucketCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "info" | "neutral" | "warning" | "danger";
}) {
  const toneClass = {
    info: "border-sky-200 bg-sky-50/60",
    neutral: "border-neutral-200 bg-neutral-50",
    warning: "border-warning-200 bg-warning-50/60",
    danger: "border-danger-200 bg-danger-50/60",
  }[tone];
  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold tabular-nums">{fmt(value)}</p>
    </div>
  );
}
