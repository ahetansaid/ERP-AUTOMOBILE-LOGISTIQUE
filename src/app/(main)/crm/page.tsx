"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { clientsApi } from "@/lib/services/api";
import type { Client } from "@/types";

export default function CrmPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    clientsApi
      .list({ search: search || undefined })
      .then((res) => {
        if (!cancelled) setClients(res.data ?? []);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Erreur chargement clients");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">CRM Clients</h1>
          <p className="mt-1 text-slate-600">Fiches clients</p>
        </div>
        <Button>+ Nouveau client</Button>
      </div>
      <Card>
        <div className="mb-4">
          <Input placeholder="Rechercher un client..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        </div>
        {loading && <p className="py-8 text-center text-slate-500">Chargement...</p>}
        {error && <p className="py-4 text-center text-red-600">{error}</p>}
        {!loading && !error && (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Nom</th><th>Email</th><th>Téléphone</th><th></th></tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.name}</td>
                    <td>{c.email ?? "—"}</td>
                    <td>{c.phone ?? "—"}</td>
                    <td><Link href={`/crm/${c.id}`} className="text-slate-600 underline hover:text-slate-900">Voir fiche</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && clients.length === 0 && (
          <p className="py-8 text-center text-slate-500">Aucun client trouvé</p>
        )}
      </Card>
    </div>
  );
}
