"use client";

/**
 * Alertes et règles.
 *
 * Le moteur rejoue en continu l'audit fait à la main sur les classeurs. Le
 * gérant active, désactive et ajuste les seuils — il ne programme pas.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Severite = "INFO" | "ALERTE" | "CRITIQUE";
type Statut = "OUVERTE" | "RESOLUE" | "IGNOREE";

interface Alerte {
  id: number;
  severite: Severite;
  statut: Statut;
  titre: string;
  detail?: string | null;
  valeur?: number | null;
  entite?: string | null;
  entiteId?: number | null;
  vuePremiereFois: string;
  regle?: { code: string; label: string };
}

interface Regle {
  id: number;
  code: string;
  label: string;
  severite: Severite;
  active: boolean;
  params: Record<string, number> | null;
  defauts: Record<string, number>;
  rappelJours: number;
  ouvertes: number;
  derniereExecution?: string | null;
}

const SEVERITE: Record<Severite, { variant: "danger" | "warning" | "info"; label: string }> = {
  CRITIQUE: { variant: "danger", label: "Critique" },
  ALERTE: { variant: "warning", label: "Alerte" },
  INFO: { variant: "info", label: "Info" },
};

const DOSSIERS = ["Vehicle", "Purchase", "Invoice", "Partner"];

const PARAM_LABEL: Record<string, string> = {
  jours: "Seuil (jours)",
  seuil: "Seuil (FCFA)",
};

export default function AlertesPage() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [regles, setRegles] = useState<Regle[]>([]);
  const [resume, setResume] = useState<Record<string, number>>({});
  const [statut, setStatut] = useState<"OUVERTE" | "TOUTES">("OUVERTE");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onglet, setOnglet] = useState<"alertes" | "regles">("alertes");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, r] = await Promise.all([
        apiGet<{ alertes?: Alerte[]; resume?: Record<string, number> }>(
          `/alertes?statut=${statut}`
        ),
        apiGet<{ regles?: Regle[] }>("/alertes/regles"),
      ]);
      setAlertes(a?.alertes ?? []);
      setResume(a?.resume ?? {});
      setRegles(r?.regles ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [statut]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const evaluer = async () => {
    setBusy(true);
    setError(null);
    try {
      await apiPost("/alertes/evaluer");
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Évaluation impossible");
    } finally {
      setBusy(false);
    }
  };

  const ignorer = async (id: number) => {
    try {
      await apiPost(`/alertes/${id}/ignorer`);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    }
  };

  const majRegle = async (id: number, patch: Record<string, unknown>) => {
    try {
      await apiPatch(`/alertes/regles/${id}`, patch);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise à jour impossible");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alertes</h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Les anomalies sont recalculées à chaque passage. Une même anomalie ne
            crée jamais de doublon.
          </p>
        </div>
        <Button onClick={evaluer} loading={busy}>
          Réévaluer maintenant
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(["CRITIQUE", "ALERTE", "INFO"] as Severite[]).map((s) => (
          <Card key={s}>
            <p className="text-sm font-medium text-neutral-500">{SEVERITE[s].label}</p>
            <p
              className={`mt-1 font-mono text-2xl font-bold tabular-nums ${
                s === "CRITIQUE"
                  ? "text-danger-600 dark:text-danger-400"
                  : s === "ALERTE"
                    ? "text-warning-600 dark:text-warning-400"
                    : "text-brand-600"
              }`}
            >
              {resume[s] ?? 0}
            </p>
            <p className="text-xs text-neutral-500">ouvertes</p>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        {(
          [
            ["alertes", "Occurrences"],
            ["regles", "Règles"],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            type="button"
            onClick={() => setOnglet(v)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              onglet === v
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700 dark:bg-danger-500/10 dark:text-danger-300">
          {error}
        </p>
      )}

      {onglet === "alertes" ? (
        <Card
          title={`${alertes.length} occurrence${alertes.length > 1 ? "s" : ""}`}
          action={
            <button
              type="button"
              onClick={() => setStatut(statut === "OUVERTE" ? "TOUTES" : "OUVERTE")}
              className="text-xs text-brand-600 hover:underline"
            >
              {statut === "OUVERTE" ? "Voir tout l'historique" : "Ouvertes seulement"}
            </button>
          }
        >
          {loading ? (
            <p className="py-6 text-sm text-neutral-500">Chargement…</p>
          ) : alertes.length === 0 ? (
            <p className="py-6 text-sm text-neutral-500">
              Aucune anomalie détectée. Lancez une réévaluation si les données ont
              changé.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {alertes.map((a) => (
                <li key={a.id} className="flex items-start gap-3 py-3">
                  <span
                    className={`mt-1 h-full w-1 shrink-0 self-stretch rounded ${
                      a.severite === "CRITIQUE"
                        ? "bg-danger-500"
                        : a.severite === "ALERTE"
                          ? "bg-warning-500"
                          : "bg-brand-500"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {a.titre}
                      <Badge variant={SEVERITE[a.severite].variant}>
                        {SEVERITE[a.severite].label}
                      </Badge>
                      {a.statut !== "OUVERTE" && (
                        <Badge variant="outline">{a.statut.toLowerCase()}</Badge>
                      )}
                    </p>
                    {a.detail && (
                      <p className="mt-0.5 text-xs text-neutral-500">{a.detail}</p>
                    )}
                    <p className="mt-1 font-mono text-[11px] text-neutral-400">
                      {a.regle?.code} · depuis le{" "}
                      {new Date(a.vuePremiereFois).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {a.entite && a.entiteId && DOSSIERS.includes(a.entite) && (
                      <Link
                        href={`/dossier/${a.entite}/${a.entiteId}`}
                        className="text-sm font-semibold text-brand-600 hover:underline"
                      >
                        Ouvrir
                      </Link>
                    )}
                    {a.statut === "OUVERTE" && (
                      <button
                        type="button"
                        onClick={() => ignorer(a.id)}
                        className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                        title="Ne plus signaler"
                      >
                        Ignorer
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : (
        <Card title={`${regles.length} règles`}>
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {regles.map((r) => (
              <li key={r.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {r.label}
                      <Badge variant={SEVERITE[r.severite].variant}>
                        {SEVERITE[r.severite].label}
                      </Badge>
                      {r.ouvertes > 0 && (
                        <Badge variant="outline">{r.ouvertes} ouvertes</Badge>
                      )}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-neutral-400">
                      {r.code}
                      {r.derniereExecution &&
                        ` · dernière exécution ${new Date(r.derniereExecution).toLocaleString("fr-FR")}`}
                    </p>
                  </div>
                  <Button
                    size="xs"
                    variant={r.active ? "secondary" : "outline"}
                    onClick={() => majRegle(r.id, { active: !r.active })}
                  >
                    {r.active ? "Désactiver" : "Activer"}
                  </Button>
                </div>

                {Object.keys(r.defauts).length > 0 && (
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    {Object.entries(r.defauts).map(([cle, defaut]) => (
                      <Input
                        key={cle}
                        label={PARAM_LABEL[cle] ?? cle}
                        type="number"
                        defaultValue={r.params?.[cle] ?? defaut}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (!Number.isNaN(v) && v !== (r.params?.[cle] ?? defaut)) {
                            majRegle(r.id, { params: { ...r.params, [cle]: v } });
                          }
                        }}
                      />
                    ))}
                    <Input
                      label="Rappel (jours)"
                      type="number"
                      defaultValue={r.rappelJours}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (!Number.isNaN(v) && v !== r.rappelJours) {
                          majRegle(r.id, { rappelJours: v });
                        }
                      }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
