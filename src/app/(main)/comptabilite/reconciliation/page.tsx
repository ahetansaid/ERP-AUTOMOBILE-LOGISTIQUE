"use client";

/**
 * Réconciliation — ancien registre contre grand livre.
 *
 * Écran de la période de double écriture. Il répond à une seule question :
 * peut-on couper l'ancienne table de trésorerie sans rien perdre ?
 *
 * Tant que le verdict n'est pas concordant plusieurs jours d'affilée, la
 * bascule reste interdite.
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Divergence {
  source: string;
  type: "absent_ancien" | "absent_livre" | "montant";
  legacy: number | null;
  ledger: number | null;
  ecart?: number;
}

interface DailyRow {
  date: string;
  legacy: number;
  ledger: number;
  ecart: number;
}

interface Report {
  ancien: { total: number; lignes: number };
  livre: { total: number; lignes: number };
  saisiesManuelles: { total: number; lignes: number };
  ecart: number;
  concordant: boolean;
  divergences: Divergence[];
  divergencesTotal: number;
  quotidien: DailyRow[];
}

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : `${Math.round(n).toLocaleString("fr-FR")} FCFA`;

const DIVERGENCE_LABEL: Record<Divergence["type"], string> = {
  absent_ancien: "Absent de l'ancien registre",
  absent_livre: "Absent du grand livre",
  montant: "Montants différents",
};

export default function ReconciliationPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      const data = await apiGet<Report>(
        `/ledger/reconciliation${qs.toString() ? `?${qs}` : ""}`
      );
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Réconciliation</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Période de double écriture : chaque mouvement est enregistré dans
          l&apos;ancienne table et dans le grand livre. Les deux doivent dire la
          même chose avant de couper.
        </p>
      </div>

      <Card title="Période">
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Du"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            label="Au"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <Button onClick={fetchReport} loading={loading}>
            Recalculer
          </Button>
        </div>
      </Card>

      {error && (
        <p className="rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700 dark:bg-danger-500/10 dark:text-danger-300">
          {error}
        </p>
      )}

      {loading && !report ? (
        <p className="py-8 text-neutral-500">Calcul en cours…</p>
      ) : report ? (
        <>
          {/* Verdict */}
          <div
            className={`rounded-2xl border p-5 ${
              report.concordant
                ? "border-accent-300 bg-accent-50/70 dark:border-accent-800 dark:bg-accent-900/20"
                : "border-warning-300 bg-warning-50/70 dark:border-warning-800 dark:bg-warning-900/20"
            }`}
          >
            <p
              className={`text-lg font-bold ${
                report.concordant
                  ? "text-accent-800 dark:text-accent-200"
                  : "text-warning-800 dark:text-warning-200"
              }`}
            >
              {report.concordant
                ? "Les deux registres concordent"
                : "Écart détecté — la coupure reste interdite"}
            </p>
            <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
              {report.concordant
                ? "Aucune divergence sur la période. Répétez la vérification pendant une vingtaine de jours avant de retirer l'ancienne écriture."
                : `Écart de ${fmt(report.ecart)} et ${report.divergencesTotal} document${report.divergencesTotal > 1 ? "s" : ""} divergent${report.divergencesTotal > 1 ? "s" : ""}. Corrigez avant d'envisager la bascule.`}
            </p>
          </div>

          {/* Totaux */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Ancien registre",
                value: report.ancien.total,
                sub: `${report.ancien.lignes} mouvements`,
              },
              {
                label: "Grand livre",
                value: report.livre.total,
                sub: `${report.livre.lignes} écritures de caisse`,
              },
              {
                label: "Saisies manuelles",
                value: report.saisiesManuelles.total,
                sub: `${report.saisiesManuelles.lignes} sans document source`,
              },
              {
                label: "Écart",
                value: report.ecart,
                sub: report.ecart === 0 ? "aucun" : "à expliquer",
                highlight: report.ecart !== 0,
              },
            ].map((c) => (
              <Card key={c.label}>
                <p className="text-sm font-medium text-neutral-500">{c.label}</p>
                <p
                  className={`mt-1 font-mono text-xl font-bold tabular-nums ${
                    c.highlight ? "text-danger-600 dark:text-danger-400" : ""
                  }`}
                >
                  {fmt(c.value)}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">{c.sub}</p>
              </Card>
            ))}
          </div>

          {/* Divergences par document */}
          <Card
            title="Documents divergents"
            action={
              report.divergencesTotal > report.divergences.length ? (
                <span className="font-mono text-xs text-neutral-500">
                  {report.divergences.length} affichés sur {report.divergencesTotal}
                </span>
              ) : undefined
            }
          >
            {report.divergences.length === 0 ? (
              <p className="py-4 text-sm text-neutral-500">
                Chaque document est présent des deux côtés, pour le même montant.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                      <th className="p-3 font-medium">Document</th>
                      <th className="p-3 font-medium">Divergence</th>
                      <th className="p-3 text-right font-medium">Ancien</th>
                      <th className="p-3 text-right font-medium">Grand livre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.divergences.map((d) => (
                      <tr
                        key={d.source}
                        className="border-b border-neutral-100 dark:border-neutral-800"
                      >
                        <td className="p-3 font-mono text-xs">{d.source}</td>
                        <td className="p-3">
                          <Badge variant={d.type === "montant" ? "warning" : "danger"}>
                            {DIVERGENCE_LABEL[d.type]}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-mono tabular-nums">
                          {fmt(d.legacy)}
                        </td>
                        <td className="p-3 text-right font-mono tabular-nums">
                          {fmt(d.ledger)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Comparaison quotidienne */}
          <Card title="Jour par jour">
            {report.quotidien.length === 0 ? (
              <p className="py-4 text-sm text-neutral-500">
                Aucun mouvement sur la période.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                      <th className="p-3 font-medium">Date</th>
                      <th className="p-3 text-right font-medium">Ancien</th>
                      <th className="p-3 text-right font-medium">Grand livre</th>
                      <th className="p-3 text-right font-medium">Écart</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.quotidien.map((d) => (
                      <tr
                        key={d.date}
                        className="border-b border-neutral-100 dark:border-neutral-800"
                      >
                        <td className="p-3 font-mono text-xs">
                          {new Date(d.date).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="p-3 text-right font-mono tabular-nums">
                          {fmt(d.legacy)}
                        </td>
                        <td className="p-3 text-right font-mono tabular-nums">
                          {fmt(d.ledger)}
                        </td>
                        <td
                          className={`p-3 text-right font-mono font-semibold tabular-nums ${
                            d.ecart === 0
                              ? "text-neutral-400"
                              : "text-danger-600 dark:text-danger-400"
                          }`}
                        >
                          {d.ecart === 0 ? "—" : fmt(d.ecart)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}
