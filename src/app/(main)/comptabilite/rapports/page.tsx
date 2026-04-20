"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface ReportItem {
  id: string | number;
  name?: string;
  created_at?: string;
  type?: string;
}

export default function RapportsPage() {
  const [list, setList] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);

  const fetchList = useCallback(async () => {
    try {
      setError(null);
      setApiAvailable(null);
      const res = await apiGet<{ reports?: ReportItem[]; data?: ReportItem[] }>("/reports");
      const raw = (res as { reports?: ReportItem[] })?.reports ?? (res as { data?: ReportItem[] })?.data ?? [];
      setList(Array.isArray(raw) ? raw : []);
      setApiAvailable(true);
    } catch (err) {
      setList([]);
      setApiAvailable(false);
      setError(err instanceof Error ? err.message : "Impossible de charger les rapports. Le service peut ne pas être encore disponible.");
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Rapports</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Rapports hebdomadaires et personnalisés. Les rapports sont générés côté serveur lorsqu&apos;ils sont disponibles.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => fetchList()} disabled={loading}>
          Rafraîchir
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          {error}
          <p className="mt-2 text-xs opacity-90">
            En attendant, vous pouvez consulter la <Link href="/comptabilite/tresorerie" className="underline">trésorerie</Link>, les <Link href="/comptabilite/factures" className="underline">factures</Link> et les <Link href="/comptabilite/charges" className="underline">charges</Link> pour une vue d&apos;ensemble.
          </p>
        </div>
      )}

      <Card title="Rapports générés">
        {loading ? (
          <p className="py-8 text-center text-slate-500 dark:text-slate-400">Chargement…</p>
        ) : list.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              {apiAvailable === false
                ? "Le service des rapports n&apos;est pas disponible pour le moment."
                : "Aucun rapport généré pour l&apos;instant. Les rapports hebdomadaires sont créés automatiquement par le serveur lorsqu&apos;ils sont configurés."}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link href="/comptabilite/tresorerie">
                <Button variant="secondary" size="sm">Vue trésorerie</Button>
              </Link>
              <Link href="/comptabilite/factures">
                <Button variant="secondary" size="sm">Factures</Button>
              </Link>
              <Link href="/comptabilite/charges">
                <Button variant="secondary" size="sm">Charges</Button>
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {list.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-600">
                <span className="text-slate-800 dark:text-slate-200">{r.name ?? r.type ?? `Rapport #${r.id}`}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR") : ""}</span>
                <Button size="sm" variant="ghost">PDF</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
