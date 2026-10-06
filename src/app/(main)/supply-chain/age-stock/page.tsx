"use client";

/**
 * Âge du stock — le capital immobilisé, par tranche d'ancienneté.
 *
 * CE QUE CET ÉCRAN REMPLACE
 *
 * Un CRM. Les outils généralistes proposent un entonnoir commercial — leads,
 * opportunités, pipeline pondéré. Un importateur n'a pas d'entonnoir, il a un
 * parc : sa question est « cette voiture dort depuis combien de jours et
 * combien me coûte-t-elle », pas « où en est cette opportunité ».
 *
 * L'ORDRE EST DÉLIBÉRÉ
 *
 * Le plus ancien en premier. Un tableau trié par date d'entrée cache ce qu'on
 * cherche ; trié par âge décroissant, la première ligne est le problème.
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/Card";

interface Ligne {
  id: number;
  vin: string | null;
  designation: string;
  statut: string;
  conteneur: string | null;
  age: number;
  tranche: string;
  baseAge: "arrivee_conteneur" | "creation_fiche";
  depuis: string;
  capital: number;
  prixVente: number | null;
  margePotentielle: number | null;
}

interface Tranche {
  cle: string;
  libelle: string;
  nombre: number;
  capital: number;
}

interface Etat {
  arreteAu: string;
  vehicules: Ligne[];
  tranches: Tranche[];
  total: {
    nombre: number;
    capital: number;
    ageMoyen: number;
    capitalAuDela90: number;
    sansCout: number;
    sansPrixVente: number;
    plusVieux: { id: number; designation: string; age: number } | null;
  };
}

const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} F`;

/** Les tranches hautes sont celles qui coûtent — la couleur le dit. */
const tonTranche = (cle: string) =>
  cle === "180+"
    ? "bg-red-500"
    : cle === "91-180"
      ? "bg-amber-500"
      : cle === "61-90"
        ? "bg-yellow-400"
        : "bg-emerald-500";

export default function AgeStockPage() {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      setEtat(await apiGet<Etat>("/vehicles/age-stock"));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Chargement impossible");
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  if (erreur) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {erreur}
      </p>
    );
  }
  if (!etat) return <p className="text-sm text-slate-500">Chargement…</p>;

  const { total, tranches, vehicules } = etat;
  const max = Math.max(...tranches.map((t) => t.capital), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Âge du stock</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Ce que le parc immobilise, et depuis combien de temps. Arrêté au{" "}
          {new Date(etat.arreteAu).toLocaleDateString("fr-FR")}.
        </p>
      </div>

      {/* ── Les quatre chiffres qui décident ──────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { k: "Véhicules en stock", v: String(total.nombre), s: null },
          { k: "Capital immobilisé", v: fcfa(total.capital), s: null },
          { k: "Âge moyen", v: `${total.ageMoyen} j`, s: total.plusVieux ? `plus ancien : ${total.plusVieux.age} j` : null },
          {
            k: "Bloqué au-delà de 90 j",
            v: fcfa(total.capitalAuDela90),
            s: `${Math.round((total.capitalAuDela90 / Math.max(total.capital, 1)) * 100)} % du capital`,
            chaud: total.capitalAuDela90 > total.capital * 0.5,
          },
        ].map((c) => (
          <Card key={c.k}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{c.k}</p>
            <p
              className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${
                c.chaud ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {c.v}
            </p>
            {c.s && <p className="mt-0.5 text-xs text-slate-500">{c.s}</p>}
          </Card>
        ))}
      </div>

      {/* ── Répartition ───────────────────────────────────────────────── */}
      <Card title="Répartition par ancienneté">
        <div className="space-y-3">
          {tranches.map((t) => (
            <div key={t.cle} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-sm text-slate-600 dark:text-slate-400">
                {t.libelle}
              </span>
              <div className="h-6 flex-1 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full ${tonTranche(t.cle)}`}
                  style={{ width: `${(t.capital / max) * 100}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right font-mono text-sm tabular-nums text-slate-500">
                {t.nombre}
              </span>
              <span className="w-36 shrink-0 text-right font-mono text-sm tabular-nums text-slate-700 dark:text-slate-300">
                {fcfa(t.capital)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {(total.sansPrixVente > 0 || total.sansCout > 0) && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {total.sansPrixVente > 0 && (
            <>
              <strong>{total.sansPrixVente}</strong> véhicule(s) sans prix de vente : leur
              marge est incalculable, et aucune facture ne peut être émise pour eux.{" "}
            </>
          )}
          {total.sansCout > 0 && (
            <>
              <strong>{total.sansCout}</strong> véhicule(s) sans aucun coût enregistré.
            </>
          )}
        </p>
      )}

      {/* ── Le détail, le plus ancien d'abord ─────────────────────────── */}
      <Card title="Véhicules en stock" description="Du plus ancien au plus récent.">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-700">
                <th className="py-2 pr-3 font-medium">Âge</th>
                <th className="py-2 pr-3 font-medium">Véhicule</th>
                <th className="py-2 pr-3 font-medium">VIN</th>
                <th className="py-2 pr-3 font-medium">Conteneur</th>
                <th className="py-2 pr-3 text-right font-medium">Coût de revient</th>
                <th className="py-2 pr-3 text-right font-medium">Prix de vente</th>
                <th className="py-2 text-right font-medium">Marge au prix affiché</th>
              </tr>
            </thead>
            <tbody>
              {vehicules.map((v) => (
                <tr key={v.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-2 pr-3">
                    <span
                      className={`font-mono tabular-nums ${
                        v.age > 180
                          ? "font-semibold text-red-600 dark:text-red-400"
                          : v.age > 90
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {v.age} j
                    </span>
                    {/* La base de calcul est dite : un indicateur dont on ignore
                        l'origine se discute au lieu d'être utilisé. */}
                    <span
                      className="ml-1 text-[10px] text-slate-400"
                      title={
                        v.baseAge === "arrivee_conteneur"
                          ? `Depuis l'arrivée du conteneur, le ${v.depuis}`
                          : `Depuis la création de la fiche, le ${v.depuis} — le conteneur n'a pas de date d'arrivée`
                      }
                    >
                      {v.baseAge === "arrivee_conteneur" ? "⚓" : "✎"}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-slate-800 dark:text-slate-200">{v.designation}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-slate-500">{v.vin ?? "—"}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-slate-500">{v.conteneur ?? "—"}</td>
                  <td className="py-2 pr-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {fcfa(v.capital)}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono tabular-nums text-slate-500">
                    {v.prixVente == null ? "—" : fcfa(v.prixVente)}
                  </td>
                  <td
                    className={`py-2 text-right font-mono tabular-nums ${
                      v.margePotentielle == null
                        ? "text-slate-400"
                        : v.margePotentielle < 0
                          ? "font-semibold text-red-600 dark:text-red-400"
                          : "text-emerald-700 dark:text-emerald-400"
                    }`}
                  >
                    {v.margePotentielle == null ? "—" : fcfa(v.margePotentielle)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
