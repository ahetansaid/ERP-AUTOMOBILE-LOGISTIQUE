"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { PurchaseListItem, PurchaseDetail, PurchaseVehicleItem, PurchaseVehicleInDetail } from "@/types/purchase";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

/** Aligne un objet achat brut (GET /purchases) sur PurchaseListItem. */
function pickPurchase(p: Record<string, unknown>): PurchaseListItem {
  const rawVehicles = p.vehicles ?? p.vehicules;
  const vehicleCount =
    (p.vehicle_count as number) ??
    (p.vehicleCount as number) ??
    (Array.isArray(rawVehicles) ? rawVehicles.length : 0) ??
    0;
  const supplierName =
    (p.supplier_name as string) ?? (p.fournisseurNom as string) ?? "";
  return {
    id: (p.id as number) ?? 0,
    supplier_name: supplierName || undefined,
    purchase_date: (p.purchase_date as string) ?? (p.dateAchat as string),
    container_reference: (p.container_reference as string) ?? (p.conteneur as string),
    vessel: (p.vessel as string) ?? (p.navire as string),
    vehicle_count: vehicleCount,
    status: (p.status as PurchaseListItem["status"]) ?? (p.statut as PurchaseListItem["status"]) ?? "EN_COURS",
  };
}

/** Modifier / Supprimer / Valider arrivée uniquement si l'achat est en cours. */
function canEditOrDelete(p: PurchaseListItem): boolean {
  return (p.status ?? "") === "EN_COURS";
}

const actionsSelectClass =
  "w-full min-w-[140px] rounded-xl border border-slate-300 bg-white px-3 py-2 pr-8 text-sm text-slate-700 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";

const STATUT_LABEL: Record<string, string> = {
  EN_COURS: "En cours",
  ARRIVE: "Arrivé",
};

export default function AchatsPage() {
  const router = useRouter();
  const [list, setList] = useState<PurchaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalCreate, setModalCreate] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ id: number; reason: string } | null>(null);
  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [editPurchaseId, setEditPurchaseId] = useState<number | null>(null);

  const fetchList = useCallback(async () => {
    try {
      setError(null);
      const res = await apiGet<{ purchases?: PurchaseListItem[] }>("/purchases");
      const raw = (Array.isArray(res) ? res : (res?.purchases ?? [])) as Record<string, unknown>[];
      setList(raw.map((p) => pickPurchase(p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    fetchList();
  }, [fetchList]);

  const handleValidateArrival = async (id: number) => {
    try {
      setValidatingId(id);
      await apiPatch(`/purchases/${id}/arrive`, {});
      await fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur validation");
    } finally {
      setValidatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal || !deleteModal.reason.trim()) return;
    try {
      await apiDelete(`/purchases/${deleteModal.id}`, {
        body: JSON.stringify({ reason: deleteModal.reason }),
      } as RequestInit & { skipAuth?: boolean });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur suppression");
    }
    setDeleteModal(null);
    fetchList();
  };

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const filtered = list.filter(
    (p) =>
      !search ||
      (p.supplier_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.container_reference ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.vessel ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion des achats</h1>
          <p className="mt-1 text-slate-600">
            Gérez vos achats de véhicules et suivez leur arrivée.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { setLoading(true); fetchList(); }}>
            Rafraîchir
          </Button>
          <Button onClick={() => setModalCreate(true)}>+ Nouvel achat</Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <Card className="flex-1 border-l-4 border-l-blue-500">
          <p className="text-sm font-medium text-slate-500">Total achats</p>
          <p className="text-2xl font-semibold text-slate-900">{list.length}</p>
        </Card>
        <Card className="flex-1 border-l-4 border-l-amber-500">
          <p className="text-sm font-medium text-slate-500">En cours</p>
          <p className="text-2xl font-semibold text-slate-900">
            {list.filter((p) => p.status === "EN_COURS").length}
          </p>
        </Card>
        <Card className="flex-1 border-l-4 border-l-green-500">
          <p className="text-sm font-medium text-slate-500">Arrivés</p>
          <p className="text-2xl font-semibold text-slate-900">
            {list.filter((p) => p.status === "ARRIVE").length}
          </p>
        </Card>
      </div>

      <Input
        placeholder="Rechercher par fournisseur, conteneur, navire..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <Card title="Liste des achats">
        {loading ? (
          <p className="py-8 text-center text-slate-500">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-slate-500">Aucun achat.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-600">
                  <th className="p-3 font-medium">Fournisseur</th>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Conteneur</th>
                  <th className="p-3 font-medium">Navire</th>
                  <th className="p-3 font-medium">Véhicules</th>
                  <th className="p-3 font-medium">Statut</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50"
                  >
                    <td className="p-3 font-medium">
                      {p.supplier_name && p.supplier_name !== "Inconnu"
                        ? p.supplier_name
                        : "—"}
                    </td>
                    <td className="p-3">
                      {p.purchase_date
                        ? new Date(p.purchase_date).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                    <td className="p-3">{p.container_reference ?? "—"}</td>
                    <td className="p-3">{p.vessel ?? "—"}</td>
                    <td className="p-3">
                      {typeof p.vehicle_count === "number" ? p.vehicle_count : 0} véhicule(s)
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          p.status === "ARRIVE" ? "success" : "warning"
                        }
                      >
                        {STATUT_LABEL[p.status ?? ""] ?? p.status ?? "—"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <select
                        className={actionsSelectClass}
                        value=""
                        onChange={(e) => {
                          const v = e.target.value;
                          e.target.value = "";
                          if (v === "detail") router.push(`/supply-chain/achats/${p.id}`);
                          else if (v === "edit") setEditPurchaseId(p.id);
                          else if (v === "arrive") handleValidateArrival(p.id);
                          else if (v === "delete") setDeleteModal({ id: p.id, reason: "" });
                        }}
                        title={!canEditOrDelete(p) ? "Modifier/Supprimer réservés aux achats en cours" : undefined}
                      >
                        <option value="" disabled>Actions</option>
                        <option value="detail">Voir détail</option>
                        <option value="edit" disabled={!canEditOrDelete(p)}>Modifier</option>
                        <option value="arrive" disabled={!canEditOrDelete(p) || validatingId === p.id}>
                          {validatingId === p.id ? "Validation…" : "Valider arrivée"}
                        </option>
                        <option value="delete" disabled={!canEditOrDelete(p)}>Supprimer</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modalCreate && (
        <ModalNouvelAchat
          onClose={() => setModalCreate(false)}
          onSuccess={() => {
            setModalCreate(false);
            fetchList();
          }}
        />
      )}

      {editPurchaseId != null && (
        <ModalModifierAchat
          purchaseId={editPurchaseId}
          onClose={() => setEditPurchaseId(null)}
          onSuccess={() => { setEditPurchaseId(null); fetchList(); }}
        />
      )}

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-4 w-full max-w-md">
            <h3 className="text-lg font-semibold">Supprimer l&apos;achat</h3>
            <p className="mt-2 text-sm text-slate-600">
              Motif obligatoire pour traçabilité.
            </p>
            <Input
              label="Motif"
              value={deleteModal.reason}
              onChange={(e) =>
                setDeleteModal((m) => (m ? { ...m, reason: e.target.value } : null))
              }
              placeholder="Ex: doublon, annulation"
              className="mt-3"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setDeleteModal(null)}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={!deleteModal.reason.trim()}
              >
                Supprimer
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function ModalNouvelAchat({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [fournisseurNom, setFournisseurNom] = useState("");
  const [dateAchat, setDateAchat] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [conteneur, setConteneur] = useState("");
  const [navire, setNavire] = useState("");
  const [devise, setDevise] = useState("USD");
  const [typeAchat, setTypeAchat] = useState<"VRAC" | "CONTENEUR">("VRAC");
  const [tauxUsd, setTauxUsd] = useState(600);
  const [tauxEur, setTauxEur] = useState(655);
  const [vehicules, setVehicules] = useState<PurchaseVehicleItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const addVehicle = () => {
    setVehicules((v) => [
      ...v,
      {
        vin: "",
        marque: "",
        modele: "",
        couleur: "",
        annee: new Date().getFullYear(),
        typeVehicule: "OCCASION",
        prix: 0,
        devise,
        montantFCFA: 0,
      },
    ]);
  };

  const updateVehicle = (index: number, field: keyof PurchaseVehicleItem, value: string | number) => {
    setVehicules((v) => {
      const out = [...v];
      (out[index] as unknown as Record<string, unknown>)[field] = value;
      const rate = devise === "USD" ? tauxUsd : tauxEur;
      if (field === "prix" && typeof value === "number") {
        out[index].montantFCFA = value * rate;
      }
      return out;
    });
  };

  const removeVehicle = (index: number) => {
    setVehicules((v) => v.filter((_, i) => i !== index));
  };

  const getTaux = () => (devise === "USD" ? tauxUsd : tauxEur);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const vinOk = vehicules.every((v) => v.vin.trim());
    const marqueOk = vehicules.every((v) => v.marque.trim());
    if (!vinOk || !marqueOk) {
      setErr("VIN et Marque obligatoires pour chaque véhicule.");
      return;
    }
    if (!fournisseurNom.trim()) {
      setErr("Le fournisseur est obligatoire.");
      return;
    }
    setSaving(true);
    try {
      await apiPost<{ purchase?: unknown }>("/purchases", {
        fournisseurNom: fournisseurNom.trim(),
        dateAchat,
        conteneur: conteneur || undefined,
        navire: navire || undefined,
        currency: devise,
        typeAchat,
        statut: "EN_COURS",
        vehicules: vehicules.map((v) => {
          const fcfa = v.montantFCFA || v.prix * getTaux();
          return {
            vin: v.vin,
            marque: v.marque,
            modele: v.modele ?? undefined,
            couleur: v.couleur ?? undefined,
            annee: v.annee,
            purchase_price: v.prix,
            prix: v.prix,
            montantFCFA: fcfa,
            purchase_price_fcfa: fcfa,
          };
        }),
      });
      onSuccess();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur création");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <Card className="my-8 w-full max-w-5xl">
        <h2 className="text-xl font-semibold">Nouvel achat</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Fournisseur *"
              placeholder="Saisir le nom du fournisseur"
              value={fournisseurNom}
              onChange={(e) => setFournisseurNom(e.target.value)}
              required
              className="min-w-0"
            />
            <Input
              label="Date achat *"
              type="date"
              value={dateAchat}
              onChange={(e) => setDateAchat(e.target.value)}
              required
              className="min-w-0"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Conteneur"
              value={conteneur}
              onChange={(e) => setConteneur(e.target.value)}
              placeholder="Réf. conteneur"
              className="min-w-0"
            />
            <Input
              label="Navire"
              value={navire}
              onChange={(e) => setNavire(e.target.value)}
              placeholder="Nom du navire"
              className="min-w-0"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Type d&apos;achat
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={typeAchat}
                onChange={(e) =>
                  setTypeAchat(e.target.value as "VRAC" | "CONTENEUR")
                }
              >
                <option value="VRAC">Vrac</option>
                <option value="CONTENEUR">Conteneur</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Devise
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={devise}
                onChange={(e) => setDevise(e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div className="rounded bg-slate-50 p-3 text-sm text-slate-600">
            Taux indicatif : 1 USD = {tauxUsd} FCFA · 1 EUR = {tauxEur} FCFA
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Taux 1 USD (FCFA)"
              type="number"
              min={1}
              value={tauxUsd}
              onChange={(e) => setTauxUsd(Number(e.target.value) || 600)}
            />
            <Input
              label="Taux 1 EUR (FCFA)"
              type="number"
              min={1}
              value={tauxEur}
              onChange={(e) => setTauxEur(Number(e.target.value) || 655)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Véhicules *
              </span>
              <Button type="button" variant="secondary" size="sm" onClick={addVehicle}>
                + Ajouter un véhicule
              </Button>
            </div>
            {vehicules.map((v, i) => (
              <div
                key={i}
                className="mt-4 grid gap-4 rounded-xl border border-slate-200 p-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
              >
                <Input
                  placeholder="VIN *"
                  value={v.vin}
                  onChange={(e) => updateVehicle(i, "vin", e.target.value)}
                  className="min-w-0"
                />
                <Input
                  placeholder="Marque *"
                  value={v.marque}
                  onChange={(e) => updateVehicle(i, "marque", e.target.value)}
                  className="min-w-0"
                />
                <Input
                  placeholder="Modèle"
                  value={v.modele ?? ""}
                  onChange={(e) => updateVehicle(i, "modele", e.target.value)}
                  className="min-w-0"
                />
                <Input
                  placeholder="Couleur"
                  value={v.couleur ?? ""}
                  onChange={(e) => updateVehicle(i, "couleur", e.target.value)}
                  className="min-w-0"
                />
                <Input
                  placeholder="Année"
                  type="number"
                  value={v.annee || ""}
                  onChange={(e) =>
                    updateVehicle(i, "annee", Number(e.target.value) || 0)
                  }
                  className="min-w-0"
                />
                <div className="min-w-0">
                  <label className="sr-only">Type</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    value={v.typeVehicule}
                    onChange={(e) =>
                      updateVehicle(i, "typeVehicule", e.target.value as PurchaseVehicleItem["typeVehicule"])
                    }
                  >
                    <option value="OCCASION">Occasion</option>
                    <option value="NEUF">Neuf</option>
                  </select>
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:col-span-1">
                  <Input
                    placeholder="Prix"
                    type="number"
                    min={0}
                    value={v.prix || ""}
                    onChange={(e) =>
                      updateVehicle(i, "prix", Number(e.target.value) || 0)
                    }
                    className="min-w-0 flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeVehicle(i)}
                    className="shrink-0 rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    aria-label="Supprimer"
                  >
                    ×
                  </button>
                </div>
                <div className="text-xs text-slate-500 sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-6">
                  {v.prix ? `${(v.montantFCFA || v.prix * getTaux()).toLocaleString("fr-FR")} FCFA` : ""}
                </div>
              </div>
            ))}
          </div>

          {err && (
            <p className="text-sm text-red-600">{err}</p>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving || vehicules.length === 0}>
              {saving ? "Création…" : "Créer achat"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function ModalModifierAchat({
  purchaseId,
  onClose,
  onSuccess,
}: {
  purchaseId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [fournisseurNom, setFournisseurNom] = useState("");
  const [dateAchat, setDateAchat] = useState("");
  const [conteneur, setConteneur] = useState("");
  const [navire, setNavire] = useState("");
  const [devise, setDevise] = useState("USD");
  const [typeAchat, setTypeAchat] = useState<"VRAC" | "CONTENEUR">("VRAC");
  const [tauxUsd, setTauxUsd] = useState(600);
  const [tauxEur, setTauxEur] = useState(655);
  const [vehicules, setVehicules] = useState<PurchaseVehicleItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadErr(null);
      setLoadingDetail(true);
      try {
        const res = await apiGet<{ purchase?: PurchaseDetail; vehicles?: PurchaseVehicleInDetail[] }>(
          `/purchases/${purchaseId}`
        );
        if (cancelled) return;
        const p = (res as { purchase?: PurchaseDetail }).purchase ?? (res as PurchaseDetail);
        const vehicles = (res as { vehicles?: PurchaseVehicleInDetail[] }).vehicles ?? p?.vehicles ?? [];
        const supplierName = p?.supplier_name ?? (p as unknown as Record<string, string>)?.fournisseurNom ?? "";
        const purchaseDate = p?.purchase_date ?? (p as unknown as Record<string, string>)?.dateAchat ?? "";
        setFournisseurNom(supplierName);
        setDateAchat(purchaseDate && purchaseDate.length >= 10 ? purchaseDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
        setConteneur(p?.container_reference ?? (p as unknown as Record<string, string>)?.conteneur ?? "");
        setNavire(p?.vessel ?? (p as unknown as Record<string, string>)?.navire ?? "");
        setDevise((p?.currency ?? (p as unknown as Record<string, string>)?.devise) || "USD");
        setTypeAchat((p?.type_achat === "CONTENEUR" ? "CONTENEUR" : "VRAC") as "VRAC" | "CONTENEUR");
        setVehicules(
          vehicles.map((v) => {
            const raw = v as unknown as Record<string, unknown>;
            const prix = (raw.purchase_price as number) ?? (raw.prix as number) ?? 0;
            const rate = (raw.currency ?? (p as unknown as Record<string, string>)?.currency ?? "USD") === "EUR" ? 655 : 600;
            return {
              vin: v.vin ?? "",
              marque: (v.brand as string) ?? "",
              modele: (v.model as string) ?? "",
              couleur: (v.color as string) ?? "",
              annee: (v.year as number) ?? new Date().getFullYear(),
              typeVehicule: "OCCASION" as const,
              prix,
              devise: (p as unknown as Record<string, string>)?.currency ?? "USD",
              montantFCFA: prix * rate,
            };
          })
        );
      } catch (e) {
        if (!cancelled) setLoadErr(e instanceof Error ? e.message : "Erreur chargement");
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => { cancelled = true; };
  }, [purchaseId]);

  const updateVehicle = (index: number, field: keyof PurchaseVehicleItem, value: string | number) => {
    setVehicules((v) => {
      const out = [...v];
      (out[index] as unknown as Record<string, unknown>)[field] = value;
      const rate = devise === "USD" ? tauxUsd : tauxEur;
      if (field === "prix" && typeof value === "number") {
        out[index].montantFCFA = value * rate;
      }
      return out;
    });
  };

  const removeVehicle = (index: number) => {
    setVehicules((v) => v.filter((_, i) => i !== index));
  };

  const addVehicle = () => {
    setVehicules((v) => [
      ...v,
      {
        vin: "",
        marque: "",
        modele: "",
        couleur: "",
        annee: new Date().getFullYear(),
        typeVehicule: "OCCASION",
        prix: 0,
        devise,
        montantFCFA: 0,
      },
    ]);
  };

  const getTaux = () => (devise === "USD" ? tauxUsd : tauxEur);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErr(null);
    if (!fournisseurNom.trim()) {
      setSubmitErr("Le fournisseur est obligatoire.");
      return;
    }
    const vinOk = vehicules.every((v) => v.vin.trim());
    const marqueOk = vehicules.every((v) => v.marque.trim());
    if (!vinOk || !marqueOk) {
      setSubmitErr("VIN et Marque obligatoires pour chaque véhicule.");
      return;
    }
    setSaving(true);
    try {
      const payloadVehicules = vehicules.map((v) => {
        const fcfa = v.montantFCFA || v.prix * getTaux();
        return {
          vin: v.vin,
          marque: v.marque,
          modele: v.modele ?? undefined,
          couleur: v.couleur ?? undefined,
          annee: v.annee,
          purchase_price: v.prix,
          prix: v.prix,
          montantFCFA: fcfa,
          purchase_price_fcfa: fcfa,
        };
      });
      await apiPatch(`/purchases/${purchaseId}`, {
        fournisseurNom: fournisseurNom.trim(),
        dateAchat,
        conteneur: conteneur || undefined,
        navire: navire || undefined,
        currency: devise,
        typeAchat,
        vehicules: payloadVehicules,
      });
      onSuccess();
    } catch (e) {
      setSubmitErr(e instanceof Error ? e.message : "Erreur modification");
    } finally {
      setSaving(false);
    }
  };

  if (loadingDetail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <Card className="max-w-md">
          <p className="py-6 text-center text-slate-500">Chargement de l&apos;achat…</p>
        </Card>
      </div>
    );
  }

  if (loadErr) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <Card className="max-w-md">
          <p className="py-4 text-red-600">{loadErr}</p>
          <Button variant="secondary" onClick={onClose}>Fermer</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <Card className="my-8 w-full max-w-5xl">
        <h2 className="text-xl font-semibold">Modifier l&apos;achat #{purchaseId}</h2>
        <p className="mt-1 text-sm text-slate-600">Uniquement pour les achats en cours.</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {submitErr && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{submitErr}</div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Fournisseur *" placeholder="Nom du fournisseur" value={fournisseurNom} onChange={(e) => setFournisseurNom(e.target.value)} required className="min-w-0" />
            <Input label="Date achat *" type="date" value={dateAchat} onChange={(e) => setDateAchat(e.target.value)} required className="min-w-0" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Conteneur" value={conteneur} onChange={(e) => setConteneur(e.target.value)} placeholder="Réf. conteneur" className="min-w-0" />
            <Input label="Navire" value={navire} onChange={(e) => setNavire(e.target.value)} placeholder="Nom du navire" className="min-w-0" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type d&apos;achat</label>
              <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={typeAchat} onChange={(e) => setTypeAchat(e.target.value as "VRAC" | "CONTENEUR")}>
                <option value="VRAC">Vrac</option>
                <option value="CONTENEUR">Conteneur</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Devise</label>
              <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={devise} onChange={(e) => setDevise(e.target.value)}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Taux 1 USD (FCFA)" type="number" min={1} value={tauxUsd} onChange={(e) => setTauxUsd(Number(e.target.value) || 600)} />
            <Input label="Taux 1 EUR (FCFA)" type="number" min={1} value={tauxEur} onChange={(e) => setTauxEur(Number(e.target.value) || 655)} />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Véhicules *</span>
              <Button type="button" variant="secondary" size="sm" onClick={addVehicle}>+ Ajouter un véhicule</Button>
            </div>
            {vehicules.map((v, i) => (
              <div key={i} className="mt-4 grid gap-4 rounded-xl border border-slate-200 p-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                <Input placeholder="VIN *" value={v.vin} onChange={(e) => updateVehicle(i, "vin", e.target.value)} className="min-w-0" />
                <Input placeholder="Marque *" value={v.marque} onChange={(e) => updateVehicle(i, "marque", e.target.value)} className="min-w-0" />
                <Input placeholder="Modèle" value={v.modele ?? ""} onChange={(e) => updateVehicle(i, "modele", e.target.value)} className="min-w-0" />
                <Input placeholder="Couleur" value={v.couleur ?? ""} onChange={(e) => updateVehicle(i, "couleur", e.target.value)} className="min-w-0" />
                <Input placeholder="Année" type="number" value={v.annee || ""} onChange={(e) => updateVehicle(i, "annee", Number(e.target.value) || 0)} className="min-w-0" />
                <div className="min-w-0">
                  <label className="sr-only">Type</label>
                  <select className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" value={v.typeVehicule} onChange={(e) => updateVehicle(i, "typeVehicule", e.target.value as PurchaseVehicleItem["typeVehicule"])}>
                    <option value="OCCASION">Occasion</option>
                    <option value="NEUF">Neuf</option>
                  </select>
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:col-span-1">
                  <Input placeholder="Prix" type="number" min={0} value={v.prix || ""} onChange={(e) => updateVehicle(i, "prix", Number(e.target.value) || 0)} className="min-w-0 flex-1" />
                  <button type="button" onClick={() => removeVehicle(i)} className="shrink-0 rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" aria-label="Supprimer">×</button>
                </div>
                <div className="text-xs text-slate-500 sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-6">
                  {v.prix ? `${(v.montantFCFA || v.prix * getTaux()).toLocaleString("fr-FR")} FCFA` : ""}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={saving || vehicules.length === 0}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
