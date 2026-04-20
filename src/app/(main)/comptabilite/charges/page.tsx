"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import type { ChargeListItem } from "@/types/compta";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const CATEGORIES = ["CARBURANT", "PEAGE", "REPARATION", "TRANSPORT", "DOUANE", "AUTRE"];

function pickCharge(r: Record<string, unknown>): ChargeListItem {
  return {
    id: (r.id as number) ?? 0,
    label: (r.label as string) ?? (r.libelle as string),
    category: (r.category as string) ?? (r.charge_category as string),
    amount: (r.amount as number) ?? (r.montant as number),
    charge_date: (r.charge_date as string) ?? (r.date as string),
  };
}

export default function ChargesPage() {
  const [list, setList] = useState<ChargeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ id: number; reason: string } | null>(null);
  const [filterCat, setFilterCat] = useState("");

  const fetchList = useCallback(async () => {
    try {
      setError(null);
      const res = await apiGet<{ charges?: unknown[] }>("/charges");
      const raw = (res as { charges?: unknown[] })?.charges ?? [];
      setList((raw as Record<string, unknown>[]).map(pickCharge));
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

  const filtered = filterCat ? list.filter((c) => (c.category ?? "") === filterCat) : list;

  const handleDelete = async () => {
    if (!deleteModal?.reason.trim()) return;
    try {
      await apiDelete(`/charges/${deleteModal.id}`, {
        body: JSON.stringify({ reason: deleteModal.reason }),
      } as RequestInit & { skipAuth?: boolean });
      setDeleteModal(null);
      fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur suppression");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Charges</h1>
          <p className="mt-1 text-slate-600">Enregistrement et suivi des charges.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Nouvelle charge</Button>
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <span>Catégorie</span>
          <select
            className="rounded border border-slate-300 px-2 py-1"
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option value="">Toutes</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <Card title="Liste des charges">
        {loading ? (
          <p className="py-8 text-center text-slate-500">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-slate-500">Aucune charge.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-600">
                  <th className="p-3 font-medium">Libellé</th>
                  <th className="p-3 font-medium">Catégorie</th>
                  <th className="p-3 font-medium">Montant (FCFA)</th>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100">
                    <td className="p-3">{c.label ?? "—"}</td>
                    <td className="p-3">{c.category ?? "—"}</td>
                    <td className="p-3">
                      {c.amount != null ? c.amount.toLocaleString("fr-FR") : "—"}
                    </td>
                    <td className="p-3">
                      {c.charge_date ? new Date(c.charge_date).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm" onClick={() => setDeleteModal({ id: c.id, reason: "" })}>
                        Supprimer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {modalOpen && (
        <ModalCharge onClose={() => setModalOpen(false)} onSuccess={() => { setModalOpen(false); fetchList(); }} />
      )}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <h3 className="text-lg font-semibold">Supprimer la charge</h3>
            <p className="mt-2 text-sm text-slate-600">Motif obligatoire.</p>
            <Input
              label="Motif"
              value={deleteModal.reason}
              onChange={(e) => setDeleteModal((m) => (m ? { ...m, reason: e.target.value } : null))}
              className="mt-3"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteModal(null)}>Annuler</Button>
              <Button variant="danger" onClick={handleDelete} disabled={!deleteModal.reason.trim()}>Supprimer</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function ModalCharge({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("AUTRE");
  const [amount, setAmount] = useState("");
  const [chargeDate, setChargeDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (Number.isNaN(val) || val < 0) return;
    setSaving(true);
    try {
      await apiPost("/charges", { label: label || undefined, category, amount: val, chargeDate });
      onSuccess();
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-semibold">Nouvelle charge</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input label="Libellé" value={label} onChange={(e) => setLabel(e.target.value)} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Catégorie</label>
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input label="Montant (FCFA)" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <Input label="Date" type="date" value={chargeDate} onChange={(e) => setChargeDate(e.target.value)} required />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
