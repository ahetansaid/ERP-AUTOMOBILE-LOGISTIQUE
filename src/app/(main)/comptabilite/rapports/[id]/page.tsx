"use client";

/**
 * Espace de lecture et d'approbation d'un rapport.
 *
 * Pas un PDF joint à un courriel : une page de revue. On lit, on ancre une
 * précision sur une ligne précise, on approuve ou on renvoie en correction.
 * La diffusion n'est possible qu'après approbation.
 */

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPost } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Statut = "GENERE" | "EN_REVUE" | "APPROUVE" | "A_CORRIGER" | "DIFFUSE";

interface Operation {
  ref: string;
  id: number;
  date: string;
  libelle: string;
  nature: string;
  montant: number;
  horsResultat: boolean;
}

interface Payload {
  debut: string;
  fin: string;
  tresorerie: {
    ouverture: number;
    entrees: number;
    sorties: number;
    cloture: number;
    parCompte: { id: number; label: string; balance: number }[];
  };
  resultat: {
    produits: number;
    coutDesVentes: number;
    margeBrute: number;
    chargesGenerales: number;
    resultat: number;
    horsResultat: number;
  };
  operations: Operation[];
  synthese: { nbOperations: number; montantHorsResultat: number };
}

interface Precision {
  id: number;
  texte: string;
  ancre?: string | null;
  auteur: string;
  date: string;
}

interface Rapport {
  id: number;
  nom: string;
  statut: Statut;
  debut: string;
  fin: string;
  payload: Payload | null;
  motif?: string | null;
  approuveLe?: string | null;
  precisions: Precision[];
}

const STATUT_STYLE: Record<Statut, { variant: "default" | "warning" | "success" | "danger" | "info"; label: string }> = {
  GENERE: { variant: "default", label: "Généré" },
  EN_REVUE: { variant: "warning", label: "En revue" },
  APPROUVE: { variant: "success", label: "Approuvé" },
  A_CORRIGER: { variant: "danger", label: "À corriger" },
  DIFFUSE: { variant: "info", label: "Diffusé" },
};

const fmt = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
const signed = (n: number) =>
  `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(Math.round(n)).toLocaleString("fr-FR")}`;

export default function RapportPage() {
  const params = useParams();
  const id = params?.id ? String(params.id) : null;

  const [rapport, setRapport] = useState<Rapport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nouvelle, setNouvelle] = useState("");
  const [ancre, setAncre] = useState<string | null>(null);

  const fetchRapport = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setRapport(await apiGet<Rapport>(`/rapports/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRapport();
  }, [fetchRapport]);

  const action = async (chemin: string, body?: unknown) => {
    setBusy(true);
    setError(null);
    try {
      await apiPost(`/rapports/${id}/${chemin}`, body);
      await fetchRapport();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setBusy(false);
    }
  };

  const publier = async () => {
    if (!nouvelle.trim()) return;
    await action("precisions", { texte: nouvelle, ancre });
    setNouvelle("");
    setAncre(null);
  };

  const corriger = async () => {
    const motif = window.prompt("Motif du renvoi en correction ?");
    if (motif?.trim()) await action("corriger", { motif });
  };

  if (loading) return <p className="py-8 text-neutral-500">Chargement du rapport…</p>;

  if (!rapport) {
    return (
      <div className="space-y-3">
        <p className="text-danger-600">{error ?? "Rapport introuvable."}</p>
        <Link href="/comptabilite/rapports" className="text-brand-600 hover:underline">
          Retour aux rapports
        </Link>
      </div>
    );
  }

  const p = rapport.payload;
  const style = STATUT_STYLE[rapport.statut];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/comptabilite/rapports" className="text-sm text-brand-600 hover:underline">
            ← Rapports
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">{rapport.nom}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={style.variant}>{style.label}</Badge>
            {rapport.approuveLe && (
              <span className="text-xs text-neutral-500">
                approuvé le {new Date(rapport.approuveLe).toLocaleDateString("fr-FR")}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {rapport.statut === "EN_REVUE" && (
            <>
              <Button onClick={() => action("approuver")} loading={busy}>
                Approuver
              </Button>
              <Button variant="secondary" onClick={corriger} disabled={busy}>
                À corriger
              </Button>
            </>
          )}
          {rapport.statut === "APPROUVE" && (
            <Button onClick={() => action("diffuser")} loading={busy}>
              Diffuser
            </Button>
          )}
        </div>
      </div>

      {rapport.motif && rapport.statut === "A_CORRIGER" && (
        <p className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-800 dark:border-danger-800 dark:bg-danger-900/20 dark:text-danger-200">
          <b>Renvoyé en correction :</b> {rapport.motif}
        </p>
      )}

      {error && (
        <p className="rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700 dark:bg-danger-500/10 dark:text-danger-300">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {p ? (
            <>
              <Card title="Trésorerie">
                <dl className="grid gap-3 sm:grid-cols-4">
                  {[
                    ["Ouverture", p.tresorerie.ouverture, ""],
                    ["Entrées", p.tresorerie.entrees, "text-accent-600 dark:text-accent-400"],
                    ["Sorties", p.tresorerie.sorties, "text-danger-600 dark:text-danger-400"],
                    ["Clôture", p.tresorerie.cloture, "font-bold"],
                  ].map(([label, val, cls]) => (
                    <div key={String(label)}>
                      <dt className="text-sm text-neutral-500">{String(label)}</dt>
                      <dd className={`font-mono text-lg tabular-nums ${cls}`}>
                        {fmt(Number(val))}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 border-t border-neutral-200 pt-3 text-xs text-neutral-500 dark:border-neutral-800">
                  Le solde d&apos;ouverture est calculé depuis le grand livre, jamais saisi.
                </p>
              </Card>

              <Card title="Résultat">
                <dl className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Produits", p.resultat.produits],
                    ["Coût des ventes", p.resultat.coutDesVentes],
                    ["Marge brute", p.resultat.margeBrute],
                    ["Charges générales", p.resultat.chargesGenerales],
                    ["Résultat", p.resultat.resultat],
                  ].map(([label, val]) => (
                    <div key={String(label)}>
                      <dt className="text-sm text-neutral-500">{String(label)}</dt>
                      <dd className="font-mono text-lg tabular-nums">{fmt(Number(val))}</dd>
                    </div>
                  ))}
                </dl>
                {p.resultat.horsResultat !== 0 && (
                  <p className="mt-3 border-t border-neutral-200 pt-3 text-xs text-neutral-500 dark:border-neutral-800">
                    <b>{fmt(Math.abs(p.resultat.horsResultat))}</b> de mouvements hors
                    résultat (emprunts, comptes d&apos;associés, transferts) —
                    volontairement exclus.
                  </p>
                )}
              </Card>

              <Card title={`Opérations (${p.operations.length})`}>
                {p.operations.length === 0 ? (
                  <p className="py-4 text-sm text-neutral-500">
                    Aucun mouvement sur la période.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                          <th className="p-2 font-medium">Date</th>
                          <th className="p-2 font-medium">Libellé</th>
                          <th className="p-2 font-medium">Nature</th>
                          <th className="p-2 text-right font-medium">Montant</th>
                          <th className="p-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {p.operations.map((o) => {
                          const commentee = rapport.precisions.some((c) => c.ancre === o.ref);
                          return (
                            <tr
                              key={o.ref}
                              className={`border-b border-neutral-100 dark:border-neutral-800 ${
                                ancre === o.ref ? "bg-brand-50 dark:bg-brand-950/40" : ""
                              }`}
                            >
                              <td className="p-2 font-mono text-xs">
                                {new Date(o.date).toLocaleDateString("fr-FR")}
                              </td>
                              <td className="p-2">
                                {o.libelle}
                                {o.horsResultat && (
                                  <Badge variant="outline" className="ml-2">
                                    hors résultat
                                  </Badge>
                                )}
                              </td>
                              <td className="p-2 font-mono text-xs text-neutral-500">
                                {o.nature}
                              </td>
                              <td
                                className={`p-2 text-right font-mono tabular-nums ${
                                  o.montant < 0
                                    ? "text-danger-600 dark:text-danger-400"
                                    : "text-accent-600 dark:text-accent-400"
                                }`}
                              >
                                {signed(o.montant)}
                              </td>
                              <td className="p-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => setAncre(ancre === o.ref ? null : o.ref)}
                                  className={`text-xs ${
                                    commentee
                                      ? "font-semibold text-brand-600"
                                      : "text-neutral-400 hover:text-brand-600"
                                  }`}
                                  title="Ancrer une précision sur cette ligne"
                                >
                                  {commentee ? "◆" : "◇"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          ) : (
            <Card title="Contenu">
              <p className="py-4 text-sm text-neutral-500">
                Ce rapport n&apos;a pas d&apos;instantané enregistré.
              </p>
            </Card>
          )}
        </div>

        <div>
          <Card title="Précisions">
            {rapport.precisions.length === 0 ? (
              <p className="py-3 text-sm text-neutral-500">Aucune précision.</p>
            ) : (
              <ul className="mb-4 space-y-3">
                {rapport.precisions.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl bg-neutral-50 px-3 py-2 dark:bg-neutral-900"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold">{c.auteur}</span>
                      <span className="font-mono text-xs text-neutral-400">
                        {new Date(c.date).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                      {c.texte}
                    </p>
                    {c.ancre && (
                      <p className="mt-1 font-mono text-xs text-brand-600">
                        ↳ ancré sur {c.ancre}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
              {ancre && (
                <p className="font-mono text-xs text-brand-600">
                  Ancré sur {ancre} ·{" "}
                  <button
                    type="button"
                    onClick={() => setAncre(null)}
                    className="underline"
                  >
                    détacher
                  </button>
                </p>
              )}
              <Input
                label="Ajouter une précision"
                placeholder="Ce retrait doit être reclassé…"
                value={nouvelle}
                onChange={(e) => setNouvelle(e.target.value)}
              />
              <Button
                size="sm"
                onClick={publier}
                disabled={busy || !nouvelle.trim()}
                className="w-full"
              >
                Publier
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
