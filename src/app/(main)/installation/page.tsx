"use client";

/**
 * Installation guidée.
 *
 * Choisir un profil suffit à rendre la plateforme opérationnelle. Les étapes
 * suivantes se cochent d'elles-mêmes au fil de l'usage : elles sont vérifiées
 * sur les données réelles, pas sur des cases à cocher.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Etape {
  cle: string;
  titre: string;
  detail: string;
  fait: boolean;
  action: string | null;
}

interface Modele {
  code: string;
  label: string;
  description: string;
  categories: number;
  comptes: number;
  regles: number;
  modeleDocument: string;
}

interface Etat {
  etapes: Etape[];
  faites: number;
  total: number;
  operationnel: boolean;
  modeles: Modele[];
}

export default function InstallationPage() {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchEtat = useCallback(async () => {
    setLoading(true);
    try {
      setEtat(await apiGet<Etat>("/installation"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEtat();
  }, [fetchEtat]);

  const appliquer = async (code: string) => {
    setBusy(code);
    setError(null);
    setMessage(null);
    try {
      const res = await apiPost<{
        label: string;
        categoriesCreees: number;
        comptesCrees: number;
        reglesCreees: number;
      }>("/installation/modele", { code });
      setMessage(
        `Modèle « ${res.label} » appliqué : ${res.categoriesCreees} catégories, ` +
          `${res.comptesCrees} comptes et ${res.reglesCreees} règles ajoutés.`
      );
      await fetchEtat();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Application impossible");
    } finally {
      setBusy(null);
    }
  };

  const finaliser = async () => {
    setBusy("finaliser");
    setError(null);
    setMessage(null);
    try {
      await apiPost("/installation/finaliser");
      setMessage("Index de recherche reconstruit.");
      await fetchEtat();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <p className="py-8 text-neutral-500">Chargement…</p>;
  if (!etat) return <p className="py-8 text-danger-600">{error}</p>;

  const progression = Math.round((etat.faites / etat.total) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Installation</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Choisissez votre profil : vous serez opérationnel en quelques minutes,
          puis vous adapterez.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-neutral-500">Avancement</p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
              {etat.faites} / {etat.total}
            </p>
          </div>
          <Badge variant={etat.operationnel ? "success" : "warning"}>
            {etat.operationnel ? "Opérationnel" : "Référentiels à installer"}
          </Badge>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-accent-500 transition-all duration-500"
            style={{ width: `${progression}%` }}
          />
        </div>
      </Card>

      {message && (
        <p className="rounded-xl bg-accent-50 px-4 py-3 text-sm font-medium text-accent-800 dark:bg-accent-900/20 dark:text-accent-200">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700 dark:bg-danger-500/10 dark:text-danger-300">
          {error}
        </p>
      )}

      <Card title="Modèles métier">
        <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
          Chaque modèle installe des catégories, des comptes de trésorerie et des
          règles d&apos;alerte cohérents avec le métier. Appliquer un modèle
          n&apos;écrase jamais ce que vous avez déjà personnalisé.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {etat.modeles.map((m) => (
            <div
              key={m.code}
              className="flex flex-col rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <p className="font-semibold">{m.label}</p>
              <p className="mt-1 flex-1 text-sm text-neutral-600 dark:text-neutral-400">
                {m.description}
              </p>
              <ul className="mt-3 space-y-0.5 font-mono text-xs text-neutral-500">
                <li>{m.categories} catégories</li>
                <li>{m.comptes} comptes</li>
                <li>{m.regles} règles d&apos;alerte</li>
                <li>document « {m.modeleDocument} »</li>
              </ul>
              <Button
                className="mt-4"
                size="sm"
                onClick={() => appliquer(m.code)}
                loading={busy === m.code}
                disabled={busy !== null}
              >
                Appliquer
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Étapes">
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {etat.etapes.map((e) => (
            <li key={e.cle} className="flex items-start gap-3 py-3">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  e.fait
                    ? "bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300"
                    : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
                }`}
              >
                {e.fait ? "✓" : "○"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{e.titre}</span>
                <span className="block text-xs text-neutral-500">{e.detail}</span>
              </span>
              {!e.fait && e.action && (
                <Link
                  href={e.action}
                  className="shrink-0 text-sm font-semibold text-brand-600 hover:underline"
                >
                  Y aller
                </Link>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Après une reprise de données">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Les entités importées directement en base n&apos;ont pas traversé la
          couche applicative : elles ne sont donc pas encore indexées. Cette
          action reconstruit l&apos;index de recherche universelle.
        </p>
        <Button
          className="mt-3"
          variant="secondary"
          onClick={finaliser}
          loading={busy === "finaliser"}
          disabled={busy !== null}
        >
          Reconstruire l&apos;index
        </Button>
      </Card>
    </div>
  );
}
