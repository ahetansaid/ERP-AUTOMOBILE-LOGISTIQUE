"use client";

/**
 * Frais de conteneur et leur répartition.
 *
 * Deux gestes distincts : on enregistre ce qui a été engagé, puis on décide
 * comment il se ventile. La simulation permet de comparer deux clés avant de
 * trancher — sans produire la moindre écriture.
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Mode = "PAR_VEHICULE" | "PRORATA_VALEUR" | "PRORATA_POIDS" | "MONTANT_FIXE";

interface Frais {
  id: number;
  type: string;
  libelle: string;
  montant: number;
  devise: string;
  taux: number | null;
  montant_fcfa: number;
  repartition: Mode;
  date: string;
  ventile_le: string | null;
}

interface LigneSimulation {
  vehicle_id: number;
  vin: string;
  vehicule: string;
  poids_kg: number | null;
  valeur: number | null;
  part: number;
}

const TYPES: { value: string; label: string }[] = [
  { value: "FRET", label: "Fret maritime" },
  { value: "TRANSPORT_INTERNE", label: "Transport interne" },
  { value: "COMMISSION", label: "Commission" },
  { value: "DEPOTAGE", label: "Dépotage" },
  { value: "MAIN_OEUVRE", label: "Main d'œuvre" },
  { value: "FRAIS_CONNEXE", label: "Frais connexes" },
  { value: "IMV", label: "IMV" },
  { value: "DOUANE", label: "Droits de douane" },
  { value: "AUTRE", label: "Autre" },
];

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: "PAR_VEHICULE", label: "Parts égales", hint: "chaque véhicule supporte la même part" },
  { value: "PRORATA_POIDS", label: "Au prorata du poids", hint: "clé la plus juste pour le fret" },
  { value: "PRORATA_VALEUR", label: "Au prorata de la valeur", hint: "proportionnel au prix d'achat" },
];

const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");

export function ContainerCosts({ purchaseId }: { purchaseId: number }) {
  const [frais, setFrais] = useState<Frais[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState("FRET");
  const [montant, setMontant] = useState("");
  const [devise, setDevise] = useState("FCFA");
  const [mode, setMode] = useState<Mode>("PAR_VEHICULE");
  const [simulation, setSimulation] = useState<LigneSimulation[] | null>(null);

  const fetchFrais = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ frais?: Frais[]; total_fcfa?: number }>(
        `/frais-conteneur?purchaseId=${purchaseId}`
      );
      setFrais(res?.frais ?? []);
      setTotal(res?.total_fcfa ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [purchaseId]);

  useEffect(() => {
    fetchFrais();
  }, [fetchFrais]);

  // La simulation ne produit aucune écriture : elle sert à comparer les clés.
  useEffect(() => {
    const m = Number(montant);
    if (!Number.isFinite(m) || m <= 0 || mode === "MONTANT_FIXE") {
      setSimulation(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await apiGet<{ lignes?: LigneSimulation[] }>(
          `/frais-conteneur/simulation?purchaseId=${purchaseId}&montant=${m}&mode=${mode}`
        );
        if (!cancelled) setSimulation(res?.lignes ?? null);
      } catch {
        if (!cancelled) setSimulation(null);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [montant, mode, purchaseId]);

  const enregistrer = async () => {
    setBusy(true);
    setError(null);
    try {
      await apiPost("/frais-conteneur", {
        purchaseId,
        type,
        montant: Number(montant),
        devise,
        repartition: mode,
      });
      setMontant("");
      setSimulation(null);
      await fetchFrais();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  };

  const action = async (chemin: string) => {
    setBusy(true);
    setError(null);
    try {
      await apiPost(chemin);
      await fetchFrais();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setBusy(false);
    }
  };

  const modeCourant = MODES.find((m) => m.value === mode);

  return (
    <Card
      title="Frais de conteneur"
      action={
        total > 0 ? (
          <span className="font-mono text-xs text-neutral-500">{fmt(total)} FCFA</span>
        ) : undefined
      }
    >
      {loading ? (
        <p className="py-4 text-sm text-neutral-500">Chargement…</p>
      ) : frais.length === 0 ? (
        <p className="rounded-xl border border-dashed border-warning-300 bg-warning-50/60 px-4 py-3 text-sm text-warning-800 dark:border-warning-700 dark:bg-warning-900/20 dark:text-warning-200">
          Aucun frais saisi. Sans fret ni manutention, le coût de revient des
          véhicules de ce dossier est incomplet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                <th className="p-2 font-medium">Frais</th>
                <th className="p-2 font-medium">Répartition</th>
                <th className="p-2 text-right font-medium">Montant</th>
                <th className="p-2 text-right font-medium">FCFA</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {frais.map((f) => (
                <tr key={f.id} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="p-2">
                    <span className="font-medium">{f.libelle}</span>
                    <span className="block font-mono text-xs text-neutral-500">
                      {new Date(f.date).toLocaleDateString("fr-FR")}
                      {f.taux && f.devise !== "FCFA" && ` · taux ${f.taux}`}
                    </span>
                  </td>
                  <td className="p-2">
                    <Badge variant={f.ventile_le ? "success" : "warning"}>
                      {MODES.find((m) => m.value === f.repartition)?.label ?? f.repartition}
                    </Badge>
                    {!f.ventile_le && (
                      <span className="block text-xs text-warning-700">non ventilé</span>
                    )}
                  </td>
                  <td className="p-2 text-right font-mono tabular-nums">
                    {fmt(f.montant)} {f.devise}
                  </td>
                  <td className="p-2 text-right font-mono tabular-nums">
                    {fmt(f.montant_fcfa)}
                  </td>
                  <td className="p-2 text-right">
                    <button
                      type="button"
                      onClick={() => action(`/frais-conteneur/${f.id}/repartir`)}
                      disabled={busy}
                      className="text-xs text-brand-600 hover:underline disabled:opacity-50"
                    >
                      Rejouer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <p className="mb-3 text-sm font-medium">Ajouter un frais</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Type
            </span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Montant"
            type="number"
            min={0}
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
          />

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Devise
            </span>
            <select
              value={devise}
              onChange={(e) => setDevise(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="FCFA">FCFA</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR (parité fixe)</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Répartition
            </span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              {MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {modeCourant && (
          <p className="mt-2 text-xs text-neutral-500">{modeCourant.hint}</p>
        )}

        {simulation && simulation.length > 0 && (
          <div className="mt-4 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
            <p className="mb-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              Simulation — aucune écriture n&apos;est produite
            </p>
            <ul className="space-y-1">
              {simulation.map((l) => (
                <li key={l.vehicle_id} className="flex justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate">
                    {l.vehicule || l.vin}
                    <span className="ml-2 font-mono text-neutral-400">
                      {mode === "PRORATA_POIDS"
                        ? l.poids_kg
                          ? `${l.poids_kg} kg`
                          : "poids inconnu"
                        : mode === "PRORATA_VALEUR"
                          ? l.valeur
                            ? fmt(l.valeur)
                            : "valeur inconnue"
                          : ""}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono font-semibold tabular-nums">
                    {fmt(l.part)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 border-t border-neutral-200 pt-2 text-right font-mono text-xs font-semibold dark:border-neutral-800">
              Total réparti {fmt(simulation.reduce((s, l) => s + l.part, 0))}
            </p>
          </div>
        )}

        <Button
          className="mt-3"
          onClick={enregistrer}
          loading={busy}
          disabled={!montant || Number(montant) <= 0}
        >
          Enregistrer et ventiler
        </Button>
      </div>

      {error && (
        <p className="mt-3 text-xs font-medium text-danger-600" role="alert">
          {error}
        </p>
      )}
    </Card>
  );
}
