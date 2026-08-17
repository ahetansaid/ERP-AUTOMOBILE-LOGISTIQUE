"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { escapeHtml } from "@/lib/records";
import type { DevisListItem } from "@/types/compta";
import type { VehicleListItem } from "@/types/vehicle";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

function pickDevis(r: Record<string, unknown>): DevisListItem {
  return {
    id: (r.id as number) ?? 0,
    vehicle_id: (r.vehicle_id as number) ?? (r.vehicleId as number),
    prestataire: (r.prestataire as string) ?? "",
    amount: (r.amount as number) ?? (r.montant as number),
    currency: (r.currency as string) ?? "FCFA",
    description: (r.description as string) ?? "",
    valid_until: (r.valid_until as string) ?? (r.validUntil as string),
    status: (r.status as string) ?? "",
    vin: (r.vin as string) ?? "",
    brand: (r.brand as string) ?? (r.marque as string),
    model: (r.model as string) ?? (r.modele as string),
  };
}

/** Devis modifiable/supprimable uniquement si non clôturé (statut ≠ TERMINE / Clôturé). */
function canEditOrDelete(d: DevisListItem): boolean {
  return (d.status ?? "") !== "TERMINE";
}

/** Libellé statut devis : En cours, Non clôturé, Clôturé (aligné processus atelier). */
function devisStatutLabel(status: string | undefined): string {
  const s = (status ?? "").toUpperCase();
  if (s === "TERMINE" || s === "CLOTURE" || s === "CLÔTURÉ") return "Clôturé";
  if (s === "ACCEPTE" || s === "ACCEPTÉ") return "Non clôturé";
  if (s === "REFUSE" || s === "REFUSÉ") return "Refusé";
  return "En cours";
}

function openDevisPrint(d: DevisListItem) {
  const dateStr = d.valid_until ? new Date(d.valid_until).toLocaleDateString("fr-FR") : "—";
  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Devis #${escapeHtml(d.id)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:520px;margin:2rem auto;padding:1rem;}
h1{font-size:1.25rem;border-bottom:1px solid #ccc;padding-bottom:0.5rem;}
p{margin:0.35rem 0;} strong{display:inline-block;min-width:10rem;}
</style></head><body>
<h1>Devis maintenance — ParcAuto Manager</h1>
<p><strong>N° devis :</strong> ${escapeHtml(d.id)}</p>
<p><strong>Véhicule :</strong> ${escapeHtml(d.vin ?? "—")} ${escapeHtml(d.brand ?? "")} ${escapeHtml(d.model ?? "")}</p>
<p><strong>Prestataire :</strong> ${escapeHtml(d.prestataire ?? "—")}</p>
<p><strong>Montant :</strong> ${d.amount != null ? d.amount.toLocaleString("fr-FR") : "—"} ${escapeHtml(d.currency ?? "FCFA")}</p>
<p><strong>Valide jusqu'au :</strong> ${dateStr}</p>
<p><strong>Statut :</strong> ${escapeHtml(d.status ?? "—")}</p>
<p><strong>Description :</strong> ${escapeHtml(d.description ?? "—")}</p>
<p style="margin-top:2rem;font-size:0.875rem;color:#666;">Document généré le ${new Date().toLocaleString("fr-FR")}</p>
</body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); w.focus(); }
}

const actionsSelectClass =
  "w-full min-w-[140px] rounded-xl border border-slate-300 bg-white px-3 py-2 pr-8 text-sm text-slate-700 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";

export default function DevisPage() {
  const router = useRouter();
  const [list, setList] = useState<DevisListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [editDevis, setEditDevis] = useState<DevisListItem | null>(null);
  const [deleteDevis, setDeleteDevis] = useState<{ devis: DevisListItem; reason: string } | null>(null);

  const fetchList = useCallback(async () => {
    try {
      setError(null);
      const res = await apiGet<{ workshopQuotes?: unknown[] }>("/devis");
      const raw = (res as { workshopQuotes?: unknown[] })?.workshopQuotes ?? [];
      setList((raw as Record<string, unknown>[]).map(pickDevis));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const filtered = filterStatus
    ? list.filter((d) => (d.status ?? "") === filterStatus)
    : list;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Devis (maintenance)</h1>
          <p className="mt-1 text-slate-600">
            Devis atelier liés aux véhicules en maintenance.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Nouveau devis</Button>
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      <div className="flex gap-4">
        <select
          className="rounded border border-slate-300 px-2 py-1 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="EN_ATTENTE">En cours</option>
          <option value="ACCEPTE">Non clôturé</option>
          <option value="REFUSE">Refusé</option>
          <option value="TERMINE">Clôturé</option>
        </select>
      </div>
      <Card title="Liste des devis">
        {loading ? (
          <p className="py-8 text-center text-slate-500">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-slate-500">Aucun devis.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-600">
                  <th className="p-3 font-medium">Véhicule</th>
                  <th className="p-3 font-medium">Prestataire</th>
                  <th className="p-3 font-medium">Montant</th>
                  <th className="p-3 font-medium">Validité</th>
                  <th className="p-3 font-medium">Statut</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100">
                    <td className="p-3">
                      {d.vin ?? "—"} {d.brand ? ` ${d.brand} ${d.model ?? ""}` : ""}
                    </td>
                    <td className="p-3">{d.prestataire ?? "—"}</td>
                    <td className="p-3">
                      {d.amount != null
                        ? d.amount.toLocaleString("fr-FR") + " " + (d.currency ?? "FCFA")
                        : "—"}
                    </td>
                    <td className="p-3">
                      {d.valid_until
                        ? new Date(d.valid_until).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                    <td className="p-3">
                      <Badge variant={d.status?.toUpperCase() === "TERMINE" ? "success" : undefined}>{devisStatutLabel(d.status)}</Badge>
                    </td>
                    <td className="p-3">
                      <select
                        className={actionsSelectClass}
                        value=""
                        onChange={(e) => {
                          const v = e.target.value;
                          e.target.value = "";
                          if (v === "fiche") router.push(`/comptabilite/devis/${d.id}`);
                          else if (v === "receipt") router.push(`/comptabilite/recus?devisId=${d.id}`);
                          else if (v === "download") openDevisPrint(d);
                          else if (v === "edit") setEditDevis(d);
                          else if (v === "delete") setDeleteDevis({ devis: d, reason: "" });
                        }}
                        title={!canEditOrDelete(d) ? "Un reçu a déjà été émis pour ce devis" : undefined}
                      >
                        <option value="" disabled>Actions</option>
                        <option value="fiche">Voir fiche</option>
                        <option value="receipt">Émettre un reçu</option>
                        <option value="download">Télécharger</option>
                        <option value="edit" disabled={!canEditOrDelete(d)}>Modifier</option>
                        <option value="delete" disabled={!canEditOrDelete(d)}>Supprimer</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modalOpen && (
        <ModalDevis
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            fetchList();
          }}
        />
      )}

      {editDevis && (
        <ModalModifierDevis
          devis={editDevis}
          onClose={() => setEditDevis(null)}
          onSuccess={() => { setEditDevis(null); fetchList(); }}
        />
      )}

      {deleteDevis && (
        <ModalSupprimerDevis
          devis={deleteDevis.devis}
          reason={deleteDevis.reason}
          onReasonChange={(reason) => setDeleteDevis((prev) => (prev ? { ...prev, reason } : null))}
          onClose={() => setDeleteDevis(null)}
          onConfirm={async () => {
            if (!deleteDevis.reason.trim()) return;
            await apiDelete(`/devis/${deleteDevis.devis.id}`, {
              body: JSON.stringify({ reason: deleteDevis.reason.trim() }),
            } as RequestInit & { skipAuth?: boolean });
            setDeleteDevis(null);
            fetchList();
          }}
        />
      )}
    </div>
  );
}

function ModalDevis({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [prestataire, setPrestataire] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet<{ data?: unknown[] }>("/vehicles?status=EN_MAINTENANCE");
        const raw = Array.isArray(res) ? res : (res as { data?: unknown[] })?.data ?? [];
        setVehicles(
          (raw as Record<string, unknown>[]).map((r) => ({
            id: (r.id as number) ?? 0,
            vin: (r.vin as string) ?? "",
            brand: (r.brand as string) ?? "",
            model: (r.model as string) ?? "",
          }))
        );
        if (raw.length && !vehicleId)
          setVehicleId(String((raw[0] as Record<string, unknown>).id));
      } catch {
        setVehicles([]);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (Number.isNaN(val) || val < 0 || !vehicleId) return;
    setSaving(true);
    try {
      await apiPost("/devis", {
        vehicleId: Number(vehicleId),
        prestataire: prestataire || undefined,
        amount: val,
        currency: "FCFA",
        description: description || undefined,
        validUntil: validUntil || undefined,
      });
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-semibold">Nouveau devis (maintenance)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Uniquement pour véhicules en maintenance.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Véhicule *
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              required
            >
              <option value="">—</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vin} — {v.brand} {v.model}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Prestataire"
            value={prestataire}
            onChange={(e) => setPrestataire(e.target.value)}
          />
          <Input
            label="Montant (FCFA) *"
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            label="Valide jusqu'au"
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : "Créer"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function ModalModifierDevis({
  devis,
  onClose,
  onSuccess,
}: {
  devis: DevisListItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [vehicleId, setVehicleId] = useState(String(devis.vehicle_id ?? ""));
  const [prestataire, setPrestataire] = useState(devis.prestataire ?? "");
  const [amount, setAmount] = useState(String(devis.amount ?? ""));
  const [description, setDescription] = useState(devis.description ?? "");
  const [validUntil, setValidUntil] = useState(
    devis.valid_until && devis.valid_until.length >= 10 ? devis.valid_until.slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet<{ data?: unknown[] }>("/vehicles?status=EN_MAINTENANCE");
        const raw = Array.isArray(res) ? res : (res as { data?: unknown[] })?.data ?? [];
        setVehicles(
          (raw as Record<string, unknown>[]).map((r) => ({
            id: (r.id as number) ?? 0,
            vin: (r.vin as string) ?? "",
            brand: (r.brand as string) ?? "",
            model: (r.model as string) ?? "",
          }))
        );
        if (!vehicleId && raw.length) setVehicleId(String((raw[0] as Record<string, unknown>).id));
      } catch {
        setVehicles([]);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const val = Number(amount);
    if (Number.isNaN(val) || val < 0) {
      setSubmitError("Montant invalide.");
      return;
    }
    setSaving(true);
    try {
      await apiPatch(`/devis/${devis.id}`, {
        vehicleId: Number(vehicleId) || devis.vehicle_id,
        prestataire: prestataire.trim() || undefined,
        amount: val,
        currency: "FCFA",
        description: description.trim() || undefined,
        validUntil: validUntil || undefined,
      });
      onSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erreur modification");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-semibold">Modifier le devis #{devis.id}</h2>
        <p className="mt-1 text-sm text-slate-600">VIN : {devis.vin ?? "—"}</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{submitError}</div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Véhicule *</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              required
            >
              <option value="">—</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.vin} — {v.brand} {v.model}</option>
              ))}
            </select>
          </div>
          <Input label="Prestataire" value={prestataire} onChange={(e) => setPrestataire(e.target.value)} />
          <Input label="Montant (FCFA) *" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input label="Valide jusqu'au" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function ModalSupprimerDevis({
  devis,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
}: {
  devis: DevisListItem;
  reason: string;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setErr("Le motif de suppression est obligatoire.");
      return;
    }
    setErr(null);
    setSubmitting(true);
    try {
      await onConfirm();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur lors de la suppression");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-semibold text-red-700">Supprimer le devis #{devis.id}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {devis.vin ?? "—"} — {devis.prestataire ?? "—"} — {devis.amount != null ? devis.amount.toLocaleString("fr-FR") + " FCFA" : "—"}
        </p>
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Motif de suppression *</label>
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={3}
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Ex : erreur de saisie, doublon..."
            required
          />
        </div>
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button variant="danger" onClick={handleConfirm} disabled={submitting || !reason.trim()}>
            {submitting ? "Suppression…" : "Confirmer la suppression"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
