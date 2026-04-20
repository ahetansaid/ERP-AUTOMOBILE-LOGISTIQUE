"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface ClientRow {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  status?: string;
}

function pickClient(r: Record<string, unknown>): ClientRow {
  return {
    id: (r.id as number) ?? 0,
    name: (r.name as string) ?? (r.nom as string),
    email: (r.email as string) ?? "",
    phone: (r.phone as string) ?? (r.telephone as string),
    address: (r.address as string) ?? (r.adresse as string),
    city: (r.city as string) ?? (r.ville as string),
    country: (r.country as string) ?? (r.pays as string),
    status: (r.status as string) ?? "",
  };
}

const actionsSelectClass =
  "w-full min-w-[140px] rounded-xl border border-slate-300 bg-white px-3 py-2 pr-8 text-sm text-slate-700 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";

export default function CRMPage() {
  const router = useRouter();
  const [list, setList] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<ClientRow | null>(null);
  const [deleteClient, setDeleteClient] = useState<{ client: ClientRow; reason: string } | null>(null);

  const fetchList = useCallback(async () => {
    try {
      setError(null);
      const res = await apiGet<{ clients?: unknown[] }>("/clients");
      const raw = (res as { clients?: unknown[] })?.clients ?? [];
      setList((raw as Record<string, unknown>[]).map(pickClient));
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

  const filtered = list.filter(
    (c) =>
      !search ||
      (c.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM Clients</h1>
          <p className="mt-1 text-slate-600">Fiches clients et historique.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Nouveau client</Button>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      <Input placeholder="Rechercher par nom, email, téléphone..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
      <Card title="Liste des clients">
        {loading ? <p className="py-8 text-center text-slate-500">Chargement…</p> : filtered.length === 0 ? <p className="py-8 text-center text-slate-500">Aucun client.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-600">
                  <th className="p-3 font-medium">Nom</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Téléphone</th>
                  <th className="p-3 font-medium">Ville / Pays</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100">
                    <td className="p-3 font-medium">{c.name ?? "—"}</td>
                    <td className="p-3">{c.email ?? "—"}</td>
                    <td className="p-3">{c.phone ?? "—"}</td>
                    <td className="p-3">{c.city ?? "—"} {c.country ? ` / ${c.country}` : ""}</td>
                    <td className="p-3">
                      <select
                        className={actionsSelectClass}
                        value=""
                        onChange={(e) => {
                          const v = e.target.value;
                          e.target.value = "";
                          if (v === "fiche") router.push(`/crm/${c.id}`);
                          else if (v === "edit") setEditClient(c);
                          else if (v === "delete") setDeleteClient({ client: c, reason: "" });
                        }}
                      >
                        <option value="" disabled>Actions</option>
                        <option value="fiche">Fiche 360°</option>
                        <option value="edit">Modifier</option>
                        <option value="delete">Supprimer</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {modalOpen && <ModalClient onClose={() => setModalOpen(false)} onSuccess={() => { setModalOpen(false); fetchList(); }} />}

      {editClient && (
        <ModalModifierClient
          client={editClient}
          onClose={() => setEditClient(null)}
          onSuccess={() => { setEditClient(null); fetchList(); }}
        />
      )}

      {deleteClient && (
        <ModalSupprimerClient
          client={deleteClient.client}
          reason={deleteClient.reason}
          onReasonChange={(reason) => setDeleteClient((prev) => (prev ? { ...prev, reason } : null))}
          onClose={() => setDeleteClient(null)}
          onConfirm={async () => {
            if (!deleteClient.reason.trim()) return;
            await apiDelete(`/clients/${deleteClient.client.id}`, {
              body: JSON.stringify({ reason: deleteClient.reason.trim() }),
            } as RequestInit & { skipAuth?: boolean });
            setDeleteClient(null);
            fetchList();
          }}
        />
      )}
    </div>
  );
}

function ModalClient({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await apiPost("/clients", { name: name.trim(), email: email || undefined, phone: phone || undefined, address: address || undefined, city: city || undefined, country: country || undefined });
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-semibold">Nouveau client</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input label="Nom / Raison sociale *" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="Adresse" value={address} onChange={(e) => setAddress(e.target.value)} />
          <Input label="Ville" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input label="Pays" value={country} onChange={(e) => setCountry(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Créer"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function ModalModifierClient({
  client,
  onClose,
  onSuccess,
}: {
  client: ClientRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(client.name ?? "");
  const [email, setEmail] = useState(client.email ?? "");
  const [phone, setPhone] = useState(client.phone ?? "");
  const [address, setAddress] = useState(client.address ?? "");
  const [city, setCity] = useState(client.city ?? "");
  const [country, setCountry] = useState(client.country ?? "");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setSubmitError("Le nom est obligatoire.");
      return;
    }
    setSubmitError(null);
    setSaving(true);
    try {
      await apiPatch(`/clients/${client.id}`, {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
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
        <h2 className="text-xl font-semibold">Modifier le client</h2>
        <p className="mt-1 text-sm text-slate-600">ID : {client.id}</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{submitError}</div>
          )}
          <Input label="Nom / Raison sociale *" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="Adresse" value={address} onChange={(e) => setAddress(e.target.value)} />
          <Input label="Ville" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input label="Pays" value={country} onChange={(e) => setCountry(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function ModalSupprimerClient({
  client,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
}: {
  client: ClientRow;
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
        <h2 className="text-xl font-semibold text-red-700">Supprimer le client</h2>
        <p className="mt-1 text-sm text-slate-600">{client.name ?? "—"} {client.email ? `(${client.email})` : ""}</p>
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Motif de suppression *</label>
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            rows={3}
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Ex : doublon, demande client..."
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
