"use client";

/**
 * Import et export en masse, pour n'importe quelle entité.
 *
 * LE TOUR À BLANC EST UNE ÉTAPE DE L'ÉCRAN, PAS UNE OPTION
 *
 * On dépose un fichier, on VOIT ce qui serait créé et ce qui est refusé, et le
 * bouton d'écriture n'apparaît qu'ensuite. Il n'y a pas de chemin qui écrit
 * sans avoir montré — c'est la même discipline que les scripts de reprise,
 * portée à l'écran.
 *
 * LES REFUS SONT LA PARTIE UTILE
 *
 * Un import qui annonce « 3 erreurs » sans dire lesquelles oblige à deviner.
 * Chaque refus cite la ligne telle qu'Excel l'affiche et toutes ses raisons,
 * pour qu'on corrige le fichier en une passe au lieu de le relancer six fois.
 */

import { useRef, useState } from "react";
import { apiPost } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Refus {
  ligne: number;
  erreurs: string[];
}

interface Resultat {
  mode: "a-blanc" | "applique";
  message: string;
  lus?: number;
  creables?: number;
  refuses?: number;
  effetSurLeSolde?: number;
  avertissement?: string | null;
  naturesProposees?: number;
  apercu?: Record<string, unknown>[];
  refus?: Refus[];
}

export function ImportExport({
  titre,
  ressource,
  description,
}: {
  titre: string;
  /** Préfixe d'API : "vehicles", "ledger", "partners"… */
  ressource: string;
  description?: string;
}) {
  const [csv, setCsv] = useState<string>("");
  const [nomFichier, setNomFichier] = useState<string | null>(null);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const champFichier = useRef<HTMLInputElement>(null);

  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  /**
   * Les téléchargements passent par un lien ouvert dans un onglet plutôt que
   * par `fetch` : le cookie de session part tout seul, et le navigateur gère le
   * nom de fichier que le serveur annonce.
   */
  const telecharger = (suffixe = "") => {
    window.open(`${base}/${ressource}/export${suffixe}`, "_blank", "noopener,noreferrer");
  };

  const lireFichier = (fichier: File) => {
    setErreur(null);
    setResultat(null);
    setNomFichier(fichier.name);
    const lecteur = new FileReader();
    lecteur.onload = () => setCsv(String(lecteur.result ?? ""));
    lecteur.onerror = () => setErreur("Fichier illisible.");
    // UTF-8 explicite : sans quoi les accents d'un fichier Excel arrivent
    // abîmés et les libellés partent faux en base.
    lecteur.readAsText(fichier, "utf-8");
  };

  const envoyer = async (valider: boolean) => {
    if (!csv.trim()) {
      setErreur("Choisissez d’abord un fichier.");
      return;
    }
    setErreur(null);
    setEnCours(true);
    try {
      const r = await apiPost<Resultat>(
        `/${ressource}/import${valider ? "?valider=1" : ""}`,
        { csv }
      );
      setResultat(r);
      if (valider) {
        // Le fichier est consommé : le laisser en place inviterait à cliquer
        // deux fois, et le second import créerait des doublons.
        setCsv("");
        setNomFichier(null);
        if (champFichier.current) champFichier.current.value = "";
      }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Import impossible");
    } finally {
      setEnCours(false);
    }
  };

  const aBlanc = resultat?.mode === "a-blanc";
  const applique = resultat?.mode === "applique";

  return (
    <Card title={titre} description={description}>
      {/* ── Export ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => telecharger()}>
          Exporter en CSV
        </Button>
        <Button variant="ghost" size="sm" onClick={() => telecharger("?modele=1")}>
          Télécharger un modèle vide
        </Button>
      </div>
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
        Le fichier exporté est aussi le modèle d&apos;import : mêmes colonnes.
        Exportez, modifiez dans Excel, réimportez.
      </p>

      <hr className="my-5 border-neutral-200 dark:border-neutral-800" />

      {/* ── Import ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={champFichier}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) lireFichier(f);
          }}
          className="block text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-neutral-200 dark:text-neutral-400 dark:file:bg-neutral-800 dark:hover:file:bg-neutral-700"
        />
        <Button onClick={() => envoyer(false)} disabled={enCours || !csv.trim()}>
          {enCours && !applique ? "Analyse…" : "Vérifier le fichier"}
        </Button>
      </div>
      {nomFichier && (
        <p className="mt-2 font-mono text-xs text-neutral-500">{nomFichier}</p>
      )}

      {erreur && (
        <p
          className="mt-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-800 dark:border-danger-900 dark:bg-danger-950/40 dark:text-danger-200"
          role="alert"
        >
          {erreur}
        </p>
      )}

      {/* ── Ce qui se passerait ───────────────────────────────────────── */}
      {resultat && (
        <div className="mt-5 space-y-4">
          <p
            className={`rounded-xl px-4 py-3 text-sm ${
              applique
                ? "border border-accent-200 bg-accent-50 text-accent-900 dark:border-accent-900 dark:bg-accent-950/40 dark:text-accent-200"
                : "border border-neutral-200 bg-neutral-50 text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200"
            }`}
            role="status"
          >
            {resultat.message}
          </p>

          {resultat.effetSurLeSolde != null && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Effet sur le solde :{" "}
              <span className="font-mono font-semibold tabular-nums">
                {Math.round(resultat.effetSurLeSolde).toLocaleString("fr-FR")} FCFA
              </span>
            </p>
          )}

          {resultat.avertissement && (
            <p className="rounded-xl border border-warning-300 bg-warning-50 px-4 py-3 text-sm text-warning-900 dark:border-warning-800 dark:bg-warning-950/40 dark:text-warning-200">
              {resultat.avertissement}
            </p>
          )}

          {/* Les refus d'abord : c'est ce qu'on doit corriger. */}
          {resultat.refus && resultat.refus.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-danger-600 dark:text-danger-400">
                {resultat.refus.length} ligne(s) refusée(s)
              </h4>
              <ul className="mt-2 space-y-1.5">
                {resultat.refus.map((r) => (
                  <li key={r.ligne} className="text-sm">
                    <span className="mr-2 font-mono text-xs text-neutral-500">
                      ligne {r.ligne}
                    </span>
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {r.erreurs.join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {resultat.apercu && resultat.apercu.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                Aperçu de ce qui serait créé
              </h4>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {resultat.apercu.map((a, i) => (
                      <tr key={i}>
                        {Object.entries(a).map(([k, v]) => (
                          <td key={k} className="whitespace-nowrap py-1.5 pr-4 text-neutral-600 dark:text-neutral-400">
                            {String(v ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Le bouton d'écriture n'existe qu'APRÈS avoir montré. */}
          {aBlanc && (resultat.creables ?? 0) > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <Button onClick={() => envoyer(true)} disabled={enCours}>
                {enCours ? "Écriture…" : `Créer les ${resultat.creables} ligne(s)`}
              </Button>
              <span className="text-xs text-neutral-500">
                Les lignes refusées sont ignorées.
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
