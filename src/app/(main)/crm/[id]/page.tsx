"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { clientsApi } from "@/lib/services/api";
import type { Client } from "@/types";

export default function ClientFichePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    clientsApi
      .getById(id)
      .then((c) => {
        if (!cancelled) setClient(c);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Client non trouvé");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p className="text-slate-500">Chargement...</p>;
  if (error || !client) {
    return (
      <div className="space-y-4">
        <p className="text-slate-600">{error ?? "Client non trouvé."}</p>
        <Button onClick={() => router.push("/crm")}>Retour CRM</Button>
      </div>
    );
  }

  const vehicles = (client as Client & { vehicles?: { id: string; vin: string; brand: string; model: string }[] }).vehicles ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/crm" className="text-slate-500 hover:text-slate-800">← CRM</Link>
        <h1 className="text-2xl font-bold text-slate-800">{client.name}</h1>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardTitle>Coordonnées</CardTitle>
          <dl className="mt-4 space-y-2 text-sm">
            <div><dt className="text-slate-500">Email</dt><dd>{client.email ?? "—"}</dd></div>
            <div><dt className="text-slate-500">Téléphone</dt><dd>{client.phone ?? "—"}</dd></div>
            <div><dt className="text-slate-500">Adresse</dt><dd>{client.address ?? "—"}</dd></div>
          </dl>
        </Card>
        <Card>
          <CardTitle>Véhicules liés</CardTitle>
          <ul className="mt-4 space-y-2 text-sm">
            {vehicles.length === 0 ? (
              <li className="text-slate-500">Aucun véhicule ou liste fournie par le backend (GET /clients/:id avec champ vehicles)</li>
            ) : (
              vehicles.map((v) => (
                <li key={v.id}>
                  <Link href={`/parc-auto/${v.vin}`} className="text-slate-700 underline">{v.vin} — {v.brand} {v.model}</Link>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
