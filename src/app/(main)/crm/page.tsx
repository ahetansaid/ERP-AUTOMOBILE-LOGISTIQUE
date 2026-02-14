"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { clientsApi } from "@/lib/services/api";
import { IconSearch } from "@/components/icons/NavIcons";
import { exportClientsCsv, printClientsAsPdf } from "@/lib/export-clients";
import type { Client } from "@/types";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CrmPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientSubmitting, setNewClientSubmitting] = useState(false);
  const [newClientError, setNewClientError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");

  useEffect(() => {
    let cancelled = false;
    clientsApi.list({ search: search || undefined })
      .then((res) => { if (!cancelled) setClients(res.data ?? []); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Erreur"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [search]);

  const listToExport = search ? clients : clients;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">CRM Clients</h1>
          <p className="mt-1 text-slate-500">Fiches clients et historique — export PDF ou Excel</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const blob = await clientsApi.export("csv");
                downloadBlob(blob, "clients_" + new Date().toISOString().slice(0, 10) + ".csv");
              } catch {
                exportClientsCsv(listToExport);
              }
            }}
            disabled={listToExport.length === 0}
          >
            Exporter Excel (CSV)
          </Button>
          <Button
            variant="outline"
            onClick={() => printClientsAsPdf(listToExport)}
            disabled={listToExport.length === 0}
          >
            Exporter PDF
          </Button>
          <Button onClick={() => setShowNewClientForm(!showNewClientForm)}>
            {showNewClientForm ? "Annuler" : "+ Nouveau client"}
          </Button>
        </div>
      </div>

      {showNewClientForm && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-800">Nouveau client</h2>
          <form
            className="mt-4 grid gap-4 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setNewClientError(null);
              setNewClientSubmitting(true);
              try {
                const created = await clientsApi.create({
                  name: newName.trim(),
                  email: newEmail.trim() || undefined,
                  phone: newPhone.trim() || undefined,
                  address: newAddress.trim() || undefined,
                });
                setClients((prev) => [created, ...prev]);
                setNewName("");
                setNewEmail("");
                setNewPhone("");
                setNewAddress("");
                setShowNewClientForm(false);
              } catch (err) {
                setNewClientError(err instanceof Error ? err.message : "Erreur lors de l'ajout");
              } finally {
                setNewClientSubmitting(false);
              }
            }}
          >
            <Input label="Nom *" value={newName} onChange={(e) => setNewName(e.target.value)} required />
            <Input label="Email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <Input label="Téléphone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
            <Input label="Adresse" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
            {newClientError && <p className="text-sm text-red-600 sm:col-span-2">{newClientError}</p>}
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={newClientSubmitting || !newName.trim()}>
                {newClientSubmitting ? "Enregistrement…" : "Enregistrer"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowNewClientForm(false)}>
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-5">
          <div className="relative max-w-md flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"><IconSearch /></span>
            <input
              type="search"
              placeholder="Rechercher un client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
          </div>
        </div>
        {loading && <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-200 border-t-accent-600" /></div>}
        {error && <p className="py-8 text-center text-red-600">{error}</p>}
        {!loading && !error && (
          <>
            <div className="table-container rounded-none border-0 shadow-none">
              <table>
                <thead>
                  <tr><th>Nom</th><th>Email</th><th>Téléphone</th><th className="text-right">Action</th></tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id}>
                      <td className="font-medium">{c.name}</td>
                      <td>{c.email ?? "—"}</td>
                      <td>{c.phone ?? "—"}</td>
                      <td className="text-right">
                        <Link href={`/crm/${c.id}`} className="font-medium text-accent-600 hover:text-accent-700 hover:underline">Voir fiche</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {clients.length === 0 && <p className="py-12 text-center text-slate-500">Aucun client trouvé</p>}
          </>
        )}
      </Card>
    </div>
  );
}
