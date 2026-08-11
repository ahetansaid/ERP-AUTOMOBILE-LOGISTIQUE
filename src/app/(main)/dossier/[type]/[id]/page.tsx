"use client";

/**
 * Dossier 360°.
 *
 * Toute entité s'ouvre sur la même structure — identité, rattachements,
 * financier, chronologie, documents. La chronologie fusionne les écritures du
 * grand livre, les documents joints, les envois et le journal d'audit : c'est ce
 * qui rend l'audit lisible au lieu de le laisser en table technique.
 */

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface TimelineEvent {
  date: string;
  type: "ledger" | "document" | "email" | "audit" | "statut" | "reglement";
  label: string;
  detail?: string | null;
  amount?: number;
}

interface DocumentRow {
  id: number;
  kind: string;
  fileName: string;
  docNumber?: string | null;
  docDate?: string | null;
  docAmount?: number | null;
}

interface Dossier {
  type: string;
  id: number;
  identite: Record<string, unknown>;
  rattachements?: Record<string, unknown>;
  financier?: Record<string, unknown>;
  documents?: DocumentRow[];
  chronologie?: TimelineEvent[];
  atelier?: { id: number; prestataire: string; montant: number; statut: string }[];
  reglements?: { id: number; numero?: string | null; montant: number; mode?: string | null }[];
}

const TYPE_LABEL: Record<string, string> = {
  Vehicle: "Véhicule",
  Purchase: "Conteneur",
  Invoice: "Facture",
  Partner: "Tiers",
};

const EVENT_STYLE: Record<TimelineEvent["type"], { dot: string; label: string }> = {
  ledger: { dot: "bg-brand-500", label: "Écriture" },
  reglement: { dot: "bg-accent-500", label: "Règlement" },
  document: { dot: "bg-neutral-400", label: "Document" },
  email: { dot: "bg-warning-500", label: "Envoi" },
  audit: { dot: "bg-neutral-300", label: "Journal" },
  statut: { dot: "bg-brand-300", label: "Statut" },
};

const fmt = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;

/** Rend une valeur quelconque du bloc identité sans supposer son type. */
function renderValue(v: unknown): string {
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "boolean") return v ? "Oui" : "Non";
  if (typeof v === "number") return v.toLocaleString("fr-FR");
  const s = String(v);
  // Une date ISO est reformatée ; tout le reste passe tel quel.
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return new Date(s).toLocaleDateString("fr-FR");
  return s;
}

const humanize = (k: string) =>
  k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

export default function DossierPage() {
  const params = useParams();
  const type = params?.type ? String(params.type) : null;
  const id = params?.id ? String(params.id) : null;

  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDossier = useCallback(async () => {
    if (!type || !id) return;
    setLoading(true);
    setError(null);
    try {
      setDossier(await apiGet<Dossier>(`/search/dossier/${type}/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
      setDossier(null);
    } finally {
      setLoading(false);
    }
  }, [type, id]);

  useEffect(() => {
    fetchDossier();
  }, [fetchDossier]);

  if (loading) return <p className="py-8 text-neutral-500">Chargement du dossier…</p>;

  if (error || !dossier) {
    return (
      <div className="space-y-3">
        <p className="text-danger-600">{error ?? "Dossier introuvable."}</p>
        <Link href="/" className="text-brand-600 hover:underline">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const titre = String(dossier.identite?.titre ?? `${dossier.type} ${dossier.id}`);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-500">
          {TYPE_LABEL[dossier.type] ?? dossier.type} · #{dossier.id}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{titre}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Identité">
            <dl className="grid gap-3 sm:grid-cols-2">
              {Object.entries(dossier.identite ?? {})
                .filter(([k]) => k !== "titre")
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-sm text-neutral-500">{humanize(k)}</dt>
                    <dd className="font-medium">{renderValue(v)}</dd>
                  </div>
                ))}
            </dl>
          </Card>

          {dossier.financier && Object.keys(dossier.financier).length > 0 && (
            <Card title="Financier">
              <dl className="grid gap-3 sm:grid-cols-2">
                {Object.entries(dossier.financier)
                  .filter(([, v]) => typeof v === "number" || typeof v === "boolean")
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-sm text-neutral-500">{humanize(k)}</dt>
                      <dd className="font-mono text-lg font-semibold tabular-nums">
                        {typeof v === "boolean"
                          ? v
                            ? "Oui"
                            : "Non"
                          : /cout|total|montant|volume|marge|prix|encaisse|restant|ticket/i.test(k)
                            ? fmt(v as number)
                            : (v as number).toLocaleString("fr-FR")}
                      </dd>
                    </div>
                  ))}
              </dl>

              {Array.isArray((dossier.financier as { decomposition?: unknown }).decomposition) && (
                <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                  <p className="mb-2 text-sm font-medium text-neutral-500">
                    Décomposition du coût
                  </p>
                  <ul className="space-y-1.5">
                    {(
                      (dossier.financier as { decomposition: { nature: string; amount: number }[] })
                        .decomposition
                    ).map((d) => (
                      <li key={d.nature} className="flex justify-between text-sm">
                        <span className="text-neutral-600 dark:text-neutral-400">
                          {d.nature}
                        </span>
                        <span className="font-mono tabular-nums">{fmt(d.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          <Card title="Chronologie">
            {!dossier.chronologie?.length ? (
              <p className="py-4 text-sm text-neutral-500">Aucun événement.</p>
            ) : (
              <ul className="space-y-0">
                {dossier.chronologie.map((e, i) => {
                  const style = EVENT_STYLE[e.type] ?? EVENT_STYLE.audit;
                  return (
                    <li key={i} className="grid grid-cols-[72px_16px_1fr] gap-3 py-2">
                      <span className="pt-0.5 font-mono text-xs text-neutral-500">
                        {new Date(e.date).toLocaleDateString("fr-FR")}
                      </span>
                      <span className="relative flex justify-center">
                        {i < (dossier.chronologie?.length ?? 0) - 1 && (
                          <span className="absolute top-2 bottom-[-8px] w-px bg-neutral-200 dark:bg-neutral-800" />
                        )}
                        <span
                          className={`relative mt-1.5 h-2 w-2 rounded-full ${style.dot}`}
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{e.label}</span>
                        <span className="block text-xs text-neutral-500">
                          {[style.label, e.detail].filter(Boolean).join(" · ")}
                        </span>
                        {e.amount != null && (
                          <span
                            className={`font-mono text-xs tabular-nums ${
                              e.amount < 0 ? "text-danger-600" : "text-accent-600"
                            }`}
                          >
                            {e.amount > 0 ? "+" : "−"}
                            {fmt(Math.abs(e.amount))}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {dossier.rattachements && (
            <Card title="Rattachements">
              <div className="space-y-3 text-sm">
                {Object.entries(dossier.rattachements).map(([k, v]) => {
                  if (v == null) {
                    return (
                      <div key={k}>
                        <p className="text-neutral-500">{humanize(k)}</p>
                        <p className="text-neutral-400">—</p>
                      </div>
                    );
                  }
                  if (Array.isArray(v)) {
                    return (
                      <div key={k}>
                        <p className="mb-1 text-neutral-500">
                          {humanize(k)} ({v.length})
                        </p>
                        <ul className="space-y-1">
                          {v.slice(0, 8).map((item, i) => {
                            const o = item as Record<string, unknown>;
                            return (
                              <li key={i} className="rounded-lg bg-neutral-50 px-2 py-1.5 dark:bg-neutral-900">
                                <span className="font-medium">
                                  {String(o.vin ?? o.vehicule ?? o.reference ?? o.prestataire ?? `#${o.id}`)}
                                </span>
                                {o.cout != null && (
                                  <span className="ml-2 font-mono text-xs text-neutral-500">
                                    {fmt(Number(o.cout))}
                                  </span>
                                )}
                                {o.montant != null && (
                                  <span className="ml-2 font-mono text-xs text-neutral-500">
                                    {fmt(Number(o.montant))}
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  }
                  const o = v as Record<string, unknown>;
                  return (
                    <div key={k}>
                      <p className="text-neutral-500">{humanize(k)}</p>
                      <p className="font-medium">
                        {String(o.name ?? o.reference ?? o.invoiceNumber ?? o.vin ?? `#${o.id}`)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <Card title="Documents">
            {!dossier.documents?.length ? (
              <p className="py-3 text-sm text-neutral-500">Aucun document joint.</p>
            ) : (
              <ul className="space-y-2">
                {dossier.documents.map((d) => (
                  <li key={d.id} className="text-sm">
                    <Badge variant="outline">{d.kind}</Badge>
                    <span className="mt-1 block font-medium">
                      {d.docNumber ?? d.fileName}
                    </span>
                    {d.docAmount != null && (
                      <span className="font-mono text-xs text-neutral-500">
                        {fmt(d.docAmount)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
