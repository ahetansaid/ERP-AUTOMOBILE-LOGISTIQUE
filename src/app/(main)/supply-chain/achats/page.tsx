"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DEVISE_TO_FCFA } from "@/lib/constants";

const STORAGE_TAUX_USD = "erp-taux-usd-fcfa";
const STORAGE_TAUX_EUR = "erp-taux-eur-fcfa";
const STORAGE_ACHATS_LIST = "erp-achats-list";

export interface AchatEnregistre {
  id: string;
  vin: string;
  marque: string;
  modele: string;
  couleur: string;
  annee: string;
  typeVehicule: string;
  prix: number;
  devise: string;
  montantFCFA: number;
  typeAchat: string;
  conteneur: string;
  navire: string;
  createdAt: string;
}

function loadAchatsFromStorage(): AchatEnregistre[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_ACHATS_LIST);
    return raw ? (JSON.parse(raw) as AchatEnregistre[]) : [];
  } catch {
    return [];
  }
}

function saveAchatsToStorage(list: AchatEnregistre[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_ACHATS_LIST, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function loadTauxFromStorage(): { usd: number; eur: number } {
  if (typeof window === "undefined") return { usd: DEVISE_TO_FCFA.USD, eur: DEVISE_TO_FCFA.EUR };
  const usd = localStorage.getItem(STORAGE_TAUX_USD);
  const eur = localStorage.getItem(STORAGE_TAUX_EUR);
  return {
    usd: usd != null ? parseFloat(usd) || DEVISE_TO_FCFA.USD : DEVISE_TO_FCFA.USD,
    eur: eur != null ? parseFloat(eur) || DEVISE_TO_FCFA.EUR : DEVISE_TO_FCFA.EUR,
  };
}

const DEVISES = ["USD", "EUR", "FCFA"] as const;

const TYPE_VEHICULE_ACHAT = [
  { id: "OCCASION", label: "Occasion" },
  { id: "NEUF", label: "Neuf" },
  { id: "ACCIDENTE", label: "Accidenté" },
] as const;
const TYPE_ACHAT = [
  { id: "VRAC", label: "Achat en vrac (préciser le conteneur et le navire)" },
  { id: "CONTENEUR", label: "Achat en conteneur (préciser le conteneur)" },
] as const;

export default function GestionAchatsPage() {
  const [vin, setVin] = useState("");
  const [marque, setMarque] = useState("");
  const [modele, setModele] = useState("");
  const [couleur, setCouleur] = useState("");
  const [annee, setAnnee] = useState("");
  const [typeVehicule, setTypeVehicule] = useState("");
  const [prix, setPrix] = useState("");
  const [devise, setDevise] = useState<"USD" | "EUR" | "FCFA">("USD");
  const [typeAchat, setTypeAchat] = useState("");
  const [conteneur, setConteneur] = useState("");
  const [navire, setNavire] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tauxUsd, setTauxUsd] = useState<string>(() => (typeof window !== "undefined" ? localStorage.getItem(STORAGE_TAUX_USD) ?? String(DEVISE_TO_FCFA.USD) : String(DEVISE_TO_FCFA.USD)));
  const [tauxEur, setTauxEur] = useState<string>(() => (typeof window !== "undefined" ? localStorage.getItem(STORAGE_TAUX_EUR) ?? String(DEVISE_TO_FCFA.EUR) : String(DEVISE_TO_FCFA.EUR)));
  const [listAchats, setListAchats] = useState<AchatEnregistre[]>([]);

  useEffect(() => {
    const { usd, eur } = loadTauxFromStorage();
    setTauxUsd(String(usd));
    setTauxEur(String(eur));
    setListAchats(loadAchatsFromStorage());
  }, []);

  const numTauxUsd = parseFloat(tauxUsd.replace(/\s/g, "").replace(",", ".")) || DEVISE_TO_FCFA.USD;
  const numTauxEur = parseFloat(tauxEur.replace(/\s/g, "").replace(",", ".")) || DEVISE_TO_FCFA.EUR;
  const taux = devise === "USD" ? numTauxUsd : devise === "EUR" ? numTauxEur : 1;
  const numPrix = prix.trim() ? parseFloat(prix.replace(/\s/g, "").replace(",", ".")) : NaN;
  const montantFCFA = !isNaN(numPrix) && numPrix >= 0 ? Math.round(numPrix * taux) : null;

  const persistTaux = (key: string, value: string) => {
    if (typeof window === "undefined") return;
    const num = parseFloat(value.replace(/\s/g, "").replace(",", "."));
    if (!isNaN(num) && num > 0) localStorage.setItem(key, String(num));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!vin.trim()) {
      setError("Le VIN est obligatoire.");
      return;
    }
    if (!marque.trim()) {
      setError("La marque est obligatoire.");
      return;
    }
    if (!annee.trim()) {
      setError("L'année est obligatoire.");
      return;
    }
    if (isNaN(numPrix) || numPrix < 0) {
      setError("Saisissez un prix d'achat valide.");
      return;
    }
    if (typeAchat === "VRAC") {
      if (!conteneur.trim()) setError("Précisez le conteneur pour un achat en vrac.");
      else if (!navire.trim()) setError("Précisez le navire pour un achat en vrac.");
      else setError(null);
      if (!conteneur.trim() || !navire.trim()) return;
    } else if (typeAchat === "CONTENEUR" && !conteneur.trim()) {
      setError("Précisez le conteneur pour un achat en conteneur.");
      return;
    }
    setLoading(true);
    try {
      const montantFCFAValue = montantFCFA ?? Math.round(numPrix * taux);
      const newAchat: AchatEnregistre = {
        id: `achat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        vin: vin.trim(),
        marque: marque.trim(),
        modele: modele.trim(),
        couleur: couleur.trim(),
        annee: annee.trim(),
        typeVehicule,
        prix: numPrix,
        devise,
        montantFCFA: montantFCFAValue,
        typeAchat,
        conteneur: conteneur.trim(),
        navire: navire.trim(),
        createdAt: new Date().toISOString(),
      };
      const next = [newAchat, ...listAchats];
      setListAchats(next);
      saveAchatsToStorage(next);
      setSuccess(true);
      setVin("");
      setMarque("");
      setModele("");
      setCouleur("");
      setAnnee("");
      setTypeVehicule("");
      setPrix("");
      setConteneur("");
      setNavire("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-accent-600">← Parc Automobile</Link>
        <div className="h-4 w-px bg-slate-200" />
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Gestion des achats</h1>
      </div>
      <p className="text-slate-600">
        Achats de véhicules en amont (Europe, USA, autres pays d&apos;expédition). Saisissez les informations du véhicule, le prix d&apos;achat, la devise et le type d&apos;achat (vrac ou conteneur).
      </p>

      {listAchats.length > 0 && (
        <Card>
          <CardTitle>Liste des véhicules en achat</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Véhicules enregistrés en amont (non encore sur le parc). Données enregistrées dans le navigateur.</p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-slate-600">
                  <th className="p-3">Date</th>
                  <th className="p-3">VIN</th>
                  <th className="p-3">Marque / Modèle</th>
                  <th className="p-3">Année</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Prix</th>
                  <th className="p-3 text-right">FCFA</th>
                  <th className="p-3">Achat</th>
                  <th className="p-3">Conteneur / Navire</th>
                  <th className="w-16 p-3"></th>
                </tr>
              </thead>
              <tbody>
                {listAchats.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-3 text-slate-600">{new Date(a.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td className="p-3 font-mono text-slate-800">{a.vin}</td>
                    <td className="p-3">{a.marque} {a.modele ? ` / ${a.modele}` : ""}</td>
                    <td className="p-3">{a.annee}</td>
                    <td className="p-3">{TYPE_VEHICULE_ACHAT.find((t) => t.id === a.typeVehicule)?.label ?? (a.typeVehicule || "—")}</td>
                    <td className="p-3 text-right">{a.prix.toLocaleString("fr-FR")} {a.devise}</td>
                    <td className="p-3 text-right text-green-700">{a.montantFCFA.toLocaleString("fr-FR")}</td>
                    <td className="p-3">{a.typeAchat === "VRAC" ? "Vrac" : a.typeAchat === "CONTENEUR" ? "Conteneur" : "—"}</td>
                    <td className="p-3 text-slate-600">{a.conteneur || "—"} {a.navire ? ` / ${a.navire}` : ""}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => {
                          const next = listAchats.filter((x) => x.id !== a.id);
                          setListAchats(next);
                          saveAchatsToStorage(next);
                        }}
                        className="text-slate-400 hover:text-red-600"
                        title="Retirer de la liste"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>Nouvel achat</CardTitle>
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Véhicule</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input label="VIN *" placeholder="Ex: JTEBU5JR6D5136791" value={vin} onChange={(e) => setVin(e.target.value)} required />
              <Input label="Marque *" placeholder="Ex: Toyota" value={marque} onChange={(e) => setMarque(e.target.value)} required />
              <Input label="Modèle" placeholder="Ex: 4Runner" value={modele} onChange={(e) => setModele(e.target.value)} />
              <Input label="Couleur" placeholder="Ex: Noir" value={couleur} onChange={(e) => setCouleur(e.target.value)} />
              <Input label="Année *" type="number" placeholder="2020" value={annee} onChange={(e) => setAnnee(e.target.value)} required />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Type véhicule</label>
                <select
                  value={typeVehicule}
                  onChange={(e) => setTypeVehicule(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800"
                >
                  <option value="">—</option>
                  {TYPE_VEHICULE_ACHAT.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold text-slate-700">Taux de change (modifiables)</h3>
            <p className="mt-1 text-xs text-slate-500">Les taux sont enregistrés dans le navigateur et utilisés pour la conversion en FCFA.</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Taux indicatif : 1 USD = … FCFA</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={tauxUsd}
                  onChange={(e) => {
                    setTauxUsd(e.target.value);
                    persistTaux(STORAGE_TAUX_USD, e.target.value);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800"
                  placeholder="600"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Taux indicatif : 1 EUR = … FCFA</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={tauxEur}
                  onChange={(e) => {
                    setTauxEur(e.target.value);
                    persistTaux(STORAGE_TAUX_EUR, e.target.value);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800"
                  placeholder="655"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold text-slate-700">Prix d&apos;achat et devise</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                label="Prix d'achat *"
                type="text"
                inputMode="decimal"
                placeholder="Ex: 15000"
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Devise *</label>
                <select
                  value={devise}
                  onChange={(e) => setDevise(e.target.value as "USD" | "EUR" | "FCFA")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800"
                >
                  {DEVISES.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Équivalent FCFA</label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800">
                  {montantFCFA != null ? montantFCFA.toLocaleString("fr-FR") + " FCFA" : "—"}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {devise === "USD" ? `Taux utilisé : 1 USD = ${numTauxUsd.toLocaleString("fr-FR")} FCFA` : devise === "EUR" ? `Taux utilisé : 1 EUR = ${numTauxEur.toLocaleString("fr-FR")} FCFA` : "Devise FCFA (pas de conversion)"}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold text-slate-700">Type d&apos;achat</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {TYPE_ACHAT.map((t) => (
                <label key={t.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50">
                  <input
                    type="radio"
                    name="typeAchat"
                    value={t.id}
                    checked={typeAchat === t.id}
                    onChange={(e) => setTypeAchat(e.target.value)}
                    className="mt-1 rounded-full border-slate-300 text-accent-600 focus:ring-accent-500"
                  />
                  <span className="text-sm font-medium text-slate-800">{t.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                label="Conteneur"
                placeholder="N° ou référence conteneur (obligatoire si vrac ou conteneur)"
                value={conteneur}
                onChange={(e) => setConteneur(e.target.value)}
              />
              {typeAchat === "VRAC" && (
                <Input
                  label="Navire *"
                  placeholder="Nom du navire (obligatoire pour achat en vrac)"
                  value={navire}
                  onChange={(e) => setNavire(e.target.value)}
                />
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-600">Achat enregistré. (Connexion backend à prévoir.)</p>}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>{loading ? "Enregistrement…" : "Enregistrer l'achat"}</Button>
            <Link href="/dashboard"><Button type="button" variant="outline">Annuler</Button></Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
