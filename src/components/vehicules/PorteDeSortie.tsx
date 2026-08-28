"use client";

/**
 * Une porte de sortie : atelier ou livraison.
 *
 * L'ÉTAT AVANT LE BOUTON
 *
 * L'écran montre d'abord ce qu'il en est — devis non soldés, facture impayée,
 * solde restant — et le bouton vient après. C'est la même discipline que le
 * tour à blanc de l'import : on ne franchit rien sans avoir vu.
 *
 * LA PORTE S'OUVRE TOUJOURS
 *
 * Un client repart avec le véhicule en ayant réglé 60 % : cela arrive toutes
 * les semaines. Bloquer ferait contourner le logiciel, et la livraison ne serait
 * alors enregistrée nulle part. Le bouton reste donc actif — mais tant qu'il y a
 * une réserve, il exige un motif écrit, et le solde du jour est figé avec.
 *
 * POURQUOI LE SOLDE FIGÉ EST DIT À L'ÉCRAN
 *
 * Pour qu'on sache ce qu'on signe. Trois mois plus tard, tout aura été payé et
 * le solde recalculé vaudra zéro : seul le chiffre écrit ce jour-là gardera la
 * trace qu'on a laissé partir un véhicule à moitié réglé.
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Porte = "atelier" | "livraison";

interface DevisLigne {
  id: number;
  prestataire: string;
  statut: string;
  montant: number;
  paye: number;
  restant: number;
  solde: boolean;
}

interface FactureResume {
  id: number;
  numero: string | null;
  statut: string;
  client: string | null;
  montant: number;
  paye: number;
  restant: number;
}

interface Franchie {
  id: number;
  dateArrival: string | null;
  docRef: string | null;
  soldeGele: number | string | null;
  motif: string | null;
}

interface Etat {
  porte: string;
  restant: number;
  pret: boolean;
  reserves: string[];
  dejaFranchie: Franchie | null;
  devis?: DevisLigne[];
  engage?: number;
  paye?: number;
  facture?: FactureResume | null;
}

const fcfa = (n: number | string | null | undefined) =>
  `${Math.round(Number(n) || 0).toLocaleString("fr-FR")} FCFA`;

const TEXTES: Record<Porte, { titre: string; action: string; piece: string; vide: string }> = {
  atelier: {
    titre: "Sortie d’atelier",
    action: "Sortir de l’atelier",
    piece: "N° du bon de sortie",
    vide: "Aucun devis d’atelier n’a été saisi sur ce véhicule.",
  },
  livraison: {
    titre: "Livraison au client",
    action: "Enregistrer la livraison",
    piece: "N° du bon de livraison signé",
    vide: "Aucune facture de vente n’a été émise pour ce véhicule.",
  },
};

export function PorteDeSortie({
  porte,
  vehicleId,
  onFranchie,
}: {
  porte: Porte;
  vehicleId: string | number;
  onFranchie?: () => void;
}) {
  const t = TEXTES[porte];
  const [etat, setEtat] = useState<Etat | null>(null);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [motif, setMotif] = useState("");
  const [docRef, setDocRef] = useState("");

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      setEtat(await apiGet<Etat>(`/sorties/${porte}/etat/${vehicleId}`));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "État indisponible");
    } finally {
      setChargement(false);
    }
  }, [porte, vehicleId]);

  useEffect(() => {
    charger();
  }, [charger]);

  const franchir = async () => {
    setEnvoi(true);
    setErreur(null);
    try {
      await apiPost(`/sorties/${porte}`, {
        vehicleId: Number(vehicleId),
        motif: motif.trim() || undefined,
        docRef: docRef.trim() || undefined,
      });
      setMotif("");
      setDocRef("");
      await charger();
      onFranchie?.();
    } catch (e) {
      // Un refus peut venir de ce qu'un collègue vient de franchir la porte, ou
      // qu'un reçu a été saisi entre-temps. Recharger transforme un message
      // énigmatique en l'état réel du dossier.
      //
      // L'ordre compte : `charger` remet l'erreur à null en entrant, donc le
      // message doit être reposé APRÈS, sinon il disparaît sans être lu.
      const message = e instanceof Error ? e.message : "Sortie impossible";
      await charger();
      setErreur(message);
    } finally {
      setEnvoi(false);
    }
  };

  if (chargement) {
    return (
      <Card title={t.titre}>
        <p className="text-sm text-neutral-500">Lecture de l’état…</p>
      </Card>
    );
  }

  if (!etat) {
    return (
      <Card title={t.titre}>
        <p className="text-sm text-danger-700 dark:text-danger-300" role="alert">
          {erreur ?? "État indisponible."}
        </p>
      </Card>
    );
  }

  /* ── Déjà franchie : on montre ce qui a été signé, et rien d'autre ────── */
  if (etat.dejaFranchie) {
    const f = etat.dejaFranchie;
    const soldeAlors = Number(f.soldeGele) || 0;
    return (
      <Card title={t.titre}>
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          Enregistrée le{" "}
          <strong>{String(f.dateArrival ?? "").slice(0, 10) || "—"}</strong>
          {f.docRef && (
            <>
              , pièce <span className="font-mono text-xs">{f.docRef}</span>
            </>
          )}
          .
        </p>
        <p className="mt-3 text-sm">
          <span className="text-neutral-500">Solde restant ce jour-là : </span>
          <span
            className={`font-mono font-semibold tabular-nums ${
              soldeAlors > 0
                ? "text-warning-700 dark:text-warning-300"
                : "text-accent-700 dark:text-accent-300"
            }`}
          >
            {fcfa(soldeAlors)}
          </span>
        </p>
        {f.motif && (
          <p className="mt-3 rounded-xl bg-neutral-100 px-4 py-3 text-sm dark:bg-neutral-800/60">
            <span className="text-neutral-500">Motif : </span>
            {f.motif}
          </p>
        )}
        <p className="mt-4 text-xs text-neutral-500">
          Cette sortie ne se modifie plus : sa date et son solde attestent de la
          régularité de l’opération.
        </p>
      </Card>
    );
  }

  const besoinMotif = etat.reserves.length > 0;
  const motifValide = motif.trim().length >= 10;

  return (
    <Card title={t.titre}>
      {/* ── L'état, avant tout ─────────────────────────────────────────── */}
      {porte === "atelier" && (
        <>
          {etat.devis && etat.devis.length > 0 ? (
            <ul className="space-y-2">
              {etat.devis.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-200 pb-2 text-sm last:border-0 dark:border-neutral-800"
                >
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {d.prestataire}
                    <span className="ml-2 text-xs text-neutral-400">{d.statut}</span>
                  </span>
                  <span className="font-mono text-xs tabular-nums">
                    <span className="text-neutral-500">{fcfa(d.paye)}</span>
                    <span className="mx-1 text-neutral-400">/</span>
                    {fcfa(d.montant)}
                    {d.restant > 0 && (
                      <span className="ml-2 font-semibold text-warning-700 dark:text-warning-300">
                        reste {fcfa(d.restant)}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">{t.vide}</p>
          )}
        </>
      )}

      {porte === "livraison" && (
        <>
          {etat.facture ? (
            <div className="space-y-1 text-sm">
              <p className="text-neutral-700 dark:text-neutral-300">
                Facture{" "}
                <span className="font-mono text-xs">{etat.facture.numero ?? etat.facture.id}</span>
                {etat.facture.client && ` — ${etat.facture.client}`}
              </p>
              <p className="font-mono text-xs tabular-nums text-neutral-500">
                {fcfa(etat.facture.paye)} réglés sur {fcfa(etat.facture.montant)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">{t.vide}</p>
          )}
        </>
      )}

      {/* ── Ce qui reste dû, en gros ───────────────────────────────────── */}
      <p className="mt-4 text-sm">
        <span className="text-neutral-500">Solde restant : </span>
        <span
          className={`font-mono text-base font-semibold tabular-nums ${
            etat.restant > 0
              ? "text-warning-700 dark:text-warning-300"
              : "text-accent-700 dark:text-accent-300"
          }`}
        >
          {fcfa(etat.restant)}
        </span>
      </p>

      {/* ── Les réserves : ce qu'on s'apprête à passer outre ────────────── */}
      {besoinMotif && (
        <ul className="mt-4 space-y-1 rounded-xl border border-warning-300 bg-warning-50 px-4 py-3 text-sm text-warning-900 dark:border-warning-800 dark:bg-warning-950/40 dark:text-warning-200">
          {etat.reserves.map((r) => (
            <li key={r}>— {r}</li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-col gap-3">
        <Input
          label={t.piece}
          placeholder="Facultatif, mais c’est la pièce qui prouve la sortie"
          value={docRef}
          onChange={(e) => setDocRef(e.target.value)}
        />
        {besoinMotif && (
          <Input
            label="Motif de la dérogation"
            placeholder="Qui a autorisé, et sur quel accord ?"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
          />
        )}
      </div>

      {erreur && (
        <p
          className="mt-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-800 dark:border-danger-900 dark:bg-danger-950/40 dark:text-danger-200"
          role="alert"
        >
          {erreur}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={franchir} disabled={envoi || (besoinMotif && !motifValide)}>
          {envoi ? "Enregistrement…" : t.action}
        </Button>
        <span className="text-xs text-neutral-500">
          {besoinMotif
            ? motifValide
              ? `Le solde de ${fcfa(etat.restant)} sera conservé avec le motif.`
              : "Un motif d’au moins 10 caractères est requis."
            : "Rien ne s’y oppose."}
        </span>
      </div>
    </Card>
  );
}
