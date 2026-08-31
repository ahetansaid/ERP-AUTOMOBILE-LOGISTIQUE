"use client";

/**
 * Identité de la société : ce qui apparaît sur les factures.
 *
 * POURQUOI CET ÉCRAN EXISTE
 *
 * Les champs étaient dans le schéma depuis le début, sans aucune route pour les
 * écrire. La société pilote s'appelait donc encore « ParcAuto Principal » sur
 * ses propres documents, sans logo ni IFU.
 *
 * L'IFU / RCCM N'EST PAS UN CHAMP COMME LES AUTRES
 *
 * Une facture émise au Bénin sans lui n'est pas opposable. Il est donc signalé
 * tant qu'il manque, plutôt que rangé parmi les coordonnées facultatives.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiPut } from "@/lib/api";
import { buildDownloadUrl } from "@/lib/download";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface Identite {
  name?: string;
  legal_number?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  country?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  logo_url?: string | null;
  logo_apercu?: string | null;
}

/** Le plafond du serveur pour un logo relu à chaque PDF. */
const LOGO_MAX_MO = 2;

export function IdentiteSociete() {
  const [f, setF] = useState<Identite>({});
  const [apercu, setApercu] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const champFichier = useRef<HTMLInputElement>(null);

  /** L'aperçu passe par un jeton court : la route du fichier est protégée. */
  const chargerApercu = useCallback(async (chemin: string | null | undefined, ref?: string | null) => {
    const id = /^upload:(\d+)$/.exec(String(ref ?? ""))?.[1];
    if (!chemin || !id) {
      setApercu(null);
      return;
    }
    try {
      setApercu(await buildDownloadUrl("uploads", id, chemin));
    } catch {
      // Aperçu indisponible : le logo reste enregistré, on n'alarme pas.
      setApercu(null);
    }
  }, []);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const r = await apiGet<Identite>("/settings/company");
      setF(r);
      await chargerApercu(r.logo_apercu, r.logo_url);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setChargement(false);
    }
  }, [chargerApercu]);

  useEffect(() => {
    charger();
  }, [charger]);

  const maj = (cle: keyof Identite, v: string) => {
    setSucces(null);
    setF((p) => ({ ...p, [cle]: v }));
  };

  const televerser = async (fichier: File) => {
    setErreur(null);
    setSucces(null);
    if (fichier.size > LOGO_MAX_MO * 1024 * 1024) {
      setErreur(`Le logo dépasse ${LOGO_MAX_MO} Mo. Il est relu à chaque facture émise.`);
      return;
    }
    setEnvoi(true);
    try {
      const fd = new FormData();
      fd.append("file", fichier);
      fd.append("kind", "COMPANY_LOGO");

      // `fetch` direct : le client d'API force un Content-Type JSON, qui
      // casserait le multipart. La session voyage par cookie.
      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      const res = await fetch(`${base}/uploads`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const piece = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(piece.message || `Envoi échoué (${res.status})`);

      // Deux temps assumés : le fichier entre dans le circuit d'uploads, puis
      // la société le désigne. Le second seul est réversible sans perdre
      // l'image, ce qui permet de revenir en arrière sans re-téléverser.
      const r = await apiPut<Identite>("/settings/company", {
        logo_url: `upload:${piece.id}`,
      });
      setF(r);
      await chargerApercu(r.logo_apercu, r.logo_url);
      setSucces("Logo enregistré. Il apparaîtra sur les prochaines factures.");
      if (champFichier.current) champFichier.current.value = "";
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setEnvoi(false);
    }
  };

  const enregistrer = async () => {
    setErreur(null);
    setSucces(null);
    setEnvoi(true);
    try {
      const r = await apiPut<Identite>("/settings/company", {
        name: f.name ?? "",
        legal_number: f.legal_number ?? "",
        address: f.address ?? "",
        phone: f.phone ?? "",
        email: f.email ?? "",
        country: f.country ?? "",
        primary_color: f.primary_color ?? "",
        secondary_color: f.secondary_color ?? "",
      });
      setF(r);
      setSucces("Identité enregistrée.");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setEnvoi(false);
    }
  };

  const sansIfu = !String(f.legal_number ?? "").trim();

  return (
    <Card
      title="Identité de la société"
      description="Ce qui figure en tête de vos factures et de vos reçus."
    >
      {chargement ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : (
        <div className="space-y-5">
          {/* ── Logo ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              {apercu ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={apercu} alt="Logo de la société" className="h-full w-full object-contain" />
              ) : (
                <span className="text-2xl font-bold text-slate-300">
                  {(f.name ?? "?").trim().charAt(0).toUpperCase() || "?"}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <input
                ref={champFichier}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={envoi}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) televerser(file);
                }}
                className="block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200 dark:text-slate-400 dark:file:bg-slate-800"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                PNG, JPEG ou WebP, {LOGO_MAX_MO} Mo maximum. Un fond transparent
                rend mieux sur les documents.
              </p>
            </div>
          </div>

          {/* ── Mentions ──────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Raison sociale"
              value={f.name ?? ""}
              onChange={(e) => maj("name", e.target.value)}
            />
            <Input
              label="IFU / RCCM"
              value={f.legal_number ?? ""}
              onChange={(e) => maj("legal_number", e.target.value)}
              placeholder="Obligatoire sur une facture"
            />
            <Input
              label="Adresse"
              value={f.address ?? ""}
              onChange={(e) => maj("address", e.target.value)}
            />
            <Input
              label="Pays"
              value={f.country ?? ""}
              onChange={(e) => maj("country", e.target.value)}
            />
            <Input
              label="Téléphone"
              value={f.phone ?? ""}
              onChange={(e) => maj("phone", e.target.value)}
            />
            <Input
              label="E-mail"
              type="email"
              value={f.email ?? ""}
              onChange={(e) => maj("email", e.target.value)}
            />
          </div>

          {/* ── Couleurs ──────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["primary_color", "Couleur principale"],
                ["secondary_color", "Couleur secondaire"],
              ] as const
            ).map(([cle, libelle]) => (
              <div key={cle}>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {libelle}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label={libelle}
                    value={/^#[0-9a-fA-F]{6}$/.test(f[cle] ?? "") ? (f[cle] as string) : "#1F3F94"}
                    onChange={(e) => maj(cle, e.target.value)}
                    className="h-10 w-12 shrink-0 cursor-pointer rounded border border-slate-200 bg-transparent dark:border-slate-700"
                  />
                  <input
                    type="text"
                    value={f[cle] ?? ""}
                    onChange={(e) => maj(cle, e.target.value)}
                    placeholder="#1F3F94"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
              </div>
            ))}
          </div>

          {sansIfu && (
            <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              L&apos;IFU / RCCM n&apos;est pas renseigné. Les factures émises ne
              le porteront pas, et ne seront donc pas opposables.
            </p>
          )}
          {erreur && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200" role="alert">
              {erreur}
            </p>
          )}
          {succes && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" role="status">
              {succes}
            </p>
          )}

          <Button onClick={enregistrer} disabled={envoi}>
            {envoi ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      )}
    </Card>
  );
}
